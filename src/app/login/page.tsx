"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

const BAN_MSG = "Hesabınız askıya alınmıştır. Destek için iletişime geçin.";

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

  // Forgot-password (inline) state
  const [mode, setMode]                 = useState<"login" | "forgot">("login");
  const [resetEmail, setResetEmail]     = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent]       = useState(false);
  const [resetError, setResetError]     = useState("");

  // Show the ban message when the middleware redirects here with ?error=banned
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("error") === "banned") {
      setError(BAN_MSG);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(turkishError(error.message));
      setLoading(false);
      return;
    }

    // Block banned users — sign out immediately, do not enter the app
    const userId = data.user?.id;
    if (userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_banned")
        .eq("id", userId)
        .maybeSingle();

      if (profile?.is_banned) {
        await supabase.auth.signOut();
        setError(BAN_MSG);
        setLoading(false);
        return;
      }
    }

    router.push("/dashboard");
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setResetError("");
    setResetLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: window.location.origin + "/auth/reset-password",
    });

    setResetLoading(false);
    if (error) {
      setResetError(turkishError(error.message));
      return;
    }
    setResetSent(true);
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

            {mode === "login" ? (
            <>
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
                  <button
                    type="button"
                    onClick={() => { setResetEmail(email); setMode("forgot"); setError(""); }}
                    className="text-xs font-medium hover:underline"
                    style={{ color: "#185FA5" }}
                  >
                    Şifremi Unuttum
                  </button>
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
            </>
            ) : (
            <>
              {/* ── Forgot password (inline) ── */}
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-extrabold mb-2" style={{ color: "#042C53" }}>Şifremi Sıfırla</h1>
                <p className="text-gray-500 text-sm">E-posta adresine sıfırlama linki gönderelim.</p>
              </div>

              {resetSent ? (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-4 text-sm text-emerald-700 text-center">
                  ✅ Şifre sıfırlama linki emailinize gönderildi.
                </div>
              ) : (
                <form onSubmit={handleReset} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold" style={{ color: "#042C53" }}>E-posta</label>
                    <input
                      type="email"
                      placeholder="ornek@email.com"
                      value={resetEmail}
                      onChange={(e) => { setResetEmail(e.target.value); setResetError(""); }}
                      required
                      disabled={resetLoading}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/20 disabled:opacity-60"
                    />
                  </div>

                  {resetError && (
                    <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                      {resetError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ backgroundColor: "#185FA5" }}
                    onMouseEnter={e => { if (!resetLoading) e.currentTarget.style.backgroundColor = "#042C53"; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#185FA5"; }}
                  >
                    {resetLoading ? "Gönderiliyor…" : "Sıfırlama Linki Gönder"}
                  </button>
                </form>
              )}

              <button
                type="button"
                onClick={() => { setMode("login"); setResetSent(false); setResetError(""); }}
                className="w-full text-center text-sm font-medium mt-6 hover:underline"
                style={{ color: "#185FA5" }}
              >
                ← Giriş ekranına dön
              </button>
            </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
