"use client";
// Search page — yayinci discovery with platform/niche/follower filters
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import InfluencerCard, { LockModal } from "@/components/InfluencerCard";
import { fetchInfluencers, favKey, type Influencer } from "@/lib/influencers";
import { useFavorites } from "@/lib/useFavorites";

// ─── Filter config ────────────────────────────────────────────────────────────

const PLATFORMS  = ["X", "Instagram", "TikTok", "YouTube", "Kick", "Twitch"];
const CATEGORIES = ["Oyun", "Futbol", "Mizah", "Influencer", "Müzik", "Diğer"];

const FOLLOWER_RANGES = [
  { label: "1K–10K",   min: 1_000,   max: 10_000  },
  { label: "10K–50K",  min: 10_000,  max: 50_000  },
  { label: "50K–200K", min: 50_000,  max: 200_000 },
  { label: "200K+",      min: 200_000, max: Infinity },
];

const PRICE_RANGES = [
  { label: "₺750–₺2.000", min: 750,  max: 2000     },
  { label: "₺2.000–₺5.000", min: 2000, max: 5000   },
  { label: "₺5.000+",        min: 5000, max: Infinity },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toggle<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value); else next.add(value);
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

  const { favorites, toggleFavorite } = useFavorites(role === "marka");

  const [platforms,      setPlatforms]      = useState<Set<string>>(new Set());
  const [categories,     setCategories]     = useState<Set<string>>(new Set());
  const [followerRange,  setFollowerRange]  = useState<number | null>(null);
  const [priceRange,     setPriceRange]     = useState<{ min: number; max: number } | null>(null);

  // Role check — redirect yayinci, check marka pro status
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
        const { data: mp } = await supabase
          .from("marka_profiles").select("is_pro").eq("id", user.id).maybeSingle();
        setIsPro(mp?.is_pro === true);
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
    return allInfluencers.filter((inf) => {
      if (platforms.size > 0 && !platforms.has(inf.platform)) return false;
      if (categories.size > 0 && !categories.has(inf.niche)) return false;
      if (followerRange !== null) {
        const range = FOLLOWER_RANGES[followerRange];
        if (inf.followers < range.min || inf.followers > range.max) return false;
      }
      if (priceRange !== null) {
        if (inf.startingPrice === null) return false;
        if (inf.startingPrice < priceRange.min || inf.startingPrice > priceRange.max) return false;
      }
      return true;
    });
  }, [allInfluencers, platforms, categories, followerRange, priceRange]);

  const hasFilters =
    platforms.size > 0 || categories.size > 0 || followerRange !== null || priceRange !== null;

  function clearAll() {
    setPlatforms(new Set());
    setCategories(new Set());
    setFollowerRange(null);
    setPriceRange(null);
  }

  const activeFilterCount = [
    platforms.size > 0, categories.size > 0,
    followerRange !== null, priceRange !== null,
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
            <InfluencerCard
              key={`${inf.id}-${inf.platform}`}
              inf={inf}
              isPro={isPro}
              onLocked={() => setLockModal(true)}
              showFavorite={role === "marka"}
              favorited={favorites.has(favKey(inf.id, inf.platform))}
              onToggleFavorite={() => toggleFavorite(inf.id, inf.platform)}
            />
          ))}
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

      {lockModal && <LockModal onClose={() => setLockModal(false)} />}

      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page title + mobile filter toggle */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold" style={{ color: "#042C53" }}>Yayıncı Bul</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {loading ? "Yükleniyor…" : `${filtered.length} hesap bulundu`}
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
