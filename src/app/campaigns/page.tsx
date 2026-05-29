"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

// ─── Types ────────────────────────────────────────────────────────────────────

type OfferStatus =
  | "pending"
  | "accepted"
  | "delivery_confirmed"
  | "delivered"
  | "completed"
  | "disputed"
  | "refunded"
  | "rejected";

type Campaign = {
  id:                    string;
  marka_id:              string;
  yayinci_id:            string;
  content_type:          string;
  brief:                 string;
  amount:                number;
  platform_fee:          number;
  total:                 number;
  deadline:              string;
  special_requests:      string | null;
  status:                OfferStatus;
  created_at:            string;
  accepted_at:           string | null;
  delivery_deadline:     string | null;
  delivery_confirmed_at: string | null;
  delivery_proof_urls:   string[] | null;
  rejection_reason:      string | null;
  yayinci_username:      string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return "₺" + Math.round(n).toLocaleString("tr-TR");
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

function fmtDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Keep first 2 chars, mask the rest. "canyilmaz" → "ca•••••••"
function maskUsername(name: string): string {
  if (!name) return "•••••";
  if (name.length <= 2) return name[0] + "•••";
  return name.slice(0, 2) + "•".repeat(Math.max(3, name.length - 2));
}

// Live countdown string until a deadline (or overdue marker).
function countdown(iso: string | null): { text: string; overdue: boolean } {
  if (!iso) return { text: "—", overdue: false };
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return { text: "Süre doldu", overdue: true };
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins  = Math.floor((diff % 3600000) / 60000);
  if (days > 0)  return { text: `${days}g ${hours}sa kaldı`, overdue: false };
  if (hours > 0) return { text: `${hours}sa ${mins}dk kaldı`, overdue: false };
  return { text: `${mins}dk kaldı`, overdue: false };
}

const STATUS_CFG: Record<OfferStatus, { label: string; bg: string; color: string }> = {
  pending:            { label: "Beklemede",                bg: "#FFF3E0", color: "#E65100" },
  accepted:           { label: "Kabul Edildi",             bg: "#E8F5E9", color: "#2E7D32" },
  delivery_confirmed: { label: "Teslim Tarihi Belirlendi", bg: "#E3F2FD", color: "#1565C0" },
  delivered:          { label: "Teslim Edildi",            bg: "#EDE7F6", color: "#5E35B1" },
  completed:          { label: "Tamamlandı",               bg: "#E8F5E9", color: "#1B5E20" },
  disputed:           { label: "Anlaşmazlık",              bg: "#FFFBEB", color: "#92400E" },
  refunded:           { label: "İade Edildi",              bg: "#F5F3FF", color: "#6D28D9" },
  rejected:           { label: "Reddedildi",               bg: "#FCE4EC", color: "#C62828" },
};

function StatusChip({ status }: { status: OfferStatus }) {
  const cfg = STATUS_CFG[status] ?? { label: status, bg: "#F5F5F5", color: "#616161" };
  return (
    <span className="text-xs font-semibold rounded-full px-2.5 py-1 whitespace-nowrap" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|mov|webm|m4v)(\?|$)/i.test(url);
}

// ─── Detail modal ───────────────────────────────────────────────────────────

function DetailModal({
  campaign,
  isPro,
  onClose,
  onAccept,
  onReject,
}: {
  campaign: Campaign;
  isPro: boolean;
  onClose: () => void;
  onAccept: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
}) {
  const [busy, setBusy]             = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [reason, setReason]         = useState("");
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const yName = isPro ? `@${campaign.yayinci_username}` : `@${maskUsername(campaign.yayinci_username)}`;
  const cd = countdown(campaign.delivery_deadline);
  const proofs = campaign.delivery_proof_urls ?? [];
  const canReview = campaign.status === "delivered";

  async function accept() {
    setBusy(true); setError(null);
    try { await onAccept(campaign.id); onClose(); }
    catch { setError("Bir hata oluştu. Tekrar dene."); setBusy(false); }
  }

  async function reject() {
    if (reason.trim().length < 5) { setError("Lütfen en az birkaç kelimelik bir gerekçe yaz."); return; }
    setBusy(true); setError(null);
    try { await onReject(campaign.id, reason.trim()); onClose(); }
    catch { setError("Bir hata oluştu. Tekrar dene."); setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(4,44,83,0.5)" }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-extrabold" style={{ color: "#042C53" }}>Sipariş #{campaign.id.slice(0, 8)}</h3>
            <StatusChip status={campaign.status} />
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {/* Detail grid */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <Field label="Yayıncı" value={yName} />
            <Field label="İçerik Türü" value={campaign.content_type} />
            <Field label="İçerik Bedeli" value={fmt(campaign.amount)} />
            <Field label="Komisyon" value={fmt(campaign.platform_fee)} />
            <Field label="Toplam" value={fmt(campaign.total)} />
            <Field label="Oluşturulma" value={fmtDateTime(campaign.created_at)} />
            <Field label="Kabul Tarihi" value={fmtDateTime(campaign.accepted_at)} />
            <Field label="Teslim Edilme" value={fmtDateTime(campaign.delivery_confirmed_at)} />
          </div>

          {/* Delivery deadline countdown */}
          {campaign.delivery_deadline && (
            <div className="rounded-xl p-4 mb-5 flex items-center justify-between" style={{ backgroundColor: cd.overdue ? "#FEF2F2" : "#EBF4FF" }}>
              <div>
                <p className="text-xs mb-0.5" style={{ color: cd.overdue ? "#991B1B" : "#185FA5" }}>Teslim Son Tarihi</p>
                <p className="text-sm font-bold" style={{ color: "#042C53" }}>{fmtDateTime(campaign.delivery_deadline)}</p>
              </div>
              <span className="text-sm font-bold" style={{ color: cd.overdue ? "#991B1B" : "#185FA5" }}>{cd.text}</span>
            </div>
          )}

          {/* Brief */}
          {campaign.brief && (
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Brifing</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{campaign.brief}</p>
            </div>
          )}
          {campaign.special_requests && (
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Özel İstekler</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{campaign.special_requests}</p>
            </div>
          )}

          {/* Proof files */}
          {proofs.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Teslim Kanıtları ({proofs.length})</p>
              <div className="flex flex-wrap gap-2">
                {proofs.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg text-white" style={{ backgroundColor: "#5E35B1" }}>
                    {isVideoUrl(url) ? "🎬" : "🖼️"} Kanıt {i + 1} — Görüntüle
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Rejection reason (if disputed) */}
          {campaign.rejection_reason && (
            <div className="rounded-xl border border-amber-100 p-4 mb-5" style={{ backgroundColor: "#FFFBEB" }}>
              <p className="text-xs font-semibold text-amber-600 mb-1">Belirttiğin Gerekçe</p>
              <p className="text-sm text-gray-700">{campaign.rejection_reason}</p>
            </div>
          )}

          {/* Review actions — only when delivered */}
          {canReview && !rejectMode && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm text-gray-500 mb-3">Yayıncı içeriği teslim etti. Kanıtları inceledikten sonra onayla veya reddet.</p>
              {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
              <div className="flex gap-3">
                <button onClick={accept} disabled={busy} className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: "#10B981" }}>
                  {busy ? "…" : "✓ Teslim Aldım"}
                </button>
                <button onClick={() => { setRejectMode(true); setError(null); }} disabled={busy} className="flex-1 rounded-xl py-2.5 text-sm font-semibold border-2 transition-all hover:bg-gray-50 disabled:opacity-50" style={{ borderColor: "#EF4444", color: "#EF4444" }}>
                  ✕ Teslim Almadım
                </button>
              </div>
            </div>
          )}

          {/* Reject reason form */}
          {canReview && rejectMode && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-semibold mb-2" style={{ color: "#042C53" }}>Reddetme Gerekçesi</p>
              <p className="text-xs text-gray-500 mb-2">Gerekçen Sponsorum ekibine anlaşmazlık olarak iletilecek ve iki taraf da bilgilendirilecek.</p>
              <textarea
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Örn: İçerik brifingdeki gereksinimleri karşılamıyor…"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/20 resize-none mb-2"
              />
              {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
              <div className="flex gap-3">
                <button onClick={reject} disabled={busy} className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: "#EF4444" }}>
                  {busy ? "Gönderiliyor…" : "Anlaşmazlık Bildir"}
                </button>
                <button onClick={() => { setRejectMode(false); setError(null); }} disabled={busy} className="rounded-xl px-4 py-2.5 text-sm font-semibold border-2 transition-all hover:bg-gray-50 disabled:opacity-50" style={{ borderColor: "#E5E7EB", color: "#6B7280" }}>
                  Vazgeç
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-800 break-words">{value}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = ["all", ...Object.keys(STATUS_CFG)] as const;
type Tab = typeof TABS[number];

export default function CampaignsPage() {
  const router = useRouter();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading]     = useState(true);
  const [isPro, setIsPro]         = useState(false);
  const [filter, setFilter]       = useState<Tab>("all");
  const [detail, setDetail]       = useState<Campaign | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const [{ data: mp }, { data: offerRows, error }] = await Promise.all([
      supabase.from("marka_profiles").select("is_pro").eq("id", user.id).maybeSingle(),
      supabase.from("offers").select("*").eq("marka_id", user.id).order("created_at", { ascending: false }),
    ]);

    setIsPro(mp?.is_pro === true);

    if (error) {
      console.error("[campaigns] fetch error:", error);
      setLoading(false);
      return;
    }
    if (!offerRows || offerRows.length === 0) {
      setCampaigns([]);
      setLoading(false);
      return;
    }

    const yayinciIds = [...new Set(offerRows.map((o) => o.yayinci_id as string))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", yayinciIds);
    const nameMap: Record<string, string> = {};
    for (const p of profiles ?? []) nameMap[p.id] = p.username;

    setCampaigns(
      offerRows.map((o) => ({
        ...o,
        delivery_proof_urls: Array.isArray(o.delivery_proof_urls) ? o.delivery_proof_urls : [],
        yayinci_username: nameMap[o.yayinci_id] ?? "yayinci",
      }))
    );
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  // Fire-and-forget notification helper
  function notify(endpoint: string, body: Record<string, unknown>) {
    fetch(`/api/notifications/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch((err) => console.error(`[campaigns] ${endpoint} notification error:`, err));
  }

  async function acceptDelivery(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("offers").update({ status: "completed" }).eq("id", id);
    if (error) { console.error("[campaigns] accept error:", error); throw error; }
    setCampaigns((prev) => prev.map((c) => c.id === id ? { ...c, status: "completed" } : c));

    const c = campaigns.find((x) => x.id === id);
    if (c) notify("delivery-accepted", { yayinciId: c.yayinci_id, contentType: c.content_type, amount: c.amount });
  }

  async function rejectDelivery(id: string, reason: string) {
    const supabase = createClient();
    const { error } = await supabase.from("offers").update({ status: "disputed", rejection_reason: reason }).eq("id", id);
    if (error) { console.error("[campaigns] reject error:", error); throw error; }
    setCampaigns((prev) => prev.map((c) => c.id === id ? { ...c, status: "disputed", rejection_reason: reason } : c));

    const c = campaigns.find((x) => x.id === id);
    if (c) notify("delivery-rejected", { markaId: c.marka_id, yayinciId: c.yayinci_id, contentType: c.content_type, reason });
  }

  const filtered = filter === "all" ? campaigns : campaigns.filter((c) => c.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#185FA5", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Title */}
        <div className="mb-7">
          <h1 className="text-2xl font-extrabold mb-1" style={{ color: "#042C53" }}>Kampanyalarım</h1>
          <p className="text-sm text-gray-500">Yayıncılara gönderdiğin tüm siparişleri buradan takip et ve teslimatları onayla.</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map((f) => {
            const active = filter === f;
            const label = f === "all" ? "Tümü" : STATUS_CFG[f as OfferStatus].label;
            const count = f === "all" ? campaigns.length : campaigns.filter((c) => c.status === f).length;
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
                {label}
                <span className="rounded-full px-1.5 py-0.5 text-xs font-bold" style={{ backgroundColor: active ? "rgba(255,255,255,0.25)" : "#F3F4F6", color: active ? "white" : "#6B7280" }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
            <p className="text-3xl mb-3">📊</p>
            <p className="text-sm font-semibold text-gray-500">
              {filter === "all" ? "Henüz bir kampanyan yok." : "Bu kategoride kampanya yok."}
            </p>
            {filter === "all" && (
              <a href="/search" className="inline-block mt-3 text-sm font-semibold px-5 py-2.5 rounded-xl text-white" style={{ backgroundColor: "#185FA5" }}>
                Sponsor Bul →
              </a>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Yayıncı", "İçerik", "Tutar", "Durum", "Teslim Tarihi", "Oluşturulma"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((c) => {
                    const cd = countdown(c.delivery_deadline);
                    const showCountdown = c.status === "delivery_confirmed";
                    return (
                      <tr key={c.id} onClick={() => setDetail(c)} className="hover:bg-gray-50 transition-colors cursor-pointer">
                        <td className="px-5 py-3.5">
                          <span className={`font-semibold text-gray-800 ${!isPro ? "blur-sm select-none" : ""}`}>
                            @{isPro ? c.yayinci_username : maskUsername(c.yayinci_username)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 max-w-[200px] truncate">{c.content_type}</td>
                        <td className="px-5 py-3.5 font-bold whitespace-nowrap" style={{ color: "#042C53" }}>{fmt(c.amount)}</td>
                        <td className="px-5 py-3.5"><StatusChip status={c.status} /></td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {c.delivery_deadline ? (
                            <div>
                              <span className="text-gray-600">{fmtDate(c.delivery_deadline)}</span>
                              {showCountdown && <span className="block text-xs font-semibold" style={{ color: cd.overdue ? "#991B1B" : "#185FA5" }}>{cd.text}</span>}
                            </div>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{fmtDate(c.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {detail && (
        <DetailModal
          campaign={detail}
          isPro={isPro}
          onClose={() => setDetail(null)}
          onAccept={acceptDelivery}
          onReject={rejectDelivery}
        />
      )}
    </div>
  );
}
