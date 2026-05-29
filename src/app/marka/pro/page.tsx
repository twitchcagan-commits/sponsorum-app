"use client";

import Navbar from "@/components/Navbar";

const BENEFITS = [
  "Tüm yayıncı profillerini tam olarak görüntüle",
  "Gerçek takipçi sayıları ve istatistiklere eriş",
  "Fiyat listelerini gör ve karşılaştır",
  "Yayıncılara teklif gönder ve yönet",
  "Anonim mesajlaşma ile iletişim kur",
  "Öncelikli müşteri desteği",
];

export default function MarkaProPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">

        {/* Header */}
        <div className="text-center mb-10">
          <span
            className="inline-block text-xs font-bold uppercase tracking-widest rounded-full px-4 py-1.5 mb-4"
            style={{ backgroundColor: "#E6F1FB", color: "#185FA5" }}
          >
            Marka Pro
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3" style={{ color: "#042C53" }}>
            Doğru yayıncıyı bul,<br />kampanyanı başlat.
          </h1>
          <p className="text-gray-500 text-base">
            Tüm yayıncı profillerine tam erişim, fiyatlar ve teklif gönderme.
          </p>
        </div>

        {/* Pricing card */}
        <div className="bg-white rounded-2xl border-2 shadow-sm overflow-hidden mb-6" style={{ borderColor: "#185FA5" }}>

          {/* Price header */}
          <div className="px-8 py-8 text-center" style={{ background: "linear-gradient(135deg, #042C53 0%, #185FA5 100%)" }}>
            <p className="text-blue-200 text-sm font-semibold uppercase tracking-widest mb-2">Aylık Plan</p>
            <div className="flex items-end justify-center gap-1">
              <span className="text-5xl font-black text-white">₺299</span>
              <span className="text-blue-200 text-base mb-1.5">/ay</span>
            </div>
          </div>

          {/* Benefits */}
          <div className="px-8 py-7">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Neler dahil</p>
            <ul className="flex flex-col gap-3 mb-8">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5" style={{ backgroundColor: "#185FA5" }}>
                    ✓
                  </span>
                  {b}
                </li>
              ))}
            </ul>

            {/* CTA — payment not yet available */}
            <button
              disabled
              className="w-full rounded-xl py-4 text-base font-semibold text-white opacity-60 cursor-not-allowed"
              style={{ backgroundColor: "#185FA5" }}
            >
              Yakında — Ödeme sistemi hazırlanıyor
            </button>

            <p className="text-center text-xs text-gray-400 mt-3">
              Ödeme altyapısı en kısa sürede aktif olacak. Hazır olduğunda bildirim alırsın.
            </p>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center">
          <a href="/dashboard" className="text-sm font-semibold hover:underline" style={{ color: "#185FA5" }}>
            ← Dashboard&apos;a Dön
          </a>
        </div>

      </div>
    </div>
  );
}
