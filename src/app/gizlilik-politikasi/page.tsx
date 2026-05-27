import React from "react";

export const metadata = {
  title: "Gizlilik Politikası | Sponsorum",
  description: "Sponsorum platformu gizlilik politikası ve kişisel veri işleme hakkında bilgilendirme.",
};

const TOC = [
  { id: "veri-sorumlusu",   label: "1. Veri Sorumlusu" },
  { id: "toplanan-veriler", label: "2. Toplanan Kişisel Veriler" },
  { id: "amac-dayanak",     label: "3. İşleme Amacı ve Hukuki Dayanak" },
  { id: "aktarim",          label: "4. Verilerin Aktarımı" },
  { id: "saklama",          label: "5. Saklama Süreleri" },
  { id: "haklar",           label: "6. Kullanıcı Hakları (KVKK md. 11)" },
  { id: "cerezler",         label: "7. Çerez Kullanımı" },
  { id: "guvenlik",         label: "8. Güvenlik Önlemleri" },
  { id: "degisiklik",       label: "9. Politika Değişiklikleri" },
  { id: "iletisim",         label: "10. İletişim" },
];

export default function GizlilikPolitikasiPage() {
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
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 sm:p-10">

              <div className="mb-8 pb-6 border-b border-gray-100">
                <h1 className="text-3xl font-extrabold mb-2" style={{ color: "#042C53" }}>Gizlilik Politikası</h1>
                <p className="text-sm text-gray-400">Son güncellenme: 27 Mayıs 2026 · KVKK uyumlu</p>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed mb-8">
                Sponsorum olarak kişisel verilerinizin güvenliği ve gizliliği en öncelikli konularımızdan biridir. Bu Gizlilik Politikası; 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") ve AB Genel Veri Koruma Yönetmeliği ("GDPR") kapsamındaki yükümlülüklerimizi ve veri işleme pratiklerimizi açıklamaktadır.
              </p>

              {/* 1 */}
              <section id="veri-sorumlusu" className="mb-10">
                <h2 className="text-xl font-extrabold mb-4" style={{ color: "#042C53" }}>1. Veri Sorumlusu</h2>
                <div className="rounded-xl border border-gray-200 p-5 text-sm text-gray-600 space-y-1" style={{ backgroundColor: "#F8FAFC" }}>
                  <p><strong className="text-gray-800">Unvan:</strong> Sponsorum</p>
                  <p><strong className="text-gray-800">Adres:</strong> İstanbul, Türkiye</p>
                  <p><strong className="text-gray-800">E-posta:</strong> kvkk@sponsorum.com.tr</p>
                  <p><strong className="text-gray-800">Kep Adresi:</strong> sponsorum@hs01.kep.tr</p>
                </div>
              </section>

              {/* 2 */}
              <section id="toplanan-veriler" className="mb-10">
                <h2 className="text-xl font-extrabold mb-4" style={{ color: "#042C53" }}>2. Toplanan Kişisel Veriler</h2>

                <h3 className="text-sm font-bold mb-2 text-gray-700">2.1 Kimlik ve İletişim Verileri</h3>
                <ul className="list-disc list-outside ml-5 text-sm text-gray-600 leading-relaxed mb-4 space-y-1">
                  <li>Ad, soyad, kullanıcı adı</li>
                  <li>E-posta adresi, telefon numarası (isteğe bağlı)</li>
                  <li>Markalar için vergi kimlik numarası (VKN) ve şirket unvanı</li>
                  <li>Profil görseli (isteğe bağlı)</li>
                </ul>

                <h3 className="text-sm font-bold mb-2 text-gray-700">2.2 Finansal Veriler</h3>
                <ul className="list-disc list-outside ml-5 text-sm text-gray-600 leading-relaxed mb-4 space-y-1">
                  <li>Ödeme işlem kayıtları (tutar, tarih, durum)</li>
                  <li>IBAN / banka hesap bilgileri (ödeme iadelerinde talep edilir)</li>
                  <li>Fatura bilgileri (Markalar için zorunlu)</li>
                  <li>Kart bilgileri iyzico tarafından işlenir; Sponsorum kart numarası saklamamaktadır</li>
                </ul>

                <h3 className="text-sm font-bold mb-2 text-gray-700">2.3 Platform Kullanım Verileri</h3>
                <ul className="list-disc list-outside ml-5 text-sm text-gray-600 leading-relaxed mb-4 space-y-1">
                  <li>Giriş tarihi, saati ve IP adresi</li>
                  <li>Gönderilen ve alınan teklifler, anlaşma geçmişi</li>
                  <li>Platform içi mesajlaşma içerikleri</li>
                  <li>Yüklenen kanıt dosyaları (istatistik ekran görüntüleri)</li>
                  <li>Sosyal medya profil istatistikleri (Yayıncılar tarafından girilir)</li>
                </ul>

                <h3 className="text-sm font-bold mb-2 text-gray-700">2.4 Teknik Veriler</h3>
                <ul className="list-disc list-outside ml-5 text-sm text-gray-600 leading-relaxed mb-4 space-y-1">
                  <li>IP adresi, tarayıcı türü ve sürümü</li>
                  <li>İşletim sistemi, ekran çözünürlüğü</li>
                  <li>Oturum çerez verileri</li>
                  <li>Sayfa görüntüleme ve tıklama verileri (anonim hâle getirilmiş)</li>
                </ul>
              </section>

              {/* 3 */}
              <section id="amac-dayanak" className="mb-10">
                <h2 className="text-xl font-extrabold mb-4" style={{ color: "#042C53" }}>3. İşleme Amacı ve Hukuki Dayanak</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse mb-4">
                    <thead>
                      <tr style={{ backgroundColor: "#E6F1FB" }}>
                        <th className="text-left px-4 py-2 font-bold text-gray-700 border border-gray-200">İşleme Amacı</th>
                        <th className="text-left px-4 py-2 font-bold text-gray-700 border border-gray-200">Hukuki Dayanak (KVKK md. 5)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Üyelik oluşturma ve kimlik doğrulama", "Sözleşmenin kurulması ve ifası (md. 5/2-c)"],
                        ["Anlaşma ve ödeme işlemlerinin yürütülmesi", "Sözleşmenin ifası (md. 5/2-c)"],
                        ["Marka vergi numarası doğrulaması", "Hukuki yükümlülüğün yerine getirilmesi (md. 5/2-ç)"],
                        ["Yayıncı istatistik kanıtı incelenmesi", "Sözleşmenin ifası / Meşru menfaat (md. 5/2-f)"],
                        ["Platform güvenliği ve dolandırıcılık tespiti", "Meşru menfaat (md. 5/2-f)"],
                        ["Anlaşmazlık çözümü ve tahkim kaydı", "Hukuki yükümlülük / Meşru menfaat"],
                        ["Yasal raporlama ve denetim yükümlülüğü", "Hukuki yükümlülük (md. 5/2-ç)"],
                        ["Pazarlama bildirimleri (açık rıza ile)", "Açık rıza (md. 5/1)"],
                        ["Ürün ve hizmet geliştirme (anonimleştirilmiş)", "Meşru menfaat (md. 5/2-f)"],
                      ].map(([a, d]) => (
                        <tr key={a} className="border-b border-gray-100">
                          <td className="px-4 py-2 text-gray-700 border border-gray-200">{a}</td>
                          <td className="px-4 py-2 text-gray-600 border border-gray-200">{d}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 4 */}
              <section id="aktarim" className="mb-10">
                <h2 className="text-xl font-extrabold mb-4" style={{ color: "#042C53" }}>4. Verilerin Aktarımı</h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  Kişisel verileriniz yalnızca aşağıdaki hizmet sağlayıcılarla, KVKK'nın 8. ve 9. maddeleri çerçevesinde paylaşılmaktadır:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse mb-4">
                    <thead>
                      <tr style={{ backgroundColor: "#E6F1FB" }}>
                        <th className="text-left px-4 py-2 font-bold text-gray-700 border border-gray-200">Alıcı</th>
                        <th className="text-left px-4 py-2 font-bold text-gray-700 border border-gray-200">Amaç</th>
                        <th className="text-left px-4 py-2 font-bold text-gray-700 border border-gray-200">Konum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Supabase", "Veri tabanı ve dosya depolama altyapısı", "AB (Frankfurt, Almanya)"],
                        ["iyzico Ödeme Hizmetleri A.Ş.", "Ödeme işleme ve escrow yönetimi", "Türkiye"],
                        ["Resend", "İşlemsel e-posta iletimi (bildirimler)", "ABD — SCCs kapsamında"],
                        ["Vergi ve Denetim Otoriteleri", "Yasal yükümlülük kapsamında", "Türkiye"],
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
                  Verileriniz, yukarıda sayılanlar dışında hiçbir üçüncü tarafla ticari amaçla paylaşılmaz veya satılmaz.
                </p>
              </section>

              {/* 5 */}
              <section id="saklama" className="mb-10">
                <h2 className="text-xl font-extrabold mb-4" style={{ color: "#042C53" }}>5. Saklama Süreleri</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse mb-4">
                    <thead>
                      <tr style={{ backgroundColor: "#E6F1FB" }}>
                        <th className="text-left px-4 py-2 font-bold text-gray-700 border border-gray-200">Veri Kategorisi</th>
                        <th className="text-left px-4 py-2 font-bold text-gray-700 border border-gray-200">Saklama Süresi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Hesap ve profil bilgileri", "Hesap aktif olduğu sürece + hesap silinmesinden itibaren 3 yıl"],
                        ["Anlaşma ve ödeme kayıtları", "10 yıl (VUK md. 253 gereği)"],
                        ["Fatura ve mali belgeler", "10 yıl (TTK ve VUK zorunluluğu)"],
                        ["Platform içi mesajlar", "Hesap aktif olduğu sürece + 2 yıl"],
                        ["Kanıt dosyaları (ekran görüntüleri)", "Anlaşma tamamlanmasından itibaren 2 yıl"],
                        ["Log ve güvenlik kayıtları", "2 yıl"],
                        ["Pazarlama verileri (açık rıza ile)", "Rıza geri çekilene kadar"],
                      ].map(([a, b]) => (
                        <tr key={a} className="border-b border-gray-100">
                          <td className="px-4 py-2 text-gray-700 border border-gray-200">{a}</td>
                          <td className="px-4 py-2 text-gray-600 border border-gray-200">{b}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 6 */}
              <section id="haklar" className="mb-10">
                <h2 className="text-xl font-extrabold mb-4" style={{ color: "#042C53" }}>6. Kullanıcı Hakları (KVKK md. 11)</h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {[
                    ["🔍 Erişim Hakkı", "Hangi kişisel verilerinizin işlendiğini öğrenme"],
                    ["✏️ Düzeltme Hakkı", "Yanlış veya eksik verilerin düzeltilmesini talep etme"],
                    ["🗑️ Silme Hakkı", "İşleme amacı ortadan kalktığında verilerinizin silinmesini talep etme"],
                    ["🚫 İtiraz Hakkı", "Meşru menfaate dayalı işlemeye itiraz etme"],
                    ["📤 Taşınabilirlik", "Verilerinizi yapılandırılmış formatta alma (GDPR kapsamında)"],
                    ["⏸️ Kısıtlama", "Belirli koşullarda işlemenin kısıtlanmasını talep etme"],
                    ["❌ Rıza Geri Çekme", "Açık rızaya dayalı işlemlerde rızanızı geri çekme"],
                    ["⚖️ Şikayet Hakkı", "KVKK kapsamında Kişisel Verileri Koruma Kurulu'na şikayette bulunma"],
                  ].map(([title, desc]) => (
                    <div key={title as string} className="rounded-xl border border-gray-100 p-4" style={{ backgroundColor: "#F8FAFC" }}>
                      <p className="text-sm font-bold text-gray-800 mb-1">{title}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Haklarınızı kullanmak için <strong>kvkk@sponsorum.com.tr</strong> adresine e-posta gönderebilir veya KEP adresimize yazılı başvuru yapabilirsiniz. Başvurular, kimliğiniz doğrulandıktan sonra <strong>30 gün</strong> içinde yanıtlanır.
                </p>
              </section>

              {/* 7 */}
              <section id="cerezler" className="mb-10">
                <h2 className="text-xl font-extrabold mb-4" style={{ color: "#042C53" }}>7. Çerez Kullanımı</h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  Platform, zorunlu teknik çerezler ve isteğe bağlı analitik çerezler kullanmaktadır. Çerezler hakkında ayrıntılı bilgi için <a href="/cerez-politikasi" className="font-semibold hover:underline" style={{ color: "#185FA5" }}>Çerez Politikamızı</a> inceleyebilirsiniz. Analitik çerezleri tarayıcı ayarlarınızdan veya Platform üzerindeki tercih merkezinden devre dışı bırakabilirsiniz.
                </p>
              </section>

              {/* 8 */}
              <section id="guvenlik" className="mb-10">
                <h2 className="text-xl font-extrabold mb-4" style={{ color: "#042C53" }}>8. Güvenlik Önlemleri</h2>
                <ul className="list-disc list-outside ml-5 text-sm text-gray-600 leading-relaxed mb-4 space-y-1">
                  <li>Tüm veriler aktarım sırasında <strong>TLS 1.3</strong> ile şifrelenir</li>
                  <li>Veritabanı verileri <strong>AES-256</strong> ile şifreli olarak saklanır (Supabase)</li>
                  <li>Parolalar <strong>bcrypt</strong> ile hash'lenerek saklanır; düz metin parola tutulmaz</li>
                  <li>Ödeme verileri <strong>PCI-DSS Seviye 1</strong> sertifikalı iyzico altyapısında işlenir</li>
                  <li>Supabase sunucuları AB (Frankfurt) veri merkezindedir; GDPR uyumludur</li>
                  <li>Yönetim paneline erişim için çok faktörlü kimlik doğrulama zorunludur</li>
                  <li>Veri ihlali durumunda KVKK'nın 12. maddesi uyarınca <strong>72 saat</strong> içinde yetkili makamlara bildirim yapılır</li>
                </ul>
              </section>

              {/* 9 */}
              <section id="degisiklik" className="mb-10">
                <h2 className="text-xl font-extrabold mb-4" style={{ color: "#042C53" }}>9. Politika Değişiklikleri</h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Bu Gizlilik Politikası, yasal değişiklikler veya platform gelişmeleri doğrultusunda güncellenebilir. Önemli değişiklikler e-posta yoluyla bildirilir. Güncel politikayı her zaman bu sayfada bulabilirsiniz.
                </p>
              </section>

              {/* 10 */}
              <section id="iletisim" className="mb-4">
                <h2 className="text-xl font-extrabold mb-4" style={{ color: "#042C53" }}>10. İletişim</h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Gizlilik ile ilgili sorularınız için: <strong>kvkk@sponsorum.com.tr</strong><br />
                  Kişisel Verileri Koruma Kurulu: <a href="https://www.kvkk.gov.tr" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: "#185FA5" }}>www.kvkk.gov.tr</a>
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
            <a href="/gizlilik-politikasi" className="hover:text-[#185FA5] transition-colors font-semibold" style={{ color: "#185FA5" }}>Gizlilik</a>
            <a href="/kvkk" className="hover:text-[#185FA5] transition-colors">KVKK</a>
            <a href="/cerez-politikasi" className="hover:text-[#185FA5] transition-colors">Çerezler</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
