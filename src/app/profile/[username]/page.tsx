"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORM_ICONS: Record<string, string> = {
  X: "𝕏", Instagram: "📸", TikTok: "🎵", YouTube: "▶", Kick: "🟢", Twitch: "💜",
};

const PRICE_DISPLAY = [
  { col: "price_ig_story",          label: "Story",                    platform: "Instagram", days: 1 },
  { col: "price_ig_reels",          label: "Reels",                    platform: "Instagram", days: 3 },
  { col: "price_ig_post",           label: "Post",                     platform: "Instagram", days: 3 },
  { col: "price_ig_highlight",      label: "Highlight",                platform: "Instagram", days: 7 },
  { col: "price_ig_bio_link",       label: "Bio Link",                 platform: "Instagram", days: 7 },
  { col: "price_tt_video",          label: "Video",                    platform: "TikTok",    days: 3 },
  { col: "price_tt_live",           label: "Canlı Yayın",              platform: "TikTok",    days: 1 },
  { col: "price_tt_profile_link",   label: "Profil Linki",             platform: "TikTok",    days: 7 },
  { col: "price_yt_video",          label: "Video Entegre",            platform: "YouTube",   days: 7 },
  { col: "price_yt_end_screen",     label: "End Screen",               platform: "YouTube",   days: 7 },
  { col: "price_yt_desc_link",      label: "Açıklama Linki",           platform: "YouTube",   days: 7 },
  { col: "price_yt_live_banner",    label: "Canlı Yayın Banner",       platform: "YouTube",   days: 1 },
  { col: "price_yt_overlay",        label: "Overlay Logo",             platform: "YouTube",   days: 1 },
  { col: "price_stream_mention",    label: "Canlı Yayın Sözlü Bahis", platform: "Stream",    days: 1 },
  { col: "price_stream_overlay",    label: "Ekran Overlay Logo",       platform: "Stream",    days: 1 },
  { col: "price_stream_panel",      label: "Panel Banner",             platform: "Stream",    days: 7 },
  { col: "price_stream_integrated", label: "Canlı Yayın Entegre",     platform: "Stream",    days: 1 },
  { col: "price_tweet",             label: "Tweet",                    platform: "X",         days: 1 },
  { col: "price_x_pinned",          label: "Sabitlenmiş Tweet",        platform: "X",         days: 7 },
  { col: "price_x_thread",          label: "Thread",                   platform: "X",         days: 3 },
  { col: "price_x_bio",             label: "Profil Bio",               platform: "X",         days: 7 },
] as const;

const PLATFORM_DISPLAY_ICONS: Record<string, string> = {
  Instagram: "📸", TikTok: "🎵", YouTube: "▶", Stream: "🎮", X: "𝕏",
};

// Maps proof keys (from proof_files jsonb) → display label + platform
const PROOF_LABELS: Record<string, { label: string; platform: string }> = {
  ig_stats_30d:    { label: "Hesap İstatistikleri (Son 30 Gün)",     platform: "Instagram" },
  ig_demographics: { label: "Kitle Demografisi",                      platform: "Instagram" },
  ig_reels_perf:   { label: "Son 5 Reels Performansı",                platform: "Instagram" },
  tt_analytics:    { label: "TikTok Analytics (Son 28 Gün)",          platform: "TikTok"    },
  tt_avg_views:    { label: "Video Görüntülenme Ortalaması",           platform: "TikTok"    },
  tt_demographics: { label: "Takipçi Demografisi",                     platform: "TikTok"    },
  yt_analytics:    { label: "YouTube Studio Analytics (Son 28 Gün)",   platform: "YouTube"   },
  yt_demographics: { label: "İzleyici Demografisi",                    platform: "YouTube"   },
  yt_watch_time:   { label: "Ortalama İzlenme Süresi",                 platform: "YouTube"   },
  kick_viewers:    { label: "Ortalama Eş Zamanlı İzleyici",           platform: "Kick"      },
  kick_stats:      { label: "Kanal İstatistikleri",                    platform: "Kick"      },
  twitch_viewers:  { label: "Ortalama Eş Zamanlı İzleyici",           platform: "Twitch"    },
  twitch_stats:    { label: "Kanal İstatistikleri",                    platform: "Twitch"    },
  x_analytics:     { label: "Tweet Analitik",                          platform: "X"         },
  x_profile_stats: { label: "Profil Ziyaret ve Gösterim",              platform: "X"         },
};

const PROOF_PLATFORM_ORDER = ["Instagram", "TikTok", "YouTube", "Kick", "Twitch", "X"];

// ─── Types ────────────────────────────────────────────────────────────────────

type SocialAccount = {
  platform: string;
  username: string;
  stats: Record<string, string>;
};

type PriceItem = {
  label:    string;
  platform: string;
  days:     number;
  price:    number;
};

type ProfileData = {
  username:     string;
  displayName:  string;
  initials:     string;
  niche:        string;
  categories:   string[];
  bio:          string;
  accounts:     SocialAccount[];
  prices:       PriceItem[];
  followers:    number;
  engagement:   number;
  avgViews:     number;
  minDelivery:  number;
  proofFiles:   Record<string, string>;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "K";
  return String(n);
}

function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function deriveFollowers(accounts: SocialAccount[]): number {
  return accounts.reduce((max, a) => {
    const n = parseInt(a.stats?.followers ?? a.stats?.subscribers ?? "0");
    return !isNaN(n) && n > max ? n : max;
  }, 0);
}

function deriveEngagement(accounts: SocialAccount[]): number {
  const rates: number[] = [];
  for (const a of accounts) {
    const f = parseInt(a.stats?.followers ?? a.stats?.subscribers ?? "0");
    if (!f) continue;
    const v = parseInt(
      a.stats?.avg_reels_views ?? a.stats?.avg_video_views ??
      a.stats?.avg_views ?? a.stats?.avg_viewers ?? "0"
    );
    if (v) rates.push((v / f) * 100);
  }
  if (!rates.length) return 0;
  return parseFloat((rates.reduce((s, r) => s + r, 0) / rates.length).toFixed(1));
}

function deriveAvgViews(accounts: SocialAccount[]): number {
  const views: number[] = [];
  for (const a of accounts) {
    const v = parseInt(
      a.stats?.avg_reels_views ?? a.stats?.avg_video_views ??
      a.stats?.avg_views ?? a.stats?.avg_viewers ?? "0"
    );
    if (v) views.push(v);
  }
  if (!views.length) return 0;
  return Math.round(views.reduce((s, v) => s + v, 0) / views.length);
}

// Stored value may be a full public URL (legacy) or a bare storage path.
// Extract the path within the "proofs" bucket either way.
function extractStoragePath(value: string): string {
  const match = value.match(/\/proofs\/(.+?)(\?|$)/);
  return match ? match[1] : value;
}

function fileType(path: string): "image" | "pdf" {
  return path.toLowerCase().endsWith(".pdf") ? "pdf" : "image";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildPrices(yp: Record<string, any>): PriceItem[] {
  return PRICE_DISPLAY.flatMap((p) => {
    const v = yp[p.col];
    if (v === null || v === undefined) return [];
    const n = Number(v);
    if (isNaN(n)) return [];
    return [{ label: p.label, platform: p.platform, days: p.days, price: n }];
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProofModal({ url, type, onClose }: { url: string; type: "image" | "pdf"; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl overflow-hidden shadow-2xl w-full max-w-4xl"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full text-white text-lg font-bold transition-colors"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.7)")}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.45)")}
          aria-label="Kapat"
        >
          ×
        </button>

        {type === "image" ? (
          <img
            src={url}
            alt="İstatistik kanıtı"
            className="w-full h-auto object-contain block"
            style={{ maxHeight: "90vh" }}
          />
        ) : (
          <iframe
            src={url}
            title="İstatistik kanıtı PDF"
            className="w-full border-0 block"
            style={{ height: "85vh" }}
          />
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="h-16 bg-white border-b border-gray-100" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="h-44 sm:h-56 rounded-b-3xl bg-gray-200 mb-16" />
        <div className="h-8 bg-gray-200 rounded w-48 mb-3" />
        <div className="h-4 bg-gray-100 rounded w-32 mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[0,1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-white rounded-2xl border border-gray-100" />
            <div className="h-32 bg-white rounded-2xl border border-gray-100" />
          </div>
          <div className="h-48 bg-white rounded-2xl border border-gray-100" />
        </div>
      </div>
    </div>
  );
}

function NotFound({ username }: { username: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 shadow-sm h-16 flex items-center px-6">
        <a href="/" className="text-2xl font-extrabold tracking-tight" style={{ color: "#185FA5" }}>Sponsorum</a>
      </header>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-extrabold mb-2" style={{ color: "#042C53" }}>Profil bulunamadı</h2>
          <p className="text-sm text-gray-500 mb-6">
            <span className="font-semibold">@{username}</span> kullanıcı adına sahip bir yayıncı yok.
          </p>
          <a href="/search" className="text-sm font-semibold hover:underline" style={{ color: "#185FA5" }}>
            ← Aramaya Dön
          </a>
        </div>
      </div>
    </div>
  );
}

function BarRow({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500 w-16 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: "#185FA5" }} />
      </div>
      <span className="text-sm font-semibold w-10 text-right" style={{ color: "#042C53" }}>%{pct}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const params   = useParams();
  const username = (params?.username as string) ?? "";

  const [data,      setData]      = useState<ProfileData | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [notFound,  setNotFound]  = useState(false);

  type ProofModal = { url: string; type: "image" | "pdf" };
  const [proofModal,      setProofModal]      = useState<ProofModal | null>(null);
  const [loadingProofKey, setLoadingProofKey] = useState<string | null>(null);
  const [proofModalError, setProofModalError] = useState("");

  async function openProof(key: string, storedValue: string) {
    setLoadingProofKey(key);
    setProofModalError("");
    const supabase  = createClient();
    const path      = extractStoragePath(storedValue);
    const { data: signed, error } = await supabase.storage
      .from("proofs")
      .createSignedUrl(path, 3600);
    setLoadingProofKey(null);
    if (error || !signed) {
      setProofModalError("Dosya açılamadı: " + (error?.message ?? "Bilinmeyen hata"));
      return;
    }
    setProofModal({ url: signed.signedUrl, type: fileType(path) });
  }

  useEffect(() => {
    if (!username) return;
    (async () => {
      const supabase = createClient();

      // 1. Look up profile by username (case-insensitive)
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("id, username, display_name")
        .ilike("username", username)
        .maybeSingle();

      if (profileErr) console.error("[profile] profiles query:", profileErr);
      if (!profile)   { setNotFound(true); setLoading(false); return; }

      // 2. Load yayinci_profiles
      const cols = [
        "bio", "categories", "social_accounts", "visibility", "proof_files",
        "price_ig_story", "price_ig_reels", "price_ig_post", "price_ig_highlight", "price_ig_bio_link",
        "price_tt_video", "price_tt_live", "price_tt_profile_link",
        "price_yt_video", "price_yt_end_screen", "price_yt_desc_link", "price_yt_live_banner", "price_yt_overlay",
        "price_stream_mention", "price_stream_overlay", "price_stream_panel", "price_stream_integrated",
        "price_tweet", "price_x_pinned", "price_x_thread", "price_x_bio",
      ].join(", ");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: yp, error: ypErr } = await supabase
        .from("yayinci_profiles")
        .select(cols)
        .eq("id", profile.id)
        .maybeSingle() as any;

      if (ypErr) console.error("[profile] yayinci_profiles query:", ypErr);
      if (!yp)   { setNotFound(true); setLoading(false); return; }

      const displayName = profile.display_name ?? profile.username ?? username;
      const accounts: SocialAccount[] = yp.social_accounts ?? [];
      const categories: string[]      = yp.categories ?? [];
      const prices                     = buildPrices(yp);
      const minDelivery                = prices.length ? Math.min(...prices.map((p) => p.days)) : 3;

      setData({
        username:    profile.username ?? username,
        displayName,
        initials:    initials(displayName),
        niche:       categories[0] ?? "Diğer",
        categories,
        bio:         yp.bio ?? "",
        accounts,
        prices,
        followers:   deriveFollowers(accounts),
        engagement:  deriveEngagement(accounts),
        avgViews:    deriveAvgViews(accounts),
        minDelivery,
        proofFiles:  (yp.proof_files as Record<string, string>) ?? {},
      });
      setLoading(false);
    })();
  }, [username]);

  if (loading)  return <LoadingSkeleton />;
  if (notFound) return <NotFound username={username} />;
  if (!data)    return <NotFound username={username} />;

  // Group prices by platform, preserving PRICE_DISPLAY order
  const platformOrder = ["Instagram", "TikTok", "YouTube", "Stream", "X"];
  const pricesByPlatform = platformOrder.reduce((acc, plat) => {
    const rows = data.prices.filter((p) => p.platform === plat);
    if (rows.length) acc[plat] = rows;
    return acc;
  }, {} as Record<string, PriceItem[]>);
  const activePlatforms = platformOrder.filter((p) => pricesByPlatform[p]);

  // Stream platform label (based on connected accounts)
  const streamPlatforms = data.accounts
    .filter((a) => a.platform === "Kick" || a.platform === "Twitch")
    .map((a) => a.platform);
  const streamLabel = streamPlatforms.length ? streamPlatforms.join(" / ") : "Kick / Twitch";

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <a href="/" className="text-2xl font-extrabold tracking-tight" style={{ color: "#185FA5" }}>
            Sponsorum
          </a>
          <a href="/search" className="text-sm font-medium text-gray-500 hover:text-[#185FA5] transition-colors">
            ← Aramaya Dön
          </a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">

        {/* ── Cover + Avatar ── */}
        <div className="relative mb-16">
          <div
            className="h-44 sm:h-56 rounded-b-3xl"
            style={{ background: "linear-gradient(135deg, #042C53 0%, #185FA5 60%, #4a9fd4 100%)" }}
          >
            <div
              className="absolute inset-0 rounded-b-3xl opacity-10"
              style={{
                backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
          </div>
          <div className="absolute left-6 sm:left-10 -bottom-12">
            <div
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-3xl sm:text-4xl font-black text-white"
              style={{ backgroundColor: "#042C53" }}
            >
              {data.initials}
            </div>
          </div>
        </div>

        {/* ── Name + badges + actions ── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8 px-2">
          <div>
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <h1 className="text-2xl font-extrabold" style={{ color: "#042C53" }}>
                @{data.username}
              </h1>
              <span
                className="text-xs font-bold rounded-full px-3 py-1"
                style={{ backgroundColor: "#E6F1FB", color: "#185FA5" }}
              >
                {data.niche}
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-3">{data.displayName}</p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1">
                ✓ E-posta Doğrulandı
              </span>
            </div>
          </div>

          <div className="flex gap-3 flex-shrink-0 sm:pt-1">
            <a href={`/offer/${data.username}`}>
              <button
                className="rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 hover:shadow-lg active:scale-[0.98]"
                style={{ backgroundColor: "#185FA5" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#042C53")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#185FA5")}
              >
                Teklif Gönder
              </button>
            </a>
            <a href="/messages">
              <button
                className="rounded-xl px-5 py-3 text-sm font-semibold border-2 transition-all hover:bg-gray-50 active:scale-[0.98]"
                style={{ borderColor: "#185FA5", color: "#185FA5" }}
              >
                Mesaj
              </button>
            </a>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Toplam Takipçi",  value: data.followers  > 0 ? fmt(data.followers)  : "—", icon: "👥" },
            { label: "Etkileşim Oranı", value: data.engagement > 0 ? `%${data.engagement}` : "—", icon: "📈" },
            { label: "Ortalama İzlenme",value: data.avgViews   > 0 ? fmt(data.avgViews)   : "—", icon: "👁️" },
            { label: "Min. Teslimat",   value: data.prices.length  ? `${data.minDelivery} gün`   : "—", icon: "⚡" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xl font-extrabold mb-0.5" style={{ color: "#042C53" }}>{s.value}</div>
              <div className="text-xs text-gray-400 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left column ── */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Price list */}
            {data.prices.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-extrabold mb-5" style={{ color: "#042C53" }}>Fiyat Listesi</h2>
                <div className="flex flex-col gap-5">
                  {activePlatforms.map((plat) => (
                    <div key={plat}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm">{PLATFORM_DISPLAY_ICONS[plat]}</span>
                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#185FA5" }}>
                          {plat === "Stream" ? streamLabel : plat}
                        </span>
                      </div>
                      <div className="flex flex-col divide-y divide-gray-50">
                        {pricesByPlatform[plat].map((item) => (
                          <div key={item.label} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-3">
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-semibold text-gray-800">{item.label}</span>
                              <p className="text-xs text-gray-400">{item.days} günde teslim</p>
                            </div>
                            <div className="text-base font-extrabold flex-shrink-0" style={{ color: "#042C53" }}>
                              ₺{item.price.toLocaleString("tr-TR")}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bio */}
            {(data.bio || data.categories.length > 0) && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-extrabold mb-3" style={{ color: "#042C53" }}>Hakkında</h2>
                {data.bio && (
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">{data.bio}</p>
                )}
                {data.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {data.categories.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs font-semibold rounded-full px-3 py-1"
                        style={{ backgroundColor: "#E6F1FB", color: "#185FA5" }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right column ── */}
          <div className="flex flex-col gap-6">

            {/* Connected accounts */}
            {data.accounts.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-extrabold mb-4" style={{ color: "#042C53" }}>Bağlı Hesaplar</h2>
                <div className="flex flex-col gap-4">
                  {data.accounts.map((acc) => {
                    const followers = parseInt(acc.stats?.followers ?? acc.stats?.subscribers ?? "0");
                    return (
                      <div key={acc.platform} className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{PLATFORM_ICONS[acc.platform] ?? "🔗"}</span>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{acc.platform}</p>
                            <p className="text-xs text-gray-400">@{acc.username}</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold" style={{ color: "#185FA5" }}>
                          {followers > 0 ? fmt(followers) : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Proof files */}
            {Object.keys(data.proofFiles).length > 0 && (() => {
              // Group uploaded proofs by platform in display order
              const grouped = PROOF_PLATFORM_ORDER.reduce<{ platform: string; entries: { key: string; label: string; url: string }[] }[]>(
                (acc, platform) => {
                  const entries = Object.entries(data.proofFiles)
                    .filter(([key]) => PROOF_LABELS[key]?.platform === platform)
                    .map(([key, url]) => ({ key, label: PROOF_LABELS[key]?.label ?? key, url }));
                  if (entries.length) acc.push({ platform, entries });
                  return acc;
                },
                []
              );
              return (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-base font-extrabold mb-4" style={{ color: "#042C53" }}>İstatistik Kanıtları</h2>
                  <div className="flex flex-col gap-4">
                    {grouped.map(({ platform, entries }) => (
                      <div key={platform}>
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                          {PLATFORM_ICONS[platform] ?? ""} {platform}
                        </p>
                        <div className="flex flex-col gap-2">
                          {entries.map(({ key, label, url }) => (
                            <div key={key} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2.5" style={{ backgroundColor: "#FAFAFA" }}>
                              <span className="text-xs font-medium text-gray-700 leading-snug flex-1 min-w-0">{label}</span>
                              <button
                                onClick={() => openProof(key, url)}
                                disabled={loadingProofKey !== null}
                                className="flex-shrink-0 text-xs font-semibold rounded-lg px-3 py-1.5 transition-all hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ backgroundColor: "#E6F1FB", color: "#185FA5" }}
                              >
                                {loadingProofKey === key ? "…" : "Görüntüle"}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Stats per account */}
            {data.accounts.some((a) => Object.keys(a.stats ?? {}).length > 1) && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-extrabold mb-4" style={{ color: "#042C53" }}>İstatistikler</h2>
                <div className="flex flex-col gap-4">
                  {data.accounts.map((acc) => {
                    const statsEntries = Object.entries(acc.stats ?? {}).filter(([k]) => k !== "followers" && k !== "subscribers");
                    if (!statsEntries.length) return null;
                    const STAT_LABELS: Record<string, string> = {
                      avg_reels_views: "Ort. Reels İzlenme",
                      avg_story_views: "Ort. Story Görüntülenme",
                      avg_video_views: "Ort. Video İzlenme",
                      avg_views:       "Ort. İzlenme",
                      avg_viewers:     "Ort. Eş Zamanlı İzleyici",
                      avg_impressions: "Ort. Gösterim",
                    };
                    return (
                      <div key={acc.platform}>
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                          {PLATFORM_ICONS[acc.platform]} {acc.platform}
                        </p>
                        {statsEntries.map(([k, v]) => (
                          <BarRow
                            key={k}
                            label={STAT_LABELS[k] ?? k}
                            pct={Math.min(100, Math.round((parseInt(v) / Math.max(1, parseInt(acc.stats?.followers ?? acc.stats?.subscribers ?? "1"))) * 100))}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer disclaimer ── */}
        <div className="mt-10 text-center">
          <p className="text-xs text-gray-400 leading-relaxed">
            Sponsorum bir aracı platformdur. Yayıncı profilleri kullanıcılar tarafından oluşturulmuş olup
            Sponsorum tarafından doğrulanmıştır. Anlaşmazlıklarda Sponsorum hakemlik görevi üstlenir.
          </p>
        </div>

      </div>

      {/* ── Proof modal ── */}
      {proofModalError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-red-50 border border-red-200 px-5 py-3 text-sm text-red-700 shadow-lg">
          {proofModalError}
          <button className="ml-3 font-bold" onClick={() => setProofModalError("")}>×</button>
        </div>
      )}
      {proofModal && (
        <ProofModal
          url={proofModal.url}
          type={proofModal.type}
          onClose={() => setProofModal(null)}
        />
      )}
    </div>
  );
}
