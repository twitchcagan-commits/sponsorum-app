import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/*
  ──────────────────────────────────────────────────────────────────────────────
  Admin API — server-only. Uses the service role key, so it bypasses RLS and can
  read auth.users emails. All requests must include the admin password.

  Required SQL (run once in Supabase SQL Editor):

    -- Ban flag on profiles
    alter table profiles add column if not exists is_banned boolean default false;

    -- Optional reason recorded when an offer is disputed
    alter table offers add column if not exists dispute_reason text;

    -- offers.status values used by the platform:
    --   pending, accepted, rejected, completed, disputed, refunded
    -- If a CHECK constraint exists on offers.status, make sure it allows all of these.

    -- Platform settings (single row, id = 1)
    create table if not exists platform_settings (
      id                int primary key default 1,
      commission_rate   numeric  default 15,
      min_order         numeric  default 750,
      maintenance_mode  boolean  default false,
      announcement_text text     default '',
      updated_at        timestamptz default now()
    );
    insert into platform_settings (id) values (1) on conflict (id) do nothing;
  ──────────────────────────────────────────────────────────────────────────────
*/

const ADMIN_PASSWORD = "sponsorum2026";

// Statuses that count as realized commission revenue.
const REVENUE_STATUSES = ["completed"];
// Statuses considered "active" (open) deals.
const ACTIVE_STATUSES = ["pending", "accepted"];

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10); // YYYY-MM-DD
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

// Fetch every auth user (paginated) and return id → email map.
async function emailMap(admin: ReturnType<typeof adminClient>): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  let page = 1;
  const perPage = 1000;
  // Hard cap to avoid runaway loops.
  for (let i = 0; i < 50; i++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error || !data?.users?.length) break;
    for (const u of data.users) if (u.email) map[u.id] = u.email;
    if (data.users.length < perPage) break;
    page++;
  }
  return map;
}

// ─── Action handlers ────────────────────────────────────────────────────────

async function handleOverview(admin: ReturnType<typeof adminClient>) {
  const [{ count: usersCount }, { data: offers }, { data: yayinciRows }] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("offers").select("status, platform_fee, created_at"),
    admin.from("yayinci_profiles").select("proof_files, verified"),
  ]);

  const offerRows = (offers ?? []) as Row[];
  const activeOffers = offerRows.filter((o) => ACTIVE_STATUSES.includes(o.status)).length;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyRevenue = offerRows
    .filter((o) => REVENUE_STATUSES.includes(o.status) && new Date(o.created_at) >= monthStart)
    .reduce((s, o) => s + Number(o.platform_fee ?? 0), 0);

  const pendingVerifications = ((yayinciRows ?? []) as Row[]).filter(
    (y) => y.verified !== true && Object.keys(y.proof_files ?? {}).length > 0
  ).length;

  // Daily revenue for last 30 days (completed offers' platform_fee).
  const series: { date: string; value: number }[] = [];
  const byDay: Record<string, number> = {};
  for (const o of offerRows) {
    if (!REVENUE_STATUSES.includes(o.status)) continue;
    const k = dayKey(o.created_at);
    byDay[k] = (byDay[k] ?? 0) + Number(o.platform_fee ?? 0);
  }
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const k = d.toISOString().slice(0, 10);
    series.push({ date: k, value: byDay[k] ?? 0 });
  }

  return {
    usersCount: usersCount ?? 0,
    activeOffers,
    monthlyRevenue,
    pendingVerifications,
    revenueSeries: series,
  };
}

async function handleUsers(admin: ReturnType<typeof adminClient>) {
  const [{ data: profiles }, { data: markas }, { data: yayincis }, emails] = await Promise.all([
    admin.from("profiles").select("id, username, display_name, role, created_at, is_banned").order("created_at", { ascending: false }),
    admin.from("marka_profiles").select("id, is_pro"),
    admin.from("yayinci_profiles").select("id, is_pro"),
    emailMap(admin),
  ]);

  const markaPro = new Map(((markas ?? []) as Row[]).map((m) => [m.id, m.is_pro === true]));
  const yayinciPro = new Map(((yayincis ?? []) as Row[]).map((y) => [y.id, y.is_pro === true]));

  const users = ((profiles ?? []) as Row[]).map((p) => ({
    id: p.id,
    username: p.username ?? "",
    displayName: p.display_name ?? "",
    role: p.role ?? "",
    email: emails[p.id] ?? "—",
    createdAt: p.created_at ?? null,
    isPro: p.role === "marka" ? (markaPro.get(p.id) ?? false) : (yayinciPro.get(p.id) ?? false),
    isBanned: p.is_banned === true,
  }));

  return { users };
}

async function handleTogglePro(admin: ReturnType<typeof adminClient>, payload: Row) {
  const { userId, role, value } = payload;
  const table = role === "marka" ? "marka_profiles" : "yayinci_profiles";
  const { error } = await admin.from(table).update({ is_pro: !!value }).eq("id", userId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

async function handleBanUser(admin: ReturnType<typeof adminClient>, payload: Row) {
  const { userId, value } = payload;
  const { error } = await admin.from("profiles").update({ is_banned: !!value }).eq("id", userId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

async function handleVerifications(admin: ReturnType<typeof adminClient>) {
  const { data: rows } = await admin
    .from("yayinci_profiles")
    .select("id, social_accounts, proof_files, verified")
    .eq("verified", false);

  const pending = ((rows ?? []) as Row[]).filter(
    (y) => Object.keys(y.proof_files ?? {}).length > 0
  );

  const ids = pending.map((p) => p.id);
  const { data: profiles } = ids.length
    ? await admin.from("profiles").select("id, username, display_name").in("id", ids)
    : { data: [] };
  const profMap = new Map(((profiles ?? []) as Row[]).map((p) => [p.id, p]));

  const list = pending.map((y) => {
    const accounts = (y.social_accounts ?? []) as Row[];
    const platforms = [...new Set(accounts.map((a) => a.platform))];
    const p = profMap.get(y.id);
    return {
      id: y.id,
      username: p?.username ?? "",
      displayName: p?.display_name ?? "",
      platformCount: platforms.length,
      platforms,
      proofCount: Object.keys(y.proof_files ?? {}).length,
      proofFiles: y.proof_files ?? {},
    };
  });

  return { verifications: list };
}

async function handleVerifyAction(admin: ReturnType<typeof adminClient>, payload: Row) {
  const { userId, approve } = payload;
  // Approve → verified=true. Reject → clear proof_files so it leaves the queue
  // (the yayıncı must re-upload to be reconsidered).
  const patch = approve ? { verified: true } : { proof_files: {} };
  const { error } = await admin.from("yayinci_profiles").update(patch).eq("id", userId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

async function handleOffers(admin: ReturnType<typeof adminClient>) {
  const { data: offers } = await admin
    .from("offers")
    .select("id, marka_id, yayinci_id, content_type, amount, platform_fee, total, status, created_at, brief, special_requests, deadline, dispute_reason, accepted_at, delivery_deadline, delivery_confirmed_at, delivery_proof_urls, rejection_reason")
    .order("created_at", { ascending: false });

  const offerRows = (offers ?? []) as Row[];
  const ids = [...new Set(offerRows.flatMap((o) => [o.marka_id, o.yayinci_id]).filter(Boolean))];

  const [{ data: profiles }, { data: markas }] = await Promise.all([
    ids.length ? admin.from("profiles").select("id, username, display_name").in("id", ids) : Promise.resolve({ data: [] as Row[] }),
    ids.length ? admin.from("marka_profiles").select("id, company_name").in("id", ids) : Promise.resolve({ data: [] as Row[] }),
  ]);
  const profMap = new Map(((profiles ?? []) as Row[]).map((p) => [p.id, p]));
  const companyMap = new Map(((markas ?? []) as Row[]).map((m) => [m.id, m.company_name]));

  const list = offerRows.map((o) => ({
    id: o.id,
    markaId: o.marka_id,
    yayinciId: o.yayinci_id,
    markaName: companyMap.get(o.marka_id) ?? profMap.get(o.marka_id)?.display_name ?? "—",
    markaUsername: profMap.get(o.marka_id)?.username ?? "",
    yayinciUsername: profMap.get(o.yayinci_id)?.username ?? "",
    yayinciName: profMap.get(o.yayinci_id)?.display_name ?? "—",
    contentType: o.content_type ?? "",
    amount: Number(o.amount ?? 0),
    platformFee: Number(o.platform_fee ?? 0),
    total: Number(o.total ?? 0),
    status: o.status ?? "pending",
    createdAt: o.created_at ?? null,
    deadline: o.deadline ?? null,
    brief: o.brief ?? "",
    specialRequests: o.special_requests ?? "",
    disputeReason: o.dispute_reason ?? "",
    acceptedAt: o.accepted_at ?? null,
    deliveryDeadline: o.delivery_deadline ?? null,
    deliveryConfirmedAt: o.delivery_confirmed_at ?? null,
    deliveryProofUrls: Array.isArray(o.delivery_proof_urls) ? o.delivery_proof_urls : [],
    rejectionReason: o.rejection_reason ?? "",
  }));

  return { offers: list };
}

async function handleOfferStatus(admin: ReturnType<typeof adminClient>, payload: Row) {
  const { offerId, status } = payload;
  const { error } = await admin.from("offers").update({ status }).eq("id", offerId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

async function handleDisputeResolve(admin: ReturnType<typeof adminClient>, payload: Row) {
  const { offerId, outcome } = payload;
  // marka lehine → refunded ; yayıncı lehine → completed
  const status = outcome === "marka" ? "refunded" : "completed";
  const { error } = await admin.from("offers").update({ status }).eq("id", offerId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

async function handleMessagesList(admin: ReturnType<typeof adminClient>) {
  const { data: msgs } = await admin
    .from("messages")
    .select("offer_id, sender_id, content, file_type, created_at")
    .order("created_at", { ascending: true });

  const msgRows = (msgs ?? []) as Row[];
  const grouped = new Map<string, { count: number; last: Row }>();
  for (const m of msgRows) {
    const g = grouped.get(m.offer_id) ?? { count: 0, last: m };
    g.count++;
    g.last = m;
    grouped.set(m.offer_id, g);
  }

  const offerIds = [...grouped.keys()];
  if (!offerIds.length) return { conversations: [] };

  const { data: offers } = await admin
    .from("offers")
    .select("id, marka_id, yayinci_id, content_type, status")
    .in("id", offerIds);
  const offerMap = new Map(((offers ?? []) as Row[]).map((o) => [o.id, o]));

  const partyIds = [...new Set(((offers ?? []) as Row[]).flatMap((o) => [o.marka_id, o.yayinci_id]).filter(Boolean))];
  const { data: profiles } = partyIds.length
    ? await admin.from("profiles").select("id, username, display_name").in("id", partyIds)
    : { data: [] };
  const profMap = new Map(((profiles ?? []) as Row[]).map((p) => [p.id, p]));

  const conversations = offerIds
    .map((offerId) => {
      const g = grouped.get(offerId)!;
      const o = offerMap.get(offerId);
      if (!o) return null;
      const last = g.last;
      const preview =
        last.file_type === "image" ? "📷 Görsel" : last.file_type === "video" ? "🎬 Video" : (last.content || "—");
      return {
        offerId,
        markaUsername: profMap.get(o.marka_id)?.username ?? "—",
        yayinciUsername: profMap.get(o.yayinci_id)?.username ?? "—",
        contentType: o.content_type ?? "",
        status: o.status ?? "pending",
        lastMessage: preview,
        lastTime: last.created_at,
        count: g.count,
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b!.lastTime).getTime() - new Date(a!.lastTime).getTime());

  return { conversations };
}

async function handleMessagesThread(admin: ReturnType<typeof adminClient>, payload: Row) {
  const { offerId } = payload;
  const { data: offer } = await admin
    .from("offers")
    .select("id, marka_id, yayinci_id, content_type, status")
    .eq("id", offerId)
    .maybeSingle();

  const { data: msgs } = await admin
    .from("messages")
    .select("id, sender_id, content, file_url, file_type, created_at")
    .eq("offer_id", offerId)
    .order("created_at", { ascending: true });

  const o = offer as Row | null;
  const partyIds = o ? [o.marka_id, o.yayinci_id].filter(Boolean) : [];
  const { data: profiles } = partyIds.length
    ? await admin.from("profiles").select("id, username, display_name").in("id", partyIds)
    : { data: [] };
  const profMap = new Map(((profiles ?? []) as Row[]).map((p) => [p.id, p]));

  const thread = ((msgs ?? []) as Row[]).map((m) => {
    const isMarka = o && m.sender_id === o.marka_id;
    const prof = profMap.get(m.sender_id);
    return {
      id: m.id,
      senderId: m.sender_id,
      senderRole: isMarka ? "marka" : "yayinci",
      senderUsername: prof?.username ?? "—",
      content: m.content ?? "",
      fileUrl: m.file_url ?? null,
      fileType: m.file_type ?? null,
      createdAt: m.created_at,
    };
  });

  return {
    thread,
    info: o
      ? {
          markaUsername: profMap.get(o.marka_id)?.username ?? "—",
          yayinciUsername: profMap.get(o.yayinci_id)?.username ?? "—",
          contentType: o.content_type ?? "",
          status: o.status ?? "pending",
        }
      : null,
  };
}

async function handleRevenue(admin: ReturnType<typeof adminClient>) {
  const [{ data: offers }, { data: markas }, { data: yayincis }] = await Promise.all([
    admin.from("offers").select("platform_fee, status, created_at"),
    admin.from("marka_profiles").select("id, company_name, is_pro, created_at").eq("is_pro", true),
    admin.from("yayinci_profiles").select("id, is_pro, created_at").eq("is_pro", true),
  ]);

  const completed = ((offers ?? []) as Row[]).filter((o) => REVENUE_STATUSES.includes(o.status));

  const byDay: Record<string, number> = {};
  const byMonth: Record<string, number> = {};
  const byYear: Record<string, number> = {};
  let total = 0;
  for (const o of completed) {
    const fee = Number(o.platform_fee ?? 0);
    total += fee;
    const d = new Date(o.created_at);
    const day = d.toISOString().slice(0, 10);
    const month = day.slice(0, 7);
    const year = day.slice(0, 4);
    byDay[day] = (byDay[day] ?? 0) + fee;
    byMonth[month] = (byMonth[month] ?? 0) + fee;
    byYear[year] = (byYear[year] ?? 0) + fee;
  }

  const toSorted = (rec: Record<string, number>) =>
    Object.entries(rec).map(([key, value]) => ({ key, value })).sort((a, b) => (a.key < b.key ? 1 : -1));

  // Pro lists need usernames.
  const proIds = [
    ...((markas ?? []) as Row[]).map((m) => m.id),
    ...((yayincis ?? []) as Row[]).map((y) => y.id),
  ];
  const { data: profiles } = proIds.length
    ? await admin.from("profiles").select("id, username, display_name").in("id", proIds)
    : { data: [] };
  const profMap = new Map(((profiles ?? []) as Row[]).map((p) => [p.id, p]));

  const markaPro = ((markas ?? []) as Row[]).map((m) => ({
    id: m.id,
    company: m.company_name ?? profMap.get(m.id)?.display_name ?? "—",
    username: profMap.get(m.id)?.username ?? "—",
    createdAt: m.created_at ?? null,
  }));
  const yayinciPro = ((yayincis ?? []) as Row[]).map((y) => ({
    id: y.id,
    username: profMap.get(y.id)?.username ?? "—",
    displayName: profMap.get(y.id)?.display_name ?? "—",
    createdAt: y.created_at ?? null,
  }));

  return {
    total,
    byDay: toSorted(byDay),
    byMonth: toSorted(byMonth),
    byYear: toSorted(byYear),
    markaPro,
    yayinciPro,
  };
}

async function handleSettingsGet(admin: ReturnType<typeof adminClient>) {
  let { data } = await admin.from("platform_settings").select("*").eq("id", 1).maybeSingle();
  if (!data) {
    const ins = await admin.from("platform_settings").insert({ id: 1 }).select("*").maybeSingle();
    data = ins.data;
  }
  const s = (data ?? {}) as Row;
  return {
    settings: {
      commissionRate: s.commission_rate ?? 15,
      minOrder: s.min_order ?? 750,
      maintenanceMode: s.maintenance_mode === true,
      announcementText: s.announcement_text ?? "",
    },
  };
}

async function handleSettingsSave(admin: ReturnType<typeof adminClient>, payload: Row) {
  const { commissionRate, minOrder, maintenanceMode, announcementText } = payload;
  const { error } = await admin.from("platform_settings").upsert({
    id: 1,
    commission_rate: Number(commissionRate),
    min_order: Number(minOrder),
    maintenance_mode: !!maintenanceMode,
    announcement_text: announcementText ?? "",
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  return { ok: true };
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password, action, payload } = body ?? {};

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const admin = adminClient();

    switch (action) {
      case "overview":          return NextResponse.json(await handleOverview(admin));
      case "users":             return NextResponse.json(await handleUsers(admin));
      case "toggle_pro":        return NextResponse.json(await handleTogglePro(admin, payload ?? {}));
      case "ban_user":          return NextResponse.json(await handleBanUser(admin, payload ?? {}));
      case "verifications":     return NextResponse.json(await handleVerifications(admin));
      case "verify_action":     return NextResponse.json(await handleVerifyAction(admin, payload ?? {}));
      case "offers":            return NextResponse.json(await handleOffers(admin));
      case "offer_status":      return NextResponse.json(await handleOfferStatus(admin, payload ?? {}));
      case "dispute_resolve":   return NextResponse.json(await handleDisputeResolve(admin, payload ?? {}));
      case "messages_list":     return NextResponse.json(await handleMessagesList(admin));
      case "messages_thread":   return NextResponse.json(await handleMessagesThread(admin, payload ?? {}));
      case "revenue":           return NextResponse.json(await handleRevenue(admin));
      case "settings_get":      return NextResponse.json(await handleSettingsGet(admin));
      case "settings_save":     return NextResponse.json(await handleSettingsSave(admin, payload ?? {}));
      default:
        return NextResponse.json({ error: "Bilinmeyen işlem" }, { status: 400 });
    }
  } catch (err) {
    console.error("[admin api]", err);
    const message = err instanceof Error ? err.message : "Sunucu hatası";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
