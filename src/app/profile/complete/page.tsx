"use client";

/*
  Run in Supabase SQL Editor before using this page:

  alter table yayinci_profiles
    add column if not exists social_accounts      jsonb    default '[]',
    add column if not exists categories           text[]   default '{}',
    add column if not exists visibility           text     default 'acik',
    add column if not exists proof_files          jsonb    default '{}',
    add column if not exists verified             boolean  default false,
    -- Instagram
    add column if not exists price_ig_story          numeric,
    add column if not exists price_ig_reels          numeric,
    add column if not exists price_ig_post           numeric,
    add column if not exists price_ig_highlight      numeric,
    add column if not exists price_ig_bio_link       numeric,
    -- TikTok
    add column if not exists price_tt_video          numeric,
    add column if not exists price_tt_live           numeric,
    add column if not exists price_tt_profile_link   numeric,
    -- YouTube
    add column if not exists price_yt_video          numeric,
    add column if not exists price_yt_end_screen     numeric,
    add column if not exists price_yt_desc_link      numeric,
    add column if not exists price_yt_live_banner    numeric,
    add column if not exists price_yt_overlay        numeric,
    -- Kick / Twitch
    add column if not exists price_stream_mention    numeric,
    add column if not exists price_stream_overlay    numeric,
    add column if not exists price_stream_panel      numeric,
    add column if not exists price_stream_integrated numeric,
    -- X
    add column if not exists price_tweet             numeric,
    add column if not exists price_x_pinned          numeric,
    add column if not exists price_x_thread          numeric,
    add column if not exists price_x_bio             numeric;

  Storage bucket (run once in Supabase dashboard or SQL):
    insert into storage.buckets (id, name, public)
    values ('proofs', 'proofs', true)
    on conflict do nothing;

  Storage RLS (allow authenticated users to upload their own proofs):
    create policy "Users upload own proofs" on storage.objects
      for insert to authenticated
      with check (bucket_id = 'proofs' and (storage.foldername(name))[1] = auth.uid()::text);

    create policy "Proofs public read" on storage.objects
      for select to public
      using (bucket_id = 'proofs');

  RLS policies needed on yayinci_profiles:
    INSERT: WITH CHECK (auth.uid() = id)
    UPDATE: USING (auth.uid() = id)
    SELECT: USING (auth.uid() = id)
*/

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Sosyal Medya"   },
  { id: 2, label: "Niş & Kategori" },
  { id: 3, label: "Fiyatlar"       },
  { id: 4, label: "Görünürlük"     },
  { id: 5, label: "Kanıtlar"       },
];

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
    { key: "subscribers", label: "Abone Sayısı",      placeholder: "100000" },
    { key: "avg_views",   label: "Ort. Video İzlenme", placeholder: "30000"  },
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
    { key: "followers",       label: "Takipçi Sayısı",      placeholder: "25000" },
    { key: "avg_impressions", label: "Ort. Tweet Gösterimi", placeholder: "5000"  },
  ],
};

const PRICE_ROWS = [
  // Instagram
  { col: "price_ig_story",          label: "Story",                                group: "Instagram",    platforms: ["Instagram"],       icon: "📸", defaultDays: 1 },
  { col: "price_ig_reels",          label: "Reels",                                group: "Instagram",    platforms: ["Instagram"],       icon: "📸", defaultDays: 3 },
  { col: "price_ig_post",           label: "Post",                                 group: "Instagram",    platforms: ["Instagram"],       icon: "📸", defaultDays: 3 },
  { col: "price_ig_highlight",      label: "Highlight",                            group: "Instagram",    platforms: ["Instagram"],       icon: "📸", defaultDays: 7 },
  { col: "price_ig_bio_link",       label: "Bio Link",                             group: "Instagram",    platforms: ["Instagram"],       icon: "📸", defaultDays: 7 },
  // TikTok
  { col: "price_tt_video",          label: "Video",                                group: "TikTok",       platforms: ["TikTok"],          icon: "🎵", defaultDays: 3 },
  { col: "price_tt_live",           label: "Canlı Yayın",                          group: "TikTok",       platforms: ["TikTok"],          icon: "🎵", defaultDays: 1 },
  { col: "price_tt_profile_link",   label: "Profil Linki",                         group: "TikTok",       platforms: ["TikTok"],          icon: "🎵", defaultDays: 7 },
  // YouTube
  { col: "price_yt_video",          label: "Video Entegre (Başı / Ortası / Sonu)", group: "YouTube",      platforms: ["YouTube"],          icon: "▶",  defaultDays: 7 },
  { col: "price_yt_end_screen",     label: "End Screen",                           group: "YouTube",      platforms: ["YouTube"],          icon: "▶",  defaultDays: 7 },
  { col: "price_yt_desc_link",      label: "Açıklama Linki",                       group: "YouTube",      platforms: ["YouTube"],          icon: "▶",  defaultDays: 7 },
  { col: "price_yt_live_banner",    label: "Canlı Yayın Banner",                   group: "YouTube",      platforms: ["YouTube"],          icon: "▶",  defaultDays: 1 },
  { col: "price_yt_overlay",        label: "Overlay Logo",                         group: "YouTube",      platforms: ["YouTube"],          icon: "▶",  defaultDays: 1 },
  // Kick / Twitch
  { col: "price_stream_mention",    label: "Canlı Yayın Sözlü Bahis",              group: "Kick / Twitch", platforms: ["Kick", "Twitch"], icon: "🎮", defaultDays: 1 },
  { col: "price_stream_overlay",    label: "Ekran Overlay Logo",                   group: "Kick / Twitch", platforms: ["Kick", "Twitch"], icon: "🎮", defaultDays: 1 },
  { col: "price_stream_panel",      label: "Panel Banner",                         group: "Kick / Twitch", platforms: ["Kick", "Twitch"], icon: "🎮", defaultDays: 7 },
  { col: "price_stream_integrated", label: "Canlı Yayın Entegre",                  group: "Kick / Twitch", platforms: ["Kick", "Twitch"], icon: "🎮", defaultDays: 1 },
  // X (Twitter)
  { col: "price_tweet",             label: "Tweet",                                group: "X",            platforms: ["X"],               icon: "𝕏",  defaultDays: 1 },
  { col: "price_x_pinned",          label: "Sabitlenmiş Tweet",                    group: "X",            platforms: ["X"],               icon: "𝕏",  defaultDays: 7 },
  { col: "price_x_thread",          label: "Thread",                               group: "X",            platforms: ["X"],               icon: "𝕏",  defaultDays: 3 },
  { col: "price_x_bio",             label: "Profil Bio",                           group: "X",            platforms: ["X"],               icon: "𝕏",  defaultDays: 7 },
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
  { id: "kapali" as const, label: "Kapalı",    emoji: "🔒", desc: "Profilin gizli. Yalnızca sana gelen teklifleri görebilirsin." },
  { id: "gizli"  as const, label: "Gizli Mod", emoji: "🕵️", desc: "Platformda görünmezsin ama teklifleri kabul edebilirsin. Kimliğin tam gizlilikte kalır." },
];

type ProofDef = { key: string; platform: string; label: string; desc: string };

const PROOF_DEFS: ProofDef[] = [
  // Instagram
  { key: "ig_stats_30d",    platform: "Instagram", label: "Hesap İstatistikleri (Son 30 Gün)", desc: "Reach ve impression gösteren ekran görüntüsü"                       },
  { key: "ig_demographics", platform: "Instagram", label: "Kitle Demografisi",                 desc: "Yaş, cinsiyet ve konum dağılımı ekran görüntüsü"                    },
  { key: "ig_reels_perf",   platform: "Instagram", label: "Son 5 Reels Performansı",           desc: "Son 5 reels videosunun izlenme ve etkileşim istatistikleri"          },
  // TikTok
  { key: "tt_analytics",    platform: "TikTok",    label: "TikTok Analytics (Son 28 Gün)",    desc: "Genel hesap analitiği ekran görüntüsü"                               },
  { key: "tt_avg_views",    platform: "TikTok",    label: "Video Görüntülenme Ortalaması",     desc: "Ortalama video görüntülenme sayısı kanıtı"                           },
  { key: "tt_demographics", platform: "TikTok",    label: "Takipçi Demografisi",               desc: "Yaş, cinsiyet ve konum dağılımı ekran görüntüsü"                    },
  // YouTube
  { key: "yt_analytics",    platform: "YouTube",   label: "YouTube Studio Analytics (Son 28 Gün)", desc: "Studio analitiği ekran görüntüsü"                             },
  { key: "yt_demographics", platform: "YouTube",   label: "İzleyici Demografisi",              desc: "Yaş, cinsiyet ve coğrafi dağılım ekran görüntüsü"                   },
  { key: "yt_watch_time",   platform: "YouTube",   label: "Ortalama İzlenme Süresi",           desc: "Ortalama izlenme süresi ve tıklama oranı ekran görüntüsü"            },
  // Kick
  { key: "kick_viewers",    platform: "Kick",      label: "Ortalama Eş Zamanlı İzleyici",     desc: "Yayın sırasında alınmış izleyici sayısı ekran görüntüsü"             },
  { key: "kick_stats",      platform: "Kick",      label: "Kanal İstatistikleri",              desc: "Kanal genel istatistikleri ekran görüntüsü"                          },
  // Twitch
  { key: "twitch_viewers",  platform: "Twitch",    label: "Ortalama Eş Zamanlı İzleyici",     desc: "Yayın sırasında alınmış izleyici sayısı ekran görüntüsü"             },
  { key: "twitch_stats",    platform: "Twitch",    label: "Kanal İstatistikleri",              desc: "Kanal genel istatistikleri ekran görüntüsü"                          },
  // X
  { key: "x_analytics",     platform: "X",         label: "Tweet Analitik",                   desc: "Tweet analitik ekran görüntüsü"                                      },
  { key: "x_profile_stats", platform: "X",         label: "Profil Ziyaret ve Gösterim",       desc: "Profil ziyaret ve gösterim istatistikleri ekran görüntüsü"            },
];

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

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

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ current }: { current: number }) {
  return (
    <div className="w-full mb-10">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" />
        <div
          className="absolute top-4 left-0 h-0.5 z-0 transition-all duration-500"
          style={{ backgroundColor: "#185FA5", width: `${((current - 1) / (STEPS.length - 1)) * 100}%` }}
        />
        {STEPS.map((s) => {
          const done = s.id < current; const active = s.id === current;
          return (
            <div key={s.id} className="flex flex-col items-center gap-2 z-10">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all"
                style={{
                  backgroundColor: done || active ? "#185FA5" : "white",
                  borderColor:     done || active ? "#185FA5" : "#E5E7EB",
                  color:           done || active ? "white"   : "#9CA3AF",
                }}
              >
                {done ? "✓" : s.id}
              </div>
              <span className="text-xs font-semibold hidden sm:block" style={{ color: active ? "#185FA5" : done ? "#6B7280" : "#9CA3AF" }}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/20";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfileCompletePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // ── Step 1 state ──
  const [selPlatform, setSelPlatform]       = useState("Instagram");
  const [selUsername, setSelUsername]       = useState("");
  const [selStats, setSelStats]             = useState<Record<string, string>>({});
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [addError, setAddError]             = useState("");

  // ── Step 2 state ──
  const [categories, setCategories] = useState<string[]>([]);
  const [bio, setBio]               = useState("");

  // ── Step 3 state ──
  const [prices, setPrices] = useState<Record<string, PriceEntry>>(
    Object.fromEntries(PRICE_ROWS.map((r) => [r.col, { price: "", days: r.defaultDays }]))
  );
  const [priceErrors, setPriceErrors] = useState<Record<string, string>>({});

  // ── Step 4 state ──
  const [visibility, setVisibility] = useState<Visibility>("acik");

  // ── Step 5 state ──
  const [proofUrls, setProofUrls]           = useState<Record<string, string>>({});
  const [uploadingKeys, setUploadingKeys]   = useState<Set<string>>(new Set());
  const [proofFileErrors, setProofFileErrors] = useState<Record<string, string>>({});
  const [proofStepError, setProofStepError] = useState("");

  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState("");

  // ── Derived ──
  const addedPlatforms = new Set(socialAccounts.map((a) => a.platform));

  const visiblePriceRows = PRICE_ROWS.filter((row) =>
    row.platforms.some((p) => addedPlatforms.has(p))
  );

  const groupedVisibleRows = GROUP_ORDER.reduce((acc, g) => {
    const rows = visiblePriceRows.filter((r) => r.group === g);
    if (rows.length) acc[g] = rows;
    return acc;
  }, {} as Record<string, typeof PRICE_ROWS>);
  const visibleGroups = GROUP_ORDER.filter((g) => groupedVisibleRows[g]);

  // Proof defs for the platforms the user actually added, grouped by platform
  const visibleProofPlatforms = PLATFORMS.filter((p) => addedPlatforms.has(p));
  const visibleProofDefs      = PROOF_DEFS.filter((d) => addedPlatforms.has(d.platform));

  // ── Step 1 handlers ──

  function handlePlatformChange(p: string) {
    setSelPlatform(p);
    setSelStats({});
    setAddError("");
  }

  function addAccount() {
    setAddError("");
    if (!selUsername.trim()) { setAddError("Kullanıcı adı boş olamaz."); return; }
    if (socialAccounts.some((a) => a.platform === selPlatform)) {
      setAddError(`${selPlatform} hesabı zaten ekli.`); return;
    }
    setSocialAccounts((prev) => [...prev, { platform: selPlatform, username: selUsername.trim(), stats: { ...selStats } }]);
    setSelUsername("");
    setSelStats({});
  }

  function removeAccount(i: number) {
    setSocialAccounts((prev) => prev.filter((_, idx) => idx !== i));
  }

  // ── Step 2 handlers ──

  function toggleCategory(label: string) {
    setCategories((prev) =>
      prev.includes(label) ? prev.filter((c) => c !== label) : prev.length < 3 ? [...prev, label] : prev
    );
  }

  // ── Step 3 handlers ──

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

  // ── Step 5 handlers ──

  async function handleFileSelect(key: string, file: File) {
    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setProofFileErrors((prev) => ({ ...prev, [key]: "Sadece JPG, PNG veya PDF yükleyebilirsiniz." }));
      return;
    }
    // Validate size
    if (file.size > MAX_FILE_BYTES) {
      setProofFileErrors((prev) => ({ ...prev, [key]: "Dosya boyutu 5MB'yi geçemez." }));
      return;
    }

    setProofFileErrors((prev) => ({ ...prev, [key]: "" }));
    setUploadingKeys((prev) => new Set([...prev, key]));

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const ext  = file.name.split(".").pop() ?? "bin";
    const path = `${user.id}/${key}-${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from("proofs")
      .upload(path, file, { upsert: true, contentType: file.type });

    setUploadingKeys((prev) => { const n = new Set(prev); n.delete(key); return n; });

    if (error) {
      setProofFileErrors((prev) => ({ ...prev, [key]: "Yükleme başarısız: " + error.message }));
      return;
    }

    // Store the storage path so viewers can generate signed URLs
    setProofUrls((prev) => ({ ...prev, [key]: data.path }));
    setProofStepError("");
  }

  function validateProofs(): boolean {
    const missing = visibleProofDefs.filter((d) => !proofUrls[d.key]);
    if (missing.length > 0) {
      setProofStepError("Lütfen tüm gerekli kanıt dosyalarını yükleyin.");
      return false;
    }
    return true;
  }

  // ── Navigation ──

  function goNext() {
    if (step === 3 && !validatePrices()) return;
    setStep((s) => s + 1);
  }

  // ── Save ──

  async function handleSave() {
    if (!validateProofs()) return;
    setSaving(true);
    setSaveError("");

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
      proof_files:     proofUrls,
      verified:        false,
      // Instagram
      price_ig_story:          toNum("price_ig_story"),
      price_ig_reels:          toNum("price_ig_reels"),
      price_ig_post:           toNum("price_ig_post"),
      price_ig_highlight:      toNum("price_ig_highlight"),
      price_ig_bio_link:       toNum("price_ig_bio_link"),
      // TikTok
      price_tt_video:          toNum("price_tt_video"),
      price_tt_live:           toNum("price_tt_live"),
      price_tt_profile_link:   toNum("price_tt_profile_link"),
      // YouTube
      price_yt_video:          toNum("price_yt_video"),
      price_yt_end_screen:     toNum("price_yt_end_screen"),
      price_yt_desc_link:      toNum("price_yt_desc_link"),
      price_yt_live_banner:    toNum("price_yt_live_banner"),
      price_yt_overlay:        toNum("price_yt_overlay"),
      // Kick / Twitch
      price_stream_mention:    toNum("price_stream_mention"),
      price_stream_overlay:    toNum("price_stream_overlay"),
      price_stream_panel:      toNum("price_stream_panel"),
      price_stream_integrated: toNum("price_stream_integrated"),
      // X
      price_tweet:             toNum("price_tweet"),
      price_x_pinned:          toNum("price_x_pinned"),
      price_x_thread:          toNum("price_x_thread"),
      price_x_bio:             toNum("price_x_bio"),
    }, { onConflict: "id" });

    if (error) {
      console.error("[profile/complete] upsert error:", error);
      setSaveError("Profil kaydedilirken bir hata oluştu: " + error.message);
      setSaving(false);
      return;
    }

    router.push("/dashboard");
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <a href="/" className="text-2xl font-extrabold tracking-tight" style={{ color: "#185FA5" }}>Sponsorum</a>
          <span className="text-xs font-semibold text-gray-400">Profil Kurulumu</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <ProgressBar current={step} />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 sm:p-9">

          {/* ── Step 1: Sosyal Medya ── */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-extrabold mb-1" style={{ color: "#042C53" }}>Sosyal Medya Hesapları</h2>
              <p className="text-sm text-gray-500 mb-7">Hangi platformlarda içerik ürettiğini ve istatistiklerini ekle.</p>

              {/* Add form */}
              <div className="rounded-xl border border-gray-200 p-5 mb-5">
                <div className="flex gap-2 mb-4">
                  <select
                    value={selPlatform}
                    onChange={(e) => handlePlatformChange(e.target.value)}
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

              {/* Added accounts list */}
              {socialAccounts.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {socialAccounts.map((acc, i) => {
                    const fields = PLATFORM_STAT_FIELDS[acc.platform] ?? [];
                    return (
                      <div key={i} className="rounded-xl border border-gray-100 p-4" style={{ backgroundColor: "#F9FAFB" }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{PLATFORM_ICONS[acc.platform]}</span>
                            <div>
                              <span className="text-sm font-bold text-gray-800">{acc.platform}</span>
                              <span className="text-sm text-gray-500 ml-2">@{acc.username}</span>
                            </div>
                          </div>
                          <button onClick={() => removeAccount(i)} className="text-gray-400 hover:text-red-500 transition-colors text-xl leading-none">×</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {fields.map((f) => (
                            acc.stats[f.key] ? (
                              <span key={f.key} className="text-xs font-medium rounded-full px-2.5 py-1" style={{ backgroundColor: "#E6F1FB", color: "#185FA5" }}>
                                {f.label}: <strong>{fmt(acc.stats[f.key])}</strong>
                              </span>
                            ) : null
                          ))}
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
            </div>
          )}

          {/* ── Step 2: Niş & Kategori ── */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-extrabold mb-1" style={{ color: "#042C53" }}>Niş & Kategori</h2>
              <p className="text-sm text-gray-500 mb-7">En fazla 3 kategori seç ve kendini tanıt.</p>

              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                Kategoriler <span className="ml-1 text-gray-300">({categories.length}/3)</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-7">
                {CATEGORIES.map((cat) => {
                  const sel = categories.includes(cat.label);
                  const dis = !sel && categories.length >= 3;
                  return (
                    <button
                      key={cat.label}
                      onClick={() => !dis && toggleCategory(cat.label)}
                      disabled={dis}
                      className="flex items-center gap-2.5 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ borderColor: sel ? "#185FA5" : "#E5E7EB", backgroundColor: sel ? "#EBF4FF" : "white", color: sel ? "#185FA5" : "#374151" }}
                    >
                      <span>{cat.emoji}</span>{cat.label}{sel && <span className="ml-auto text-xs">✓</span>}
                    </button>
                  );
                })}
              </div>

              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Hakkında</p>
              <textarea
                rows={4}
                placeholder="Kendini markalar için tanıt. İçerik tarzın, hedef kitlen ve iş birliği tercihlerinden bahset."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={500}
                className={inputCls + " resize-none"}
              />
              <p className="text-xs text-gray-400 mt-1.5 text-right">{bio.length}/500</p>
            </div>
          )}

          {/* ── Step 3: Fiyatlar ── */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-extrabold mb-1" style={{ color: "#042C53" }}>Fiyat Listesi</h2>
              <p className="text-sm text-gray-500 mb-2">Eklediğin platformlara göre içerik fiyatlarını belirle.</p>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1 mb-6" style={{ backgroundColor: "#FFF3E0", color: "#E65100" }}>
                ⚠ Minimum fiyat ₺{MIN_PRICE.toLocaleString("tr-TR")}
              </div>

              {visiblePriceRows.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
                  Adım 1&apos;de sosyal medya hesabı eklemen gerekiyor.
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {visibleGroups.map((group) => (
                    <div key={group}>
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                        <span className="text-base">{groupedVisibleRows[group][0].icon}</span>
                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#185FA5" }}>{group}</span>
                      </div>
                      <div className="flex flex-col gap-3">
                        {groupedVisibleRows[group].map((row) => (
                          <div key={row.col} className="rounded-xl border border-gray-100 p-5" style={{ backgroundColor: "#FAFAFA" }}>
                            <div className="flex items-center gap-2 mb-4">
                              <span className="text-sm font-bold" style={{ color: "#042C53" }}>{row.label}</span>
                              {row.platforms.length > 1 && (
                                <span className="text-xs text-gray-400 ml-1">({row.platforms.filter((p) => addedPlatforms.has(p)).join(" & ")})</span>
                              )}
                            </div>
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
                                {priceErrors[row.col] && <p className="text-xs text-red-600 mt-1">{priceErrors[row.col]}</p>}
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
            </div>
          )}

          {/* ── Step 4: Görünürlük ── */}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-extrabold mb-1" style={{ color: "#042C53" }}>Görünürlük Ayarı</h2>
              <p className="text-sm text-gray-500 mb-7">Profilinin platformda nasıl görüneceğini seç.</p>
              <div className="flex flex-col gap-3">
                {VISIBILITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setVisibility(opt.id)}
                    className="flex items-start gap-4 rounded-xl border-2 p-5 text-left transition-all"
                    style={{ borderColor: visibility === opt.id ? "#185FA5" : "#E5E7EB", backgroundColor: visibility === opt.id ? "#EBF4FF" : "white" }}
                  >
                    <span className="text-2xl mt-0.5 flex-shrink-0">{opt.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold" style={{ color: visibility === opt.id ? "#185FA5" : "#042C53" }}>{opt.label}</span>
                        <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: visibility === opt.id ? "#185FA5" : "#D1D5DB" }}>
                          {visibility === opt.id && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#185FA5" }} />}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 5: Kanıtlar ── */}
          {step === 5 && (
            <div>
              <h2 className="text-xl font-extrabold mb-1" style={{ color: "#042C53" }}>İstatistik Kanıtları</h2>
              <p className="text-sm text-gray-500 mb-2">
                Eklediğin her platform için istatistik ekran görüntülerini yükle. Sponsorum ekibi tarafından incelenerek profilin onaylanacak.
              </p>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1 mb-7" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8" }}>
                JPG, PNG veya PDF · Maks. 5MB · Tüm alanlar zorunlu
              </div>

              {visibleProofPlatforms.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
                  Adım 1&apos;de sosyal medya hesabı eklemen gerekiyor.
                </div>
              ) : (
                <div className="flex flex-col gap-8">
                  {visibleProofPlatforms.map((platform) => {
                    const defs = PROOF_DEFS.filter((d) => d.platform === platform);
                    return (
                      <div key={platform}>
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                          <span>{PLATFORM_ICONS[platform]}</span>
                          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#185FA5" }}>{platform}</span>
                        </div>
                        <div className="flex flex-col gap-4">
                          {defs.map((proof) => {
                            const uploaded  = !!proofUrls[proof.key];
                            const uploading = uploadingKeys.has(proof.key);
                            const err       = proofFileErrors[proof.key];

                            return (
                              <div key={proof.key} className="rounded-xl border border-gray-100 p-5" style={{ backgroundColor: "#FAFAFA" }}>
                                <div className="flex items-start justify-between gap-3 mb-1">
                                  <div>
                                    <p className="text-sm font-bold" style={{ color: "#042C53" }}>{proof.label}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{proof.desc}</p>
                                  </div>
                                  {uploaded && (
                                    <span className="flex-shrink-0 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1">
                                      ✓ Yüklendi
                                    </span>
                                  )}
                                </div>

                                <div className="mt-3">
                                  <label className="cursor-pointer">
                                    <input
                                      type="file"
                                      accept=".jpg,.jpeg,.png,.pdf"
                                      className="hidden"
                                      disabled={uploading}
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileSelect(proof.key, file);
                                        e.target.value = "";
                                      }}
                                    />
                                    <div
                                      className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3 px-4 text-sm font-semibold transition-all"
                                      style={{
                                        borderColor:     uploaded ? "#10B981" : "#E5E7EB",
                                        backgroundColor: uploaded ? "#F0FDF4" : "white",
                                        color:           uploading ? "#9CA3AF" : uploaded ? "#059669" : "#185FA5",
                                        cursor:          uploading ? "not-allowed" : "pointer",
                                      }}
                                    >
                                      {uploading ? (
                                        <>
                                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                          </svg>
                                          Yükleniyor…
                                        </>
                                      ) : uploaded ? (
                                        <>✓ Değiştir</>
                                      ) : (
                                        <>
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 0l-3 3m3-3l3 3" />
                                          </svg>
                                          Dosya Seç
                                        </>
                                      )}
                                    </div>
                                  </label>

                                  {err && (
                                    <p className="text-xs text-red-600 mt-1.5">{err}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {proofStepError && (
                <div className="mt-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {proofStepError}
                </div>
              )}

              {saveError && (
                <div className="mt-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {saveError}
                </div>
              )}

              <div className="mt-6 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-xs text-amber-700 leading-relaxed">
                🔍 Yüklenen dosyalar Sponsorum ekibi tarafından incelenecek. Onay sonrası profilin &quot;Doğrulanmış&quot; rozeti kazanacak.
              </div>
            </div>
          )}

          {/* ── Navigation ── */}
          <div className={`flex mt-8 ${step > 1 ? "justify-between" : "justify-end"}`}>
            {step > 1 && (
              <button onClick={() => setStep((s) => s - 1)} disabled={saving}
                className="rounded-xl px-6 py-3 text-sm font-semibold border-2 transition-all hover:bg-gray-50 disabled:opacity-50"
                style={{ borderColor: "#E5E7EB", color: "#6B7280" }}>
                ← Geri
              </button>
            )}
            {step < 5 ? (
              <button onClick={goNext}
                className="rounded-xl px-8 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ backgroundColor: "#185FA5" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#042C53")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#185FA5")}>
                İleri →
              </button>
            ) : (
              <button onClick={handleSave} disabled={saving || uploadingKeys.size > 0}
                className="rounded-xl px-8 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#185FA5" }}
                onMouseEnter={e => { if (!saving) e.currentTarget.style.backgroundColor = "#042C53"; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#185FA5"; }}>
                {saving ? "Kaydediliyor…" : uploadingKeys.size > 0 ? "Yükleniyor…" : "Profili Tamamla ✓"}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          Adım {step} / {STEPS.length} — {STEPS[step - 1].label}
        </p>
      </div>
    </div>
  );
}
