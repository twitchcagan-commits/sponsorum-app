import React from "react";

export const metadata = {
  title: "KVKK Aydınlatma Metni | Sponsorum",
  description: "Sponsorum KVKK madde 10 kapsamında kişisel veri aydınlatma metni.",
};

const TOC = [
  { id: "veri-sorumlusu",  label: "1. Veri Sorumlusu" },
  { id: "islenme-amaci",   label: "2. Kişisel Verilerin İşlenme Amacı" },
  { id: "aktarilan-taraf", label: "3. Aktarılan Taraflar ve Amaçlar" },
  { id: "toplama-yontemi", label: "4. Toplama Yöntemi ve Hukuki Sebep" },
  { id: "kvkk-haklar",     label: "5. KVKK Madde 11 Kapsamındaki Haklar" },
];

export default function KvkkPage() {
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
              <div className="mt-6 pt-5 border-t border-gray-100">
                <div className="rounded-xl p-3 text-xs text-blue-700 leading-relaxed" style={{ backgroundColor: "#EFF6FF" }}>
                  <strong>KVKK md. 10</strong> uyarınca hazırlanmış resmi aydınlatma metnidir.
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 sm:p-10">

              <div className="mb-8 pb-6 border-b border-gray-100">
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold mb-4" style={{ backgroundColor: "#E6F1FB", color: "#185FA5" }}>
                  6698 Sayılı KVKK — Madde 10
                </div>
                <h1 className="text-3xl font-extrabold mb-2" style={{ color: "#042C53" }}>KVKK Aydınlatma Metni</h1>
                <p className="text-sm text-gray-400">Son güncellenme: 27 Mayıs 2026</p>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed mb-8">
                6698 sayılı Kişisel Verilerin Korunması Kanunu'nun ("KVKK") 10. maddesi ve Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ kapsamında, <strong>Sponsorum</strong> tarafından kişisel verilerinizin işlenmesine ilişkin aşağıdaki bilgileri sizinle paylaşmaktayız.
              </p>

              {/* 1 */}
              <section id="veri-sorumlusu" className="mb-10">
                <h2 className="text-xl font-extrabold mb-4" style={{ color: "#042C53" }}>1. Veri Sorumlusu</h2>
                <div className="rounded-xl border border-gray-200 p-5 text-sm space-y-2" style={{ backgroundColor: "#F8FAFC" }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Unvan</p>
                      <p className="font-semibold text-gray-800">Sponsorum</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Adres</p>
                      <p className="font-semibold text-gray-800">İstanbul, Türkiye</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">E-posta</p>
                      <p className="font-semibold text-gray-800">kvkk@sponsorum.com.tr</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">KEP</p>
                      <p className="font-semibold text-gray-800">sponsorum@hs01.kep.tr</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* 2 */}
              <section id="islenme-amaci" className="mb-10">
                <h2 className="text-xl font-extrabold mb-4" style={{ color: "#042C53" }}>2. Kişisel Verilerin İşlenme Amacı</h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  Kişisel verileriniz aşağıda belirtilen amaçlarla işlenmektedir:
                </p>

                <h3 className="text-sm font-bold mb-2 text-gray-700">2.1 Yayıncılar (İçerik Üreticileri) İçin</h3>
                <ul className="list-disc list-outside ml-5 text-sm text-gray-600 leading-relaxed mb-4 space-y-1">
                  <li>Platform üyeliğinin oluşturulması ve yönetilmesi</li>
                  <li>Profil bilgilerinin ve istatistik kanıtlarının doğrulanması</li>
                  <li>Markalardan gelen sponsorluk tekliflerinin iletilmesi</li>
                  <li>Anlaşma kapsamındaki ödeme ve escrow işlemlerinin yürütülmesi</li>
                  <li>Anlaşmazlık süreçlerinde hakemlik kararlarının oluşturulması</li>
                  <li>Platform kullanım istatistiklerinin anonim olarak analizi</li>
                  <li>Yasal bildirim ve yükümlülüklerin yerine getirilmesi</li>
                </ul>

                <h3 className="text-sm font-bold mb-2 text-gray-700">2.2 Markalar İçin</h3>
                <ul className="list-disc list-outside ml-5 text-sm text-gray-600 leading-relaxed mb-4 space-y-1">
                  <li>Marka hesabının oluşturulması ve vergi kimliği doğrulaması</li>
                  <li>Yayıncı arama ve filtreleme hizmetinin sunulması</li>
                  <li>Sponsorluk teklifi gönderme ve anlaşma yönetimi</li>
                  <li>Ödeme işlemlerinin ve fatura belgelerinin düzenlenmesi</li>
                  <li>KDV ve stopaj yükümlülüklerine ilişkin yasal raporlama</li>
                  <li>Müşteri hizmetleri ve destek taleplerinin yanıtlanması</li>
                </ul>

                <h3 className="text-sm font-bold mb-2 text-gray-700">2.3 Tüm Kullanıcılar İçin</h3>
                <ul className="list-disc list-outside ml-5 text-sm text-gray-600 leading-relaxed mb-4 space-y-1">
                  <li>Platform güvenliğinin sağlanması ve dolandırıcılık önleme</li>
                  <li>İşlemsel e-posta bildirimlerinin gönderilmesi</li>
                  <li>KVKK ve ilgili mevzuattan doğan yükümlülüklerin yerine getirilmesi</li>
                  <li>Açık rıza verilmesi durumunda pazarlama iletişimi</li>
                </ul>
              </section>

              {/* 3 */}
              <section id="aktarilan-taraf" className="mb-10">
                <h2 className="text-xl font-extrabold mb-4" style={{ color: "#042C53" }}>3. Kişisel Verilerin Aktarıldığı Taraflar ve Amaçlar</h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  Kişisel verileriniz, KVKK'nın 8. (yurt içi) ve 9. (yurt dışı) maddeleri uyarınca aşağıdaki alıcı gruplarına aktarılmaktadır:
                </p>
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr style={{ backgroundColor: "#E6F1FB" }}>
                        <th className="text-left px-4 py-2 font-bold text-gray-700 border border-gray-200">Alıcı Grubu</th>
                        <th className="text-left px-4 py-2 font-bold text-gray-700 border border-gray-200">Aktarım Amacı</th>
                        <th className="text-left px-4 py-2 font-bold text-gray-700 border border-gray-200">Aktarım Dayanağı</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Supabase (AB/Almanya)", "Veritabanı altyapısı ve dosya depolama", "GDPR Standart Sözleşme Maddeleri"],
                        ["iyzico Ödeme Hizmetleri A.Ş. (TR)", "Ödeme işleme ve escrow yönetimi", "Sözleşme ifası / BDDK lisansı"],
                        ["Resend (ABD)", "İşlemsel e-posta iletimi", "GDPR SCCs / açık rıza"],
                        ["Vergi Dairesi / GİB", "Yasal vergi bildirimleri", "Hukuki yükümlülük"],
                        ["Mahkeme / Savcılık", "Yasal talep halinde bilgi ifşası", "Hukuki yükümlülük / kanun hükmü"],
                        ["KVKK (ihlal durumunda)", "Veri ihlali bildirimi", "KVKK md. 12"],
                      ].map(([a, b, c]) => (
                        <tr key={a} className="border-b border-gray-100">
                          <td className="px-4 py-2 font-semibold text-gray-800 border border-gray-200">{a}</td>
                          <td className="px-4 py-2 text-gray-600 border border-gray-200">{b}</td>
                          <td className="px-4 py-2 text-gray-600 border border-gray-200">{c}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Kişisel verileriniz; Platform hizmetini karşı taraftaki kullanıcılarla (Yayıncı↔Marka) eşleştirme amacıyla da paylaşılmaktadır. Bu paylaşım; anlaşma sürecinin doğal gereği olup KVKK md. 5/2-c kapsamında sözleşmenin ifasına dayanmaktadır.
                </p>
              </section>

              {/* 4 */}
              <section id="toplama-yontemi" className="mb-10">
                <h2 className="text-xl font-extrabold mb-4" style={{ color: "#042C53" }}>4. Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi</h2>

                <h3 className="text-sm font-bold mb-2 text-gray-700">4.1 Toplama Yöntemleri</h3>
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr style={{ backgroundColor: "#E6F1FB" }}>
                        <th className="text-left px-4 py-2 font-bold text-gray-700 border border-gray-200">Yöntem</th>
                        <th className="text-left px-4 py-2 font-bold text-gray-700 border border-gray-200">Açıklama</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Kayıt formu", "Ad, e-posta, şifre, kullanıcı adı"],
                        ["Profil tamamlama", "Sosyal medya hesapları, istatistikler, fiyat listeleri, biyografi"],
                        ["Kanıt yükleme", "Ekran görüntüleri ve PDF belgeler"],
                        ["Ödeme işlemi", "Fatura bilgileri, işlem kayıtları (kart bilgileri iyzico'ya aktarılır)"],
                        ["Platform kullanımı", "Oturum logları, IP adresi, tarayıcı verileri (otomatik)"],
                        ["Mesajlaşma", "Platform içi yazışmalar"],
                        ["Çerezler", "Oturum yönetimi ve tercihler"],
                      ].map(([a, b]) => (
                        <tr key={a} className="border-b border-gray-100">
                          <td className="px-4 py-2 font-semibold text-gray-800 border border-gray-200">{a}</td>
                          <td className="px-4 py-2 text-gray-600 border border-gray-200">{b}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h3 className="text-sm font-bold mb-2 text-gray-700">4.2 Hukuki Sebepler</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    ["KVKK md. 5/1 — Açık Rıza", "Pazarlama iletişimi ve isteğe bağlı analitik çerezler"],
                    ["KVKK md. 5/2-c — Sözleşme İfası", "Üyelik, anlaşma yönetimi, ödeme ve escrow işlemleri"],
                    ["KVKK md. 5/2-ç — Hukuki Yükümlülük", "Vergi bildirimi, mahkeme kararları, BDDK/GİB yükümlülükleri"],
                    ["KVKK md. 5/2-f — Meşru Menfaat", "Güvenlik logları, dolandırıcılık tespiti, platform geliştirme"],
                  ].map(([title, desc]) => (
                    <div key={title as string} className="rounded-xl border border-gray-100 p-4" style={{ backgroundColor: "#F8FAFC" }}>
                      <p className="text-xs font-bold mb-1" style={{ color: "#185FA5" }}>{title}</p>
                      <p className="text-xs text-gray-600 leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* 5 */}
              <section id="kvkk-haklar" className="mb-4">
                <h2 className="text-xl font-extrabold mb-4" style={{ color: "#042C53" }}>5. KVKK Madde 11 Kapsamındaki Haklarınız</h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  KVKK'nın 11. maddesi uyarınca veri sorumlusu olarak Sponsorum'a başvurarak aşağıdaki haklarınızı kullanabilirsiniz:
                </p>
                <ol className="space-y-3 mb-6">
                  {[
                    ["Bilgi alma hakkı", "Kişisel verilerinizin işlenip işlenmediğini öğrenme"],
                    ["Erişim hakkı", "İşlenmişse buna ilişkin bilgi talep etme"],
                    ["Amacı öğrenme", "İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme"],
                    ["Aktarım bilgisi", "Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme"],
                    ["Düzeltme hakkı", "Eksik veya yanlış işlenen verilerin düzeltilmesini isteme"],
                    ["Silme / yok etme hakkı", "İşleme şartları ortadan kalktığında silinmesini veya yok edilmesini isteme"],
                    ["Bildirim hakkı", "Düzeltme ve silme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme"],
                    ["İtiraz hakkı", "Münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonuç doğmasına itiraz etme"],
                    ["Tazminat hakkı", "Kanuna aykırı işleme nedeniyle zarara uğramanız durumunda zararın giderilmesini talep etme"],
                  ].map(([title, desc], i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center" style={{ backgroundColor: "#185FA5" }}>{i + 1}</span>
                      <span className="text-gray-600"><strong className="text-gray-800">{title}:</strong> {desc}</span>
                    </li>
                  ))}
                </ol>

                <div className="rounded-xl border border-amber-100 p-5 text-sm" style={{ backgroundColor: "#FFFBEB" }}>
                  <p className="font-bold text-amber-800 mb-2">📋 Başvuru Usulü</p>
                  <p className="text-amber-700 leading-relaxed mb-2">
                    Haklarınızı kullanmak için aşağıdaki kanallardan birini tercih edebilirsiniz:
                  </p>
                  <ul className="space-y-1 text-amber-700">
                    <li>• <strong>E-posta:</strong> kvkk@sponsorum.com.tr (kayıtlı e-posta adresinizden)</li>
                    <li>• <strong>KEP:</strong> sponsorum@hs01.kep.tr</li>
                    <li>• <strong>Yazılı başvuru:</strong> Islak imzalı dilekçe ile şirket adresimize</li>
                  </ul>
                  <p className="text-amber-700 mt-2">
                    Başvurular, kimliğinizin doğrulanmasını takiben <strong>en geç 30 gün</strong> içinde sonuçlandırılır. Talebin reddedilmesi veya yanıtsız kalması durumunda <strong>Kişisel Verileri Koruma Kurulu</strong>'na şikayette bulunma hakkınız saklıdır.
                  </p>
                </div>
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
            <a href="/kvkk" className="hover:text-[#185FA5] transition-colors font-semibold" style={{ color: "#185FA5" }}>KVKK</a>
            <a href="/cerez-politikasi" className="hover:text-[#185FA5] transition-colors">Çerezler</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
