"use client";
// Search page �?yayinci discovery with platform/niche/follower filters
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

// ─── Types ────────────────────────────────────────────────────────────────────

type SocialAccount = {
  platform: string;
  username: string;
  stats: Record<string, string>;
};

type AdFormat = { label: string; price: number };

type Influencer = {
  id:            string;
  username:      string;
  displayName:   string;
  niche:         string;
  platforms:     string[];
  followers:     number;
  adFormats:     AdFormat[];   // up to 3 non-null price entries
  startingPrice: number | null; // kept for price-range filter
};

// ─── Filter config ────────────────────────────────────────────────────────────

const PLATFORMS  = ["X", "Instagram", "TikTok", "YouTube", "Kick", "Twitch"];
const CATEGORIES = ["Oyun", "Futbol", "Mizah", "Influencer", "Müzik", "Diğer"];

const FOLLOWER_RANGES = [
  { label: "1K �?10K",   min: 1_000,   max: 10_000  },
  { label: "10K �?50K",  min: 10_000,  max: 50_000  },
  { label: "50K �?200K", min: 50_000,  max: 200_000 },
  { label: "200K+",      min: 200_000, max: Infinity },
];

const ENGAGEMENT_RATES = [
  { label: "%2+",  min: 2  },
  { label: "%5+",  min: 5  },
  { label: "%10+", min: 10 },
];

const PRICE_RANGES = [
  { label: "�?50 �?�?.000", min: 750,  max: 2000     },
  { label: "�?.000 �?�?.000", min: 2000, max: 5000   },
  { label: "�?.000+",        min: 5000, max: Infinity },
];

// All price columns on yayinci_profiles
const PRICE_COLS = [
  "price_ig_story", "price_ig_reels", "price_ig_post", "price_ig_highlight", "price_ig_bio_link",
  "price_tt_video", "price_tt_live", "price_tt_profile_link",
  "price_yt_video", "price_yt_end_screen", "price_yt_desc_link", "price_yt_live_banner", "price_yt_overlay",
  "price_stream_mention", "price_stream_overlay", "price_stream_panel", "price_stream_integrated",
  "price_tweet", "price_x_pinned", "price_x_thread", "price_x_bio",
] as const;

const NICHE_EMOJI: Record<string, string> = {
  Oyun: "🎮", Futbol: "�?, Mizah: "😂", Influencer: "🌟", Müzik: "🎤", Diğer: "�?,
};

const PLATFORM_ICONS: Record<string, string> = {
  X: "𝕏", Instagram: "📸", TikTok: "🎵", YouTube: "�?, Kick: "🟢", Twitch: "💜",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "K";
  return String(n);
}

// Mask each word: keep first letter, replace rest with asterisks. "Can Yılmaz" �?"C*** Y*****"
function maskName(name: string): string {
  return name
    .split(" ")
    .map((w) => (w.length <= 1 ? w : w[0] + "*".repeat(w.length - 1)))
    .join(" ");
}

function toggle<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  next.has(value) ? next.delete(value) : next.add(value);
  return next;
}

function deriveFollowers(accounts: SocialAccount[]): number {
  let max = 0;
  for (const acc of accounts) {
    const raw = acc.stats?.followers ?? acc.stats?.subscribers ?? "0";
    const n = parseInt(raw);
    if (!isNaN(n) && n > max) max = n;
  }
  return max;
}

const PRICE_COL_LABELS: Record<string, string> = {
  price_ig_story:          "Instagram Story",
  price_ig_reels:          "Instagram Reels",
  price_ig_post:           "Instagram Post",
  price_ig_highlight:      "Instagram Highlight",
  price_ig_bio_link:       "Instagram Bio Link",
  price_tt_video:          "TikTok Video",
  price_tt_live:           "TikTok Canlı",
  price_tt_profile_link:   "TikTok Profil Linki",
  price_yt_video:          "YouTube Video",
  price_yt_end_screen:     "YouTube End Screen",
  price_yt_desc_link:      "YouTube Açıklama Linki",
  price_yt_live_banner:    "YouTube Canlı Banner",
  price_yt_overlay:        "YouTube Overlay",
  price_stream_mention:    "Canlı Sözlü Bahis",
  price_stream_overlay:    "Canlı Overlay",
  price_stream_panel:      "Canlı Panel Banner",
  price_stream_integrated: "Canlı Yayın Entegre",
  price_tweet:             "X Tweet",
  price_x_pinned:          "X Sabitlenmiş Tweet",
  price_x_thread:          "X Thread",
  price_x_bio:             "X Profil Bio",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deriveAdFormats(yp: Record<string, any>): AdFormat[] {
  const formats: AdFormat[] = [];
  for (const col of PRICE_COLS) {
    if (formats.length >= 3) break;
    const v = yp[col];
    if (v === null || v === undefined) continue;
    const n = Number(v);
    if (!isNaN(n) && n > 0) formats.push({ label: PRICE_COL_LABELS[col] ?? col, price: n });
  }
  return formats;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deriveStartingPrice(yp: Record<string, any>): number | null {
  let min: number | null = null;
  for (const col of PRICE_COLS) {
    const v = yp[col];
    if (v !== null && v !== undefined) {
      const n = Number(v);
      if (!isNaN(n) && (min === null || n < min)) min = n;
    }
  }
  return min;
}

// ─── Data loading ─────────────────────────────────────────────────────────────

async function fetchInfluencers(): Promise<Influencer[]> {
  const supabase = createClient();

  // 1. Get all yayinci profile ids + display names + usernames
  const { data: profileRows, error: profileErr } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("role", "yayinci");

  console.log("[search] profiles data:", JSON.stringify(profileRows));
  console.log("[search] profiles error:", profileErr);

  if (profileErr || !profileRows?.length) {
    console.error("[search] profiles fetch:", profileErr);
    return [];
  }

  const ids = profileRows.map((p) => p.id);

  // 2. Get yayinci_profiles for open/visible profiles
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ypRows, error: ypErr } = await (supabase
    .from("yayinci_profiles")
    .select([
      "id", "categories", "social_accounts", "platforms", "niche", "followers_count", "visibility",
      ...PRICE_COLS,
    ].join(", "))
    .in("id", ids)
    .eq("visibility", "acik") as any);

  console.log("[search] yayinci_profiles data:", JSON.stringify(ypRows));
  console.log("[search] yayinci_profiles error:", ypErr);

  if (ypErr) {
    console.error("[search] yayinci_profiles fetch:", ypErr);
    return [];
  }

  if (!ypRows?.length) return [];

  // 3. Build lookup map for profiles
  const profileMap = Object.fromEntries(profileRows.map((p) => [p.id, p]));

  // 4. Merge and derive
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ypRows
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((yp: any) => {
      const profile = profileMap[yp.id];
      const accounts: SocialAccount[] = yp.social_accounts ?? [];
      const categories: string[]      = yp.categories ?? [];

      const platforms = accounts.length > 0
        ? [...new Set(accounts.map((a) => a.platform))]
        : (yp.platforms ?? []);

      const niche     = categories[0] ?? yp.niche ?? "Diğer";
      const followers = yp.followers_count ?? deriveFollowers(accounts);

      const username    = profile?.username ?? profile?.display_name?.toLowerCase().replace(/\s+/g, "") ?? yp.id.slice(0, 8);
      const displayName = profile?.display_name ?? username;

      return {
        id:            yp.id,
        username,
        displayName,
        niche,
        platforms,
        followers,
        adFormats:     deriveAdFormats(yp),
        startingPrice: deriveStartingPrice(yp),
        _hasAccounts:  accounts.length > 0,
      };
    })
    // Hide yayıncılar who have removed all social accounts
    .filter((inf: any) => inf._hasAccounts && inf.platforms.length > 0)
    // Drop the internal flag before returning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ _hasAccounts, ...inf }) => inf);
}

// ─── Sidebar section wrapper ──────────────────────────────────────────────────

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-100 pb-5 mb-5 last:border-0 last:mb-0 last:pb-0">
      <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#042C53" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

// ─── Lock modal ───────────────────────────────────────────────────────────────

function LockModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(4,44,83,0.5)", backdropFilter: "blur(2px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4" style={{ backgroundColor: "#E6F1FB" }}>
          🔒
        </div>
        <h3 className="text-lg font-extrabold mb-2" style={{ color: "#042C53" }}>
          Marka Pro Gerekli
        </h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Bu profili görmek için Marka Pro üyeliği gereklidir. Tüm yayıncı profillerine, fiyatlara ve istatistiklere erişin.
        </p>
        <a
          href="/marka/pro"
          className="block w-full rounded-xl py-3 text-sm font-semibold text-white text-center mb-3 transition-all hover:opacity-90"
          style={{ backgroundColor: "#185FA5" }}
        >
          299 �?ay �?Marka Pro Ol
        </a>
        <button
          onClick={onClose}
          className="w-full rounded-xl py-3 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
        >
          İptal
        </button>
      </div>
    </div>
  );
}

// ─── Influencer card ──────────────────────────────────────────────────────────

function InfluencerCard({
  inf, isPro, onLocked,
}: {
  inf: Influencer;
  isPro: boolean;
  onLocked: () => void;
}) {
  function handleView(e: React.MouseEvent) {
    if (!isPro) { e.preventDefault(); onLocked(); }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col p-6 gap-4">
      {/* Avatar + name */}
      <div className="flex items-center gap-3">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ backgroundColor: "#E6F1FB" }}
        >
          {NICHE_EMOJI[inf.niche] ?? "�?}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm truncate" style={{ color: "#042C53" }}>
            {isPro ? inf.displayName : maskName(inf.displayName)}
          </p>
          {isPro && (
            <p className="text-xs text-gray-400 truncate">@{inf.username}</p>
          )}
          <span
            className="inline-block mt-1 text-xs font-semibold rounded-full px-2 py-0.5"
            style={{ backgroundColor: "#E6F1FB", color: "#185FA5" }}
          >
            {inf.niche}
          </span>
        </div>
      </div>

      {/* Platforms */}
      {inf.platforms.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {inf.platforms.map((p) => (
            <span key={p} className="text-xs bg-gray-50 border border-gray-100 rounded-lg px-2 py-0.5 text-gray-500 font-medium">
              {PLATFORM_ICONS[p] ?? ""} {p}
            </span>
          ))}
        </div>
      )}

      {/* Follower count */}
      <div className="flex items-center gap-2 px-0.5">
        <span className="text-xs text-gray-400">Takipçi:</span>
        <span className={`text-sm font-bold ${!isPro ? "blur-sm select-none" : ""}`} style={{ color: "#042C53" }}>
          {isPro ? (inf.followers > 0 ? fmt(inf.followers) : "�?) : "••�?K"}
        </span>
      </div>

      {/* Ad formats */}
      <div className="flex flex-col gap-1.5">
        {(inf.adFormats ?? []).length > 0 ? (inf.adFormats ?? []).map((f) => (
          <div key={f.label} className="flex items-center justify-between rounded-lg px-2.5 py-1.5 bg-gray-50">
            <span className="text-xs text-gray-600 truncate mr-2">{f.label}</span>
            <span className={`text-xs font-bold flex-shrink-0 ${!isPro ? "blur-sm select-none" : ""}`} style={{ color: "#042C53" }}>
              {isPro ? `�?{f.price.toLocaleString("tr-TR")}` : "₺••�?}
            </span>
          </div>
        )) : (
          <p className="text-xs text-gray-400 italic px-0.5">Fiyat belirtilmemiş</p>
        )}
      </div>

      {/* CTA */}
      <a href={`/profile/${inf.username}`} className="mt-auto" onClick={handleView}>
        <button
          className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ backgroundColor: "#185FA5" }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#042C53")}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#185FA5")}
        >
          {isPro ? "Profili Gör" : "🔒 Profili Gör"}
        </button>
      </a>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [allInfluencers, setAllInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);

  const [role,        setRole]        = useState<"yayinci" | "marka" | null>(null);
  const [roleChecked, setRoleChecked] = useState(false);
  const [isPro,       setIsPro]       = useState(false);
  const [lockModal,   setLockModal]   = useState(false);

  const [platforms,      setPlatforms]      = useState<Set<string>>(new Set());
  const [categories,     setCategories]     = useState<Set<string>>(new Set());
  const [followerRange,  setFollowerRange]  = useState<number | null>(null);
  const [engagementRate, setEngagementRate] = useState<number | null>(null);
  const [priceRange,     setPriceRange]     = useState<{ min: number; max: number } | null>(null);

  // Role check �?redirect yayinci, check marka pro status
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setRoleChecked(true); return; }
      const metaRole = user.user_metadata?.role as string | undefined;
      const resolvedRole = metaRole ?? (
        await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
          .then(({ data }) => data?.role ?? null)
      );
      setRole(resolvedRole as "yayinci" | "marka" | null);
      if (resolvedRole === "marka") {
        const { data: mp, error: mpErr } = await supabase
          .from("marka_profiles").select("is_pro").eq("id", user.id).maybeSingle();
        console.log("[search] marka_profiles row:", mp, "error:", mpErr);
        const pro = mp?.is_pro === true;
        console.log("[search] isPro:", pro);
        setIsPro(pro);
      }
      setRoleChecked(true);
    });
  }, []);

  useEffect(() => {
    if (role === "yayinci") router.push("/dashboard");
  }, [role, router]);

  useEffect(() => {
    let active = true;

    function doFetch() {
      setLoading(true);
      fetchInfluencers().then((data) => {
        if (active) { setAllInfluencers(data); setLoading(false); }
      });
    }

    doFetch(); // initial load

    // Re-fetch when browser restores the page from bfcache (back/forward navigation)
    function onPageShow(e: PageTransitionEvent) { if (e.persisted) doFetch(); }
    window.addEventListener("pageshow", onPageShow);

    return () => { active = false; window.removeEventListener("pageshow", onPageShow); };
  }, []);

  const filtered = useMemo(() => {
    return allInfluencers.filter((inf: any) => {
      if (platforms.size > 0 && !inf.platforms.some((p) => platforms.has(p))) return false;
      if (categories.size > 0 && !categories.has(inf.niche)) return false;
      if (followerRange !== null) {
        const range = FOLLOWER_RANGES[followerRange];
        if (inf.followers < range.min || inf.followers > range.max) return false;
      }
      if (engagementRate !== null && inf.engagement < engagementRate) return false;
      if (priceRange !== null) {
        if (inf.startingPrice === null) return false;
        if (inf.startingPrice < priceRange.min || inf.startingPrice > priceRange.max) return false;
      }
      return true;
    });
  }, [allInfluencers, platforms, categories, followerRange, engagementRate, priceRange]);

  const hasFilters =
    platforms.size > 0 || categories.size > 0 || followerRange !== null || engagementRate !== null || priceRange !== null;

  function clearAll() {
    setPlatforms(new Set());
    setCategories(new Set());
    setFollowerRange(null);
    setEngagementRate(null);
    setPriceRange(null);
  }

  const activeFilterCount = [
    platforms.size > 0, categories.size > 0,
    followerRange !== null, engagementRate !== null, priceRange !== null,
  ].filter(Boolean).length;

  const sidebar = (
    <div className="flex flex-col gap-0">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-extrabold" style={{ color: "#042C53" }}>Filtreler</h2>
        {hasFilters && (
          <button onClick={clearAll} className="text-xs font-semibold hover:underline" style={{ color: "#185FA5" }}>
            Temizle
          </button>
        )}
      </div>

      <FilterSection title="Platform">
        <div className="flex flex-col gap-2">
          {PLATFORMS.map((p) => (
            <label key={p} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={platforms.has(p)}
                onChange={() => setPlatforms(toggle(platforms, p))}
                className="w-4 h-4 rounded accent-[#185FA5] cursor-pointer"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{p}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Kategori">
        <div className="flex flex-col gap-2">
          {CATEGORIES.map((c) => (
            <label key={c} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={categories.has(c)}
                onChange={() => setCategories(toggle(categories, c))}
                className="w-4 h-4 rounded accent-[#185FA5] cursor-pointer"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{c}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Takipçi Sayısı">
        <div className="flex flex-col gap-2">
          {FOLLOWER_RANGES.map((r, i) => (
            <label key={r.label} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="follower"
                checked={followerRange === i}
                onChange={() => setFollowerRange(followerRange === i ? null : i)}
                className="w-4 h-4 accent-[#185FA5] cursor-pointer"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{r.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Etkileşim Oranı">
        <div className="flex flex-col gap-2">
          {ENGAGEMENT_RATES.map((r) => (
            <label key={r.label} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="engagement"
                checked={engagementRate === r.min}
                onChange={() => setEngagementRate(engagementRate === r.min ? null : r.min)}
                className="w-4 h-4 accent-[#185FA5] cursor-pointer"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{r.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Fiyat Aralığı">
        <div className="flex flex-col gap-2">
          {PRICE_RANGES.map((r) => (
            <label key={r.label} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="price"
                checked={priceRange?.min === r.min}
                onChange={() => setPriceRange(priceRange?.min === r.min ? null : r)}
                className="w-4 h-4 accent-[#185FA5] cursor-pointer"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{r.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>
    </div>
  );

  // ── Cards area ──

  let cardsContent: React.ReactNode;

  if (loading) {
    cardsContent = (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex-shrink-0" />
              <div className="flex-1">
                <div className="h-3.5 bg-gray-100 rounded w-24 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-16" />
              </div>
            </div>
            <div className="h-3 bg-gray-100 rounded w-full mb-2" />
            <div className="grid grid-cols-3 gap-2 mt-4">
              {[0, 1, 2].map((j) => <div key={j} className="h-12 bg-gray-100 rounded-xl" />)}
            </div>
          </div>
        ))}
      </div>
    );
  } else if (allInfluencers.length === 0) {
    cardsContent = (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-5xl mb-4">📭</div>
        <h3 className="text-lg font-bold mb-2" style={{ color: "#042C53" }}>Henüz yayıncı yok</h3>
        <p className="text-sm text-gray-500">Yayıncılar profillerini tamamladıkça burada görünecekler.</p>
      </div>
    );
  } else if (filtered.length === 0) {
    cardsContent = (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h3 className="text-lg font-bold mb-2" style={{ color: "#042C53" }}>Sonuç bulunamadı</h3>
        <p className="text-sm text-gray-500 mb-5">Filtreleri değiştirmeyi dene.</p>
        <button onClick={clearAll} className="text-sm font-semibold hover:underline" style={{ color: "#185FA5" }}>
          Tüm filtreleri temizle
        </button>
      </div>
    );
  } else {
    cardsContent = (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((inf) => (
            <InfluencerCard key={inf.id} inf={inf} isPro={isPro} onLocked={() => setLockModal(true)} />
          ))}
      </div>
    );
  }

  // Block yayinci �?show message while redirect fires
  if (roleChecked && role === "yayinci") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
          <div className="text-5xl mb-5">🔒</div>
          <h2 className="text-xl font-extrabold mb-2" style={{ color: "#042C53" }}>
            Bu sayfa markalar içindir
          </h2>
          <p className="text-sm text-gray-500 mb-6">Dashboard&apos;a yönlendiriliyorsunuz�?/p>
          <a href="/dashboard" className="text-sm font-semibold hover:underline" style={{ color: "#185FA5" }}>
            Dashboard&apos;a Git �?          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {lockModal && <LockModal onClose={() => setLockModal(false)} />}

      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page title + mobile filter toggle */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold" style={{ color: "#042C53" }}>Yayıncı Bul</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {loading ? "Yükleniyor�? : `${filtered.length} yayıncı bulundu`}
            </p>
          </div>
          <button
            className="lg:hidden flex items-center gap-2 text-sm font-semibold rounded-xl px-4 py-2.5 border-2 transition-colors"
            style={{ borderColor: hasFilters ? "#185FA5" : "#E6F1FB", color: hasFilters ? "#185FA5" : "#6b7280" }}
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M6 12h12M9 20h6" />
            </svg>
            Filtreler {hasFilters && `(${activeFilterCount})`}
          </button>
        </div>

        <div className="flex gap-7">

          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-60 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24">
              {sidebar}
            </div>
          </aside>

          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex">
              <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
              <div className="relative ml-auto w-72 max-w-full h-full bg-white shadow-xl overflow-y-auto p-6 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-base font-extrabold" style={{ color: "#042C53" }}>Filtreler</h2>
                  <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {hasFilters && (
                  <button onClick={clearAll} className="text-xs font-semibold mb-5 text-left hover:underline" style={{ color: "#185FA5" }}>
                    Tüm filtreleri temizle
                  </button>
                )}
                {sidebar}
                <button
                  className="mt-6 w-full rounded-xl py-3 text-sm font-semibold text-white"
                  style={{ backgroundColor: "#185FA5" }}
                  onClick={() => setSidebarOpen(false)}
                >
                  {filtered.length} Sonucu Gör
                </button>
              </div>
            </div>
          )}

          {/* Cards grid */}
          <div className="flex-1 min-w-0">
            {cardsContent}
          </div>
        </div>
      </div>
    </div>
  );
}
