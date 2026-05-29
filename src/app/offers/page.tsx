"use client";

/*
  ──────────────────────────────────────────────────────────────────────────────
  Delivery confirmation flow — required SQL (run once in Supabase SQL Editor).
  This replaces the old 48-hour auto-approval system.

    -- New columns on offers
    alter table offers add column if not exists accepted_at          timestamptz;
    alter table offers add column if not exists delivery_deadline    timestamptz;
    alter table offers add column if not exists delivery_confirmed_at timestamptz;
    alter table offers add column if not exists delivery_proof_urls  jsonb default '[]'::jsonb;
    alter table offers add column if not exists rejection_reason     text;

    -- offers.status values now used by the platform:
    --   pending, accepted, delivery_confirmed, delivered,
    --   completed, disputed, refunded, rejected
    -- If a CHECK constraint exists on offers.status, allow all of these.

    -- Public storage bucket for delivery proof files (videos/images)
    insert into storage.buckets (id, name, public)
    values ('delivery-proofs', 'delivery-proofs', true)
    on conflict (id) do nothing;

    create policy "authenticated upload delivery proofs"
      on storage.objects for insert to authenticated
      with check (bucket_id = 'delivery-proofs');

    create policy "public read delivery proofs"
      on storage.objects for select
      using (bucket_id = 'delivery-proofs');
  ──────────────────────────────────────────────────────────────────────────────
*/

import { useState, useEffect, useCallback, useRef } from "react";
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

type Offer = {
  id:                    string;
  marka_id:              string;
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
  marka_name:            string;
};

// ─── Upload constraints ─────────────────────────────────────────────────────

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/quicktime", "video/webm"];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_FILES     = 5;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return "₺" + Math.round(n).toLocaleString("tr-TR");
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Minimum value for a datetime-local input — "now", in local time.
function nowLocalInput(): string {
  const d = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
}

const STATUS_CFG: Record<OfferStatus, { label: string; bg: string; color: string }> = {
  pending:            { label: "Beklemede",               bg: "#FFF3E0", color: "#E65100" },
  accepted:           { label: "Kabul Edildi",            bg: "#E8F5E9", color: "#2E7D32" },
  delivery_confirmed: { label: "Teslim Tarihi Belirlendi", bg: "#E3F2FD", color: "#1565C0" },
  delivered:          { label: "Teslim Edildi",           bg: "#EDE7F6", color: "#5E35B1" },
  completed:          { label: "Tamamlandı",              bg: "#E8F5E9", color: "#1B5E20" },
  disputed:           { label: "Anlaşmazlık",             bg: "#FFFBEB", color: "#92400E" },
  refunded:           { label: "İade Edildi",             bg: "#F5F3FF", color: "#6D28D9" },
  rejected:           { label: "Reddedildi",              bg: "#FCE4EC", color: "#C62828" },
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

// ─── Delivery section (shown for accepted / delivery_confirmed / delivered) ────

type LocalFile = {
  file:       File;
  previewUrl: string;
  fileType:   "image" | "video";
  storageUrl: string | null;
  uploading:  boolean;
  error:      string | null;
};

function DeliverySection({
  offer,
  currentUserId,
  onConfirmDeadline,
  onSubmitDelivery,
}: {
  offer: Offer;
  currentUserId: string;
  onConfirmDeadline: (id: string, deadlineISO: string) => Promise<void>;
  onSubmitDelivery: (id: string, proofUrls: string[]) => Promise<void>;
}) {
  const [deadline, setDeadline]   = useState("");
  const [busy, setBusy]           = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [files, setFiles]         = useState<LocalFile[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Step 1: set delivery deadline ──────────────────────────────────────────
  if (offer.status === "accepted") {
    async function confirm() {
      if (!deadline) return;
      const iso = new Date(deadline).toISOString();
      if (new Date(iso).getTime() <= Date.now()) {
        setSubmitError("Teslim tarihi gelecekte bir zaman olmalı.");
        return;
      }
      setBusy(true);
      setSubmitError(null);
      try {
        await onConfirmDeadline(offer.id, iso);
      } catch {
        setSubmitError("Bir hata oluştu. Tekrar dene.");
      }
      setBusy(false);
    }

    return (
      <div className="rounded-xl border-2 border-dashed p-4" style={{ borderColor: "#BBDEFB", backgroundColor: "#F5FAFF" }}>
        <p className="text-sm font-bold mb-3" style={{ color: "#1565C0" }}>📅 Teslim Tarihini Belirle</p>
        <input
          type="datetime-local"
          value={deadline}
          min={nowLocalInput()}
          onChange={(e) => setDeadline(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/20 mb-3"
        />
        <p className="text-xs mb-3 flex items-start gap-1.5" style={{ color: "#B45309" }}>
          <span>⚠️</span>
          <span>Bu tarih ve saati geçerseniz otomatik iade gerçekleşir.</span>
        </p>
        {submitError && <p className="text-xs text-red-600 mb-2">{submitError}</p>}
        <button
          onClick={confirm}
          disabled={busy || !deadline}
          className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#185FA5" }}
        >
          {busy ? "Kaydediliyor…" : "Teslim Edeceğim Tarihi Onaylıyorum"}
        </button>
      </div>
    );
  }

  // ── Step 2: delivery date confirmed → show "Teslim Ettim" / upload ─────────
  if (offer.status === "delivery_confirmed") {
    function handleFiles(selected: FileList | null) {
      if (!selected) return;
      setSubmitError(null);
      const incoming = Array.from(selected);
      const slots = MAX_FILES - files.length;
      if (slots <= 0) { setSubmitError(`En fazla ${MAX_FILES} dosya yükleyebilirsin.`); return; }

      for (const file of incoming.slice(0, slots)) {
        if (!ALLOWED_TYPES.includes(file.type)) { setSubmitError("Desteklenmeyen dosya türü. Video veya görsel yükle."); continue; }
        if (file.size > MAX_FILE_SIZE)          { setSubmitError("Her dosya en fazla 50 MB olabilir."); continue; }

        const fileType   = file.type.startsWith("video/") ? "video" : "image";
        const previewUrl = URL.createObjectURL(file);
        const entry: LocalFile = { file, previewUrl, fileType, storageUrl: null, uploading: true, error: null };
        setFiles((prev) => [...prev, entry]);
        uploadFile(entry);
      }
    }

    async function uploadFile(entry: LocalFile) {
      const supabase = createClient();
      const ext  = entry.file.name.split(".").pop()?.toLowerCase() ?? "bin";
      const path = `${offer.id}/${currentUserId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { data, error } = await supabase.storage
        .from("delivery-proofs")
        .upload(path, entry.file, { contentType: entry.file.type });

      if (error) {
        console.error("[offers] proof upload error:", error);
        setFiles((prev) => prev.map((f) => f === entry ? { ...f, uploading: false, error: "Yükleme başarısız" } : f));
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from("delivery-proofs").getPublicUrl(data.path);
      setFiles((prev) => prev.map((f) => f === entry ? { ...f, uploading: false, storageUrl: publicUrl } : f));
    }

    function removeFile(entry: LocalFile) {
      URL.revokeObjectURL(entry.previewUrl);
      setFiles((prev) => prev.filter((f) => f !== entry));
    }

    async function submit() {
      const urls = files.map((f) => f.storageUrl).filter((u): u is string => !!u);
      if (urls.length === 0)            { setSubmitError("En az 1 kanıt dosyası yüklemelisin."); return; }
      if (files.some((f) => f.uploading)) { setSubmitError("Dosyalar yükleniyor, lütfen bekle."); return; }
      setBusy(true);
      setSubmitError(null);
      try {
        await onSubmitDelivery(offer.id, urls);
      } catch {
        setSubmitError("Bir hata oluştu. Tekrar dene.");
        setBusy(false);
      }
    }

    return (
      <div className="rounded-xl border p-4" style={{ borderColor: "#E3F2FD", backgroundColor: "#F5FAFF" }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold" style={{ color: "#1565C0" }}>Teslim Tarihi</p>
          <p className="text-sm font-bold" style={{ color: "#042C53" }}>{offer.delivery_deadline ? fmtDateTime(offer.delivery_deadline) : "—"}</p>
        </div>

        {!showUpload ? (
          <button
            onClick={() => setShowUpload(true)}
            className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: "#5E35B1" }}
          >
            📤 Teslim Ettim
          </button>
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-2">İçeriği kanıtlayan 1-5 video/görsel yükle (her biri en fazla 50 MB).</p>

            {files.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {files.map((f, i) => (
                  <div key={i} className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 aspect-square">
                    {f.fileType === "image"
                      ? <img src={f.previewUrl} alt="" className="w-full h-full object-cover" />
                      : <video src={f.previewUrl} className="w-full h-full object-cover" />}
                    {f.uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      </div>
                    )}
                    {f.error && <div className="absolute inset-0 flex items-center justify-center bg-red-500/70 text-white text-[10px] p-1 text-center">{f.error}</div>}
                    <button
                      onClick={() => removeFile(f)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs leading-none flex items-center justify-center hover:bg-black/80"
                    >×</button>
                  </div>
                ))}
              </div>
            )}

            {files.length < MAX_FILES && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border-2 border-dashed border-gray-300 py-2.5 text-sm font-semibold text-gray-500 hover:border-[#185FA5] hover:text-[#185FA5] transition-colors mb-3"
              >
                + Dosya Ekle ({files.length}/{MAX_FILES})
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_TYPES.join(",")}
              multiple
              className="hidden"
              onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
            />

            {submitError && <p className="text-xs text-red-600 mb-2">{submitError}</p>}

            <button
              onClick={submit}
              disabled={busy || files.length === 0}
              className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#5E35B1" }}
            >
              {busy ? "Gönderiliyor…" : "Teslimatı Gönder"}
            </button>
          </>
        )}
        {submitError && !showUpload && <p className="text-xs text-red-600 mt-2">{submitError}</p>}
      </div>
    );
  }

  // ── Delivered → awaiting marka review ──────────────────────────────────────
  if (offer.status === "delivered") {
    return (
      <div className="rounded-xl border p-4" style={{ borderColor: "#EDE7F6", backgroundColor: "#FAF8FF" }}>
        <p className="text-sm font-bold mb-1" style={{ color: "#5E35B1" }}>✓ Teslimat gönderildi</p>
        <p className="text-xs text-gray-500">Marka kanıtları inceliyor. Onaylandığında ödemen serbest bırakılacak.</p>
        {offer.delivery_proof_urls && offer.delivery_proof_urls.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {offer.delivery_proof_urls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer" className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: "#5E35B1" }}>
                Kanıt {i + 1}
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Terminal states ────────────────────────────────────────────────────────
  if (offer.status === "completed") {
    return (
      <div className="rounded-xl border p-4" style={{ borderColor: "#C8E6C9", backgroundColor: "#F1F8F4" }}>
        <p className="text-sm font-bold" style={{ color: "#1B5E20" }}>🎉 Tamamlandı — ödemen serbest bırakıldı.</p>
      </div>
    );
  }
  if (offer.status === "refunded") {
    return (
      <div className="rounded-xl border p-4" style={{ borderColor: "#E9D5FF", backgroundColor: "#FAF5FF" }}>
        <p className="text-sm font-bold" style={{ color: "#6D28D9" }}>↩️ İade edildi.</p>
        <p className="text-xs text-gray-500 mt-1">Teslim tarihi geçtiği veya anlaşmazlık marka lehine sonuçlandığı için tutar markaya iade edildi.</p>
      </div>
    );
  }
  if (offer.status === "disputed") {
    return (
      <div className="rounded-xl border p-4" style={{ borderColor: "#FDE68A", backgroundColor: "#FFFBEB" }}>
        <p className="text-sm font-bold" style={{ color: "#92400E" }}>⚖️ Anlaşmazlık inceleniyor</p>
        {offer.rejection_reason && <p className="text-xs text-gray-600 mt-1"><strong>Marka gerekçesi:</strong> {offer.rejection_reason}</p>}
        <p className="text-xs text-gray-500 mt-1">Sponsorum ekibi durumu değerlendiriyor.</p>
      </div>
    );
  }

  return null;
}

// ─── Offer card ───────────────────────────────────────────────────────────────

function OfferCard({
  offer,
  currentUserId,
  onAccept,
  onReject,
  onConfirmDeadline,
  onSubmitDelivery,
  updating,
}: {
  offer: Offer;
  currentUserId: string;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onConfirmDeadline: (id: string, deadlineISO: string) => Promise<void>;
  onSubmitDelivery: (id: string, proofUrls: string[]) => Promise<void>;
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

      {/* Delivery flow — accepted and beyond */}
      {offer.status !== "pending" && offer.status !== "rejected" && (
        <DeliverySection
          offer={offer}
          currentUserId={currentUserId}
          onConfirmDeadline={onConfirmDeadline}
          onSubmitDelivery={onSubmitDelivery}
        />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = "all" | "pending" | "active" | "done";

const TAB_MATCH: Record<Tab, (s: OfferStatus) => boolean> = {
  all:     () => true,
  pending: (s) => s === "pending",
  active:  (s) => s === "accepted" || s === "delivery_confirmed" || s === "delivered",
  done:    (s) => s === "completed" || s === "refunded" || s === "disputed" || s === "rejected",
};

const TAB_LABEL: Record<Tab, string> = {
  all:     "Tümü",
  pending: "Beklemede",
  active:  "Devam Eden",
  done:    "Tamamlanan",
};

export default function OffersPage() {
  const router = useRouter();

  const [offers, setOffers]         = useState<Offer[]>([]);
  const [loading, setLoading]       = useState(true);
  const [updating, setUpdating]     = useState<string | null>(null);
  const [filter, setFilter]         = useState<Tab>("all");
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
        delivery_proof_urls: Array.isArray(o.delivery_proof_urls) ? o.delivery_proof_urls : [],
        marka_name: nameMap[o.marka_id] ?? "Marka",
      }))
    );
    setLoading(false);
  }, [router]);

  useEffect(() => { loadOffers(); }, [loadOffers]);

  // Fire-and-forget notification helper
  function notify(endpoint: string, body: Record<string, unknown>) {
    fetch(`/api/notifications/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch((err) => console.error(`[offers] ${endpoint} notification error:`, err));
  }

  async function updateStatus(id: string, status: "accepted" | "rejected") {
    setUpdating(id);
    const supabase = createClient();
    const patch: Record<string, unknown> = { status };
    if (status === "accepted") patch.accepted_at = new Date().toISOString();

    const { error } = await supabase.from("offers").update(patch).eq("id", id);

    if (error) {
      console.error("[offers] update error:", error);
    } else {
      setOffers((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch, status } as Offer : o)));

      const offer = offers.find((o) => o.id === id);
      if (offer && currentUserId) {
        const endpoint = status === "accepted" ? "offer-accepted" : "offer-rejected";
        notify(endpoint, {
          markaId:     offer.marka_id,
          yayinciId:   currentUserId,
          contentType: offer.content_type,
          deadline:    offer.deadline,
        });
      }
    }
    setUpdating(null);
  }

  async function confirmDeadline(id: string, deadlineISO: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("offers")
      .update({ status: "delivery_confirmed", delivery_deadline: deadlineISO })
      .eq("id", id);
    if (error) { console.error("[offers] confirmDeadline error:", error); throw error; }

    setOffers((prev) => prev.map((o) => o.id === id ? { ...o, status: "delivery_confirmed", delivery_deadline: deadlineISO } : o));

    const offer = offers.find((o) => o.id === id);
    if (offer && currentUserId) {
      notify("delivery-scheduled", {
        markaId:          offer.marka_id,
        yayinciId:        currentUserId,
        contentType:      offer.content_type,
        deliveryDeadline: deadlineISO,
      });
    }
  }

  async function submitDelivery(id: string, proofUrls: string[]) {
    const supabase = createClient();
    const confirmedAt = new Date().toISOString();
    const { error } = await supabase
      .from("offers")
      .update({ status: "delivered", delivery_proof_urls: proofUrls, delivery_confirmed_at: confirmedAt })
      .eq("id", id);
    if (error) { console.error("[offers] submitDelivery error:", error); throw error; }

    setOffers((prev) => prev.map((o) => o.id === id
      ? { ...o, status: "delivered", delivery_proof_urls: proofUrls, delivery_confirmed_at: confirmedAt }
      : o));

    const offer = offers.find((o) => o.id === id);
    if (offer && currentUserId) {
      notify("delivery-submitted", {
        markaId:     offer.marka_id,
        yayinciId:   currentUserId,
        contentType: offer.content_type,
      });
    }
  }

  const filtered = offers.filter((o) => TAB_MATCH[filter](o.status));

  const counts: Record<Tab, number> = {
    all:     offers.length,
    pending: offers.filter((o) => TAB_MATCH.pending(o.status)).length,
    active:  offers.filter((o) => TAB_MATCH.active(o.status)).length,
    done:    offers.filter((o) => TAB_MATCH.done(o.status)).length,
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
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* Title */}
        <div className="mb-7">
          <h1 className="text-2xl font-extrabold mb-1" style={{ color: "#042C53" }}>Gelen Teklifler</h1>
          <p className="text-sm text-gray-500">Markalardan gelen sponsorluk tekliflerini incele, kabul et ve içeriğini teslim et.</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(["all", "pending", "active", "done"] as const).map((f) => {
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
                {TAB_LABEL[f]}
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
                currentUserId={currentUserId ?? ""}
                onAccept={(id) => updateStatus(id, "accepted")}
                onReject={(id) => updateStatus(id, "rejected")}
                onConfirmDeadline={confirmDeadline}
                onSubmitDelivery={submitDelivery}
                updating={updating}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
