"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type OfferStatus = "pending" | "accepted" | "rejected";

type Offer = {
  id:               string;
  marka_id:         string;
  content_type:     string;
  brief:            string;
  amount:           number;
  platform_fee:     number;
  total:            number;
  deadline:         string;
  special_requests: string | null;
  status:           OfferStatus;
  created_at:       string;
  marka_name:       string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return "₺" + Math.round(n).toLocaleString("tr-TR");
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

const STATUS_CFG: Record<OfferStatus, { label: string; bg: string; color: string }> = {
  pending:  { label: "Beklemede",    bg: "#FFF3E0", color: "#E65100" },
  accepted: { label: "Kabul Edildi", bg: "#E8F5E9", color: "#2E7D32" },
  rejected: { label: "Reddedildi",  bg: "#FCE4EC", color: "#C62828" },
};

function StatusChip({ status }: { status: OfferStatus }) {
  const cfg = STATUS_CFG[status] ?? { label: status, bg: "#F5F5F5", color: "#616161" };
  return (
    <span
      className="text-xs font-semibold rounded-full px-2.5 py-1"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

// ─── Offer card ───────────────────────────────────────────────────────────────

function OfferCard({
  offer,
  onAccept,
  onReject,
  updating,
}: {
  offer: Offer;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  updating: string | null;
}) {
  const isUpdating = updating === offer.id;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black text-white flex-shrink-0"
            style={{ backgroundColor: "#042C53" }}
          >
            {offer.marka_name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: "#042C53" }}>{offer.marka_name}</p>
            <p className="text-xs text-gray-400">{fmtDate(offer.created_at)}</p>
          </div>
        </div>
        <StatusChip status={offer.status} />
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl p-3" style={{ backgroundColor: "#F9FAFB" }}>
          <p className="text-xs text-gray-400 mb-0.5">İçerik Türü</p>
          <p className="text-sm font-semibold" style={{ color: "#042C53" }}>{offer.content_type}</p>
        </div>
        <div className="rounded-xl p-3" style={{ backgroundColor: "#F9FAFB" }}>
          <p className="text-xs text-gray-400 mb-0.5">İçerik Bedeli</p>
          <p className="text-sm font-semibold" style={{ color: "#042C53" }}>{fmt(offer.amount)}</p>
        </div>
        <div className="rounded-xl p-3" style={{ backgroundColor: "#F9FAFB" }}>
          <p className="text-xs text-gray-400 mb-0.5">Teslim Tarihi</p>
          <p className="text-sm font-semibold" style={{ color: "#042C53" }}>{fmtDate(offer.deadline)}</p>
        </div>
        <div className="rounded-xl p-3" style={{ backgroundColor: "#EBF4FF" }}>
          <p className="text-xs mb-0.5" style={{ color: "#185FA5" }}>Toplam (sana ödenecek)</p>
          <p className="text-sm font-bold" style={{ color: "#185FA5" }}>{fmt(offer.amount)}</p>
        </div>
      </div>

      {/* Brief */}
      <div className="rounded-xl border border-gray-100 p-4 mb-4">
        <p className="text-xs font-semibold text-gray-400 mb-1.5">Brifing</p>
        <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{offer.brief}</p>
      </div>

      {/* Special requests */}
      {offer.special_requests && (
        <div className="rounded-xl border border-amber-100 p-4 mb-4" style={{ backgroundColor: "#FFFBF0" }}>
          <p className="text-xs font-semibold text-amber-600 mb-1.5">Özel İstekler</p>
          <p className="text-sm text-gray-700 leading-relaxed">{offer.special_requests}</p>
        </div>
      )}

      {/* Action buttons — only shown while pending */}
      {offer.status === "pending" && (
        <div className="flex gap-3">
          <button
            onClick={() => onAccept(offer.id)}
            disabled={isUpdating}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#185FA5" }}
          >
            {isUpdating ? "…" : "✓ Kabul Et"}
          </button>
          <button
            onClick={() => onReject(offer.id)}
            disabled={isUpdating}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold border-2 transition-all hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderColor: "#E5E7EB", color: "#6B7280" }}
          >
            {isUpdating ? "…" : "✕ Reddet"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OffersPage() {
  const router = useRouter();

  const [offers, setOffers]         = useState<Offer[]>([]);
  const [loading, setLoading]       = useState(true);
  const [updating, setUpdating]     = useState<string | null>(null);
  const [filter, setFilter]         = useState<OfferStatus | "all">("all");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const loadOffers = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    setCurrentUserId(user.id);

    // Fetch offers
    const { data: offerRows, error } = await supabase
      .from("offers")
      .select("*")
      .eq("yayinci_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[offers] fetch error:", error);
      setLoading(false);
      return;
    }

    if (!offerRows || offerRows.length === 0) {
      setOffers([]);
      setLoading(false);
      return;
    }

    // Fetch marka company names
    const markaIds = [...new Set(offerRows.map((o) => o.marka_id as string))];
    const { data: markaRows } = await supabase
      .from("marka_profiles")
      .select("id, company_name")
      .in("id", markaIds);

    const nameMap: Record<string, string> = {};
    for (const m of markaRows ?? []) nameMap[m.id] = m.company_name;

    setOffers(
      offerRows.map((o) => ({
        ...o,
        marka_name: nameMap[o.marka_id] ?? "Marka",
      }))
    );
    setLoading(false);
  }, [router]);

  useEffect(() => { loadOffers(); }, [loadOffers]);

  async function updateStatus(id: string, status: "accepted" | "rejected") {
    setUpdating(id);
    const supabase = createClient();
    const { error } = await supabase
      .from("offers")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("[offers] update error:", error);
    } else {
      setOffers((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status } : o))
      );

      // Fire-and-forget email notification to marka
      const offer = offers.find((o) => o.id === id);
      if (offer && currentUserId) {
        const endpoint = status === "accepted" ? "offer-accepted" : "offer-rejected";
        fetch(`/api/notifications/${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            markaId:     offer.marka_id,
            yayinciId:   currentUserId,
            contentType: offer.content_type,
            deadline:    offer.deadline,
          }),
        }).catch((err) => console.error("[offers] notification error:", err));
      }
    }
    setUpdating(null);
  }

  const filtered = filter === "all" ? offers : offers.filter((o) => o.status === filter);

  const counts = {
    all:      offers.length,
    pending:  offers.filter((o) => o.status === "pending").length,
    accepted: offers.filter((o) => o.status === "accepted").length,
    rejected: offers.filter((o) => o.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#185FA5", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <a href="/" className="text-2xl font-extrabold tracking-tight" style={{ color: "#185FA5" }}>Sponsorum</a>
          <a href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-[#185FA5] transition-colors">
            ← Dashboard
          </a>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* Title */}
        <div className="mb-7">
          <h1 className="text-2xl font-extrabold mb-1" style={{ color: "#042C53" }}>Gelen Teklifler</h1>
          <p className="text-sm text-gray-500">Markalardan gelen sponsorluk tekliflerini incele ve yanıtla.</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(["all", "pending", "accepted", "rejected"] as const).map((f) => {
            const labels: Record<typeof f, string> = {
              all:      "Tümü",
              pending:  "Beklemede",
              accepted: "Kabul Edildi",
              rejected: "Reddedildi",
            };
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all border"
                style={{
                  backgroundColor: active ? "#185FA5" : "white",
                  borderColor:     active ? "#185FA5" : "#E5E7EB",
                  color:           active ? "white"   : "#6B7280",
                }}
              >
                {labels[f]}
                <span
                  className="rounded-full px-1.5 py-0.5 text-xs font-bold"
                  style={{
                    backgroundColor: active ? "rgba(255,255,255,0.25)" : "#F3F4F6",
                    color:           active ? "white" : "#6B7280",
                  }}
                >
                  {counts[f]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Offer list */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
            <p className="text-3xl mb-3">📭</p>
            <p className="text-sm font-semibold text-gray-500">
              {filter === "all" ? "Henüz teklif almadın." : "Bu kategoride teklif yok."}
            </p>
            {filter === "all" && (
              <p className="text-xs text-gray-400 mt-1">Profilini tamamla ve markalar seni bulsun.</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {filtered.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onAccept={(id) => updateStatus(id, "accepted")}
                onReject={(id) => updateStatus(id, "rejected")}
                updating={updating}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
