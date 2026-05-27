import React from "react";

export const metadata = {
  title: "Kullanım Şartları | Sponsorum",
  description: "Sponsorum platformu kullanım şartları ve koşulları.",
};

const TOC = [
  { id: "taraflar",      label: "1. Taraflar ve Tanımlar" },
  { id: "uyelik",        label: "2. Platforma Üyelik Şartları" },
  { id: "yayinci",       label: "3. Yayıncı Yükümlülükleri" },
  { id: "marka",         label: "4. Marka Yükümlülükleri" },
  { id: "komisyon",      label: "5. Komisyon ve Ödeme Şartları" },
  { id: "anlasma",       label: "6. Anlaşma Süreci" },
  { id: "anlaşmazlık",   label: "7. Anlaşmazlık Çözümü" },
  { id: "yasakli",       label: "8. Yasaklı Kategoriler ve İçerikler" },
  { id: "hesap",         label: "9. Hesap Askıya Alma ve Kapatma" },
  { id: "sorumluluk",    label: "10. Sorumluluk Sınırlaması" },
  { id: "fikri",         label: "11. Fikri Mülkiyet" },
  { id: "degisiklik",    label: "12. Değişiklik Hakkı" },
  { id: "cayma",         label: "13. Cayma Hakkı" },
  { id: "hukuk",         label: "14. Uygulanacak Hukuk ve Yetki" },
  { id: "iletisim",      label: "15. İletişim" },
];

export default function KullanimSartlariPage() {
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

          {/* TOC sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:sticky lg:top-8">
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#185FA5" }}>İçindekiler</p>
              <nav className="flex flex-col gap-1.5">
                {TOC.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="text-sm text-gray-500 hover:text-[#185FA5] transition-colors leading-snug"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 sm:p-10">

              <div className="mb-8 pb-6 border-b border-gray-100">
                <h1 className="text-3xl font-extrabold mb-2" style={{ color: "#042C53" }}>Kullanım Şartları</h1>
                <p className="text-sm text-gray-400">Son güncellenme: 27 Mayıs 2026 · Yürürlük tarihi: 27 Mayıs 2026</p>
              </div>

              <div className="prose-legal">

                <p className="text-sm text-gray-600 leading-relaxed mb-8">
                  Bu Kullanım Şartları ("Sözleşme"), <strong>Sponsorum</strong> platformunu ("Platform") kullanan tüm gerçek ve tüzel kişiler ("Kullanıcı") ile Platform operatörü arasındaki hukuki ilişkiyi düzenlemektedir. Platforma kaydolarak veya Platformu kullanarak bu Sözleşme'nin tamamını okuduğunuzu, anladığınızı ve kabul ettiğinizi beyan etmiş olursunuz.
                </p>

                {/* 1 */}
                <section id="taraflar" className="mb-10">
                  <h2 className="text-xl font-extrabold mb-4" style={{ color: "#042C53" }}>1. Taraflar ve Tanımlar</h2>

                  <h3 className="text-sm font-bold mb-2 text-gray-700">1.1 Taraflar</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Bu Sözleşme; Platform operatörü olarak <strong>Sponsorum</strong> (bundan böyle "Sponsorum", "biz" veya "platform" olarak anılacaktır) ile Platforma kayıtlı <strong>Yayıncılar</strong> ve <strong>Markalar</strong> arasında akdedilmiştir.
                  </p>

                  <h3 className="text-sm font-bold mb-2 text-gray-700">1.2 Tanımlar</h3>
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr style={{ backgroundColor: "#E6F1FB" }}>
                          <th className="text-left px-4 py-2 font-bold text-gray-700 border border-gray-200">Terim</th>
                          <th className="text-left px-4 py-2 font-bold text-gray-700 border border-gray-200">Tanım</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ["Platform", "Sponsorum web sitesi ve mobil uygulaması (sponsorum.com.tr ve alt domainleri)"],
                          ["Yayıncı", "Platform üzerinde içerik üreticisi olarak kayıtlı gerçek kişiler"],
                          ["Marka", "Platform üzerinde sponsorluk teklifi veren gerçek veya tüzel kişiler"],
                          ["Teklif", "Markanın bir Yayıncıya gönderdiği ücretli işbirliği önerisi"],
                          ["Anlaşma", "Yayıncı tarafından kabul edilen ve ödemenin escrow'a alındığı işbirliği"],
                          ["Escrow", "Sponsorum'un anlaşma bedelini teslimata kadar güvence altında tuttuğu sistem"],
                          ["İçerik", "Yayıncı tarafından anlaşma kapsamında üretilen reklam içeriği"],
                          ["Komisyon", "Her anlaşmadan Sponsorum'a ödenen %15 platform hizmet bedeli"],
                        ].map(([t, d]) => (
                          <tr key={t} className="border-b border-gray-100">
                            <td className="px-4 py-2 font-semibold text-gray-800 border border-gray-200 whitespace-nowrap">{t}</td>
                            <td className="px-4 py-2 text-gray-600 border border-gray-200">{d}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* 2 */}
                <section id="uyelik" className="mb-10">
                  <h2 className="text-xl font-extrabold mb-4" style={{ color: "#042C53" }}>2. Platforma Üyelik Şartları</h2>

                  <h3 className="text-sm font-bold mb-2 text-gray-700">2.1 Genel Şartlar</h3>
                  <ul className="list-disc list-outside ml-5 text-sm text-gray-600 leading-relaxed mb-4 space-y-1">
                    <li>18 yaşını doldurmuş olmak veya yasal temsilci onayına sahip olmak</li>
                    <li>Türkiye Cumhuriyeti mevzuatı kapsamında hukuki ehliyete sahip olmak</li>
                    <li>Doğru, eksiksiz ve güncel kayıt bilgileri sağlamak</li>
                    <li>Her gerçek/tüzel kişi yalnızca bir hesap açabilir</li>
                    <li>Hesap bilgilerini üçüncü şahıslarla paylaşmamak</li>
                  </ul>

                  <h3 className="text-sm font-bold mb-2 text-gray-700">2.2 Marka Üyeliği için Ek Şartlar</h3>
                  <ul className="list-disc list-outside ml-5 text-sm text-gray-600 leading-relaxed mb-4 space-y-1">
                    <li>Geçerli bir <strong>vergi kimlik numarası</strong> (VKN) beyan etmek zorunludur</li>
                    <li>Tüzel kişiler için şirket unvanı ve MERSİS numarası gereklidir</li>
                    <li>Sahte veya başkasına ait vergi numarası kullanmak hesabın kalıcı olarak kapatılmasına neden olur ve hukuki işlem başlatılır</li>
                  </ul>

                  <h3 className="text-sm font-bold mb-2 text-gray-700">2.3 Yayıncı Üyeliği için Ek Şartlar</h3>
                  <ul className="list-disc list-outside ml-5 text-sm text-gray-600 leading-relaxed mb-4 space-y-1">
                    <li>En az bir aktif sosyal medya hesabının bağlanması gereklidir</li>
                    <li>Platform tarafından talep edilen istatistik kanıtlarının yüklenmesi zorunludur</li>
                    <li>Profil bilgilerinin doğru ve güncel tutulması yükümlülüğü Yayıncıya aittir</li>
                  </ul>
                </section>

                {/* 3 */}
                <section id="yayinci" className="mb-10">
                  <h2 className="text-xl font-extrabold mb-4" style={{ color: "#042C53" }}>3. Yayıncı Yükümlülükleri</h2>

                  <h3 className="text-sm font-bold mb-2 text-gray-700">3.1 Profil Doğruluğu</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Yayıncılar, profillerinde beyan ettikleri takipçi sayısı, etkileşim oranı, demografik veriler ve istatistiklerin gerçek ve güncel olduğunu kabul eder. Yanıltıcı bilgi paylaşımı, hesabın askıya alınmasına ve elde edilen tüm gelirlerin iadesiyle birlikte hukuki sorumluluk doğurur.
                  </p>

                  <h3 className="text-sm font-bold mb-2 text-gray-700">3.2 Kanıt Yükleme Yükümlülüğü</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Platform, Yayıncıların istatistiklerini doğrulamak amacıyla platform içi analitik ekran görüntüleri talep edebilir. Yayıncılar, talep edilen kanıtları eksiksiz, değiştirilmemiş ve güncel şekilde yüklemekle yükümlüdür. Görsel düzenleme veya sahte kanıt yüklenmesi kalıcı hesap kapatma ve hukuki işlem sebebidir.
                  </p>

                  <h3 className="text-sm font-bold mb-2 text-gray-700">3.3 İçerik Üretim Yükümlülükleri</h3>
                  <ul className="list-disc list-outside ml-5 text-sm text-gray-600 leading-relaxed mb-4 space-y-1">
                    <li>Anlaşma kapsamındaki içeriği teslim tarihinde veya öncesinde üretmek</li>
                    <li>İçeriğin Markanın brief'ine uygun olmasını sağlamak</li>
                    <li>RTÜK, Reklam Kurulu ve ilgili platformların kurallarına uymak</li>
                    <li>Reklamı, RKHK ve Ticari Reklam Yönetmeliği kapsamında açıkça belirtmek ("#reklam", "#işbirliği" etiketleri kullanmak)</li>
                    <li>İçeriği teslimden sonra en az 30 gün boyunca yayında tutmak (aksini anlaşma öngörmedikçe)</li>
                  </ul>

                  <h3 className="text-sm font-bold mb-2 text-gray-700">3.4 Yasaklı Davranışlar</h3>
                  <ul className="list-disc list-outside ml-5 text-sm text-gray-600 leading-relaxed mb-4 space-y-1">
                    <li>Takipçi satın alarak profil istatistiklerini yapay şişirmek</li>
                    <li>Platform dışında anlaşmaya teşvik etmek (commission bypass)</li>
                    <li>Anlaşma onaylandıktan sonra içerik üretmeksizin ödeme talep etmek</li>
                  </ul>
                </section>

                {/* 4 */}
                <section id="marka" className="mb-10">
                  <h2 className="text-xl font-extrabold mb-4" style={{ color: "#042C53" }}>4. Marka Yükümlülükleri</h2>

                  <h3 className="text-sm font-bold mb-2 text-gray-700">4.1 Teklif Gereksinimleri</h3>
                  <ul className="list-disc list-outside ml-5 text-sm text-gray-600 leading-relaxed mb-4 space-y-1">
                    <li>Tekliflerin eksiksiz, açık ve doğru bir brief içermesi zorunludur</li>
                    <li>Teklif edilen ürün veya hizmetin Türkiye'de yasal olarak pazarlanabilir olması şarttır</li>
                    <li>Minimum teklif tutarı <strong>750 TL</strong>'dir; bu tutarın altındaki teklifler sistem tarafından reddedilir</li>
                  </ul>

                  <h3 className="text-sm font-bold mb-2 text-gray-700">4.2 Ödeme Yükümlülüğü</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Markalar, teklif kabul edildiğinde anlaşma bedelini ve platform komisyonunu (%15 KDV hariç) escrow hesabına yatırmakla yükümlüdür. Ödeme yapılmaması durumunda anlaşma otomatik olarak iptal edilir ve Yayıncıya bildirim gönderilir.
                  </p>

                  <h3 className="text-sm font-bold mb-2 text-gray-700">4.3 İçerik Onay Süreci</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Yayıncı içeriği teslim ettiğinde Marka, <strong>48 saat</strong> içinde içeriği inceleyerek kabul veya itirazını Platform üzerinden bildirmelidir. 48 saat içinde herhangi bir işlem yapılmadığı takdirde içerik otomatik olarak onaylanmış sayılır ve escrow'daki ödeme Yayıncıya serbest bırakılır.
                  </p>

                  <h3 className="text-sm font-bold mb-2 text-gray-700">4.4 Yasaklı Davranışlar</h3>
                  <ul className="list-disc list-outside ml-5 text-sm text-gray-600 leading-relaxed mb-4 space-y-1">
                    <li>Platform dışında ödeme yaparak komisyon kaçınmaya çalışmak</li>
                    <li>Anlaşma koşullarına uymayan içerik reddi gerekçesi oluşturmak</li>
                    <li>Yayıncıya taciz, baskı veya tehdit içeren iletişim kurmak</li>
                  </ul>
                </section>

                {/* 5 */}
                <section id="komisyon" className="mb-10">
                  <h2 className="text-xl font-extrabold mb-4" style={{ color: "#042C53" }}>5. Komisyon ve Ödeme Şartları</h2>

                  <h3 className="text-sm font-bold mb-2 text-gray-700">5.1 Platform Komisyonu</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Sponsorum, her başarılı anlaşmadan <strong>%15 platform hizmet komisyonu</strong> tahsil eder. Komisyon, anlaşma tutarı üzerinden hesaplanır ve Marka tarafından ödenir. Yayıncı, anlaşma tutarının tamamını alır; komisyon Markanın ödediği toplam tutardan ayrıca kesilir.
                  </p>

                  <h3 className="text-sm font-bold mb-2 text-gray-700">5.2 Ücretli Abonelikler</h3>
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr style={{ backgroundColor: "#E6F1FB" }}>
                          <th className="text-left px-4 py-2 font-bold text-gray-700 border border-gray-200">Plan</th>
                          <th className="text-left px-4 py-2 font-bold text-gray-700 border border-gray-200">Ücret</th>
                          <th className="text-left px-4 py-2 font-bold text-gray-700 border border-gray-200">Kapsam</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-100">
                          <td className="px-4 py-2 font-semibold text-gray-800 border border-gray-200">Marka Pro</td>
                          <td className="px-4 py-2 text-gray-600 border border-gray-200">299 TL/ay (KDV dahil)</td>
                          <td className="px-4 py-2 text-gray-600 border border-gray-200">Öncelikli arama sıralaması, gelişmiş analitik, sınırsız teklif</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-semibold text-gray-800 border border-gray-200">Yayıncı Gizli Mod</td>
                          <td className="px-4 py-2 text-gray-600 border border-gray-200">199 TL/ay (KDV dahil)</td>
                          <td className="px-4 py-2 text-gray-600 border border-gray-200">Profil arama sonuçlarında gizleme, gelen teklifleri kabul edebilme</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Abonelikler aylık olarak yenilenir. İptal işlemi bir sonraki fatura döneminden itibaren geçerlidir; cari dönem ücreti iade edilmez. Abonelik ücretleri, otomatik ödeme talimatı ile kayıtlı ödeme yönteminizden tahsil edilir.
                  </p>

                  <h3 className="text-sm font-bold mb-2 text-gray-700">5.3 Ödeme Altyapısı</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Ödemeler, PCI-DSS uyumlu <strong>iyzico</strong> ödeme altyapısı üzerinden gerçekleştirilir. Sponsorum, hiçbir kart bilgisini kendi sunucularında saklamaz. Escrow tutarları, iyzico güvencesinde muhafaza edilir ve içerik onayı gerçekleştiğinde anında serbest bırakılır.
                  </p>

                  <h3 className="text-sm font-bold mb-2 text-gray-700">5.4 İade ve İptal</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Yayıncının teslim süresinde içerik üretmemesi durumunda escrow tutarı Markaya iade edilir. Haklı gerekçeyle Marka tarafından reddedilen içeriklerde Sponsorum hakemi olarak karar verir; kararına göre kısmi veya tam iade yapılabilir.
                  </p>
                </section>

                {/* 6 */}
                <section id="anlasma" className="mb-10">
                  <h2 className="text-xl font-extrabold mb-4" style={{ color: "#042C53" }}>6. Anlaşma Süreci</h2>

                  <h3 className="text-sm font-bold mb-2 text-gray-700">6.1 Süreç Adımları</h3>
                  <ol className="list-none text-sm text-gray-600 leading-relaxed mb-4 space-y-3">
                    {[
                      ["Teklif Gönderme", "Marka, Yayıncı profilini inceleyerek Platform üzerinden teklif gönderir. Teklif; içerik türü, bütçe, teslim tarihi ve brief bilgilerini içerir."],
                      ["Teklif Kabulü", "Yayıncı teklifi kabul veya reddeder. Kabul edilmesi halinde Marka ödemeyi escrow'a yatırır."],
                      ["Escrow Onayı", "Ödeme iyzico escrow sistemine alındığında Yayıncı, içerik üretimine başlayabilir."],
                      ["İçerik Teslimi", "Yayıncı içeriği Platform üzerinden teslim eder ve canlı yayın linkini bildirir."],
                      ["İnceleme Süresi", "Marka, 48 saat içinde içeriği inceler. Onay verilmesi ya da 48 saatin dolması halinde ödeme otomatik olarak Yayıncıya aktarılır."],
                      ["İtiraz Süreci", "Marka, içeriği reddederse gerekçesini yazılı olarak iletir. Sponsorum hakemlik sürecini başlatır."],
                    ].map(([title, desc], i) => (
                      <li key={i} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center mt-0.5" style={{ backgroundColor: "#185FA5" }}>{i + 1}</span>
                        <span><strong className="text-gray-800">{title}:</strong> {desc}</span>
                      </li>
                    ))}
                  </ol>

                  <h3 className="text-sm font-bold mb-2 text-gray-700">6.2 Otomatik Onay</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    İçerik tesliminden itibaren <strong>48 saat</strong> içinde Marka tarafından herhangi bir itiraz bildirilmezse, anlaşma otomatik olarak onaylanır ve escrow tutarı doğrudan Yayıncının bakiyesine aktarılır. Bu süre, Sponsorum sistemleri üzerinden hesaplanır.
                  </p>
                </section>

                {/* 7 */}
                <section id="anlaşmazlık" className="mb-10">
                  <h2 className="text-xl font-extrabold mb-4" style={{ color: "#042C53" }}>7. Anlaşmazlık Çözümü</h2>

                  <h3 className="text-sm font-bold mb-2 text-gray-700">7.1 Sponsorum Tahkim Yetkisi</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Taraflar arasında bir anlaşmazlık doğması halinde, önce 7 (yedi) gün boyunca Platform mesajlaşma sistemi üzerinden uzlaşma aranır. Uzlaşma sağlanamaması durumunda her iki taraf, anlaşmazlığın çözümünü <strong>Sponsorum'un bağlayıcı tahkim kararına</strong> bırakmayı kabul eder.
                  </p>

                  <h3 className="text-sm font-bold mb-2 text-gray-700">7.2 Karar Süreci</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Sponsorum, her iki tarafın yazılı beyanlarını aldıktan sonra <strong>5 iş günü</strong> içinde nihai kararını bildirir. Karar; escrow tutarının kime ve hangi oranda ödeneceğini belirler. Taraflar bu karara itiraz etmeksizin uyacaklarını peşinen kabul eder. Sponsorum'un kararı, genel hükümlere göre mahkemelerde icraya konulabilir.
                  </p>

                  <h3 className="text-sm font-bold mb-2 text-gray-700">7.3 Kötü Niyetli Anlaşmazlık</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Sponsorum, anlaşmazlık başvurusunun açıkça kötü niyetle yapıldığını tespit ederse, anlaşmazlık başlatan hesabı uyarma, askıya alma veya kapatma yetkisine sahiptir.
                  </p>
                </section>

                {/* 8 */}
                <section id="yasakli" className="mb-10">
                  <h2 className="text-xl font-extrabold mb-4" style={{ color: "#042C53" }}>8. Yasaklı Kategoriler ve İçerikler</h2>

                  <h3 className="text-sm font-bold mb-2 text-gray-700">8.1 Kesinlikle Yasaklı Marka Kategorileri</h3>
                  <ul className="list-disc list-outside ml-5 text-sm text-gray-600 leading-relaxed mb-4 space-y-1">
                    <li>Bahis, şans oyunları ve kumar siteleri (lisanslı olsa dahi)</li>
                    <li>Yasadışı ürün veya hizmetler</li>
                    <li>RTÜK veya Reklam Kurulu tarafından yasaklanmış içerikler</li>
                    <li>Tütün, alkol (plaform ölçeğine ve mevzuata aykırı reklamlar)</li>
                    <li>Yanıltıcı yatırım araçları, kripto para dolandırıcılığı</li>
                    <li>Silah, uyuşturucu veya bunların türevleri</li>
                    <li>Nefret söylemi, ırkçılık veya ayrımcılık içeren içerikler</li>
                    <li>Telif hakkı ihlali içeren ürün veya hizmetler</li>
                  </ul>

                  <h3 className="text-sm font-bold mb-2 text-gray-700">8.2 Yaptırım</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Yasaklı kategoride içerik üreten Yayıncı ve bu kategoriyi talep eden Marka; anlaşma iptal edilir, escrow tutarı iade edilmez (Yayıncıya aktarılmaz), ve her iki hesap kalıcı olarak kapatılır. Durum ilgili devlet kurumlarına bildirilebilir.
                  </p>
                </section>

                {/* 9 */}
                <section id="hesap" className="mb-10">
                  <h2 className="text-xl font-extrabold mb-4" style={{ color: "#042C53" }}>9. Hesap Askıya Alma ve Kapatma</h2>

                  <h3 className="text-sm font-bold mb-2 text-gray-700">9.1 Geçici Askıya Alma</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Sponsorum; şüpheli faaliyet, doğrulama eksikliği veya şikayet incelemesi gibi durumlarda bir hesabı önceden bildirim yaparak ya da acil durumlarda bildirimsiz olarak geçici süreyle askıya alabilir. Askıya alma süresi 30 günü geçemez; bu süre içinde sorun çözülmezse kalıcı kapatma kararı verilir.
                  </p>

                  <h3 className="text-sm font-bold mb-2 text-gray-700">9.2 Kalıcı Kapatma</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Aşağıdaki durumlarda hesap kalıcı olarak kapatılır:
                  </p>
                  <ul className="list-disc list-outside ml-5 text-sm text-gray-600 leading-relaxed mb-4 space-y-1">
                    <li>Bu Sözleşme'nin ağır ihlali</li>
                    <li>Sahte kimlik veya vergi numarası kullanımı</li>
                    <li>Yasaklı kategoride anlaşma yapılması</li>
                    <li>Platform dışı ödeme yönlendirmesi</li>
                    <li>Diğer kullanıcılara zarar verecek sistematik davranış</li>
                  </ul>

                  <h3 className="text-sm font-bold mb-2 text-gray-700">9.3 Bakiye ve Ödemeler</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Hesap kapatıldığında, tamamlanmış anlaşmalardan kaynaklanan bekleyen ödemeler iade politikasına göre işleme alınır. Sözleşme ihlalinden kaynaklanan kapatmalarda Sponsorum, uğradığı zararı talep etme hakkını saklı tutar.
                  </p>
                </section>

                {/* 10 */}
                <section id="sorumluluk" className="mb-10">
                  <h2 className="text-xl font-extrabold mb-4" style={{ color: "#042C53" }}>10. Sorumluluk Sınırlaması</h2>

                  <h3 className="text-sm font-bold mb-2 text-gray-700">10.1 Aracılık Niteliği</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Sponsorum, Yayıncılar ile Markalar arasında aracılık hizmeti sunan bir teknoloji platformudur. Sponsorum, kullanıcılar arasındaki sözleşmenin tarafı değildir ve içeriklerin ticari sonuçlarından sorumlu tutulamaz.
                  </p>

                  <h3 className="text-sm font-bold mb-2 text-gray-700">10.2 Sorumluluk Üst Sınırı</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Sponsorum'un herhangi bir anlaşmazlıktan doğan toplam sorumluluğu, söz konusu anlaşmadan tahsil edilen <strong>platform komisyonu</strong> tutarıyla sınırlıdır. Sponsorum; dolaylı zararlar, kâr kayıpları, itibar kayıpları veya üçüncü tarafların talepleri için hiçbir koşulda sorumlu tutulamaz.
                  </p>

                  <h3 className="text-sm font-bold mb-2 text-gray-700">10.3 Hizmet Kesintileri</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Sponsorum, teknik bakım, güvenlik ihlali veya force majeure halleri nedeniyle geçici hizmet kesintisi yaşanabileceğini ve bu kesintilerden doğan zararlardan sorumlu olmadığını beyan eder.
                  </p>
                </section>

                {/* 11 */}
                <section id="fikri" className="mb-10">
                  <h2 className="text-xl font-extrabold mb-4" style={{ color: "#042C53" }}>11. Fikri Mülkiyet</h2>

                  <h3 className="text-sm font-bold mb-2 text-gray-700">11.1 Platform Hakları</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Sponsorum markası, logosu, tasarımı, yazılımı ve tüm içerikleri Sponsorum'a aittir. Kullanıcılar, Platform'u yalnızca bu Sözleşme kapsamında kullanma hakkına sahiptir; hiçbir hak devri söz konusu değildir.
                  </p>

                  <h3 className="text-sm font-bold mb-2 text-gray-700">11.2 İçerik Hakları</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Yayıncı tarafından üretilen içeriğin fikri mülkiyet hakları, taraflar arasındaki anlaşmada aksi kararlaştırılmadığı sürece Yayıncıda kalır. Marka, anlaşmada belirtilen amaçlarla içeriği kullanma lisansına sahiptir. Yayıncı, üçüncü şahıslara ait fikri mülkiyet haklarını ihlal eden içerik üretemez.
                  </p>
                </section>

                {/* 12 */}
                <section id="degisiklik" className="mb-10">
                  <h2 className="text-xl font-extrabold mb-4" style={{ color: "#042C53" }}>12. Değişiklik Hakkı</h2>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Sponsorum, bu Sözleşme'yi önceden bildirmeksizin değiştirme hakkını saklı tutar. Değişiklikler, Platform'da yayınlandığı tarihten itibaren yürürlüğe girer. Önemli değişiklikler, kayıtlı e-posta adresinize en az <strong>7 gün</strong> öncesinden bildirilir. Değişiklik tarihinden sonra Platformu kullanmaya devam etmek, yeni şartların kabul edildiği anlamına gelir.
                  </p>
                </section>

                {/* 13 */}
                <section id="cayma" className="mb-10">
                  <h2 className="text-xl font-extrabold mb-4" style={{ color: "#042C53" }}>13. Cayma Hakkı</h2>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Sponsorum, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ("TKHK") ve Mesafeli Sözleşmeler Yönetmeliği kapsamında dijital hizmet sağlayıcısıdır. TKHK madde 15/ğ uyarınca; <strong>tüketicinin onayıyla ifasına başlanan dijital içerik veya hizmetlerde cayma hakkı kullanılamaz.</strong>
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Platforma kayıt aşamasında bu hususu açıkça kabul etmektesiniz. Ücretli abonelik başladığında ve dijital hizmet ifası başladığında cayma hakkınız ortadan kalkar.
                  </p>
                </section>

                {/* 14 */}
                <section id="hukuk" className="mb-10">
                  <h2 className="text-xl font-extrabold mb-4" style={{ color: "#042C53" }}>14. Uygulanacak Hukuk ve Yetki</h2>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Bu Sözleşme, <strong>Türk Hukuku</strong>'na tabidir. İşbu Sözleşme'den doğan tüm uyuşmazlıklarda <strong>İstanbul Anadolu Mahkemeleri ve İcra Daireleri</strong> münhasıran yetkilidir.
                  </p>
                </section>

                {/* 15 */}
                <section id="iletisim" className="mb-4">
                  <h2 className="text-xl font-extrabold mb-4" style={{ color: "#042C53" }}>15. İletişim</h2>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Bu Sözleşme hakkında sorularınız için <strong>destek@sponsorum.com.tr</strong> adresine e-posta gönderebilirsiniz. Yasal tebligatlar için kayıtlı şirket adresimize yazılı başvuru yapabilirsiniz.
                  </p>
                </section>

              </div>
            </div>
          </main>
        </div>
      </div>

      <footer className="py-6 border-t border-gray-100 bg-white mt-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-gray-400">© 2026 Sponsorum. Tüm hakları saklıdır.</span>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <a href="/kullanim-sartlari" className="hover:text-[#185FA5] transition-colors font-semibold" style={{ color: "#185FA5" }}>Kullanım Şartları</a>
            <a href="/gizlilik-politikasi" className="hover:text-[#185FA5] transition-colors">Gizlilik</a>
            <a href="/kvkk" className="hover:text-[#185FA5] transition-colors">KVKK</a>
            <a href="/cerez-politikasi" className="hover:text-[#185FA5] transition-colors">Çerezler</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
