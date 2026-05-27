import React from "react";

export const metadata = {
  title: "Çerez Politikası | Sponsorum",
  description: "Sponsorum platformu çerez kullanımı ve yönetimi hakkında bilgilendirme.",
};

const TOC = [
  { id: "nedir",      label: "1. Çerez Nedir?" },
  { id: "zorunlu",   label: "2. Zorunlu Çerezler" },
  { id: "analitik",  label: "3. Analitik Çerezler" },
  { id: "tercih",    label: "4. Tercih Çerezleri" },
  { id: "uc-taraf",  label: "5. Üçüncü Taraf Çerezleri" },
  { id: "yonetim",   label: "6. Çerez Yönetimi" },
  { id: "iletisim",  label: "7. İletişim" },
];

const MANDATORY_COOKIES = [
  {
    name: "sb-access-token",
    provider: "Supabase",
    purpose: "Kullanıcı oturum kimlik doğrulaması. Güvenli giriş durumunu korur.",
    duration: "Oturum süresi",
    type: "Zorunlu",
  },
  {
    name: "sb-refresh-token",
    provider: "Supabase",
    purpose: "Oturum yenileme için kullanılan güvenli token.",
    duration: "7 gün",
    type: "Zorunlu",
  },
  {
    name: "__Host-next-auth.csrf-token",
    provider: "Next.js",
    purpose: "Cross-Site Request Forgery (CSRF) saldırılarına karşı koruma.",
    duration: "Oturum süresi",
    type: "Zorunlu",
  },
  {
    name: "next-locale",
    provider: "Sponsorum",
    purpose: "Kullanıcının dil tercihini saklar.",
    duration: "1 yıl",
    type: "Zorunlu",
  },
];

const ANALYTICS_COOKIES = [
  {
    name: "_ga",
    provider: "Google Analytics",
    purpose: "Kullanıcıları ayırt etmek için kullanılır. Anonim kullanım istatistikleri toplanır.",
    duration: "2 yıl",
    type: "Analitik",
  },
  {
    name: "_ga_*",
    provider: "Google Analytics",
    purpose: "Oturum durumunu korur.",
    duration: "2 yıl",
    type: "Analitik",
  },
  {
    name: "_vercel_insights",
    provider: "Vercel",
    purpose: "Sayfa performans metrikleri (anonim, kişisel veri içermez).",
    duration: "Oturum süresi",
    type: "Analitik",
  },
];

const PREFERENCE_COOKIES = [
  {
    name: "sp-theme",
    provider: "Sponsorum",
    purpose: "Koyu/açık tema tercihini saklar.",
    duration: "1 yıl",
    type: "Tercih",
  },
  {
    name: "sp-cookie-consent",
    provider: "Sponsorum",
    purpose: "Kullanıcının çerez tercih kararını saklar (kabul/red).",
    duration: "1 yıl",
    type: "Tercih",
  },
  {
    name: "sp-sidebar-state",
    provider: "Sponsorum",
    purpose: "Kenar çubuğu açık/kapalı tercihini saklar.",
    duration: "30 gün",
    type: "Tercih",
  },
];

function CookieTable({ cookies }: { cookies: typeof MANDATORY_COOKIES }) {
  return (
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr style={{ backgroundColor: "#E6F1FB" }}>
            <th className="text-left px-3 py-2 font-bold text-gray-700 border border-gray-200">Çerez Adı</th>
            <th className="text-left px-3 py-2 font-bold text-gray-700 border border-gray-200">Sağlayıcı</th>
            <th className="text-left px-3 py-2 font-bold text-gray-700 border border-gray-200">Amaç</th>
            <th className="text-left px-3 py-2 font-bold text-gray-700 border border-gray-200 whitespace-nowrap">Süre</th>
          </tr>
        </thead>
        <tbody>
          {cookies.map((c) => (
            <tr key={c.name} className="border-b border-gray-100">
              <td className="px-3 py-2 font-mono text-xs text-gray-800 border border-gray-200">{c.name}</td>
              <td className="px-3 py-2 text-gray-600 border border-gray-200 whitespace-nowrap">{c.provider}</td>
              <td className="px-3 py-2 text-gray-600 border border-gray-200">{c.purpose}</td>
              <td className="px-3 py-2 text-gray-600 border border-gray-200 whitespace-nowrap">{c.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CerezPolitikasiPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-16">
          <a href="/" className="text-2xl font-extrabold tracking-tight" style={{ color: "#185FA5" }}>
            Sponsorum
          </a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-10">

          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:sticky lg:top-8">
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#185FA5" }}>İçindekiler</p>
              <nav className="flex flex-col gap-1.5">
                {TOC.map((item) => (
                  <a key={item.id} href={`#${item.id}`} className="text-sm text-gray-500 hover:text-[#185FA5] transition-colors leading-snug">
                    {item.label}
                  </a>
                ))}
              </nav>

              <div className="mt-6 pt-5 border-t border-gray-100 space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Çerez Türleri</p>
                {[
                  { label: "Zorunlu", color: "#185FA5", bg: "#E6F1FB" },
                  { label: "Analitik", color: "#7C3AED", bg: "#EDE9FE" },
                  { label: "Tercih", color: "#059669", bg: "#D1FAE5" },
                ].map(({ label, color, bg }) => (
                  <span key={label} className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-2.5 py-1 mr-1" style={{ backgroundColor: bg, color }}>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 sm:p-10">

              <div className="mb-8 pb-6 border-b border-gray-100">
                <h1 className="text-3xl font-extrabold mb-2" style={{ color: "#042C53" }}>Çerez Politikası</h1>
                <p className="text-sm text-gray-400">Son güncellenme: 27 Mayıs 2026</p>
              </div>

              {/* 1 */}
              <section id="nedir" className="mb-10">
                <h2 className="text-xl font-extrabold mb-4" style={{ color: "#042C53" }}>1. Çerez Nedir?</h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  Çerezler (cookies), bir web sitesini ziyaret ettiğinizde tarayıcınız tarafından cihazınıza kaydedilen küçük metin dosyalarıdır. Çerezler; oturum yönetimi, tercihlerinizin hatırlanması ve anonim kullanım analitiği gibi amaçlarla kullanılır.
                </p>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  Sponsorum, yalnızca aşağıda açıklanan amaçlar için çerez kullanmaktadır. Zorunlu çerezler, Platformun çalışması için teknik olarak gereklidir ve devre dışı bırakılamaz. Analitik ve tercih çerezleri için tarayıcı ayarlarınızdan veya tercih merkezimizden onay vermeniz istenir.
                </p>
                <div className="rounded-xl border border-blue-100 p-4 text-sm text-blue-700 leading-relaxed" style={{ backgroundColor: "#EFF6FF" }}>
                  💡 <strong>KVKK ve ePrivacy uyumu:</strong> Sponsorum, zorunlu çerezler dışındaki tüm çerezleri yalnızca açık onayınız doğrultusunda aktif hâle getirmektedir. Onayınızı istediğiniz zaman geri çekme hakkınız saklıdır.
                </div>
              </section>

              {/* 2 */}
              <section id="zorunlu" className="mb-10">
                <h2 className="text-xl font-extrabold mb-3" style={{ color: "#042C53" }}>2. Zorunlu Çerezler</h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  Bu çerezler, Platformun temel işlevlerinin çalışması için zorunludur. Devre dışı bırakılmaları platforma erişimi ve oturum işlemlerini engeller. Açık onay gerektirmez; KVKK ve ePrivacy direktifi kapsamında meşru menfaat hukuki sebebine dayanır.
                </p>
                <CookieTable cookies={MANDATORY_COOKIES} />
              </section>

              {/* 3 */}
              <section id="analitik" className="mb-10">
                <h2 className="text-xl font-extrabold mb-3" style={{ color: "#042C53" }}>3. Analitik Çerezler</h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  Analitik çerezler, platformun nasıl kullanıldığını anlamamıza yardımcı olur. Toplanan tüm veriler anonim hâle getirilir; hiçbir veri sizi doğrudan tanımlamak için kullanılmaz. Bu çerezlerin aktif olması için <strong>açık onayınız</strong> gerekmektedir.
                </p>
                <CookieTable cookies={ANALYTICS_COOKIES} />
                <div className="rounded-xl border border-purple-100 p-4 text-sm text-purple-700" style={{ backgroundColor: "#F5F3FF" }}>
                  <strong>Google Analytics:</strong> Veriler, Google LLC sunucularına aktarılmaktadır. Google ile imzaladığımız Veri İşleme Sözleşmesi (DPA) ve Standart Sözleşme Maddeleri (SCCs) kapsamında GDPR uyumluluğu sağlanmaktadır. IP anonimleştirme aktif durumdadır.
                </div>
              </section>

              {/* 4 */}
              <section id="tercih" className="mb-10">
                <h2 className="text-xl font-extrabold mb-3" style={{ color: "#042C53" }}>4. Tercih Çerezleri</h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  Tercih çerezleri, Platform deneyiminizi kişiselleştirmek için kullanılır. Tema seçimi ve kenar çubuğu durumu gibi tercihlerinizi hatırlar. Bu çerezler yalnızca Sponsorum tarafından kullanılır ve herhangi bir üçüncü tarafla paylaşılmaz.
                </p>
                <CookieTable cookies={PREFERENCE_COOKIES} />
              </section>

              {/* 5 */}
              <section id="uc-taraf" className="mb-10">
                <h2 className="text-xl font-extrabold mb-4" style={{ color: "#042C53" }}>5. Üçüncü Taraf Çerezleri</h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  Sponsorum, aşağıdaki üçüncü taraf hizmetleriyle entegrasyonlar nedeniyle bu taraflara ait çerezler cihazınıza yerleştirilebilir:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse mb-4">
                    <thead>
                      <tr style={{ backgroundColor: "#E6F1FB" }}>
                        <th className="text-left px-4 py-2 font-bold text-gray-700 border border-gray-200">Taraf</th>
                        <th className="text-left px-4 py-2 font-bold text-gray-700 border border-gray-200">Kullanım Amacı</th>
                        <th className="text-left px-4 py-2 font-bold text-gray-700 border border-gray-200">Gizlilik Politikası</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Google LLC", "Analitik ve performans ölçümü", "policies.google.com/privacy"],
                        ["iyzico Ödeme Hizmetleri A.Ş.", "Ödeme sayfası entegrasyonu", "iyzico.com/gizlilik-politikasi"],
                        ["Vercel Inc.", "Barındırma altyapısı ve performans analitiği", "vercel.com/legal/privacy-policy"],
                      ].map(([a, b, c]) => (
                        <tr key={a} className="border-b border-gray-100">
                          <td className="px-4 py-2 font-semibold text-gray-800 border border-gray-200">{a}</td>
                          <td className="px-4 py-2 text-gray-600 border border-gray-200">{b}</td>
                          <td className="px-4 py-2 border border-gray-200">
                            <span className="text-xs text-gray-500 font-mono">{c}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Üçüncü taraf çerezleri hakkında Sponsorum'un kontrolü sınırlıdır. İlgili tarafların gizlilik politikalarını incelemenizi öneririz.
                </p>
              </section>

              {/* 6 */}
              <section id="yonetim" className="mb-10">
                <h2 className="text-xl font-extrabold mb-4" style={{ color: "#042C53" }}>6. Çerez Yönetimi</h2>

                <h3 className="text-sm font-bold mb-2 text-gray-700">6.1 Tarayıcı Ayarları</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  Tüm modern tarayıcılar, çerezleri yönetmenize olanak tanır. Aşağıdaki linklerden tarayıcınıza özel rehbere erişebilirsiniz:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
                  {[
                    "Google Chrome",
                    "Mozilla Firefox",
                    "Apple Safari",
                    "Microsoft Edge",
                    "Opera",
                    "Samsung Internet",
                  ].map((b) => (
                    <div key={b} className="rounded-xl border border-gray-100 px-3 py-2 text-xs font-medium text-gray-600 text-center" style={{ backgroundColor: "#F8FAFC" }}>
                      {b}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  Not: Zorunlu çerezleri devre dışı bırakmanız, oturum açma ve platforma erişim gibi temel işlevleri bozabilir.
                </p>

                <h3 className="text-sm font-bold mb-2 text-gray-700">6.2 Onay Yönetimi</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  Platform üzerindeki çerez tercih merkezine erişmek için sayfanın alt kısmındaki <strong>"Çerez Tercihleri"</strong> bağlantısını kullanabilirsiniz. Tercihlerinizi her zaman güncelleyebilir veya geri çekebilirsiniz. Geri çekme işlemi geriye dönük olarak uygulanamaz; yalnızca gelecekteki veri toplamayı etkiler.
                </p>

                <h3 className="text-sm font-bold mb-2 text-gray-700">6.3 Google Analytics Opt-Out</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Google Analytics takibinden çıkmak için Google'ın resmi tarayıcı eklentisini kullanabilirsiniz: <span className="font-mono text-xs text-gray-500">tools.google.com/dlpage/gaoptout</span>
                </p>
              </section>

              {/* 7 */}
              <section id="iletisim" className="mb-4">
                <h2 className="text-xl font-extrabold mb-4" style={{ color: "#042C53" }}>7. İletişim</h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Çerez politikamız hakkında sorularınız için <strong>kvkk@sponsorum.com.tr</strong> adresine ulaşabilirsiniz. Bu politika; yasal düzenlemeler veya teknolojik değişiklikler doğrultusunda güncellenebilir.
                </p>
              </section>

            </div>
          </main>
        </div>
      </div>

      <footer className="py-6 border-t border-gray-100 bg-white mt-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-gray-400">© 2026 Sponsorum. Tüm hakları saklıdır.</span>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <a href="/kullanim-sartlari" className="hover:text-[#185FA5] transition-colors">Kullanım Şartları</a>
            <a href="/gizlilik-politikasi" className="hover:text-[#185FA5] transition-colors">Gizlilik</a>
            <a href="/kvkk" className="hover:text-[#185FA5] transition-colors">KVKK</a>
            <a href="/cerez-politikasi" className="hover:text-[#185FA5] transition-colors font-semibold" style={{ color: "#185FA5" }}>Çerezler</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
