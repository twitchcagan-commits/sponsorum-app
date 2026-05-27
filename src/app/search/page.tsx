"use client";

import { useState, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Influencer = {
  id: number;
  avatar: string;
  username: string;
  fullName: string;
  niche: string;
  platforms: string[];
  followers: number;
  engagement: number;
  startingPrice: number;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const INFLUENCERS: Influencer[] = [
  {
    id: 1,
    avatar: "🎮",
    username: "@gamerturk",
    fullName: "Burak K.",
    niche: "Oyun",
    platforms: ["YouTube", "Twitch"],
    followers: 120000,
    engagement: 8.2,
    startingPrice: 3500,
  },
  {
    id: 2,
    avatar: "⚽",
    username: "@futboleditr",
    fullName: "Emre S.",
    niche: "Futbol",
    platforms: ["X", "Instagram"],
    followers: 85000,
    engagement: 6.5,
    startingPrice: 2000,
  },
  {
    id: 3,
    avatar: "😂",
    username: "@mizahkral",
    fullName: "Selin A.",
    niche: "Mizah",
    platforms: ["Instagram", "TikTok"],
    followers: 320000,
    engagement: 4.1,
    startingPrice: 6500,
  },
  {
    id: 4,
    avatar: "🌟",
    username: "@lifewithayse",
    fullName: "Ayşe D.",
    niche: "Influencer",
    platforms: ["Instagram"],
    followers: 28000,
    engagement: 12.3,
    startingPrice: 1200,
  },
  {
    id: 5,
    avatar: "🎤",
    username: "@beatmaker34",
    fullName: "Can Y.",
    niche: "Müzik",
    platforms: ["TikTok", "YouTube"],
    followers: 55000,
    engagement: 9.7,
    startingPrice: 2500,
  },
  {
    id: 6,
    avatar: "💡",
    username: "@techreviewer",
    fullName: "Mert Ö.",
    niche: "Diğer",
    platforms: ["YouTube"],
    followers: 210000,
    engagement: 5.8,
    startingPrice: 5000,
  },
];

// ─── Filter config ────────────────────────────────────────────────────────────

const PLATFORMS = ["X", "Instagram", "TikTok", "YouTube", "Kick", "Twitch"];
const CATEGORIES = ["Oyun", "Futbol", "Mizah", "Influencer", "Müzik", "Diğer"];

const FOLLOWER_RANGES = [
  { label: "1K – 10K", min: 1000, max: 10000 },
  { label: "10K – 50K", min: 10000, max: 50000 },
  { label: "50K – 200K", min: 50000, max: 200000 },
  { label: "200K+", min: 200000, max: Infinity },
];

const ENGAGEMENT_RATES = [
  { label: "%2+", min: 2 },
  { label: "%5+", min: 5 },
  { label: "%10+", min: 10 },
];

const PRICE_RANGES = [
  { label: "₺750 – ₺2.000", min: 750, max: 2000 },
  { label: "₺2.000 – ₺5.000", min: 2000, max: 5000 },
  { label: "₺5.000+", min: 5000, max: Infinity },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(0) + "K";
  return String(n);
}

function toggle<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  next.has(value) ? next.delete(value) : next.add(value);
  return next;
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
  const platformIcons: Record<string, string> = {
    X: "𝕏",
    Instagram: "📸",
    TikTok: "🎵",
    YouTube: "▶",
    Kick: "🟢",
    Twitch: "💜",
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col p-6 gap-4">
      {/* Avatar + name */}
      <div className="flex items-center gap-3">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ backgroundColor: "#E6F1FB" }}
        >
          {inf.avatar}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm truncate" style={{ color: "#042C53" }}>{inf.username}</p>
          <p className="text-xs text-gray-400 truncate">{inf.fullName}</p>
          <span
            className="inline-block mt-1 text-xs font-semibold rounded-full px-2 py-0.5"
            style={{ backgroundColor: "#E6F1FB", color: "#185FA5" }}
          >
            {inf.niche}
          </span>
        </div>
      </div>

      {/* Platforms */}
      <div className="flex flex-wrap gap-1.5">
        {inf.platforms.map((p) => (
          <span key={p} className="text-xs bg-gray-50 border border-gray-100 rounded-lg px-2 py-0.5 text-gray-500 font-medium">
            {platformIcons[p]} {p}
          </span>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-gray-50 rounded-xl py-2">
          <p className="text-sm font-extrabold" style={{ color: "#042C53" }}>{fmt(inf.followers)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Takipçi</p>
        </div>
        <div className="bg-gray-50 rounded-xl py-2">
          <p className="text-sm font-extrabold" style={{ color: "#185FA5" }}>%{inf.engagement}</p>
          <p className="text-xs text-gray-400 mt-0.5">Etkileşim</p>
        </div>
        <div className="bg-gray-50 rounded-xl py-2">
          <p className="text-sm font-extrabold" style={{ color: "#042C53" }}>₺{inf.startingPrice.toLocaleString("tr-TR")}</p>
          <p className="text-xs text-gray-400 mt-0.5">Başlangıç</p>
        </div>
      </div>

      {/* CTA */}
      <button
        className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] mt-auto"
        style={{ backgroundColor: "#185FA5" }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#042C53")}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#185FA5")}
      >
        Profili Gör
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [platforms, setPlatforms] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<Set<string>>(new Set());
  const [followerRange, setFollowerRange] = useState<number | null>(null);
  const [engagementRate, setEngagementRate] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null);

  const filtered = useMemo(() => {
    return INFLUENCERS.filter((inf) => {
      if (platforms.size > 0 && !inf.platforms.some((p) => platforms.has(p))) return false;
      if (categories.size > 0 && !categories.has(inf.niche)) return false;
      if (followerRange !== null) {
        const range = FOLLOWER_RANGES[followerRange];
        if (inf.followers < range.min || inf.followers > range.max) return false;
      }
      if (engagementRate !== null && inf.engagement < engagementRate) return false;
      if (priceRange !== null && (inf.startingPrice < priceRange.min || inf.startingPrice > priceRange.max)) return false;
      return true;
    });
  }, [platforms, categories, followerRange, engagementRate, priceRange]);

  const hasFilters =
    platforms.size > 0 || categories.size > 0 || followerRange !== null || engagementRate !== null || priceRange !== null;

  function clearAll() {
    setPlatforms(new Set());
    setCategories(new Set());
    setFollowerRange(null);
    setEngagementRate(null);
    setPriceRange(null);
  }

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

      {/* Platform */}
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

      {/* Category */}
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

      {/* Follower range */}
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

      {/* Engagement rate */}
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

      {/* Price range */}
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

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <a href="/" className="text-2xl font-extrabold tracking-tight" style={{ color: "#185FA5" }}>
            Sponsorum
          </a>
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-[#185FA5] transition-colors">
              Dashboard
            </a>
            <a
              href="/login"
              className="text-sm font-semibold text-white rounded-lg px-4 py-2 transition-colors"
              style={{ backgroundColor: "#185FA5" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#042C53")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#185FA5")}
            >
              Giriş Yap
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page title + mobile filter toggle */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold" style={{ color: "#042C53" }}>Yayıncı Bul</h1>
            <p className="text-sm text-gray-500 mt-0.5">{filtered.length} yayıncı bulundu</p>
          </div>
          <button
            className="lg:hidden flex items-center gap-2 text-sm font-semibold rounded-xl px-4 py-2.5 border-2 transition-colors"
            style={{ borderColor: hasFilters ? "#185FA5" : "#E6F1FB", color: hasFilters ? "#185FA5" : "#6b7280" }}
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M6 12h12M9 20h6" />
            </svg>
            Filtreler {hasFilters && `(${[platforms.size > 0, categories.size > 0, followerRange !== null, engagementRate !== null, priceRange !== null].filter(Boolean).length})`}
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
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-bold mb-2" style={{ color: "#042C53" }}>Sonuç bulunamadı</h3>
                <p className="text-sm text-gray-500 mb-5">Filtreleri değiştirmeyi dene.</p>
                <button
                  onClick={clearAll}
                  className="text-sm font-semibold hover:underline"
                  style={{ color: "#185FA5" }}
                >
                  Tüm filtreleri temizle
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((inf) => (
                  <InfluencerCard key={inf.id} inf={inf} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
