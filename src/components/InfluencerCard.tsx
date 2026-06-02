"use client";

import {
  type Influencer,
  PLATFORM_COLORS, PLATFORM_ICONS, NICHE_EMOJI,
  fmt, maskName,
} from "@/lib/influencers";

// ─── Lock modal (Marka Pro paywall) ─────────────────────────────────────────────

export function LockModal({ onClose }: { onClose: () => void }) {
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
          299 ₺/ay — Marka Pro Ol
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

// ─── Heart button ────────────────────────────────────────────────────────────

function HeartButton({ favorited, onToggle }: { favorited: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(); }}
      title={favorited ? "Favorilerden çıkar" : "Favorilere ekle"}
      aria-label={favorited ? "Favorilerden çıkar" : "Favorilere ekle"}
      className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-white/95 shadow-sm border border-gray-100 hover:scale-110 active:scale-95 transition-transform"
    >
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill={favorited ? "#EF4444" : "none"}
        stroke={favorited ? "#EF4444" : "#9CA3AF"}
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
  );
}

// ─── Influencer card ──────────────────────────────────────────────────────────

export default function InfluencerCard({
  inf, isPro, onLocked, showFavorite = false, favorited = false, onToggleFavorite,
}: {
  inf: Influencer;
  isPro: boolean;
  onLocked: () => void;
  showFavorite?: boolean;
  favorited?: boolean;
  onToggleFavorite?: () => void;
}) {
  function handleView(e: React.MouseEvent) {
    if (!isPro) { e.preventDefault(); onLocked(); }
  }

  const colors = PLATFORM_COLORS[inf.platform] ?? { bg: "#E6F1FB", text: "#185FA5", border: "#BFDBFE" };

  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col p-6 gap-4">

      {showFavorite && onToggleFavorite && (
        <HeartButton favorited={favorited} onToggle={onToggleFavorite} />
      )}

      {/* Platform icon + influencer info */}
      <div className="flex items-center gap-3 pr-10">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 border-2"
          style={{ backgroundColor: colors.bg, borderColor: colors.border }}
        >
          {PLATFORM_ICONS[inf.platform] ?? "📱"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold" style={{ color: colors.text }}>{inf.platform}</span>
            <span
              className="text-xs font-semibold rounded-full px-2 py-0.5"
              style={{ backgroundColor: "#E6F1FB", color: "#185FA5" }}
            >
              {NICHE_EMOJI[inf.niche] ?? ""} {inf.niche}
            </span>
          </div>
          <p className="font-bold text-sm truncate mt-0.5" style={{ color: "#042C53" }}>
            {isPro ? inf.displayName : maskName(inf.displayName)}
          </p>
          <p className={`text-xs mt-0.5 truncate ${!isPro ? "blur-sm select-none" : "text-gray-400"}`}>
            @{isPro ? inf.accountUsername : "••••••"}
          </p>
        </div>
      </div>

      {/* Follower count */}
      <div className="flex items-center gap-2 px-0.5">
        <span className="text-xs text-gray-400">Takipçi:</span>
        <span className={`text-sm font-bold ${!isPro ? "blur-sm select-none" : ""}`} style={{ color: "#042C53" }}>
          {isPro ? (inf.followers > 0 ? fmt(inf.followers) : "—") : "••K"}
        </span>
      </div>

      {/* Ad formats */}
      <div className="flex flex-col gap-1.5">
        {(inf.adFormats ?? []).length > 0 ? (inf.adFormats ?? []).map((f) => (
          <div key={f.label} className="flex items-center justify-between rounded-lg px-2.5 py-1.5 bg-gray-50">
            <span className="text-xs text-gray-600 truncate mr-2">{f.label}</span>
            <span className={`text-xs font-bold flex-shrink-0 ${!isPro ? "blur-sm select-none" : ""}`} style={{ color: "#042C53" }}>
              {isPro ? `₺${f.price.toLocaleString("tr-TR")}` : "₺••"}
            </span>
          </div>
        )) : (
          <p className="text-xs text-gray-400 italic px-0.5">Fiyat belirtilmemiş</p>
        )}
      </div>

      {/* CTA */}
      <a href={`/profile/${inf.username}?platform=${encodeURIComponent(inf.platform)}`} className="mt-auto" onClick={handleView}>
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
