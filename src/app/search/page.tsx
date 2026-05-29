"use client";
// Search page — yayinci discovery with platform/niche/follower filters
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

type Influencer = {
  id:            string;
  username:      string;
  displayName:   string;
  niche:         string;
  platforms:     string[];
  followers:     number;
  engagement:    number;
  startingPrice: number | null;
};

// ─── Filter config ────────────────────────────────────────────────────────────

const PLATFORMS  = ["X", "Instagram", "TikTok", "YouTube", "Kick", "Twitch"];
const CATEGORIES = ["Oyun", "Futbol", "Mizah", "Influencer", "Müzik", "Diğer"];

const FOLLOWER_RANGES = [
  { label: "1K – 10K",   min: 1_000,   max: 10_000  },
  { label: "10K – 50K",  min: 10_000,  max: 50_000  },
  { label: "50K – 200K", min: 50_000,  max: 200_000 },
  { label: "200K+",      min: 200_000, max: Infinity },
];

const ENGAGEMENT_RATES = [
  { label: "%2+",  min: 2  },
  { label: "%5+",  min: 5  },
  { label: "%10+", min: 10 },
];

const PRICE_RANGES = [
  { label: "₺750 – ₺2.000", min: 750,  max: 2000     },
  { label: "₺2.000 – ₺5.000", min: 2000, max: 5000   },
  { label: "₺5.000+",        min: 5000, max: Infinity },
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
  Oyun: "🎮", Futbol: "⚽", Mizah: "😂", Influencer: "🌟", Müzik: "🎤", Diğer: "✨",
};

const PLATFORM_ICONS: Record<string, string> = {
  X: "𝕏", Instagram: "📸", TikTok: "🎵", YouTube: "▶", Kick: "🟢", Twitch: "💜",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "K";
  return String(n);
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

function deriveEngagement(accounts: SocialAccount[]): number {
  const rates: number[] = [];
  for (const acc of accounts) {
    const followers = parseInt(acc.stats?.followers ?? acc.stats?.subscribers ?? "0");
    if (!followers) continue;
    const views = parseInt(
      acc.stats?.avg_reels_views ??
      acc.stats?.avg_video_views ??
      acc.stats?.avg_views ??
      acc.stats?.avg_viewers ??
      "0"
    );
    if (views) rates.push((views / followers) * 100);
  }
  if (!rates.length) return 0;
  return parseFloat((rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(1));
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
  return ypRows.map((yp: any) => {
    const profile = profileMap[yp.id];
    const accounts: SocialAccount[] = yp.social_accounts ?? [];
    const categories: string[]      = yp.categories ?? [];

    // Fall back to platforms text[] column when social_accounts is absent
    const platforms = accounts.length > 0
      ? [...new Set(accounts.map((a) => a.platform))]
      : (yp.platforms ?? []);

    // Fall back to niche text column when categories is absent
    const niche = categories[0] ?? yp.niche ?? "Diğer";

    // Use followers_count directly when available; derive from social_accounts otherwise
    const followers = yp.followers_count !== null && yp.followers_count !== undefined
      ? yp.followers_count
      : deriveFollowers(accounts);

    const username    = profile?.username ?? profile?.display_name?.toLowerCase().replace(/\s+/g, "") ?? yp.id.slice(0, 8);
    const displayName = profile?.display_name ?? username;

    return {
      id:            yp.id,
      username,
      displayName,
      niche,
      platforms,
      followers,
      engagement:    deriveEngagement(accounts),
      startingPrice: deriveStartingPrice(yp),
    };
  });
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

// ─── Influencer card ──────────────────────────────────────────────────────────

function InfluencerCard({ inf }: { inf: Influencer }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col p-6 gap-4">
      {/* Avatar + name */}
      <div className="flex items-center gap-3">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ backgroundColor: "#E6F1FB" }}
        >
          {NICHE_EMOJI[inf.niche] ?? "✨"}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm truncate" style={{ color: "#042C53" }}>@{inf.username}</p>
          <p className="text-xs text-gray-400 truncate">{inf.displayName}</p>
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-gray-50 rounded-xl py-2">
          <p className="text-sm font-extrabold" style={{ color: "#042C53" }}>
            {inf.followers > 0 ? fmt(inf.followers) : "—"}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Takipçi</p>
        </div>
        <div className="bg-gray-50 rounded-xl py-2">
          <p className="text-sm font-extrabold" style={{ color: "#185FA5" }}>
            {inf.engagement > 0 ? `%${inf.engagement}` : "—"}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Etkileşim</p>
        </div>
        <div className="bg-gray-50 rounded-xl py-2">
          <p className="text-sm font-extrabold" style={{ color: "#042C53" }}>
            {inf.startingPrice !== null ? `₺${inf.startingPrice.toLocaleString("tr-TR")}` : "—"}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Başlangıç</p>
        </div>
      </div>

      {/* CTA */}
      <a href={`/profile/${inf.username}`} className="mt-auto">
        <button
          className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ backgroundColor: "#185FA5" }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#042C53")}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#185FA5")}
        >
          Profili Gör
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

  const [platforms,      setPlatforms]      = useState<Set<string>>(new Set());
  const [categories,     setCategories]     = useState<Set<string>>(new Set());
  const [followerRange,  setFollowerRange]  = useState<number | null>(null);
  const [engagementRate, setEngagementRate] = useState<number | null>(null);
  const [priceRange,     setPriceRange]     = useState<{ min: number; max: number } | null>(null);

  // Role check — redirect yayinci away from this page
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) { setRoleChecked(true); return; }
      const metaRole = session.user.user_metadata?.role as string | undefined;
      if (metaRole) {
        setRole(metaRole as "yayinci" | "marka");
        setRoleChecked(true);
        return;
      }
      const { data } = await supabase.from("profiles").select("role").eq("id", session.user.id).maybeSingle();
      setRole((data?.role ?? null) as "yayinci" | "marka" | null);
      setRoleChecked(true);
    });
  }, []);

  useEffect(() => {
    if (role === "yayinci") router.push("/dashboard");
  }, [role, router]);

  useEffect(() => {
    fetchInfluencers().then((data) => {
      setAllInfluencers(data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    return allInfluencers.filter((inf) => {
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
        {filtered.map((inf) => <InfluencerCard key={inf.id} inf={inf} />)}
      </div>
    );
  }

  // Block yayinci — show message while redirect fires
  if (roleChecked && role === "yayinci") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
          <div className="text-5xl mb-5">🔒</div>
          <h2 className="text-xl font-extrabold mb-2" style={{ color: "#042C53" }}>
            Bu sayfa markalar içindir
          </h2>
          <p className="text-sm text-gray-500 mb-6">Dashboard&apos;a yönlendiriliyorsunuz…</p>
          <a href="/dashboard" className="text-sm font-semibold hover:underline" style={{ color: "#185FA5" }}>
            Dashboard&apos;a Git →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page title + mobile filter toggle */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold" style={{ color: "#042C53" }}>Yayıncı Bul</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {loading ? "Yükleniyor…" : `${filtered.length} yayıncı bulundu`}
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
