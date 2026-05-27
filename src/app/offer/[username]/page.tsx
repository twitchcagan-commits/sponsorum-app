"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

// ─── Types & config ───────────────────────────────────────────────────────────

type ContentType = "reels" | "story" | "tiktok" | "paket";

const CONTENT_TYPES: { id: ContentType; label: string; platform: string; price: number; days: number }[] = [
  { id: "reels",  label: "Instagram Reels (60 sn)", platform: "Instagram", price: 3500, days: 3 },
  { id: "story",  label: "Instagram Story",          platform: "Instagram", price: 1200, days: 1 },
  { id: "tiktok", label: "TikTok Video",             platform: "TikTok",    price: 2800, days: 3 },
  { id: "paket",  label: "Paket (Reels + Story + TikTok)", platform: "Multi", price: 6000, days: 5 },
];

const PLATFORM_FEE = 0.15;

const CREATOR = {
  username: "gamerturk",
  displayName: "Burak K.",
  initials: "BK",
  niche: "Oyun",
  rating: 4.9,
  dealsCompleted: 12,
};

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
  onSubmit,
  loading,
}: {
  username: string;
  selected: (typeof CONTENT_TYPES)[0] | null;
  budget: number;
  onSubmit: () => void;
  loading: boolean;
}) {
  const fee = budget * PLATFORM_FEE;
  const total = budget + fee;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5">
      <h3 className="text-base font-extrabold" style={{ color: "#042C53" }}>Teklif Özeti</h3>

      {/* Creator */}
      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "#E6F1FB" }}>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0"
          style={{ backgroundColor: "#042C53" }}
        >
          {CREATOR.initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: "#042C53" }}>@{username}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500">{CREATOR.niche}</span>
            <span className="text-xs text-gray-300">•</span>
            <span className="text-xs text-amber-600 font-semibold">⭐ {CREATOR.rating}</span>
          </div>
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

      {/* Submit */}
      <button
        onClick={onSubmit}
        disabled={!selected || budget <= 0 || loading}
        className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ backgroundColor: "#185FA5" }}
        onMouseEnter={e => { if (!loading && selected) e.currentTarget.style.backgroundColor = "#042C53"; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#185FA5"; }}
      >
        {loading ? "Gönderiliyor…" : "Teklif Gönder"}
      </button>

      <p className="text-xs text-gray-400 text-center leading-relaxed">
        Teklifi göndererek{" "}
        <a href="#" className="underline">Kullanım Şartları</a>
        'nı kabul etmiş olursunuz.
      </p>
    </div>
  );
}

// ─── Success state ────────────────────────────────────────────────────────────

function SuccessView({ username }: { username: string }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #E6F1FB 0%, #ffffff 60%)" }}>
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-16">
          <a href="/" className="text-2xl font-extrabold tracking-tight" style={{ color: "#185FA5" }}>Sponsorum</a>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-10 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl text-white mx-auto mb-6"
            style={{ backgroundColor: "#185FA5" }}
          >
            ✓
          </div>
          <h2 className="text-2xl font-extrabold mb-2" style={{ color: "#042C53" }}>Teklif Gönderildi!</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            Teklifiniz <span className="font-semibold text-gray-700">@{username}</span> adlı yayıncıya iletildi.
            Yayıncı genellikle <span className="font-semibold text-gray-700">24–48 saat</span> içinde yanıt verir.
            Bildirimlerinizi takip etmeyi unutmayın.
          </p>
          <div className="flex flex-col gap-3">
            <a
              href="/dashboard"
              className="w-full rounded-xl py-3 text-sm font-semibold text-white text-center transition-all hover:opacity-90"
              style={{ backgroundColor: "#185FA5" }}
            >
              Dashboard'a Git
            </a>
            <a
              href="/search"
              className="w-full rounded-xl py-3 text-sm font-semibold border-2 text-center transition-all hover:bg-gray-50"
              style={{ borderColor: "#E6F1FB", color: "#185FA5" }}
            >
              Başka Yayıncı Ara
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OfferPage() {
  const params = useParams();
  const username = (params?.username as string) ?? CREATOR.username;

  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [brief, setBrief] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const selected = CONTENT_TYPES.find((c) => c.id === contentType) ?? null;

  // Auto-fill budget when content type changes
  useEffect(() => {
    if (selected) setBudget(String(selected.price));
  }, [contentType]); // eslint-disable-line react-hooks/exhaustive-deps

  const budgetNum = parseFloat(budget) || 0;

  async function handleSubmit() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) return <SuccessView username={username} />;

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
                      borderColor: contentType === ct.id ? "#185FA5" : "#F3F4F6",
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
                placeholder="Ürününüzü, hedef kitlenizi ve yayıncıdan beklentilerinizi açıklayın. Örn: 'Yeni çıkan FPS oyunumuzu doğal bir şekilde tanıtmasını, en az 30 saniye ürünü göstermesini istiyoruz.'"
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
                placeholder="Örn: Rakip marka adı geçmesin, belirli bir müzik kullanılsın, video açıklamasına link eklensin…"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/20 resize-none"
              />
            </div>

            {/* Mobile: submit button */}
            <div className="lg:hidden">
              <SummaryCard
                username={username}
                selected={selected}
                budget={budgetNum}
                onSubmit={handleSubmit}
                loading={loading}
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
                onSubmit={handleSubmit}
                loading={loading}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
