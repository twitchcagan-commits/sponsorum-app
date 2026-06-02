"use client";
// Favorites page — marka's saved yayinci accounts, same card + paywall as /search
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import InfluencerCard, { LockModal } from "@/components/InfluencerCard";
import { fetchInfluencers, favKey, type Influencer } from "@/lib/influencers";
import { useFavorites } from "@/lib/useFavorites";

export default function FavoritesPage() {
  const router = useRouter();

  const [allInfluencers, setAllInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);

  const [role,        setRole]        = useState<"yayinci" | "marka" | null>(null);
  const [roleChecked, setRoleChecked] = useState(false);
  const [isPro,       setIsPro]       = useState(false);
  const [lockModal,   setLockModal]   = useState(false);

  const { favorites, toggleFavorite, loaded: favoritesLoaded } = useFavorites(role === "marka");

  // Role check — redirect yayinci, check marka pro status
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setRoleChecked(true); router.push("/login"); return; }
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
  }, [router]);

  useEffect(() => {
    if (role === "yayinci") router.push("/dashboard");
  }, [role, router]);

  useEffect(() => {
    let active = true;
    fetchInfluencers().then((data) => { if (active) { setAllInfluencers(data); setLoading(false); } });
    return () => { active = false; };
  }, []);

  // Only the cards the marka has favorited, in favorite order is not tracked so
  // keep the natural fetch order. Unfavoriting removes the card immediately.
  const favorited = allInfluencers.filter((inf) => favorites.has(favKey(inf.id, inf.platform)));

  const stillLoading = loading || (role === "marka" && !favoritesLoaded);

  // ── Cards area ──
  let cardsContent: React.ReactNode;

  if (stillLoading) {
    cardsContent = (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
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
  } else if (favorited.length === 0) {
    cardsContent = (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-5xl mb-4">🤍</div>
        <h3 className="text-lg font-bold mb-2" style={{ color: "#042C53" }}>Henüz favori eklemediniz</h3>
        <p className="text-sm text-gray-500 mb-5">
          Beğendiğiniz yayıncıları kalp simgesine tıklayarak favorilerinize ekleyin.
        </p>
        <a href="/search" className="text-sm font-semibold hover:underline" style={{ color: "#185FA5" }}>
          Yayıncı Bul →
        </a>
      </div>
    );
  } else {
    cardsContent = (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {favorited.map((inf) => (
          <InfluencerCard
            key={`${inf.id}-${inf.platform}`}
            inf={inf}
            isPro={isPro}
            onLocked={() => setLockModal(true)}
            showFavorite
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

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold" style={{ color: "#042C53" }}>Favorilerim</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {stillLoading ? "Yükleniyor…" : `${favorited.length} favori yayıncı`}
            </p>
          </div>
          <a href="/search" className="text-sm font-semibold hover:underline" style={{ color: "#185FA5" }}>
            ← Yayıncı Bul
          </a>
        </div>

        {cardsContent}
      </div>
    </div>
  );
}
