"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

const CATEGORIES = [
  { label: "Oyun Yayıncıları",       emoji: "🎮", slug: "oyun"        },
  { label: "Futbol Editörleri",       emoji: "⚽", slug: "futbol"      },
  { label: "Mizah / Caps",            emoji: "😂", slug: "mizah"       },
  { label: "Influencer & Fenomenler", emoji: "🌟", slug: "influencer"  },
  { label: "Müzik",                   emoji: "🎤", slug: "muzik"       },
  { label: "Diğer",                   emoji: "✨", slug: "diger"       },
];

const HOME_NAV = (
  <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
    <a href="#nasil-calisir" className="hover:text-[#185FA5] transition-colors">Nasıl çalışır</a>
    <a href="/search"        className="hover:text-[#185FA5] transition-colors">Yayıncılar</a>
    <a href="/register"      className="hover:text-[#185FA5] transition-colors">Fiyatlar</a>
  </nav>
);

type Role = "yayinci" | "marka" | null;

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [role,     setRole]     = useState<Role>(null);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      setLoggedIn(!!session);
      if (!session?.user) return;
      const metaRole = session.user.user_metadata?.role as Role;
      if (metaRole) setRole(metaRole);
      const { data } = await supabase.from("profiles").select("role").eq("id", session.user.id).maybeSingle();
      if (data?.role) setRole(data.role as Role);
    }

    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session);
      if (!session) { setRole(null); return; }
      const metaRole = session.user.user_metadata?.role as Role;
      if (metaRole) setRole(metaRole);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">

      <Navbar navLinks={HOME_NAV} />

      {/* HERO */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #E6F1FB 0%, #ffffff 60%)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36 text-center">
          <span
            className="inline-block text-xs font-semibold uppercase tracking-widest rounded-full px-4 py-1.5 mb-6"
            style={{ backgroundColor: "#E6F1FB", color: "#185FA5" }}
          >
            Türkiye&apos;nin ilk anonim influencer pazaryeri
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight mb-6" style={{ color: "#042C53" }}>
            Doğru sponsor,<br />
            <span style={{ color: "#185FA5" }}>doğru fiyata.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-600 mb-10 leading-relaxed">
            Markalar ve yayıncılar anonim olarak buluşur, şeffaf fiyatlarla anlaşır.
            Ne kimliğin ifşa olur, ne de zaman kaybedersin.
          </p>
          {/* CTA — role-aware */}
          {role === "yayinci" ? (
            <div className="flex justify-center">
              <a
                href="/profile/edit"
                className="inline-flex items-center justify-center gap-2 text-base font-semibold rounded-xl px-8 py-4 border-2 transition-all hover:-translate-y-0.5"
                style={{ borderColor: "#185FA5", color: "#185FA5", backgroundColor: "white" }}
              >
                Profilimi Güncelle
              </a>
            </div>
          ) : role === "marka" ? (
            <div className="flex justify-center">
              <a
                href="/search"
                className="inline-flex items-center justify-center gap-2 text-base font-semibold text-white rounded-xl px-8 py-4 shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
                style={{ backgroundColor: "#185FA5" }}
              >
                Sponsor Bul
              </a>
            </div>
          ) : (
            /* Not logged in — two role cards */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto w-full">

              {/* Marka */}
              <div className="flex flex-col items-center gap-3 rounded-2xl border-2 p-6 bg-white text-center transition-all hover:shadow-lg hover:-translate-y-1" style={{ borderColor: "#185FA5" }}>
                <span className="text-4xl">🏢</span>
                <div>
                  <h3 className="text-base font-extrabold mb-1" style={{ color: "#042C53" }}>Marka mısın?</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">Doğru yayıncıyı bul, kampanyanı başlat</p>
                </div>
                <a
                  href="/register?role=marka"
                  className="w-full rounded-xl py-2.5 text-sm font-semibold text-white text-center transition-all hover:opacity-90"
                  style={{ backgroundColor: "#185FA5" }}
                >
                  Marka Hesabı Oluştur
                </a>
              </div>

              {/* Yayıncı */}
              <div className="flex flex-col items-center gap-3 rounded-2xl border-2 p-6 bg-white text-center transition-all hover:shadow-lg hover:-translate-y-1" style={{ borderColor: "#E5E7EB" }}>
                <span className="text-4xl">🎬</span>
                <div>
                  <h3 className="text-base font-extrabold mb-1" style={{ color: "#042C53" }}>Yayıncı mısın?</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">Markalardan sponsorluk teklifi al, para kazan</p>
                </div>
                <a
                  href="/register?role=yayinci"
                  className="w-full rounded-xl py-2.5 text-sm font-semibold text-center border-2 transition-all hover:bg-[#EBF4FF]"
                  style={{ borderColor: "#185FA5", color: "#185FA5" }}
                >
                  Yayıncı Hesabı Oluştur
                </a>
              </div>

            </div>
          )}
        </div>
        {/* decorative blur */}
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-30 blur-3xl pointer-events-none" style={{ backgroundColor: "#185FA5" }} />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ backgroundColor: "#042C53" }} />
      </section>

      {/* PLATFORM BANDI */}
      <section className="border-y border-gray-100 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 mb-5">Desteklenen platformlar</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
            {[
              { name: "X (Twitter)", icon: "𝕏" },
              { name: "Instagram",   icon: "📸" },
              { name: "TikTok",      icon: "🎵" },
              { name: "YouTube",     icon: "▶"  },
              { name: "Kick",        icon: "🟢" },
              { name: "Twitch",      icon: "💜" },
            ].map((p) => (
              <div key={p.name} className="flex items-center gap-2 text-gray-500 hover:text-[#185FA5] transition-colors cursor-default">
                <span className="text-xl">{p.icon}</span>
                <span className="text-sm font-semibold">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NASIL ÇALIŞIR */}
      <section id="nasil-calisir" className="py-20 md:py-28" style={{ backgroundColor: "#E6F1FB" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: "#042C53" }}>Nasıl çalışır?</h2>
            <p className="text-gray-600 text-lg max-w-xl mx-auto">Üç adımda sponsorluk sürecini tamamla.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Filtrele",
                desc: "Platform, kategori, bütçe ve kitle büyüklüğüne göre sana uygun yayıncıları ya da markaları filtrele.",
              },
              {
                step: "02",
                title: "Anlaş",
                desc: "Anonim mesajlaşma ile fiyat müzakeresi yap. Kimlik bilgileri yalnızca anlaşma tamamlandıktan sonra paylaşılır.",
              },
              {
                step: "03",
                title: "Yayınla",
                desc: "Escrow ile güvende olan ödeme, içerik yayınlandıktan sonra otomatik serbest bırakılır.",
              },
            ].map((item) => (
              <div key={item.step} className="relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div
                  className="text-5xl font-black mb-4 leading-none"
                  style={{ color: "#E6F1FB", WebkitTextStroke: `2px #185FA5` }}
                >
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: "#042C53" }}>{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KATEGORİLER */}
      <section id="yayincilar" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: "#042C53" }}>Kategoriler</h2>
            <p className="text-gray-600 text-lg max-w-xl mx-auto">Her nişten yayıncı, her bütçeye uygun sponsor.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((cat) => (
              <a
                key={cat.label}
                href={`/search?category=${cat.slug}`}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-transparent transition-all hover:-translate-y-1 hover:shadow-md"
                style={{ backgroundColor: "#E6F1FB" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#185FA5"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "transparent"; }}
              >
                <span className="text-4xl">{cat.emoji}</span>
                <span className="text-sm font-semibold text-center leading-snug" style={{ color: "#042C53" }}>{cat.label}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FARKIMIZ */}
      <section className="py-20 md:py-28" style={{ backgroundColor: "#042C53" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-white">Neden Sponsorum?</h2>
            <p className="text-blue-200 text-lg max-w-xl mx-auto">Sponsorluk sürecini güvenli, şeffaf ve hızlı yapıyoruz.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "🔒",
                title: "Escrow Ödeme",
                desc: "Ödeme, içerik onaylanana kadar güvende tutulur. Ne marka para kaybeder, ne de yayıncı.",
              },
              {
                icon: "📄",
                title: "Otomatik Sözleşme",
                desc: "Her anlaşmada otomatik dijital sözleşme oluşturulur. Avukata gerek yok, imzalar anında.",
              },
              {
                icon: "📊",
                title: "Gerçek Veri",
                desc: "Takipçi sayısı değil, gerçek erişim ve etkileşim verileriyle karar ver. Sahte hesap yok.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl p-8 border border-blue-800 hover:border-blue-500 transition-colors"
                style={{ backgroundColor: "rgba(24, 95, 165, 0.15)" }}
              >
                <div className="text-4xl mb-5">{item.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-blue-200 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANDI */}
      <section className="py-20 md:py-24" style={{ backgroundColor: "#E6F1FB" }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: "#042C53" }}>
            {role === "yayinci"
              ? "Profilini tamamla, markalarla buluş."
              : role === "marka"
                ? "Doğru yayıncıyı bul, kampanyanı başlat."
                : "Hemen başla, ücretsiz dene."}
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            {role === "yayinci"
              ? "Profilini güçlendir ve sponsorluk tekliflerini almaya başla."
              : role === "marka"
                ? "Binlerce anonim yayıncı arasından markanıza uygun olanı hemen keşfet."
                : "Kayıt ol, profilini oluştur ve ilk sponsorluk teklifini al."}
          </p>
          <a
            href={role === "yayinci" ? "/profile/edit" : role === "marka" ? "/search" : "/register"}
            className="inline-flex items-center justify-center text-base font-semibold text-white rounded-xl px-10 py-4 shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
            style={{ backgroundColor: "#185FA5" }}
          >
            {role === "yayinci" ? "Profilime Git →" : role === "marka" ? "Yayıncı Ara →" : "Ücretsiz Hesap Oluştur →"}
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-gray-400">© 2026 Sponsorum. Tüm hakları saklıdır.</span>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <a href="/kullanim-sartlari"   className="hover:text-[#185FA5] transition-colors">Kullanım Şartları</a>
            <a href="/gizlilik-politikasi" className="hover:text-[#185FA5] transition-colors">Gizlilik</a>
            <a href="/kvkk"                className="hover:text-[#185FA5] transition-colors">KVKK</a>
            <a href="/cerez-politikasi"    className="hover:text-[#185FA5] transition-colors">Çerezler</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
