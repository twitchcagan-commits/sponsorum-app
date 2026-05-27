"use client";

/*
  Requires a username column on the profiles table:

  alter table profiles
    add column if not exists username text unique;

  Update existing yayinci rows:
    update profiles set username = lower(replace(display_name, ' ', ''))
    where role = 'yayinci';
*/

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

// ─── Types & config ───────────────────────────────────────────────────────────

type ContentTypeDef = {
  col:   string;
  label: string;
  group: string;
  icon:  string;
  days:  number;
};

type LoadedContentType = ContentTypeDef & { price: number };

// Master list — matches every price column in yayinci_profiles
const ALL_CONTENT_TYPES: ContentTypeDef[] = [
  { col: "price_ig_story",          label: "Story",              group: "Instagram",     icon: "📸", days: 1 },
  { col: "price_ig_reels",          label: "Reels",              group: "Instagram",     icon: "📸", days: 3 },
  { col: "price_ig_post",           label: "Post",               group: "Instagram",     icon: "📸", days: 3 },
  { col: "price_ig_highlight",      label: "Highlight",          group: "Instagram",     icon: "📸", days: 7 },
  { col: "price_ig_bio_link",       label: "Bio Link",           group: "Instagram",     icon: "📸", days: 7 },
  { col: "price_tt_video",          label: "Video",              group: "TikTok",        icon: "🎵", days: 3 },
  { col: "price_tt_live",           label: "Canlı Yayın",        group: "TikTok",        icon: "🎵", days: 1 },
  { col: "price_tt_profile_link",   label: "Profil Linki",       group: "TikTok",        icon: "🎵", days: 7 },
  { col: "price_yt_video",          label: "Video Entegre",      group: "YouTube",       icon: "▶",  days: 7 },
  { col: "price_yt_end_screen",     label: "End Screen",         group: "YouTube",       icon: "▶",  days: 7 },
  { col: "price_yt_desc_link",      label: "Açıklama Linki",     group: "YouTube",       icon: "▶",  days: 7 },
  { col: "price_yt_live_banner",    label: "Canlı Yayın Banner", group: "YouTube",       icon: "▶",  days: 1 },
  { col: "price_yt_overlay",        label: "Overlay Logo",       group: "YouTube",       icon: "▶",  days: 1 },
  { col: "price_stream_mention",    label: "Sözlü Bahis",        group: "Kick / Twitch", icon: "🎮", days: 1 },
  { col: "price_stream_overlay",    label: "Ekran Overlay",      group: "Kick / Twitch", icon: "🎮", days: 1 },
  { col: "price_stream_panel",      label: "Panel Banner",       group: "Kick / Twitch", icon: "🎮", days: 7 },
  { col: "price_stream_integrated", label: "Canlı Yayın Entegre",group: "Kick / Twitch", icon: "🎮", days: 1 },
  { col: "price_tweet",             label: "Tweet",              group: "X",             icon: "𝕏",  days: 1 },
  { col: "price_x_pinned",          label: "Sabitlenmiş Tweet",  group: "X",             icon: "𝕏",  days: 7 },
  { col: "price_x_thread",          label: "Thread",             group: "X",             icon: "𝕏",  days: 3 },
  { col: "price_x_bio",             label: "Profil Bio",         group: "X",             icon: "𝕏",  days: 7 },
];

const PRICE_COLS = ALL_CONTENT_TYPES.map((ct) => ct.col);
const PLATFORM_FEE = 0.15;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return "₺" + Math.round(n).toLocaleString("tr-TR");
}

function minDate() {
  const d  = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// ─── Summary card ─────────────────────────────────────────────────────────────

function SummaryCard({
  username,
  selected,
  budget,
  deadline,
  brief,
  onSubmit,
  loading,
  submitError,
}: {
  username:    string;
  selected:    LoadedContentType[];
  budget:      number;
  deadline:    string;
  brief:       string;
  onSubmit:    () => void;
  loading:     boolean;
  submitError: string;
}) {
  const fee   = budget * PLATFORM_FEE;
  const total = budget + fee;
  const canSubmit = selected.length > 0 && budget > 0 && !!deadline && !!brief.trim() && !loading;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5">
      <h3 className="text-base font-extrabold" style={{ color: "#042C53" }}>Teklif Özeti</h3>

      {/* Creator */}
      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "#E6F1FB" }}>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0"
          style={{ backgroundColor: "#042C53" }}
        >
          {username.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: "#042C53" }}>@{username}</p>
        </div>
      </div>

      {/* Line items */}
      <div className="flex flex-col gap-3 text-sm">
        <div className="flex justify-between items-start gap-2">
          <span className="text-gray-500 flex-shrink-0">İçerik türü</span>
          <span className="font-semibold text-right" style={{ color: "#042C53" }}>
            {selected.length > 0 ? (
              <span className="flex flex-col items-end gap-0.5">
                {selected.map((s) => (
                  <span key={s.col}>{s.icon} {s.group} {s.label}</span>
                ))}
              </span>
            ) : (
              <span className="text-gray-300 font-normal">Seçilmedi</span>
            )}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">İçerik bedeli</span>
          <span className="font-semibold" style={{ color: "#042C53" }}>
            {budget > 0 ? fmt(budget) : "—"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Platform ücreti (%15)</span>
          <span className="font-semibold" style={{ color: "#042C53" }}>
            {budget > 0 ? fmt(fee) : "—"}
          </span>
        </div>

        <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
          <span className="font-bold" style={{ color: "#042C53" }}>Toplam</span>
          <span className="text-lg font-extrabold" style={{ color: "#185FA5" }}>
            {budget > 0 ? fmt(total) : "—"}
          </span>
        </div>
      </div>

      {/* Escrow note */}
      <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2.5 text-xs text-emerald-700 leading-relaxed">
        🔒 Ödeme, içerik onaylanana kadar Sponsorum güvencesinde tutulur.
      </div>

      {submitError && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-xs text-red-700">
          {submitError}
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ backgroundColor: "#185FA5" }}
        onMouseEnter={e => { if (canSubmit) e.currentTarget.style.backgroundColor = "#042C53"; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#185FA5"; }}
      >
        {loading ? "Gönderiliyor…" : "Teklif Gönder"}
      </button>

      <p className="text-xs text-gray-400 text-center leading-relaxed">
        Teklifi göndererek{" "}
        <a href="#" className="underline">Kullanım Şartları</a>
        &apos;nı kabul etmiş olursunuz.
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OfferPage() {
  const params   = useParams();
  const router   = useRouter();
  const username = (params?.username as string) ?? "";

  const [yayinciId, setYayinciId]         = useState<string | null>(null);
  // null = still loading, [] = loaded but no prices set
  const [availableTypes, setAvailableTypes] = useState<LoadedContentType[] | null>(null);
  const [selectedCols, setSelectedCols]   = useState<Set<string>>(new Set());

  const [brief, setBrief]                   = useState("");
  const [budget, setBudget]                 = useState("");
  const [deadline, setDeadline]             = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  const [fetchError, setFetchError]   = useState("");
  const [loading, setLoading]         = useState(false);
  const [submitError, setSubmitError] = useState("");

  const selectedTypes = (availableTypes ?? []).filter((ct) => selectedCols.has(ct.col));
  const budgetNum     = parseFloat(budget) || 0;

  function toggleCol(col: string) {
    setSelectedCols((prev) => {
      const next = new Set(prev);
      next.has(col) ? next.delete(col) : next.add(col);
      return next;
    });
  }

  // Auto-fill budget as sum of selected prices
  useEffect(() => {
    const sum = selectedTypes.reduce((acc, ct) => acc + ct.price, 0);
    setBudget(sum > 0 ? String(sum) : "");
  }, [selectedCols]); // eslint-disable-line react-hooks/exhaustive-deps

  // Step 1: resolve username → yayinciId
  useEffect(() => {
    if (!username) return;
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("id, username, role")
      .ilike("username", username.toLowerCase())
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) { setFetchError("Profil sorgusu başarısız: " + error.message); return; }
        if (!data)  { setFetchError(`'${username}' kullanıcı adıyla profil bulunamadı.`); return; }
        if (data.role !== "yayinci") { setFetchError(`'${username}' bir yayıncı hesabı değil.`); return; }
        setYayinciId(data.id);
      });
  }, [username]);

  // Step 2: load prices from yayinci_profiles
  useEffect(() => {
    if (!yayinciId) return;
    const supabase = createClient();
    supabase
      .from("yayinci_profiles")
      .select(PRICE_COLS.join(", "))
      .eq("id", yayinciId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) { setFetchError("Fiyat bilgisi alınamadı: " + error.message); return; }
        if (!data)  { setAvailableTypes([]); return; }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const row = data as Record<string, any>;
        const types: LoadedContentType[] = ALL_CONTENT_TYPES.flatMap((def) => {
          const v = row[def.col];
          if (v === null || v === undefined) return [];
          const price = Number(v);
          if (isNaN(price) || price <= 0) return [];
          return [{ ...def, price }];
        });
        setAvailableTypes(types);
      });
  }, [yayinciId]);

  async function handleSubmit() {
    if (selectedTypes.length === 0 || budgetNum <= 0 || !deadline || !brief.trim() || !yayinciId) return;

    // Reject past dates
    if (deadline < minDate()) {
      setSubmitError("Teslim tarihi geçmiş bir tarih olamaz. Lütfen bugün veya daha sonraki bir tarih seçin.");
      return;
    }

    setLoading(true);
    setSubmitError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const amount = Math.round(budgetNum);
    const fee    = Math.round(amount * PLATFORM_FEE);

    const contentType = selectedTypes.map((s) => `${s.group} ${s.label}`).join(", ");

    const { error } = await supabase.from("offers").insert({
      marka_id:         user.id,
      yayinci_id:       yayinciId,
      content_type:     contentType,
      brief:            brief.trim(),
      amount,
      platform_fee:     fee,
      total:            amount + fee,
      deadline,
      special_requests: specialRequests.trim() || null,
      status:           "pending",
    });

    if (error) {
      console.error("[offer] insert error:", error);
      setSubmitError("Teklif gönderilirken bir hata oluştu: " + error.message);
      setLoading(false);
      return;
    }

    // Fire-and-forget email notification to yayinci
    fetch("/api/notifications/offer-received", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        yayinciId,
        markaId:     user.id,
        contentType,
        amount,
        deadline,
      }),
    }).catch((err) => console.error("[offer] notification error:", err));

    router.push("/messages");
  }

  // Group loaded types by platform for the UI
  const groups = (availableTypes ?? []).reduce<{ group: string; types: LoadedContentType[] }[]>(
    (acc, ct) => {
      const existing = acc.find((g) => g.group === ct.group);
      if (existing) existing.types.push(ct);
      else acc.push({ group: ct.group, types: [ct] });
      return acc;
    },
    []
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <a href="/" className="text-2xl font-extrabold tracking-tight" style={{ color: "#185FA5" }}>Sponsorum</a>
          <a href={`/profile/${username}`} className="text-sm font-medium text-gray-500 hover:text-[#185FA5] transition-colors">
            ← Profile Dön
          </a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold mb-1" style={{ color: "#042C53" }}>
            Sponsorluk Teklifi Gönder
          </h1>
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-700">@{username}</span> adlı yayıncıya teklif gönderiyorsunuz.
          </p>
          {fetchError && (
            <div className="mt-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {fetchError}
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-7">

          {/* ── Form ── */}
          <div className="flex-1 flex flex-col gap-5 min-w-0">

            {/* Content type selection */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-extrabold mb-4" style={{ color: "#042C53" }}>
                İçerik Türleri <span className="text-red-400">*</span>
              </h2>

              {/* Loading skeleton */}
              {availableTypes === null && !fetchError && (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
                  ))}
                </div>
              )}

              {/* No prices set */}
              {availableTypes?.length === 0 && (
                <p className="text-sm text-gray-400">Bu yayıncı henüz fiyat listesi oluşturmamış.</p>
              )}

              {/* Grouped checkboxes */}
              {groups.length > 0 && (
                <div className="flex flex-col gap-6">
                  {groups.map(({ group, types }) => (
                    <div key={group}>
                      <p className="text-xs font-bold uppercase tracking-widest mb-2 text-gray-400">
                        {types[0].icon} {group}
                      </p>
                      <div className="flex flex-col gap-2">
                        {types.map((ct) => {
                          const isChecked = selectedCols.has(ct.col);
                          return (
                            <label
                              key={ct.col}
                              className="flex items-center justify-between gap-4 rounded-xl border-2 p-4 cursor-pointer transition-all hover:border-[#185FA5]/40"
                              style={{
                                borderColor:     isChecked ? "#185FA5" : "#F3F4F6",
                                backgroundColor: isChecked ? "#EBF4FF" : "white",
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleCol(ct.col)}
                                  className="w-4 h-4 accent-[#185FA5]"
                                />
                                <div>
                                  <p className="text-sm font-semibold text-gray-800">{ct.label}</p>
                                  <p className="text-xs text-gray-400">{ct.days} günde teslim</p>
                                </div>
                              </div>
                              <span className="text-sm font-extrabold flex-shrink-0" style={{ color: "#185FA5" }}>
                                {fmt(ct.price)}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Campaign brief */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <label className="block text-sm font-extrabold mb-1" style={{ color: "#042C53" }}>
                Kampanya Brifing <span className="text-red-400">*</span>
              </label>
              <p className="text-xs text-gray-400 mb-3">Markamızı nasıl tanıtmamızı istiyorsunuz?</p>
              <textarea
                rows={5}
                placeholder="Ürününüzü, hedef kitlenizi ve yayıncıdan beklentilerinizi açıklayın."
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/20 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1.5 text-right">{brief.length} karakter</p>
            </div>

            {/* Budget + deadline */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-extrabold mb-1" style={{ color: "#042C53" }}>
                    Bütçe (₺)
                  </label>
                  <p className="text-xs text-gray-400 mb-2">Seçilen içerik türlerinin toplam fiyatı.</p>
                  <div
                    className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-bold"
                    style={{ color: budgetNum > 0 ? "#042C53" : "#9ca3af" }}
                  >
                    {budgetNum > 0 ? fmt(budgetNum) : "—"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-extrabold mb-1" style={{ color: "#042C53" }}>
                    Teslim Tarihi <span className="text-red-400">*</span>
                  </label>
                  <p className="text-xs text-gray-400 mb-2">Bugün veya daha sonraki bir tarih seçilebilir.</p>
                  <input
                    type="date"
                    min={minDate()}
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/20"
                  />
                </div>
              </div>
            </div>

            {/* Special requests */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <label className="block text-sm font-extrabold mb-1" style={{ color: "#042C53" }}>
                Özel İstekler <span className="text-xs font-normal text-gray-400">(isteğe bağlı)</span>
              </label>
              <p className="text-xs text-gray-400 mb-3">Yayıncının bilmesi gereken ek bilgiler, kısıtlamalar veya tercihler.</p>
              <textarea
                rows={3}
                placeholder="Örn: Rakip marka adı geçmesin, belirli bir müzik kullanılsın…"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/20 resize-none"
              />
            </div>

            {/* Mobile: summary card */}
            <div className="lg:hidden">
              <SummaryCard
                username={username}
                selected={selectedTypes}
                budget={budgetNum}
                deadline={deadline}
                brief={brief}
                onSubmit={handleSubmit}
                loading={loading}
                submitError={submitError}
              />
            </div>
          </div>

          {/* ── Desktop summary card ── */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24">
              <SummaryCard
                username={username}
                selected={selectedTypes}
                budget={budgetNum}
                deadline={deadline}
                brief={brief}
                onSubmit={handleSubmit}
                loading={loading}
                submitError={submitError}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
