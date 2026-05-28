"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

// ─── Constants (mirrors profile/complete) ────────────────────────────────────

const PLATFORMS = ["X", "Instagram", "TikTok", "YouTube", "Kick", "Twitch"];

const PLATFORM_ICONS: Record<string, string> = {
  X: "𝕏", Instagram: "📸", TikTok: "🎵", YouTube: "▶", Kick: "🟢", Twitch: "💜",
};

type StatField = { key: string; label: string; placeholder: string };

const PLATFORM_STAT_FIELDS: Record<string, StatField[]> = {
  Instagram: [
    { key: "followers",       label: "Takipçi Sayısı",         placeholder: "120000" },
    { key: "avg_reels_views", label: "Ort. Reels İzlenme",      placeholder: "45000"  },
    { key: "avg_story_views", label: "Ort. Story Görüntülenme", placeholder: "12000"  },
  ],
  TikTok: [
    { key: "followers",       label: "Takipçi Sayısı",    placeholder: "50000" },
    { key: "avg_video_views", label: "Ort. Video İzlenme", placeholder: "80000" },
  ],
  YouTube: [
    { key: "subscribers", label: "Abone Sayısı",       placeholder: "100000" },
    { key: "avg_views",   label: "Ort. Video İzlenme",  placeholder: "30000"  },
  ],
  Kick: [
    { key: "followers",   label: "Takipçi Sayısı",           placeholder: "10000" },
    { key: "avg_viewers", label: "Ort. Eş Zamanlı İzleyici", placeholder: "500"   },
  ],
  Twitch: [
    { key: "followers",   label: "Takipçi Sayısı",           placeholder: "15000" },
    { key: "avg_viewers", label: "Ort. Eş Zamanlı İzleyici", placeholder: "300"   },
  ],
  X: [
    { key: "followers",       label: "Takipçi Sayısı",       placeholder: "25000" },
    { key: "avg_impressions", label: "Ort. Tweet Gösterimi",  placeholder: "5000"  },
  ],
};

const PRICE_ROWS = [
  { col: "price_ig_story",          label: "Story",                               group: "Instagram",     platforms: ["Instagram"],       icon: "📸", defaultDays: 1 },
  { col: "price_ig_reels",          label: "Reels",                               group: "Instagram",     platforms: ["Instagram"],       icon: "📸", defaultDays: 3 },
  { col: "price_ig_post",           label: "Post",                                group: "Instagram",     platforms: ["Instagram"],       icon: "📸", defaultDays: 3 },
  { col: "price_ig_highlight",      label: "Highlight",                           group: "Instagram",     platforms: ["Instagram"],       icon: "📸", defaultDays: 7 },
  { col: "price_ig_bio_link",       label: "Bio Link",                            group: "Instagram",     platforms: ["Instagram"],       icon: "📸", defaultDays: 7 },
  { col: "price_tt_video",          label: "Video",                               group: "TikTok",        platforms: ["TikTok"],          icon: "🎵", defaultDays: 3 },
  { col: "price_tt_live",           label: "Canlı Yayın",                         group: "TikTok",        platforms: ["TikTok"],          icon: "🎵", defaultDays: 1 },
  { col: "price_tt_profile_link",   label: "Profil Linki",                        group: "TikTok",        platforms: ["TikTok"],          icon: "🎵", defaultDays: 7 },
  { col: "price_yt_video",          label: "Video Entegre",                       group: "YouTube",       platforms: ["YouTube"],         icon: "▶",  defaultDays: 7 },
  { col: "price_yt_end_screen",     label: "End Screen",                          group: "YouTube",       platforms: ["YouTube"],         icon: "▶",  defaultDays: 7 },
  { col: "price_yt_desc_link",      label: "Açıklama Linki",                      group: "YouTube",       platforms: ["YouTube"],         icon: "▶",  defaultDays: 7 },
  { col: "price_yt_live_banner",    label: "Canlı Yayın Banner",                  group: "YouTube",       platforms: ["YouTube"],         icon: "▶",  defaultDays: 1 },
  { col: "price_yt_overlay",        label: "Overlay Logo",                        group: "YouTube",       platforms: ["YouTube"],         icon: "▶",  defaultDays: 1 },
  { col: "price_stream_mention",    label: "Sözlü Bahis",                         group: "Kick / Twitch", platforms: ["Kick", "Twitch"],  icon: "🎮", defaultDays: 1 },
  { col: "price_stream_overlay",    label: "Ekran Overlay Logo",                  group: "Kick / Twitch", platforms: ["Kick", "Twitch"],  icon: "🎮", defaultDays: 1 },
  { col: "price_stream_panel",      label: "Panel Banner",                        group: "Kick / Twitch", platforms: ["Kick", "Twitch"],  icon: "🎮", defaultDays: 7 },
  { col: "price_stream_integrated", label: "Canlı Yayın Entegre",                 group: "Kick / Twitch", platforms: ["Kick", "Twitch"],  icon: "🎮", defaultDays: 1 },
  { col: "price_tweet",             label: "Tweet",                               group: "X",             platforms: ["X"],               icon: "𝕏",  defaultDays: 1 },
  { col: "price_x_pinned",          label: "Sabitlenmiş Tweet",                   group: "X",             platforms: ["X"],               icon: "𝕏",  defaultDays: 7 },
  { col: "price_x_thread",          label: "Thread",                              group: "X",             platforms: ["X"],               icon: "𝕏",  defaultDays: 3 },
  { col: "price_x_bio",             label: "Profil Bio",                          group: "X",             platforms: ["X"],               icon: "𝕏",  defaultDays: 7 },
];

const GROUP_ORDER = [...new Set(PRICE_ROWS.map((r) => r.group))];

const CATEGORIES = [
  { label: "Oyun",       emoji: "🎮" },
  { label: "Futbol",     emoji: "⚽" },
  { label: "Mizah",      emoji: "😂" },
  { label: "Influencer", emoji: "🌟" },
  { label: "Müzik",      emoji: "🎤" },
  { label: "Diğer",      emoji: "✨" },
];

const VISIBILITY_OPTIONS = [
  { id: "acik"   as const, label: "Açık",      emoji: "🌐", desc: "Profilin herkese görünür. Markalar seni bulabilir ve teklif gönderebilir." },
  { id: "kapali" as const, label: "Kapalı",    emoji: "🔒", desc: "Profilin gizli. Yalnızca sana gelen teklifleri görebilirsin."             },
  { id: "gizli"  as const, label: "Gizli Mod", emoji: "🕵️", desc: "Platformda görünmezsin ama teklifleri kabul edebilirsin."                },
];

const DELIVERY_OPTIONS = [1, 2, 3, 5, 7, 10, 14];
const MIN_PRICE = 750;

// ─── Types ────────────────────────────────────────────────────────────────────

type SocialAccount = { platform: string; username: string; stats: Record<string, string> };
type PriceEntry    = { price: string; days: number };
type Visibility    = "acik" | "kapali" | "gizli";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(val: string): string {
  const n = parseInt(val);
  if (!val || isNaN(n)) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "K";
  return String(n);
}

function emptyPrices(): Record<string, PriceEntry> {
  return Object.fromEntries(PRICE_ROWS.map((r) => [r.col, { price: "", days: r.defaultDays }]));
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
      <h2 className="text-base font-extrabold mb-5 pb-3 border-b border-gray-100" style={{ color: "#042C53" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/20";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfileEditPage() {
  const router = useRouter();

  const [pageLoading, setPageLoading] = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Social accounts
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [selPlatform,    setSelPlatform]    = useState("Instagram");
  const [selUsername,    setSelUsername]    = useState("");
  const [selStats,       setSelStats]       = useState<Record<string, string>>({});
  const [addError,       setAddError]       = useState("");

  // Bio & categories
  const [categories, setCategories] = useState<string[]>([]);
  const [bio,        setBio]        = useState("");

  // Prices
  const [prices,      setPrices]      = useState<Record<string, PriceEntry>>(emptyPrices());
  const [priceErrors, setPriceErrors] = useState<Record<string, string>>({});

  // Visibility
  const [visibility, setVisibility] = useState<Visibility>("acik");

  // ── Load existing profile ──

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role !== "yayinci") { router.push("/dashboard"); return; }

      const cols = [
        "bio", "categories", "social_accounts", "visibility",
        ...PRICE_ROWS.map((r) => r.col),
      ].join(", ");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: yp } = await (supabase
        .from("yayinci_profiles")
        .select(cols)
        .eq("id", user.id)
        .maybeSingle() as any);

      if (yp) {
        setBio(yp.bio ?? "");
        setCategories(yp.categories ?? []);
        setSocialAccounts(yp.social_accounts ?? []);
        setVisibility((yp.visibility as Visibility) ?? "acik");

        const loaded = emptyPrices();
        for (const row of PRICE_ROWS) {
          const v = yp[row.col];
          if (v !== null && v !== undefined) {
            loaded[row.col] = { price: String(v), days: row.defaultDays };
          }
        }
        setPrices(loaded);
      }

      setPageLoading(false);
    }
    load();
  }, [router]);

  // ── Derived ──

  const addedPlatforms = new Set(socialAccounts.map((a) => a.platform));

  const visiblePriceRows = PRICE_ROWS.filter((row) =>
    row.platforms.some((p) => addedPlatforms.has(p))
  );

  const groupedRows = GROUP_ORDER.reduce((acc, g) => {
    const rows = visiblePriceRows.filter((r) => r.group === g);
    if (rows.length) acc[g] = rows;
    return acc;
  }, {} as Record<string, typeof PRICE_ROWS>);

  const visibleGroups = GROUP_ORDER.filter((g) => groupedRows[g]);

  // ── Social account handlers ──

  function addAccount() {
    setAddError("");
    if (!selUsername.trim()) { setAddError("Kullanıcı adı boş olamaz."); return; }
    if (socialAccounts.some((a) => a.platform === selPlatform)) {
      setAddError(`${selPlatform} hesabı zaten ekli.`); return;
    }
    setSocialAccounts((prev) => [
      ...prev,
      { platform: selPlatform, username: selUsername.trim(), stats: { ...selStats } },
    ]);
    setSelUsername("");
    setSelStats({});
  }

  function removeAccount(i: number) {
    setSocialAccounts((prev) => prev.filter((_, idx) => idx !== i));
  }

  // ── Category handlers ──

  function toggleCategory(label: string) {
    setCategories((prev) =>
      prev.includes(label)
        ? prev.filter((c) => c !== label)
        : prev.length < 3
          ? [...prev, label]
          : prev
    );
  }

  // ── Price handlers ──

  function setPrice(col: string, field: "price" | "days", val: string | number) {
    setPrices((prev) => ({ ...prev, [col]: { ...prev[col], [field]: val } }));
    if (field === "price") setPriceErrors((prev) => ({ ...prev, [col]: "" }));
  }

  function validatePrices(): boolean {
    const errs: Record<string, string> = {};
    for (const row of visiblePriceRows) {
      const raw = prices[row.col].price;
      if (!raw) continue;
      const n = parseFloat(raw);
      if (isNaN(n) || n < MIN_PRICE)
        errs[row.col] = `Minimum ₺${MIN_PRICE.toLocaleString("tr-TR")} olmalıdır.`;
    }
    setPriceErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Save ──

  async function handleSave() {
    if (!validatePrices()) return;
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const toNum = (col: string) => {
      const v = prices[col]?.price;
      return v && !isNaN(parseFloat(v)) ? parseFloat(v) : null;
    };

    const { error } = await supabase.from("yayinci_profiles").upsert({
      id:              user.id,
      bio:             bio.trim(),
      platforms:       [...new Set(socialAccounts.map((a) => a.platform))],
      social_accounts: socialAccounts,
      categories,
      visibility,
      price_ig_story:          toNum("price_ig_story"),
      price_ig_reels:          toNum("price_ig_reels"),
      price_ig_post:           toNum("price_ig_post"),
      price_ig_highlight:      toNum("price_ig_highlight"),
      price_ig_bio_link:       toNum("price_ig_bio_link"),
      price_tt_video:          toNum("price_tt_video"),
      price_tt_live:           toNum("price_tt_live"),
      price_tt_profile_link:   toNum("price_tt_profile_link"),
      price_yt_video:          toNum("price_yt_video"),
      price_yt_end_screen:     toNum("price_yt_end_screen"),
      price_yt_desc_link:      toNum("price_yt_desc_link"),
      price_yt_live_banner:    toNum("price_yt_live_banner"),
      price_yt_overlay:        toNum("price_yt_overlay"),
      price_stream_mention:    toNum("price_stream_mention"),
      price_stream_overlay:    toNum("price_stream_overlay"),
      price_stream_panel:      toNum("price_stream_panel"),
      price_stream_integrated: toNum("price_stream_integrated"),
      price_tweet:             toNum("price_tweet"),
      price_x_pinned:          toNum("price_x_pinned"),
      price_x_thread:          toNum("price_x_thread"),
      price_x_bio:             toNum("price_x_bio"),
    }, { onConflict: "id" });

    if (error) {
      setSaveError("Kayıt hatası: " + error.message);
      setSaving(false);
      return;
    }

    setSaveSuccess(true);
    setSaving(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Loading state ──

  if (pageLoading) {
    return (
      <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #E6F1FB 0%, #ffffff 60%)" }}>
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#185FA5", borderTopColor: "transparent" }} />
        </div>
      </div>
    );
  }

  // ── Render ──

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

        {/* Page header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold" style={{ color: "#042C53" }}>Profili Düzenle</h1>
            <p className="text-sm text-gray-500 mt-1">Yayıncı profilini güncel tut, daha fazla teklif al.</p>
          </div>
          <a href="/dashboard" className="text-sm font-semibold hover:underline" style={{ color: "#185FA5" }}>
            ← Dashboard
          </a>
        </div>

        {/* Success banner */}
        {saveSuccess && (
          <div className="mb-6 rounded-2xl px-5 py-4 flex items-center gap-3 text-sm font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200">
            <span className="text-lg">✅</span>
            Profilin başarıyla güncellendi!
          </div>
        )}

        <div className="flex flex-col gap-5">

          {/* ── Bio & Kategoriler ── */}
          <Section title="Hakkında & Kategoriler">
            <div className="mb-5">
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                Kategoriler <span className="text-gray-300 ml-1">({categories.length}/3)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {CATEGORIES.map((cat) => {
                  const sel = categories.includes(cat.label);
                  const dis = !sel && categories.length >= 3;
                  return (
                    <button
                      key={cat.label}
                      onClick={() => !dis && toggleCategory(cat.label)}
                      disabled={dis}
                      className="flex items-center gap-2.5 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        borderColor: sel ? "#185FA5" : "#E5E7EB",
                        backgroundColor: sel ? "#EBF4FF" : "white",
                        color: sel ? "#185FA5" : "#374151",
                      }}
                    >
                      <span>{cat.emoji}</span>
                      {cat.label}
                      {sel && <span className="ml-auto text-xs">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Hakkımda</label>
              <textarea
                rows={4}
                placeholder="Kendini markalar için tanıt. İçerik tarzın, hedef kitlen ve iş birliği tercihlerinden bahset."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={500}
                className={inputCls + " resize-none"}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{bio.length}/500</p>
            </div>
          </Section>

          {/* ── Sosyal Medya Hesapları ── */}
          <Section title="Sosyal Medya Hesapları">
            {/* Add account form */}
            <div className="rounded-xl border border-gray-200 p-5 mb-4">
              <div className="flex gap-2 mb-4">
                <select
                  value={selPlatform}
                  onChange={(e) => { setSelPlatform(e.target.value); setSelStats({}); setAddError(""); }}
                  className="rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/20 bg-white flex-shrink-0"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>{PLATFORM_ICONS[p]} {p}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Kullanıcı adın (@ olmadan)"
                  value={selUsername}
                  onChange={(e) => setSelUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAccount())}
                  className={inputCls + " flex-1"}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {PLATFORM_STAT_FIELDS[selPlatform].map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">{field.label}</label>
                    <input
                      type="number"
                      min={0}
                      placeholder={field.placeholder}
                      value={selStats[field.key] ?? ""}
                      onChange={(e) => setSelStats((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                ))}
              </div>

              {addError && <p className="text-xs text-red-600 mb-3">{addError}</p>}

              <button
                onClick={addAccount}
                className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: "#185FA5" }}
              >
                + Hesap Ekle
              </button>
            </div>

            {/* Existing accounts */}
            {socialAccounts.length > 0 ? (
              <div className="flex flex-col gap-3">
                {socialAccounts.map((acc, i) => {
                  const fields = PLATFORM_STAT_FIELDS[acc.platform] ?? [];
                  return (
                    <div key={i} className="rounded-xl border border-gray-100 p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{PLATFORM_ICONS[acc.platform]}</span>
                          <div>
                            <span className="text-sm font-bold text-gray-800">{acc.platform}</span>
                            <span className="text-sm text-gray-500 ml-2">@{acc.username}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeAccount(i)}
                          className="text-gray-400 hover:text-red-500 transition-colors text-xl leading-none"
                        >
                          ×
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {fields.map((f) =>
                          acc.stats[f.key] ? (
                            <span
                              key={f.key}
                              className="text-xs font-medium rounded-full px-2.5 py-1"
                              style={{ backgroundColor: "#E6F1FB", color: "#185FA5" }}
                            >
                              {f.label}: <strong>{fmt(acc.stats[f.key])}</strong>
                            </span>
                          ) : null
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
                Henüz hesap eklenmedi.
              </div>
            )}
          </Section>

          {/* ── Fiyat Listesi ── */}
          <Section title="Fiyat Listesi">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1 mb-5" style={{ backgroundColor: "#FFF3E0", color: "#E65100" }}>
              ⚠ Minimum fiyat ₺{MIN_PRICE.toLocaleString("tr-TR")} — boş bırakılan alanlar listede gösterilmez
            </div>

            {visiblePriceRows.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
                Fiyat girebilmek için önce sosyal medya hesabı eklemen gerekiyor.
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {visibleGroups.map((group) => (
                  <div key={group}>
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                      <span className="text-base">{groupedRows[group][0].icon}</span>
                      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#185FA5" }}>{group}</span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {groupedRows[group].map((row) => (
                        <div key={row.col} className="rounded-xl border border-gray-100 p-5 bg-gray-50">
                          <p className="text-sm font-bold mb-4" style={{ color: "#042C53" }}>{row.label}</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Fiyat (₺)</label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">₺</span>
                                <input
                                  type="number"
                                  min={MIN_PRICE}
                                  placeholder={String(MIN_PRICE)}
                                  value={prices[row.col].price}
                                  onChange={(e) => setPrice(row.col, "price", e.target.value)}
                                  className={inputCls + " pl-7"}
                                />
                              </div>
                              {priceErrors[row.col] && (
                                <p className="text-xs text-red-600 mt-1">{priceErrors[row.col]}</p>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Teslimat</label>
                              <select
                                value={prices[row.col].days}
                                onChange={(e) => setPrice(row.col, "days", parseInt(e.target.value))}
                                className={inputCls}
                              >
                                {DELIVERY_OPTIONS.map((d) => (
                                  <option key={d} value={d}>{d} gün</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* ── Görünürlük ── */}
          <Section title="Görünürlük">
            <div className="flex flex-col gap-3">
              {VISIBILITY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setVisibility(opt.id)}
                  className="flex items-start gap-4 rounded-xl border-2 p-5 text-left transition-all"
                  style={{
                    borderColor: visibility === opt.id ? "#185FA5" : "#E5E7EB",
                    backgroundColor: visibility === opt.id ? "#EBF4FF" : "white",
                  }}
                >
                  <span className="text-2xl mt-0.5 flex-shrink-0">{opt.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold" style={{ color: visibility === opt.id ? "#185FA5" : "#042C53" }}>
                        {opt.label}
                      </span>
                      <span
                        className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                        style={{ borderColor: visibility === opt.id ? "#185FA5" : "#D1D5DB" }}
                      >
                        {visibility === opt.id && (
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#185FA5" }} />
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </Section>

          {/* ── Save ── */}
          {saveError && (
            <div className="rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">
              {saveError}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-2xl py-4 text-base font-semibold text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            style={{ backgroundColor: "#185FA5" }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.backgroundColor = "#042C53"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#185FA5"; }}
          >
            {saving ? "Kaydediliyor…" : "Değişiklikleri Kaydet ✓"}
          </button>

        </div>
      </div>
    </div>
  );
}
