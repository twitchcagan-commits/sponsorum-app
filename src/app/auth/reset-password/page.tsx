"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Status = "verifying" | "ready" | "invalid" | "success";

const UPDATE_ERRORS: Record<string, string> = {
  "session":                  "Oturum bulunamadı. Lütfen sıfırlama bağlantısına tekrar tıkla.",
  "different from the old":   "Yeni şifre eskisinden farklı olmalı.",
  "should be at least 6":     "Şifre en az 6 karakter olmalı.",
};

function turkishError(msg: string): string {
  for (const [key, val] of Object.entries(UPDATE_ERRORS)) {
    if (msg.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return "Şifre güncellenemedi. Lütfen tekrar dene.";
}

const inputCls =
  "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/20 disabled:opacity-60";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [status, setStatus]   = useState<Status>("verifying");
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  // ── Establish the recovery session from the email link ──
  useEffect(() => {
    const supabase = createClient();

    // An expired/invalid link comes back with an error in the URL hash
    const hasUrlError = typeof window !== "undefined" && /error/i.test(window.location.hash);

    let resolved = false;

    // Supabase fires PASSWORD_RECOVERY (or SIGNED_IN after the PKCE exchange)
    // once it has parsed the token/code from the URL.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        resolved = true;
        setStatus("ready");
      }
    });

    // Fallback: session may already be established before the listener attaches
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        resolved = true;
        setStatus("ready");
      } else if (hasUrlError) {
        setStatus("invalid");
      } else {
        // Give URL detection a moment, then give up
        setTimeout(() => { if (!resolved) setStatus("invalid"); }, 2000);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) { setError("Şifre en az 6 karakter olmalı."); return; }
    if (password !== confirm) { setError("Şifreler eşleşmiyor."); return; }

    setLoading(true);
    const supabase = createClient();
    const { error: updErr } = await supabase.auth.updateUser({ password });

    if (updErr) {
      setError(turkishError(updErr.message));
      setLoading(false);
      return;
    }

    // Sign the recovery session out so the user logs in fresh with the new password
    await supabase.auth.signOut();
    setStatus("success");
    setTimeout(() => router.push("/login"), 2500);
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

            {/* ── Verifying ── */}
            {status === "verifying" && (
              <div className="flex flex-col items-center py-8">
                <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin mb-5" style={{ borderColor: "#185FA5", borderTopColor: "transparent" }} />
                <p className="text-sm text-gray-500">Bağlantı doğrulanıyor…</p>
              </div>
            )}

            {/* ── Invalid / expired link ── */}
            {status === "invalid" && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-6" style={{ backgroundColor: "#FEF2F2" }}>
                  ⚠️
                </div>
                <h1 className="text-2xl font-extrabold mb-3" style={{ color: "#042C53" }}>Bağlantı Geçersiz</h1>
                <p className="text-sm text-gray-500 leading-relaxed mb-8">
                  Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş. Lütfen yeni bir sıfırlama bağlantısı talep et.
                </p>
                <a
                  href="/login"
                  className="inline-block w-full rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: "#185FA5" }}
                >
                  Giriş Sayfasına Dön
                </a>
              </div>
            )}

            {/* ── Success ── */}
            {status === "success" && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-6" style={{ backgroundColor: "#ECFDF5" }}>
                  ✅
                </div>
                <h1 className="text-2xl font-extrabold mb-3" style={{ color: "#042C53" }}>Şifreniz Güncellendi</h1>
                <p className="text-sm text-gray-500 leading-relaxed mb-8">
                  Şifreniz güncellendi, giriş yapabilirsiniz. Giriş sayfasına yönlendiriliyorsunuz…
                </p>
                <a
                  href="/login"
                  className="inline-block w-full rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: "#185FA5" }}
                >
                  Giriş Yap
                </a>
              </div>
            )}

            {/* ── Reset form ── */}
            {status === "ready" && (
              <>
                <div className="mb-8 text-center">
                  <h1 className="text-3xl font-extrabold mb-2" style={{ color: "#042C53" }}>Yeni Şifre Belirle</h1>
                  <p className="text-gray-500 text-sm">Hesabın için yeni bir şifre oluştur.</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold" style={{ color: "#042C53" }}>Yeni Şifre</label>
                    <input
                      type="password"
                      placeholder="En az 6 karakter"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      required
                      minLength={6}
                      disabled={loading}
                      autoComplete="new-password"
                      className={inputCls}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold" style={{ color: "#042C53" }}>Yeni Şifre (Tekrar)</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirm}
                      onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                      required
                      minLength={6}
                      disabled={loading}
                      autoComplete="new-password"
                      className={inputCls}
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
                    {loading ? "Güncelleniyor…" : "Şifreyi Güncelle"}
                  </button>
                </form>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
