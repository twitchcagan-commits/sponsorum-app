"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

const ERRORS: Record<string, string> = {
  "Invalid login credentials": "E-posta veya şifre hatalı.",
  "Email not confirmed": "E-posta adresin henüz onaylanmamış. Gelen kutunu kontrol et.",
  "Too many requests": "Çok fazla deneme yaptın. Lütfen biraz bekle.",
};

function turkishError(msg: string): string {
  for (const [key, val] of Object.entries(ERRORS)) {
    if (msg.includes(key)) return val;
  }
  return "Bir hata oluştu. Lütfen tekrar dene.";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

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
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-10">

            <div className="mb-8 text-center">
              <h1 className="text-3xl font-extrabold mb-2" style={{ color: "#042C53" }}>Giriş Yap</h1>
              <p className="text-gray-500 text-sm">Hesabına erişmek için bilgilerini gir.</p>
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
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold" style={{ color: "#042C53" }}>Şifre</label>
                  <a href="#" className="text-xs font-medium hover:underline" style={{ color: "#185FA5" }}>
                    Şifremi unuttum
                  </a>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
                {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Hesabın yok mu?{" "}
              <a href="/register" className="font-semibold hover:underline" style={{ color: "#185FA5" }}>
                Kayıt Ol
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
