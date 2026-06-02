// Shared influencer types, presentation constants, and data loading used by
// both the /search and /favorites pages.
import { createClient } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SocialAccount = {
  platform: string;
  username: string;
  stats: Record<string, string>;
};

export type AdFormat = { label: string; price: number };

export type Influencer = {
  id:              string;
  username:        string;
  displayName:     string;
  niche:           string;
  platform:        string;
  accountUsername: string;
  followers:       number;
  adFormats:       AdFormat[];
  startingPrice:   number | null;
};

// ─── Presentation constants ─────────────────────────────────────────────────────

export const NICHE_EMOJI: Record<string, string> = {
  Oyun: "🎮", Futbol: "⚽", Mizah: "😂", Influencer: "🌟", Müzik: "🎤", Diğer: "✨",
};

export const PLATFORM_ICONS: Record<string, string> = {
  X: "𝕏", Instagram: "📸", TikTok: "🎵", YouTube: "▶", Kick: "🟢", Twitch: "💜",
};

export const PLATFORM_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Instagram: { bg: "#FFF0F9", text: "#C026D3", border: "#F0ABFC" },
  TikTok:    { bg: "#F0F0F0", text: "#111111", border: "#D1D5DB" },
  YouTube:   { bg: "#FFF0F0", text: "#DC2626", border: "#FECACA" },
  Kick:      { bg: "#F0FFF4", text: "#16A34A", border: "#86EFAC" },
  Twitch:    { bg: "#F5F0FF", text: "#7C3AED", border: "#C4B5FD" },
  X:         { bg: "#F0F4FF", text: "#1D4ED8", border: "#BFDBFE" },
};

// All price columns on yayinci_profiles
export const PRICE_COLS = [
  "price_ig_story", "price_ig_reels", "price_ig_post", "price_ig_highlight", "price_ig_bio_link",
  "price_tt_video", "price_tt_live", "price_tt_profile_link",
  "price_yt_video", "price_yt_end_screen", "price_yt_desc_link", "price_yt_live_banner", "price_yt_overlay",
  "price_stream_mention", "price_stream_overlay", "price_stream_panel", "price_stream_integrated",
  "price_tweet", "price_x_pinned", "price_x_thread", "price_x_bio",
] as const;

export const PLATFORM_PRICE_COLS: Record<string, string[]> = {
  Instagram: ["price_ig_story", "price_ig_reels", "price_ig_post", "price_ig_highlight", "price_ig_bio_link"],
  TikTok:    ["price_tt_video", "price_tt_live", "price_tt_profile_link"],
  YouTube:   ["price_yt_video", "price_yt_end_screen", "price_yt_desc_link", "price_yt_live_banner", "price_yt_overlay"],
  Kick:      ["price_stream_mention", "price_stream_overlay", "price_stream_panel", "price_stream_integrated"],
  Twitch:    ["price_stream_mention", "price_stream_overlay", "price_stream_panel", "price_stream_integrated"],
  X:         ["price_tweet", "price_x_pinned", "price_x_thread", "price_x_bio"],
};

export const PRICE_COL_LABELS: Record<string, string> = {
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "K";
  return String(n);
}

// Mask each word: keep first letter, replace rest with asterisks. "Can Yılmaz" → "C** Y*****"
export function maskName(name: string): string {
  return name
    .split(" ")
    .map((w) => (w.length <= 1 ? w : w[0] + "*".repeat(w.length - 1)))
    .join(" ");
}

export function getAccountFollowers(acc: SocialAccount): number {
  const raw = acc.stats?.followers ?? acc.stats?.subscribers ?? "0";
  const n = parseInt(raw);
  return isNaN(n) ? 0 : n;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function deriveAdFormatsForPlatform(yp: Record<string, any>, platform: string): AdFormat[] {
  const cols = PLATFORM_PRICE_COLS[platform] ?? [];
  const formats: AdFormat[] = [];
  for (const col of cols) {
    if (formats.length >= 3) break;
    const v = yp[col];
    if (v === null || v === undefined) continue;
    const n = Number(v);
    if (!isNaN(n) && n > 0) formats.push({ label: PRICE_COL_LABELS[col] ?? col, price: n });
  }
  return formats;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function deriveStartingPriceForPlatform(yp: Record<string, any>, platform: string): number | null {
  const cols = PLATFORM_PRICE_COLS[platform] ?? [];
  let min: number | null = null;
  for (const col of cols) {
    const v = yp[col];
    if (v !== null && v !== undefined) {
      const n = Number(v);
      if (!isNaN(n) && (min === null || n < min)) min = n;
    }
  }
  return min;
}

// Stable key for a favorited (yayinci, platform) pair. UUIDs contain dashes, so
// use a separator that can't appear in either part.
export function favKey(yayinciId: string, platform: string): string {
  return `${yayinciId}::${platform}`;
}

// ─── Data loading ─────────────────────────────────────────────────────────────

export async function fetchInfluencers(): Promise<Influencer[]> {
  const supabase = createClient();

  // 1. All yayinci profiles (id, username, display name)
  const { data: profileRows, error: profileErr } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("role", "yayinci");

  if (profileErr || !profileRows?.length) {
    if (profileErr) console.error("[influencers] profiles fetch:", profileErr);
    return [];
  }

  const ids = profileRows.map((p) => p.id);

  // 2. Visible yayinci_profiles with their stats/prices
  const ypQuery = supabase
    .from("yayinci_profiles")
    .select([
      "id", "categories", "social_accounts", "platforms", "niche", "followers_count", "visibility",
      ...PRICE_COLS,
    ].join(", "))
    .in("id", ids)
    .eq("visibility", "acik");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ypRows, error: ypErr } = await (ypQuery as any);

  if (ypErr) {
    console.error("[influencers] yayinci_profiles fetch:", ypErr);
    return [];
  }
  if (!ypRows?.length) return [];

  const profileMap = Object.fromEntries(profileRows.map((p) => [p.id, p]));

  // 3. Expand each yayinci into one entry per social account
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (ypRows as any[]).flatMap((yp) => {
    const profile   = profileMap[yp.id];
    const accounts: SocialAccount[] = yp.social_accounts ?? [];
    const categories: string[]      = yp.categories ?? [];
    const niche       = categories[0] ?? yp.niche ?? "Diğer";
    const username    = profile?.username ?? profile?.display_name?.toLowerCase().replace(/\s+/g, "") ?? yp.id.slice(0, 8);
    const displayName = profile?.display_name ?? username;

    return accounts
      .filter((acc) => acc.platform && acc.username)
      .map((acc) => ({
        id:              yp.id,
        username,
        displayName,
        niche,
        platform:        acc.platform,
        accountUsername: acc.username,
        followers:       getAccountFollowers(acc),
        adFormats:       deriveAdFormatsForPlatform(yp, acc.platform),
        startingPrice:   deriveStartingPriceForPlatform(yp, acc.platform),
      }));
  });
}
