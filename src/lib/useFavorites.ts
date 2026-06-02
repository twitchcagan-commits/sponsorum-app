"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { favKey } from "@/lib/influencers";

// Manages the logged-in marka's favorite (yayinci, platform) pairs. Loads the
// current set once `enabled` becomes true (i.e. once the user is known to be a
// marka) and exposes an optimistic toggle backed by the favorites table.
export function useFavorites(enabled: boolean) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [userId, setUserId]       = useState<string | null>(null);
  const [loaded, setLoaded]       = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoaded(true); return; }
      setUserId(user.id);
      const { data } = await supabase
        .from("favorites")
        .select("yayinci_id, platform")
        .eq("marka_id", user.id);
      if (data) setFavorites(new Set(data.map((f) => favKey(f.yayinci_id, f.platform))));
      setLoaded(true);
    });
  }, [enabled]);

  const toggleFavorite = useCallback(async (yayinciId: string, platform: string) => {
    if (!userId) return;
    const key = favKey(yayinciId, platform);
    const wasFav = favorites.has(key);

    // Optimistic update
    setFavorites((prev) => {
      const next = new Set(prev);
      if (wasFav) next.delete(key); else next.add(key);
      return next;
    });

    const supabase = createClient();
    if (wasFav) {
      await supabase.from("favorites").delete()
        .eq("marka_id", userId).eq("yayinci_id", yayinciId).eq("platform", platform);
    } else {
      const { error } = await supabase.from("favorites")
        .insert({ marka_id: userId, yayinci_id: yayinciId, platform });
      // Roll back on failure (e.g. unique-constraint race)
      if (error) {
        console.error("[favorites] insert:", error.message);
        setFavorites((prev) => { const next = new Set(prev); next.delete(key); return next; });
      }
    }
  }, [favorites, userId]);

  return { favorites, toggleFavorite, loaded };
}
