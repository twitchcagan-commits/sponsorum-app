"use client";

import { useParams } from "next/navigation";

// ─── Mock data ────────────────────────────────────────────────────────────────

const PROFILE = {
  username: "gamerturk",
  displayName: "Burak K.",
  initials: "BK",
  niche: "Oyun",
  bio: "Türkiye'nin önde gelen oyun yayıncılarından biri. FPS, RPG ve strateji oyunları üzerine içerikler üretiyorum. Markalarla uzun vadeli ve dürüst iş birlikleri yapmayı tercih ederim.",
  followers: 120000,
  engagement: 8.2,
  avgViews: 45000,
  deliveryDays: 3,
  dealsCompleted: 12,
  rating: 4.9,
  verifiedPhone: true,
  verifiedEmail: true,
  prices: [
    { type: "Instagram Reels (60 sn)", price: 3500, original: 4500, days: 3, badge: null },
    { type: "Instagram Story", price: 1200, original: 1800, days: 1, badge: null },
    { type: "TikTok Video", price: 2800, original: 3500, days: 3, badge: null },
    { type: "Paket (Reels + Story + TikTok)", price: 6000, original: 8500, days: 5, badge: "🔥 Popüler" },
  ],
  audience: {
    age: [
      { label: "13–17", pct: 20 },
      { label: "18–24", pct: 45 },
      { label: "25–34", pct: 35 },
    ],
    gender: [
      { label: "Erkek", pct: 72 },
      { label: "Kadın", pct: 28 },
    ],
    location: [
      { label: "Türkiye", pct: 85 },
      { label: "Diğer", pct: 15 },
    ],
  },
  tags: ["Oyun", "FPS", "RPG", "Strateji", "Türkçe İçerik", "18–34 Yaş", "Erkek Ağırlıklı"],
  platforms: [
    { name: "YouTube", handle: "@gamerturk", followers: 120000, icon: "▶" },
    { name: "Twitch", handle: "gamerturk", followers: 45000, icon: "💜" },
    { name: "Instagram", handle: "@gamerturk_", followers: 28000, icon: "📸" },
  ],
  works: [
    { title: "Monster Energy İş Birliği", desc: "YouTube entegrasyon video", color: "from-blue-400 to-blue-600" },
    { title: "Razer Türkiye Kampanyası", desc: "TikTok + Instagram Reels", color: "from-green-400 to-emerald-600" },
    { title: "Zynga Mobil Oyun Tanıtımı", desc: "YouTube özel bölüm", color: "from-purple-400 to-purple-600" },
  ],
};

function fmt(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(0) + "K";
  return String(n);
}

function BarRow({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500 w-16 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: "#185FA5" }}
        />
      </div>
      <span className="text-sm font-semibold w-10 text-right" style={{ color: "#042C53" }}>%{pct}</span>
    </div>
  );
}

export default function ProfilePage() {
  const params = useParams();
  const username = (params?.username as string) ?? PROFILE.username;
  const data = PROFILE; // In production, fetch by username

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <a href="/" className="text-2xl font-extrabold tracking-tight" style={{ color: "#185FA5" }}>
            Sponsorum
          </a>
          <div className="flex items-center gap-3">
            <a href="/search" className="text-sm font-medium text-gray-500 hover:text-[#185FA5] transition-colors">
              ← Aramaya Dön
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">

        {/* ── Cover + Avatar ── */}
        <div className="relative mb-16">
          {/* Cover banner */}
          <div
            className="h-44 sm:h-56 rounded-b-3xl"
            style={{ background: "linear-gradient(135deg, #042C53 0%, #185FA5 60%, #4a9fd4 100%)" }}
          >
            {/* subtle pattern */}
            <div className="absolute inset-0 rounded-b-3xl opacity-10"
              style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          </div>

          {/* Avatar */}
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
                @{username}
              </h1>
              <span
                className="text-xs font-bold rounded-full px-3 py-1"
                style={{ backgroundColor: "#E6F1FB", color: "#185FA5" }}
              >
                {data.niche}
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-3">{data.displayName}</p>

            {/* Verified badges */}
            <div className="flex flex-wrap gap-2">
              {data.verifiedPhone && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1">
                  ✓ Telefon Doğrulandı
                </span>
              )}
              {data.verifiedEmail && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1">
                  ✓ E-posta Doğrulandı
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-1">
                ✓ {data.dealsCompleted} Anlaşma Tamamlandı
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-2.5 py-1">
                ⭐ {data.rating} Puan
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 flex-shrink-0 sm:pt-1">
            <button
              className="rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 hover:shadow-lg active:scale-[0.98]"
              style={{ backgroundColor: "#185FA5" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#042C53")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#185FA5")}
            >
              Teklif Gönder
            </button>
            <button
              className="rounded-xl px-5 py-3 text-sm font-semibold border-2 transition-all hover:bg-gray-50 active:scale-[0.98]"
              style={{ borderColor: "#185FA5", color: "#185FA5" }}
            >
              Mesaj
            </button>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Toplam Takipçi", value: fmt(data.followers), icon: "👥" },
            { label: "Etkileşim Oranı", value: `%${data.engagement}`, icon: "📈" },
            { label: "Ortalama İzlenme", value: fmt(data.avgViews), icon: "👁️" },
            { label: "Teslimat Süresi", value: `${data.deliveryDays} gün`, icon: "⚡" },
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
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-extrabold mb-5" style={{ color: "#042C53" }}>Fiyat Listesi</h2>
              <div className="flex flex-col divide-y divide-gray-50">
                {data.prices.map((item) => (
                  <div key={item.type} className="flex items-center justify-between py-4 first:pt-0 last:pb-0 gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-800">{item.type}</span>
                        {item.badge && (
                          <span className="text-xs font-bold rounded-full px-2 py-0.5" style={{ backgroundColor: "#FFF3E0", color: "#E65100" }}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">{item.days} günde teslim</span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-base font-extrabold" style={{ color: "#042C53" }}>
                        ₺{item.price.toLocaleString("tr-TR")}
                      </div>
                      <div className="text-xs text-gray-400 line-through">
                        ₺{item.original.toLocaleString("tr-TR")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-extrabold mb-3" style={{ color: "#042C53" }}>Hakkında</h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{data.bio}</p>
              <div className="flex flex-wrap gap-2">
                {data.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-semibold rounded-full px-3 py-1"
                    style={{ backgroundColor: "#E6F1FB", color: "#185FA5" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Sample works */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-extrabold mb-5" style={{ color: "#042C53" }}>Örnek Çalışmalar</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {data.works.map((work) => (
                  <div key={work.title} className="rounded-xl overflow-hidden border border-gray-100">
                    <div className={`h-28 bg-gradient-to-br ${work.color} flex items-center justify-center`}>
                      <span className="text-white text-4xl opacity-50">▶</span>
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-bold text-gray-800 mb-0.5 truncate">{work.title}</p>
                      <p className="text-xs text-gray-400">{work.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ── Right column ── */}
          <div className="flex flex-col gap-6">

            {/* Audience */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-extrabold mb-5" style={{ color: "#042C53" }}>Hedef Kitle</h2>

              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Yaş</p>
              <div className="flex flex-col gap-2 mb-5">
                {data.audience.age.map((a) => <BarRow key={a.label} {...a} />)}
              </div>

              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Cinsiyet</p>
              <div className="flex flex-col gap-2 mb-5">
                {data.audience.gender.map((g) => <BarRow key={g.label} {...g} />)}
              </div>

              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Konum</p>
              <div className="flex flex-col gap-2">
                {data.audience.location.map((l) => <BarRow key={l.label} {...l} />)}
              </div>
            </div>

            {/* Connected platforms */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-extrabold mb-4" style={{ color: "#042C53" }}>Bağlı Hesaplar</h2>
              <div className="flex flex-col gap-3">
                {data.platforms.map((p) => (
                  <div key={p.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{p.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.handle}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold" style={{ color: "#185FA5" }}>{fmt(p.followers)}</span>
                  </div>
                ))}
              </div>
            </div>

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
    </div>
  );
}
