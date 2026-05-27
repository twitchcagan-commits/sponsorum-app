"use client";

/*
  Requires a username column on the profiles table:

  alter table profiles
    add column if not exists username text unique;

  Update existing yayinci rows:
    update profiles set username = lower(replace(display_name, ' ', ''))
    where role = 'yayinci';
*/

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

// ─── Types & config ───────────────────────────────────────────────────────────

type ContentType = "reels" | "story" | "tiktok" | "paket";

const CONTENT_TYPES: { id: ContentType; label: string; platform: string; price: number; days: number }[] = [
  { id: "reels",  label: "Instagram Reels (60 sn)",       platform: "Instagram", price: 3500, days: 3 },
  { id: "story",  label: "Instagram Story",                platform: "Instagram", price: 1200, days: 1 },
  { id: "tiktok", label: "TikTok Video",                   platform: "TikTok",    price: 2800, days: 3 },
  { id: "paket",  label: "Paket (Reels + Story + TikTok)", platform: "Multi",     price: 6000, days: 5 },
];

const PLATFORM_FEE = 0.15;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return "₺" + Math.round(n).toLocaleString("tr-TR");
}

function minDate() {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString().split("T")[0];
}

// ─── Summary card ─────────────────────────────────────────────────────────────

function SummaryCard({
  username,
  selected,
  budget,
  deadline,
  brief,
  onSubmit,
  loading,
  submitError,
}: {
  username: string;
  selected: (typeof CONTENT_TYPES)[0] | null;
  budget: number;
  deadline: string;
  brief: string;
  onSubmit: () => void;
  loading: boolean;
  submitError: string;
}) {
  const fee = budget * PLATFORM_FEE;
  const total = budget + fee;
  const canSubmit = !!selected && budget > 0 && !!deadline && !!brief.trim() && !loading;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5">
      <h3 className="text-base font-extrabold" style={{ color: "#042C53" }}>Teklif Özeti</h3>

      {/* Creator */}
      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "#E6F1FB" }}>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0"
          style={{ backgroundColor: "#042C53" }}
        >
          {username.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: "#042C53" }}>@{username}</p>
        </div>
      </div>

      {/* Line items */}
      <div className="flex flex-col gap-3 text-sm">
        <div className="flex justify-between items-start gap-2">
          <span className="text-gray-500">İçerik türü</span>
          <span className="font-semibold text-right" style={{ color: "#042C53" }}>
            {selected ? selected.label : <span className="text-gray-300 font-normal">Seçilmedi</span>}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">İçerik bedeli</span>
          <span className="font-semibold" style={{ color: "#042C53" }}>
            {budget > 0 ? fmt(budget) : "—"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Platform ücreti (%15)</span>
          <span className="font-semibold" style={{ color: "#042C53" }}>
            {budget > 0 ? fmt(fee) : "—"}
          </span>
        </div>

        <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
          <span className="font-bold" style={{ color: "#042C53" }}>Toplam</span>
          <span className="text-lg font-extrabold" style={{ color: "#185FA5" }}>
            {budget > 0 ? fmt(total) : "—"}
          </span>
        </div>
      </div>

      {/* Escrow note */}
      <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2.5 text-xs text-emerald-700 leading-relaxed">
        🔒 Ödeme, içerik onaylanana kadar Sponsorum güvencesinde tutulur.
      </div>

      {submitError && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-xs text-red-700">
          {submitError}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ backgroundColor: "#185FA5" }}
        onMouseEnter={e => { if (canSubmit) e.currentTarget.style.backgroundColor = "#042C53"; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#185FA5"; }}
      >
        {loading ? "Gönderiliyor…" : "Teklif Gönder"}
      </button>

      <p className="text-xs text-gray-400 text-center leading-relaxed">
        Teklifi göndererek{" "}
        <a href="#" className="underline">Kullanım Şartları</a>
        &apos;nı kabul etmiş olursunuz.
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OfferPage() {
  const params   = useParams();
  const router   = useRouter();
  const username = (params?.username as string) ?? "";

  const [contentType, setContentType]       = useState<ContentType | null>(null);
  const [brief, setBrief]                   = useState("");
  const [budget, setBudget]                 = useState("");
  const [deadline, setDeadline]             = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  const [yayinciId, setYayinciId]   = useState<string | null>(null);
  const [fetchError, setFetchError] = useState("");
  const [loading, setLoading]       = useState(false);
  const [submitError, setSubmitError] = useState("");

  const selected   = CONTENT_TYPES.find((c) => c.id === contentType) ?? null;
  const budgetNum  = parseFloat(budget) || 0;

  // Auto-fill budget when content type changes
  useEffect(() => {
    if (selected) setBudget(String(selected.price));
  }, [contentType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Look up yayinci user id from profiles.username (case-insensitive)
  useEffect(() => {
    if (!username) return;
    const supabase = createClient();
    const normalized = username.toLowerCase();
    console.log("[offer] looking up username:", normalized);
    supabase
      .from("profiles")
      .select("id, username, role")
      .ilike("username", normalized)
      .maybeSingle()
      .then(({ data, error }) => {
        console.log("[offer] profiles lookup result:", { data, error });
        if (error) {
          setFetchError("Profil sorgusu başarısız: " + error.message);
          return;
        }
        if (!data) {
          setFetchError(`'${username}' kullanıcı adıyla profil bulunamadı.`);
          return;
        }
        if (data.role !== "yayinci") {
          setFetchError(`'${username}' bir yayıncı hesabı değil (rol: ${data.role}).`);
          return;
        }
        console.log("[offer] yayinci_id resolved:", data.id);
        setYayinciId(data.id);
      });
  }, [username]);

  async function handleSubmit() {
    if (!selected || budgetNum <= 0 || !deadline || !brief.trim() || !yayinciId) return;
    setLoading(true);
    setSubmitError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const fee = parseFloat((budgetNum * PLATFORM_FEE).toFixed(2));

    const { error } = await supabase.from("offers").insert({
      marka_id:         user.id,
      yayinci_id:       yayinciId,
      content_type:     selected.label,
      brief:            brief.trim(),
      amount:           budgetNum,
      platform_fee:     fee,
      total:            parseFloat((budgetNum + fee).toFixed(2)),
      deadline,
      special_requests: specialRequests.trim() || null,
      status:           "pending",
    });

    if (error) {
      console.error("[offer] insert error:", error);
      setSubmitError("Teklif gönderilirken bir hata oluştu: " + error.message);
      setLoading(false);
      return;
    }

    router.push("/messages");
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <a href="/" className="text-2xl font-extrabold tracking-tight" style={{ color: "#185FA5" }}>Sponsorum</a>
          <a href={`/profile/${username}`} className="text-sm font-medium text-gray-500 hover:text-[#185FA5] transition-colors">
            ← Profile Dön
          </a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold mb-1" style={{ color: "#042C53" }}>
            Sponsorluk Teklifi Gönder
          </h1>
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-700">@{username}</span> adlı yayıncıya teklif gönderiyorsunuz.
          </p>
          {fetchError && (
            <div className="mt-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {fetchError}
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-7">

          {/* ── Form ── */}
          <div className="flex-1 flex flex-col gap-5 min-w-0">

            {/* Content type */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-extrabold mb-4" style={{ color: "#042C53" }}>
                İçerik Türü <span className="text-red-400">*</span>
              </h2>
              <div className="flex flex-col gap-3">
                {CONTENT_TYPES.map((ct) => (
                  <label
                    key={ct.id}
                    className="flex items-center justify-between gap-4 rounded-xl border-2 p-4 cursor-pointer transition-all hover:border-[#185FA5]/40"
                    style={{
                      borderColor:     contentType === ct.id ? "#185FA5" : "#F3F4F6",
                      backgroundColor: contentType === ct.id ? "#EBF4FF" : "white",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="contentType"
                        value={ct.id}
                        checked={contentType === ct.id}
                        onChange={() => setContentType(ct.id)}
                        className="w-4 h-4 accent-[#185FA5]"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{ct.label}</p>
                        <p className="text-xs text-gray-400">{ct.platform} · {ct.days} günde teslim</p>
                      </div>
                    </div>
                    <span className="text-sm font-extrabold flex-shrink-0" style={{ color: "#185FA5" }}>
                      ₺{ct.price.toLocaleString("tr-TR")}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Campaign brief */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <label className="block text-sm font-extrabold mb-1" style={{ color: "#042C53" }}>
                Kampanya Brifing <span className="text-red-400">*</span>
              </label>
              <p className="text-xs text-gray-400 mb-3">Markamızı nasıl tanıtmamızı istiyorsunuz?</p>
              <textarea
                rows={5}
                placeholder="Ürününüzü, hedef kitlenizi ve yayıncıdan beklentilerinizi açıklayın."
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/20 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1.5 text-right">{brief.length} karakter</p>
            </div>

            {/* Budget + deadline */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-extrabold mb-1" style={{ color: "#042C53" }}>
                    Bütçe (₺) <span className="text-red-400">*</span>
                  </label>
                  <p className="text-xs text-gray-400 mb-2">İçerik türüne göre otomatik doldurulur, değiştirilebilir.</p>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">₺</span>
                    <input
                      type="number"
                      min={1}
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-xl border border-gray-200 pl-8 pr-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-extrabold mb-1" style={{ color: "#042C53" }}>
                    Teslim Tarihi <span className="text-red-400">*</span>
                  </label>
                  <p className="text-xs text-gray-400 mb-2">En erken 3 gün sonrası seçilebilir.</p>
                  <input
                    type="date"
                    min={minDate()}
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/20"
                  />
                </div>
              </div>
            </div>

            {/* Special requests */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <label className="block text-sm font-extrabold mb-1" style={{ color: "#042C53" }}>
                Özel İstekler <span className="text-xs font-normal text-gray-400">(isteğe bağlı)</span>
              </label>
              <p className="text-xs text-gray-400 mb-3">Yayıncının bilmesi gereken ek bilgiler, kısıtlamalar veya tercihler.</p>
              <textarea
                rows={3}
                placeholder="Örn: Rakip marka adı geçmesin, belirli bir müzik kullanılsın…"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/20 resize-none"
              />
            </div>

            {/* Mobile: summary card */}
            <div className="lg:hidden">
              <SummaryCard
                username={username}
                selected={selected}
                budget={budgetNum}
                deadline={deadline}
                brief={brief}
                onSubmit={handleSubmit}
                loading={loading}
                submitError={submitError}
              />
            </div>
          </div>

          {/* ── Desktop summary card ── */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24">
              <SummaryCard
                username={username}
                selected={selected}
                budget={budgetNum}
                deadline={deadline}
                brief={brief}
                onSubmit={handleSubmit}
                loading={loading}
                submitError={submitError}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
