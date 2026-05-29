import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

/*
  ──────────────────────────────────────────────────────────────────────────────
  Auto-refund cron — replaces the old 48-hour auto-approval system.

  Finds offers that are still in `delivery_confirmed` (the yayıncı committed to a
  delivery date but never submitted the content) whose `delivery_deadline` has
  passed, sets them to `refunded`, and emails both parties.

  Invoke on a schedule (e.g. Vercel Cron / external cron), e.g. every 15 min:
    GET /api/cron/check-deadlines
    Authorization: Bearer <CRON_SECRET>   (only enforced if CRON_SECRET is set)
  ──────────────────────────────────────────────────────────────────────────────
*/

export const dynamic = "force-dynamic";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

async function run() {
  const admin = adminClient();
  const nowIso = new Date().toISOString();

  // Offers where the yayıncı committed a delivery date but never delivered,
  // and that date has passed.
  const { data: offers, error } = await admin
    .from("offers")
    .select("id, marka_id, yayinci_id, content_type, amount, delivery_deadline")
    .eq("status", "delivery_confirmed")
    .lt("delivery_deadline", nowIso);

  if (error) throw new Error(error.message);

  const rows = (offers ?? []) as Row[];
  if (rows.length === 0) return { refunded: 0, ids: [] as string[] };

  const ids = rows.map((o) => o.id);

  // Flip them all to refunded.
  const { error: updErr } = await admin
    .from("offers")
    .update({ status: "refunded" })
    .in("id", ids);
  if (updErr) throw new Error(updErr.message);

  // Notify both parties (best-effort, never block the refund on email).
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://sponsorum.com";

  await Promise.allSettled(
    rows.map(async (o) => {
      const [{ data: markaAuth }, { data: yayinciAuth }] = await Promise.all([
        admin.auth.admin.getUserById(o.marka_id),
        admin.auth.admin.getUserById(o.yayinci_id),
      ]);
      const markaEmail   = markaAuth.user?.email;
      const yayinciEmail = yayinciAuth.user?.email;
      const contentType  = o.content_type ?? "İçerik";
      const tasks: Promise<unknown>[] = [];

      if (markaEmail) {
        tasks.push(sendEmail({
          to: markaEmail,
          subject: "Otomatik İade Gerçekleşti ↩️ - Sponsorum",
          html: `
            <h2>Otomatik iade gerçekleşti ↩️</h2>
            <p>Yayıncı belirlediği teslim tarihine kadar içeriği teslim etmediği için anlaşma otomatik olarak iptal edildi ve tutar tarafınıza iade edildi.</p>
            <div class="info">
              <div class="row"><span class="lbl">İçerik Türü</span><span class="val">${contentType}</span></div>
            </div>
            <p>Dilerseniz aynı veya farklı bir yayıncıyla yeni bir anlaşma başlatabilirsiniz.</p>
            <a class="btn" href="${appUrl}/search">Yeni Yayıncı Ara →</a>
          `,
        }));
      }
      if (yayinciEmail) {
        tasks.push(sendEmail({
          to: yayinciEmail,
          subject: "Teslim Süresi Doldu — Anlaşma İptal Edildi ⏰ - Sponsorum",
          html: `
            <h2>Teslim süresi doldu ⏰</h2>
            <p>Belirlediğiniz teslim tarihine kadar içeriği teslim etmediğiniz için anlaşma otomatik olarak iptal edildi ve tutar markaya iade edildi.</p>
            <div class="info">
              <div class="row"><span class="lbl">İçerik Türü</span><span class="val">${contentType}</span></div>
            </div>
            <p>Teslim sürelerinize uymanız puanınız ve görünürlüğünüz açısından önemlidir.</p>
            <a class="btn" href="${appUrl}/offers">Tekliflerime Git →</a>
          `,
        }));
      }
      await Promise.allSettled(tasks);
    })
  );

  return { refunded: ids.length, ids };
}

async function handle(req: NextRequest) {
  // Optional shared-secret protection.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }
  }

  try {
    const result = await run();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron check-deadlines]", err);
    const message = err instanceof Error ? err.message : "Sunucu hatası";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest)  { return handle(req); }
export async function POST(req: NextRequest) { return handle(req); }
