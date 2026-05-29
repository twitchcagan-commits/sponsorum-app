"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORMS = ["X", "Instagram", "TikTok", "YouTube", "Kick", "Twitch"];

const PLATFORM_ICONS: Record<string, string> = {
  X: "𝕏", Instagram: "📸", TikTok: "🎵", YouTube: "▶", Kick: "🟢", Twitch: "💜",
};

const PLATFORM_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Instagram: { bg: "#FFF0F9", text: "#C026D3", border: "#F0ABFC" },
  TikTok:    { bg: "#F0F0F0", text: "#111111", border: "#D1D5DB" },
  YouTube:   { bg: "#FFF0F0", text: "#DC2626", border: "#FECACA" },
  Kick:      { bg: "#F0FFF4", text: "#16A34A", border: "#86EFAC" },
  Twitch:    { bg: "#F5F0FF", text: "#7C3AED", border: "#C4B5FD" },
  X:         { bg: "#F0F4FF", text: "#1D4ED8", border: "#BFDBFE" },
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
  { col: "price_ig_story",          label: "Story",               group: "Instagram",     platforms: ["Instagram"],      icon: "📸", defaultDays: 1 },
  { col: "price_ig_reels",          label: "Reels",               group: "Instagram",     platforms: ["Instagram"],      icon: "📸", defaultDays: 3 },
  { col: "price_ig_post",           label: "Post",                group: "Instagram",     platforms: ["Instagram"],      icon: "📸", defaultDays: 3 },
  { col: "price_ig_highlight",      label: "Highlight",           group: "Instagram",     platforms: ["Instagram"],      icon: "📸", defaultDays: 7 },
  { col: "price_ig_bio_link",       label: "Bio Link",            group: "Instagram",     platforms: ["Instagram"],      icon: "📸", defaultDays: 7 },
  { col: "price_tt_video",          label: "Video",               group: "TikTok",        platforms: ["TikTok"],         icon: "🎵", defaultDays: 3 },
  { col: "price_tt_live",           label: "Canlı Yayın",         group: "TikTok",        platforms: ["TikTok"],         icon: "🎵", defaultDays: 1 },
  { col: "price_tt_profile_link",   label: "Profil Linki",        group: "TikTok",        platforms: ["TikTok"],         icon: "🎵", defaultDays: 7 },
  { col: "price_yt_video",          label: "Video Entegre",       group: "YouTube",       platforms: ["YouTube"],        icon: "▶",  defaultDays: 7 },
  { col: "price_yt_end_screen",     label: "End Screen",          group: "YouTube",       platforms: ["YouTube"],        icon: "▶",  defaultDays: 7 },
  { col: "price_yt_desc_link",      label: "Açıklama Linki",      group: "YouTube",       platforms: ["YouTube"],        icon: "▶",  defaultDays: 7 },
  { col: "price_yt_live_banner",    label: "Canlı Yayın Banner",  group: "YouTube",       platforms: ["YouTube"],        icon: "▶",  defaultDays: 1 },
  { col: "price_yt_overlay",        label: "Overlay Logo",        group: "YouTube",       platforms: ["YouTube"],        icon: "▶",  defaultDays: 1 },
  { col: "price_stream_mention",    label: "Sözlü Bahis",         group: "Kick / Twitch", platforms: ["Kick", "Twitch"], icon: "🎮", defaultDays: 1 },
  { col: "price_stream_overlay",    label: "Ekran Overlay Logo",  group: "Kick / Twitch", platforms: ["Kick", "Twitch"], icon: "🎮", defaultDays: 1 },
  { col: "price_stream_panel",      label: "Panel Banner",        group: "Kick / Twitch", platforms: ["Kick", "Twitch"], icon: "🎮", defaultDays: 7 },
  { col: "price_stream_integrated", label: "Canlı Yayın Entegre", group: "Kick / Twitch", platforms: ["Kick", "Twitch"], icon: "🎮", defaultDays: 1 },
  { col: "price_tweet",             label: "Tweet",               group: "X",             platforms: ["X"],              icon: "𝕏",  defaultDays: 1 },
  { col: "price_x_pinned",          label: "Sabitlenmiş Tweet",   group: "X",             platforms: ["X"],              icon: "𝕏",  defaultDays: 7 },
  { col: "price_x_thread",          label: "Thread",              group: "X",             platforms: ["X"],              icon: "𝕏",  defaultDays: 3 },
  { col: "price_x_bio",             label: "Profil Bio",          group: "X",             platforms: ["X"],              icon: "𝕏",  defaultDays: 7 },
];

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

type ProofDef = { key: string; platform: string; label: string; desc: string };

const PROOF_DEFS: ProofDef[] = [
  { key: "ig_stats_30d",    platform: "Instagram", label: "Hesap İstatistikleri (Son 30 Gün)", desc: "Reach ve impression gösteren ekran görüntüsü"                    },
  { key: "ig_demographics", platform: "Instagram", label: "Kitle Demografisi",                 desc: "Yaş, cinsiyet ve konum dağılımı ekran görüntüsü"                 },
  { key: "ig_reels_perf",   platform: "Instagram", label: "Son 5 Reels Performansı",           desc: "Son 5 reels videosunun izlenme ve etkileşim istatistikleri"     },
  { key: "tt_analytics",    platform: "TikTok",    label: "TikTok Analytics (Son 28 Gün)",     desc: "Genel hesap analitiği ekran görüntüsü"                          },
  { key: "tt_avg_views",    platform: "TikTok",    label: "Video Görüntülenme Ortalaması",      desc: "Ortalama video görüntülenme sayısı kanıtı"                      },
  { key: "tt_demographics", platform: "TikTok",    label: "Takipçi Demografisi",                desc: "Yaş, cinsiyet ve konum dağılımı ekran görüntüsü"                },
  { key: "yt_analytics",    platform: "YouTube",   label: "YouTube Studio Analytics (Son 28 Gün)", desc: "Studio analitiği ekran görüntüsü"                         },
  { key: "yt_demographics", platform: "YouTube",   label: "İzleyici Demografisi",               desc: "Yaş, cinsiyet ve coğrafi dağılım ekran görüntüsü"              },
  { key: "yt_watch_time",   platform: "YouTube",   label: "Ortalama İzlenme Süresi",            desc: "Ortalama izlenme süresi ve tıklama oranı ekran görüntüsü"      },
  { key: "kick_viewers",    platform: "Kick",      label: "Ortalama Eş Zamanlı İzleyici",      desc: "Yayın sırasında alınmış izleyici sayısı ekran görüntüsü"        },
  { key: "kick_stats",      platform: "Kick",      label: "Kanal İstatistikleri",               desc: "Kanal genel istatistikleri ekran görüntüsü"                    },
  { key: "twitch_viewers",  platform: "Twitch",    label: "Ortalama Eş Zamanlı İzleyici",      desc: "Yayın sırasında alınmış izleyici sayısı ekran görüntüsü"        },
  { key: "twitch_stats",    platform: "Twitch",    label: "Kanal İstatistikleri",               desc: "Kanal genel istatistikleri ekran görüntüsü"                    },
  { key: "x_analytics",     platform: "X",         label: "Tweet Analitik",                    desc: "Tweet analitik ekran görüntüsü"                                 },
  { key: "x_profile_stats", platform: "X",         label: "Profil Ziyaret ve Gösterim",        desc: "Profil ziyaret ve gösterim istatistikleri ekran görüntüsü"      },
];

const ALLOWED_TYPES  = ["image/jpeg", "image/png", "application/pdf"];
const MAX_FILE_BYTES = 5 * 1024 * 1024;

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

  // Navigation
  const [selectedIndex,   setSelectedIndex]   = useState<number | null>(null);
  const [confirmRemove,   setConfirmRemove]   = useState(false);
  const [confirmReset,    setConfirmReset]    = useState(false);
  const [resetting,       setResetting]       = useState(false);

  // Social accounts
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);

  // Modal (add new account)
  const [modalOpen,   setModalOpen]   = useState(false);
  const [selPlatform, setSelPlatform] = useState("Instagram");
  const [selUsername, setSelUsername] = useState("");
  const [selStats,    setSelStats]    = useState<Record<string, string>>({});
  const [addError,    setAddError]    = useState("");

  // Bio & categories (global)
  const [categories, setCategories] = useState<string[]>([]);
  const [bio,        setBio]        = useState("");

  // Prices
  const [prices,           setPrices]           = useState<Record<string, PriceEntry>>(emptyPrices());
  const [priceErrors,      setPriceErrors]      = useState<Record<string, string>>({});
  const [priceGlobalError, setPriceGlobalError] = useState("");

  // Visibility (global)
  const [visibility, setVisibility] = useState<Visibility>("acik");

  // Proofs
  const [proofUrls,        setProofUrls]        = useState<Record<string, string>>({});
  const [uploadingKeys,    setUploadingKeys]    = useState<Set<string>>(new Set());
  const [proofFileErrors,  setProofFileErrors]  = useState<Record<string, string>>({});
  const [proofSectionError, setProofSectionError] = useState("");
  const [viewingKey,        setViewingKey]        = useState<string | null>(null);

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
        "bio", "categories", "social_accounts", "visibility", "proof_files",
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
        setProofUrls(yp.proof_files ?? {});

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

  // ── Navigation helpers ──

  function openAccount(i: number | null) {
    setSelectedIndex(i);
    setConfirmRemove(false);
    setSaveSuccess(false);
    setSaveError("");
  }

  // ── Modal handlers ──

  function openModal() {
    const available = PLATFORMS.filter((p) => !socialAccounts.some((a) => a.platform === p));
    setSelPlatform(available[0] ?? "Instagram");
    setSelUsername("");
    setSelStats({});
    setAddError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setAddError("");
  }

  function addAccount() {
    setAddError("");
    if (!selUsername.trim()) { setAddError("Kullanıcı adı boş olamaz."); return; }
    if (socialAccounts.some((a) => a.platform === selPlatform)) {
      setAddError(`${selPlatform} hesabı zaten ekli.`); return;
    }
    const newIndex = socialAccounts.length;
    setSocialAccounts((prev) => [
      ...prev,
      { platform: selPlatform, username: selUsername.trim(), stats: { ...selStats } },
    ]);
    closeModal();
    openAccount(newIndex);
  }

  // ── Account detail helpers ──

  function updateStat(key: string, value: string) {
    if (selectedIndex === null) return;
    setSocialAccounts((prev) =>
      prev.map((a, i) =>
        i === selectedIndex ? { ...a, stats: { ...a.stats, [key]: value } } : a
      )
    );
  }

  function updateUsername(value: string) {
    if (selectedIndex === null) return;
    setSocialAccounts((prev) =>
      prev.map((a, i) => (i === selectedIndex ? { ...a, username: value } : a))
    );
  }

  async function removeSelectedAccount() {
    if (selectedIndex === null) return;
    const removed   = socialAccounts[selectedIndex];
    const updated   = socialAccounts.filter((_, i) => i !== selectedIndex);
    const remaining = new Set(updated.map((a) => a.platform));

    // Null out price columns whose every required platform has been removed
    const nulledPrices: Record<string, null> = {};
    for (const row of PRICE_ROWS) {
      if (row.platforms.every((p) => !remaining.has(p))) nulledPrices[row.col] = null;
    }
    setPrices((prev) => {
      const next = { ...prev };
      for (const col of Object.keys(nulledPrices)) next[col] = { price: "", days: next[col]?.days ?? 1 };
      return next;
    });

    // Remove proof_files keys whose prefix matches the removed platform
    const PLATFORM_PROOF_PREFIXES: Record<string, string[]> = {
      Instagram: ["ig_"],
      TikTok:    ["tt_"],
      YouTube:   ["yt_"],
      Kick:      ["kick_"],
      Twitch:    ["twitch_", "stream_"],
      X:         ["x_", "twitter_"],
    };
    const prefixes = PLATFORM_PROOF_PREFIXES[removed.platform] ?? [];
    const updatedProofUrls = Object.fromEntries(
      Object.entries(proofUrls).filter(([key]) => !prefixes.some((p) => key.startsWith(p)))
    );
    setProofUrls(updatedProofUrls);

    setSocialAccounts(updated);
    openAccount(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("yayinci_profiles")
      .update({
        social_accounts: updated,
        platforms:       [...remaining],
        proof_files:     updatedProofUrls,
        ...nulledPrices,
      })
      .eq("id", user.id);
    if (error) console.error("[profile/edit] remove account error:", error.message);
    else console.log("[profile/edit] removed", removed.platform, "cleared proofs:", Object.keys(proofUrls).filter(k => PROOF_DEFS.find(d => d.key === k && d.platform === removed.platform)));
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
    if (field === "price") {
      setPriceErrors((prev) => ({ ...prev, [col]: "" }));
      if (val) setPriceGlobalError("");
    }
  }

  function validatePrices(rows: typeof PRICE_ROWS): boolean {
    const errs: Record<string, string> = {};
    let anyFilled = false;
    for (const row of rows) {
      const raw = prices[row.col].price;
      if (!raw) continue;
      anyFilled = true;
      const n = parseFloat(raw);
      if (isNaN(n) || n < MIN_PRICE)
        errs[row.col] = "Minimum fiyat 750 ₺ olmalıdır";
    }
    setPriceErrors(errs);
    if (!anyFilled && rows.length > 0) {
      setPriceGlobalError("En az bir fiyat girmelisiniz");
      return false;
    }
    setPriceGlobalError("");
    return Object.keys(errs).length === 0;
  }

  // ── Proof handlers ──

  async function handleFileSelect(key: string, file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setProofFileErrors((prev) => ({ ...prev, [key]: "Sadece JPG, PNG veya PDF yükleyebilirsiniz." }));
      return;
    }
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

    setProofUrls((prev) => ({ ...prev, [key]: data.path }));
    setProofSectionError("");
  }

  async function viewProof(key: string, storedValue: string) {
    setViewingKey(key);
    const supabase = createClient();
    // Extract bare path within the "proofs" bucket — handles both full URL and bare path
    const match = storedValue.match(/\/proofs\/(.+?)(\?|$)/);
    const path  = match ? match[1] : storedValue;
    const { data, error } = await supabase.storage.from("proofs").createSignedUrl(path, 3600);
    setViewingKey(null);
    if (error || !data?.signedUrl) {
      console.error("[proof] signedUrl error:", error?.message);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  function validateCurrentProofs(): boolean {
    if (selectedIndex === null) return true;
    const acc = socialAccounts[selectedIndex];
    if (!acc) return true;
    const missing = PROOF_DEFS.filter((d) => d.platform === acc.platform && !proofUrls[d.key]);
    if (missing.length > 0) {
      setProofSectionError("Lütfen tüm kanıt dosyalarını yükleyin.");
      return false;
    }
    setProofSectionError("");
    return true;
  }

  async function handleSaveWithProofCheck() {
    if (!validateCurrentProofs()) return;
    await handleSave();
  }

  // ── Reset ──

  async function resetProfile() {
    setResetting(true);
    setConfirmReset(false);

    // Clear all local state
    setSocialAccounts([]);
    setBio("");
    setCategories([]);
    setProofUrls({});
    setPrices(emptyPrices());
    setPriceErrors({});
    openAccount(null);

    // Wipe everything in the DB
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setResetting(false); return; }

    const nullPrices = Object.fromEntries(PRICE_ROWS.map((r) => [r.col, null]));
    const { error } = await supabase.from("yayinci_profiles").update({
      social_accounts: [],
      platforms:       [],
      bio:             "",
      categories:      [],
      proof_files:     {},
      ...nullPrices,
    }).eq("id", user.id);

    if (error) console.error("[profile/edit] reset error:", error.message);
    else console.log("[profile/edit] profile reset");
    setResetting(false);
  }

  // ── Save ──

  async function handleSave() {
    const allVisible = PRICE_ROWS.filter((row) =>
      row.platforms.some((p) => socialAccounts.some((a) => a.platform === p))
    );
    if (!validatePrices(allVisible)) return;

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
      proof_files:     proofUrls,
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

  // ── Loading ──

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

  // ── Account detail view ──────────────────────────────────────────────────────

  if (selectedIndex !== null) {
    const acc = socialAccounts[selectedIndex];

    if (!acc) {
      openAccount(null);
      return null;
    }

    const fields            = PLATFORM_STAT_FIELDS[acc.platform] ?? [];
    const colors            = PLATFORM_COLORS[acc.platform] ?? { bg: "#F9FAFB", text: "#374151", border: "#E5E7EB" };
    const platformPriceRows = PRICE_ROWS.filter((r) => r.platforms.includes(acc.platform));
    const priceGroups       = [...new Set(platformPriceRows.map((r) => r.group))];

    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => openAccount(null)}
              className="flex items-center gap-1.5 text-sm font-semibold mb-5 hover:opacity-70 transition-opacity"
              style={{ color: "#185FA5" }}
            >
              ← Hesaplara Dön
            </button>
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 border-2"
                style={{ backgroundColor: colors.bg, borderColor: colors.border }}
              >
                {PLATFORM_ICONS[acc.platform]}
              </div>
              <div>
                <h1 className="text-2xl font-extrabold" style={{ color: "#042C53" }}>{acc.platform}</h1>
                <p className="text-sm text-gray-500 mt-0.5">@{acc.username}</p>
              </div>
            </div>
          </div>

          {/* Banners */}
          {saveSuccess && (
            <div className="mb-6 rounded-2xl px-5 py-4 flex items-center gap-3 text-sm font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200">
              <span className="text-lg">✅</span>
              Profilin başarıyla güncellendi!
            </div>
          )}

          <div className="flex flex-col gap-5">

            {/* ── Hesap Bilgileri ── */}
            <Section title="Hesap Bilgileri">
              <div className="mb-4">
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                  Kullanıcı Adı
                </label>
                <input
                  type="text"
                  placeholder="Kullanıcı adın (@ olmadan)"
                  value={acc.username}
                  onChange={(e) => updateUsername(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">{field.label}</label>
                    <input
                      type="number"
                      min={0}
                      placeholder={field.placeholder}
                      value={acc.stats[field.key] ?? ""}
                      onChange={(e) => updateStat(field.key, e.target.value)}
                      className={inputCls}
                    />
                  </div>
                ))}
              </div>
            </Section>

            {/* ── Fiyat Listesi ── */}
            {platformPriceRows.length > 0 && (
              <Section title="Fiyat Listesi">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1 mb-5" style={{ backgroundColor: "#FFF3E0", color: "#E65100" }}>
                  ⚠ Minimum fiyat ₺{MIN_PRICE.toLocaleString("tr-TR")} — boş bırakılan alanlar listede gösterilmez
                </div>
                <div className="flex flex-col gap-6">
                  {priceGroups.map((group) => {
                    const rows = platformPriceRows.filter((r) => r.group === group);
                    return (
                      <div key={group}>
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                          <span className="text-base">{rows[0].icon}</span>
                          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#185FA5" }}>{group}</span>
                        </div>
                        <div className="flex flex-col gap-3">
                          {rows.map((row) => (
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
                    );
                  })}
                </div>
                {priceGlobalError && (
                  <p className="text-sm text-red-600 mt-4 font-medium">{priceGlobalError}</p>
                )}
              </Section>
            )}

            {/* ── Hakkında & Kategoriler ── */}
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


            {/* ── İstatistik Kanıtları ── */}
            <Section title="İstatistik Kanıtları">
              <div className="flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1 mb-5 w-fit" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8" }}>
                JPG, PNG veya PDF · Maks. 5MB · Tüm alanlar zorunlu
              </div>

              <div className="flex flex-col gap-4">
                {PROOF_DEFS.filter((d) => d.platform === acc.platform).map((proof) => {
                  const uploaded  = !!proofUrls[proof.key];
                  const uploading = uploadingKeys.has(proof.key);
                  const err       = proofFileErrors[proof.key];
                  return (
                    <div key={proof.key} className="rounded-xl border border-gray-100 p-5 bg-gray-50">
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
                      <div className="mt-3 flex flex-col gap-2">
                        {/* Görüntüle — only shown when a file is already uploaded */}
                        {uploaded && (
                          <button
                            onClick={() => viewProof(proof.key, proofUrls[proof.key])}
                            disabled={viewingKey === proof.key}
                            className="flex items-center justify-center gap-2 rounded-xl border-2 py-2.5 px-4 text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                            style={{ borderColor: "#185FA5", color: "#185FA5" }}
                          >
                            {viewingKey === proof.key ? "Açılıyor…" : "Görüntüle"}
                          </button>
                        )}
                        {/* Upload / replace */}
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
                            className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed py-2.5 px-4 text-sm font-semibold transition-all"
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
                        {err && <p className="text-xs text-red-600 mt-1.5">{err}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {proofSectionError && (
                <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {proofSectionError}
                </div>
              )}

              <div className="mt-4 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-xs text-amber-700 leading-relaxed">
                🔍 Yüklenen dosyalar Sponsorum ekibi tarafından incelenecek. Onay sonrası profilin &quot;Doğrulanmış&quot; rozeti kazanacak.
              </div>
            </Section>

            {/* ── Hesabı Kaldır ── */}
            <div className="rounded-2xl border border-red-100 bg-red-50/40 p-5">
              <h3 className="text-sm font-bold text-red-700 mb-1">Hesabı Kaldır</h3>
              <p className="text-xs text-red-400 mb-4">
                Bu hesap profilinden kalıcı olarak kaldırılır.
              </p>
              {confirmRemove ? (
                <div className="flex gap-2">
                  <button
                    onClick={removeSelectedAccount}
                    className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
                  >
                    Evet, Kaldır
                  </button>
                  <button
                    onClick={() => setConfirmRemove(false)}
                    className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    İptal
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmRemove(true)}
                  className="rounded-xl border-2 border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  Bu Hesabı Kaldır
                </button>
              )}
            </div>

            {/* ── Save ── */}
            {saveError && (
              <div className="rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">
                {saveError}
              </div>
            )}
            <button
              onClick={handleSaveWithProofCheck}
              disabled={saving || uploadingKeys.size > 0}
              className="w-full rounded-2xl py-4 text-base font-semibold text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              style={{ backgroundColor: "#185FA5" }}
              onMouseEnter={e => { if (!saving && uploadingKeys.size === 0) e.currentTarget.style.backgroundColor = "#042C53"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#185FA5"; }}
            >
              {saving ? "Kaydediliyor…" : uploadingKeys.size > 0 ? "Yükleniyor…" : "Değişiklikleri Kaydet ✓"}
            </button>

          </div>
        </div>
      </div>
    );
  }

  // ── Main card list view ──────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* ── Add platform modal ── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(4,44,83,0.45)", backdropFilter: "blur(2px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h3 className="text-base font-extrabold" style={{ color: "#042C53" }}>Yeni Hesap Ekle</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none">×</button>
            </div>
            <div className="px-6 py-5">
              <div className="mb-4">
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Platform</label>
                <select
                  value={selPlatform}
                  onChange={(e) => { setSelPlatform(e.target.value); setSelStats({}); setAddError(""); }}
                  className={inputCls}
                >
                  {PLATFORMS.filter((p) => !socialAccounts.some((a) => a.platform === p)).map((p) => (
                    <option key={p} value={p}>{PLATFORM_ICONS[p]} {p}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Kullanıcı Adı</label>
                <input
                  type="text"
                  placeholder="Kullanıcı adın (@ olmadan)"
                  value={selUsername}
                  onChange={(e) => setSelUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAccount())}
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
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
              {addError && <p className="text-xs text-red-600 mt-2">{addError}</p>}
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={addAccount}
                className="flex-1 rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: "#185FA5" }}
              >
                Hesap Ekle
              </button>
              <button
                onClick={closeModal}
                className="flex-1 rounded-xl py-3 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

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

        {/* Account cards */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <h2 className="text-base font-extrabold" style={{ color: "#042C53" }}>Sosyal Medya Hesapları</h2>
              {socialAccounts.length > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">{socialAccounts.length} hesap bağlı</p>
              )}
            </div>
            <button
              onClick={openModal}
              disabled={socialAccounts.length >= PLATFORMS.length}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#185FA5" }}
            >
              <span className="text-base leading-none">+</span>
              Yeni Hesap Ekle
            </button>
          </div>

          {socialAccounts.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {socialAccounts.map((acc, i) => {
                const fields = PLATFORM_STAT_FIELDS[acc.platform] ?? [];
                const colors = PLATFORM_COLORS[acc.platform] ?? { bg: "#F9FAFB", text: "#374151", border: "#E5E7EB" };
                return (
                  <button
                    key={i}
                    onClick={() => openAccount(i)}
                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50/80 transition-colors text-left group"
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border-2"
                      style={{ backgroundColor: colors.bg, borderColor: colors.border }}
                    >
                      {PLATFORM_ICONS[acc.platform]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color: colors.text }}>
                          {acc.platform}
                        </span>
                        <span className="text-sm text-gray-500 truncate">@{acc.username}</span>
                      </div>
                      {fields[0] && acc.stats[fields[0].key] ? (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {fmt(acc.stats[fields[0].key])} {fields[0].label.toLowerCase()}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-300 mt-0.5 italic">İstatistik girilmemiş</p>
                      )}
                    </div>
                    <span className="text-gray-300 group-hover:text-gray-400 transition-colors text-xl font-light flex-shrink-0">›</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-gray-400 mb-1">Henüz hesap eklenmedi.</p>
              <p className="text-xs text-gray-300">Yukarıdaki butona tıklayarak platform ekleyebilirsin.</p>
            </div>
          )}
        </div>

        {/* Save */}
        {saveError && (
          <div className="mb-4 rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">
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

        {/* Profili Sıfırla */}
        {!confirmReset ? (
          <button
            onClick={() => setConfirmReset(true)}
            disabled={resetting}
            className="w-full rounded-2xl py-3 text-sm font-semibold text-red-500 border-2 border-red-100 hover:border-red-300 hover:bg-red-50 transition-all"
          >
            Profili Sıfırla
          </button>
        ) : (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm font-semibold text-red-700 mb-3">
              Tüm hesaplar, fiyatlar, kanıtlar ve profil bilgileri silinecek. Emin misin?
            </p>
            <div className="flex gap-2">
              <button
                onClick={resetProfile}
                disabled={resetting}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {resetting ? "Sıfırlanıyor…" : "Evet, Sıfırla"}
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
