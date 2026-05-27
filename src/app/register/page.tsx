"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Role = "yayinci" | "marka" | null;
type Step = "role" | "form";

const ERRORS: Record<string, string> = {
  "User already registered": "Bu e-posta adresi zaten kayıtlı.",
  "Password should be at least 6 characters": "Şifre en az 6 karakter olmalıdır.",
  "Unable to validate email address": "Geçerli bir e-posta adresi gir.",
  "Signup is disabled": "Şu anda kayıt kapalıdır.",
};

function turkishError(msg: string): string {
  for (const [key, val] of Object.entries(ERRORS)) {
    if (msg.includes(key)) return val;
  }
  return "Bir hata oluştu. Lütfen tekrar dene.";
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("role");
  const [selected, setSelected] = useState<Role>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: selected },
      },
    });

    if (error) {
      setError(turkishError(error.message));
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #E6F1FB 0%, #ffffff 60%)" }}>

      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-16">
          <a href="/" className="text-2xl font-extrabold tracking-tight" style={{ color: "#185FA5" }}>
            Sponsorum
          </a>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl">

          {step === "role" && (
            <>
              <div className="mb-10 text-center">
                <h1 className="text-3xl font-extrabold mb-2" style={{ color: "#042C53" }}>Hesap Oluştur</h1>
                <p className="text-gray-500 text-sm">Nasıl devam etmek istediğini seç.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
                <button
                  onClick={() => setSelected("yayinci")}
                  className="relative flex flex-col items-center text-center gap-4 rounded-2xl border-2 p-8 transition-all hover:-translate-y-1 hover:shadow-lg focus:outline-none bg-white"
                  style={{ borderColor: selected === "yayinci" ? "#185FA5" : "#E6F1FB" }}
                >
                  {selected === "yayinci" && (
                    <span className="absolute top-4 right-4 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: "#185FA5" }}>
                      ✓
                    </span>
                  )}
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: "#E6F1FB" }}>
                    🎙️
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold mb-1" style={{ color: "#042C53" }}>Yayıncı Olarak Kayıt</h2>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      İçerik üreticisi, influencer veya yayıncı olarak platforma katıl. Markalardan sponsorluk teklifleri al.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setSelected("marka")}
                  className="relative flex flex-col items-center text-center gap-4 rounded-2xl border-2 p-8 transition-all hover:-translate-y-1 hover:shadow-lg focus:outline-none bg-white"
                  style={{ borderColor: selected === "marka" ? "#185FA5" : "#E6F1FB" }}
                >
                  {selected === "marka" && (
                    <span className="absolute top-4 right-4 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: "#185FA5" }}>
                      ✓
                    </span>
                  )}
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: "#E6F1FB" }}>
                    🏢
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold mb-1" style={{ color: "#042C53" }}>Marka Olarak Kayıt</h2>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      Ürün veya hizmetini tanıtmak için doğru yayıncıyı bul. Bütçene uygun sponsorluk anlaşmaları yap.
                    </p>
                  </div>
                </button>
              </div>

              <div className="flex flex-col items-center gap-4">
                <button
                  disabled={!selected}
                  onClick={() => setStep("form")}
                  className="w-full sm:w-auto rounded-xl px-10 py-3.5 text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
                  style={{ backgroundColor: "#185FA5" }}
                  onMouseEnter={e => { if (selected) e.currentTarget.style.backgroundColor = "#042C53"; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#185FA5"; }}
                >
                  {selected === "yayinci" ? "Yayıncı Olarak Devam Et →" : selected === "marka" ? "Marka Olarak Devam Et →" : "Devam Et"}
                </button>

                <p className="text-sm text-gray-500">
                  Zaten hesabın var mı?{" "}
                  <a href="/login" className="font-semibold hover:underline" style={{ color: "#185FA5" }}>
                    Giriş Yap
                  </a>
                </p>
              </div>
            </>
          )}

          {step === "form" && (
            <div className="max-w-md mx-auto">
              <button
                onClick={() => { setStep("role"); setError(""); }}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors mb-6"
              >
                ← Geri
              </button>

              <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-10">
                <div className="mb-8 text-center">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest rounded-full px-3 py-1 mb-4" style={{ backgroundColor: "#E6F1FB", color: "#185FA5" }}>
                    {selected === "yayinci" ? "🎙️ Yayıncı" : "🏢 Marka"}
                  </div>
                  <h1 className="text-3xl font-extrabold mb-2" style={{ color: "#042C53" }}>Hesap Bilgileri</h1>
                  <p className="text-gray-500 text-sm">Ücretsiz hesabını oluşturmak için devam et.</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold" style={{ color: "#042C53" }}>E-posta</label>
                    <input
                      type="email"
                      placeholder="ornek@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/20 disabled:opacity-60"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold" style={{ color: "#042C53" }}>Şifre</label>
                    <input
                      type="password"
                      placeholder="En az 6 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={loading}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/20 disabled:opacity-60"
                    />
                  </div>

                  {error && (
                    <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ backgroundColor: "#185FA5" }}
                    onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = "#042C53"; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#185FA5"; }}
                  >
                    {loading ? "Hesap oluşturuluyor…" : "Kayıt Ol"}
                  </button>
                </form>

                <p className="text-center text-xs text-gray-400 mt-6 leading-relaxed">
                  Kayıt olarak{" "}
                  <a href="#" className="underline hover:text-gray-600">Kullanım Şartları</a>
                  {" "}ve{" "}
                  <a href="#" className="underline hover:text-gray-600">Gizlilik Politikası</a>
                  &apos;nı kabul etmiş olursun.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
