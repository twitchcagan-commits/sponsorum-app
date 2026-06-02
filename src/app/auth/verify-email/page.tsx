"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

const RESEND_ERRORS: Record<string, string> = {
  "rate limit":        "Çok sık denediniz. Lütfen biraz bekleyip tekrar deneyin.",
  "already confirmed": "E-postanız zaten doğrulanmış. Giriş yapabilirsiniz.",
  "for security purposes": "Çok sık denediniz. Lütfen biraz bekleyip tekrar deneyin.",
};

function turkishError(msg: string): string {
  for (const [key, val] of Object.entries(RESEND_ERRORS)) {
    if (msg.toLowerCase().includes(key)) return val;
  }
  return "E-posta gönderilemedi. Lütfen tekrar deneyin.";
}

export default function VerifyEmailPage() {
  const [email, setEmail]     = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");

  // Email is passed from the registration redirect (?email=…)
  useEffect(() => {
    const e = new URLSearchParams(window.location.search).get("email");
    if (e) setEmail(e);
  }, []);

  async function handleResend() {
    setError("");
    setSent(false);
    if (!email) { setError("E-posta adresi bulunamadı. Lütfen tekrar kayıt olun."); return; }

    setSending(true);
    const supabase = createClient();
    const { error: resendErr } = await supabase.auth.resend({ type: "signup", email });
    setSending(false);

    if (resendErr) { setError(turkishError(resendErr.message)); return; }
    setSent(true);
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
          <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-10 text-center">

            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-6" style={{ backgroundColor: "#E6F1FB" }}>
              📧
            </div>

            <h1 className="text-3xl font-extrabold mb-3" style={{ color: "#042C53" }}>Emailinizi Doğrulayın</h1>

            <p className="text-sm text-gray-500 leading-relaxed mb-2">
              {email ? (
                <><span className="font-semibold text-gray-700">{email}</span> adresine bir doğrulama bağlantısı gönderdik.</>
              ) : (
                "E-posta adresinize bir doğrulama bağlantısı gönderdik."
              )}
            </p>
            <p className="text-sm text-gray-500 leading-relaxed mb-8">
              Hesabını etkinleştirmek için e-postandaki bağlantıya tıkla. Gelen kutunda göremiyorsan spam klasörünü kontrol et.
            </p>

            {sent && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 mb-4">
                ✅ Doğrulama e-postası tekrar gönderildi.
              </div>
            )}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">
                {error}
              </div>
            )}

            <button
              onClick={handleResend}
              disabled={sending}
              className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#185FA5" }}
              onMouseEnter={e => { if (!sending) e.currentTarget.style.backgroundColor = "#042C53"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#185FA5"; }}
            >
              {sending ? "Gönderiliyor…" : "Tekrar Gönder"}
            </button>

            <p className="text-center text-sm text-gray-500 mt-6">
              E-postanı doğruladın mı?{" "}
              <a href="/login" className="font-semibold hover:underline" style={{ color: "#185FA5" }}>
                Giriş Yap
              </a>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}
