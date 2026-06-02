"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Role = "yayinci" | "marka" | null;
type Step = "role" | "form" | "confirm-email";
type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

const AUTH_ERRORS: Record<string, string> = {
  "User already registered":           "Bu e-posta adresi zaten kayıtlı.",
  "Password should be at least 6":     "Şifre en az 6 karakter olmalıdır.",
  "Unable to validate email address":  "Geçerli bir e-posta adresi gir.",
  "Signup is disabled":                "Şu anda kayıt kapalıdır.",
};

const DB_ERRORS: Record<string, string> = {
  "duplicate key":   "Bu hesap zaten mevcut.",
  "violates foreign": "Hesap oluşturulurken bir hata oluştu.",
  "row-level":       "Profil kaydedilemedi. Lütfen destek ile iletişime geç.",
};

function turkishError(msg: string, map: Record<string, string>): string {
  for (const [key, val] of Object.entries(map)) {
    if (msg.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return "Bir hata oluştu. Lütfen tekrar dene.";
}

// ─── Field component ──────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  required = true,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold" style={{ color: "#042C53" }}>
        {label}
        {!required && <span className="ml-1 text-xs font-normal text-gray-400">(isteğe bağlı)</span>}
      </label>
      {hint && <p className="text-xs text-gray-400 -mt-1">{hint}</p>}
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/20 disabled:opacity-60";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep]             = useState<Step>("role");
  const [selected, setSelected]     = useState<Role>(null);

  // Shared fields
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername]     = useState("");
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Marka-only fields
  const [companyName, setCompanyName] = useState("");
  const [taxNumber, setTaxNumber]     = useState("");

  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  // Pre-select role and skip to form when ?role=marka or ?role=yayinci is in the URL
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("role");
    if (param === "marka" || param === "yayinci") {
      setSelected(param as Role);
      setStep("form");
    }
  }, []);

  const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

  function handleUsernameChange(raw: string) {
    const val = raw.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
    setUsername(val);

    if (usernameTimer.current) clearTimeout(usernameTimer.current);

    if (!val) { setUsernameStatus("idle"); return; }
    if (!USERNAME_RE.test(val)) { setUsernameStatus("invalid"); return; }

    setUsernameStatus("checking");
    usernameTimer.current = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", val)
        .maybeSingle();
      setUsernameStatus(data ? "taken" : "available");
    }, 500);
  }

  async function insertProfiles(userId: string) {
    const supabase = createClient();

    const { error: profileError } = await supabase.from("profiles").insert({
      id:           userId,
      role:         selected,
      display_name: displayName.trim(),
      username:     username.trim(),
      created_at:   new Date().toISOString(),
    });

    if (profileError) {
      console.error("[register] profiles insert failed:", profileError);
      throw new Error(turkishError(profileError.message, DB_ERRORS));
    }

    if (selected === "marka") {
      const { error: markaError } = await supabase.from("marka_profiles").insert({
        id:           userId,
        company_name: companyName.trim(),
        tax_number:   taxNumber.trim(),
      });
      if (markaError) {
        console.error("[register] marka_profiles insert failed:", markaError);
        throw new Error(turkishError(markaError.message, DB_ERRORS));
      }
    } else {
      const { error: yayinciError } = await supabase.from("yayinci_profiles").insert({
        id:        userId,
        bio:       "",
        platforms: [],
      });
      if (yayinciError) {
        console.error("[register] yayinci_profiles insert failed:", yayinciError);
        console.error("[register] yayinci_profiles error details:", JSON.stringify(yayinciError));
        throw new Error(turkishError(yayinciError.message, DB_ERRORS));
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!USERNAME_RE.test(username)) {
      setError("Kullanıcı adı 3-20 karakter olmalı; sadece küçük harf, rakam ve alt çizgi (_) kullanılabilir.");
      return;
    }
    if (usernameStatus !== "available") {
      setError(usernameStatus === "taken" ? "Bu kullanıcı adı alınmış. Lütfen başka bir tane seç." : "Kullanıcı adı müsaitliği kontrol ediliyor, lütfen bekle.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    // 1. Sign up
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: selected, display_name: displayName },
      },
    });

    if (authError) {
      console.error("[register] signUp failed:", authError);
      setError(turkishError(authError.message, AUTH_ERRORS));
      setLoading(false);
      return;
    }

    const user = authData.user;
    if (!user) {
      console.error("[register] signUp returned no user");
      setError("Hesap oluşturulamadı. Lütfen tekrar dene.");
      setLoading(false);
      return;
    }

    console.log("[register] signUp success. session:", authData.session ? "exists" : "null (email confirmation required)");

    // 2a. Session exists → email confirmation is OFF → insert profiles now
    if (authData.session) {
      try {
        await insertProfiles(user.id);
        router.push("/dashboard");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Profil kaydedilemedi.");
        setLoading(false);
      }
      return;
    }

    // 2b. No session → email confirmation is ON
    // Store pending profile data in localStorage so dashboard can finish the insert after confirmation
    console.log("[register] storing pending profile for post-confirmation insert");
    localStorage.setItem(
      "pendingProfile",
      JSON.stringify({
        userId:      user.id,
        role:        selected,
        displayName: displayName.trim(),
        username:    username.trim(),
        companyName: companyName.trim(),
        taxNumber:   taxNumber.trim(),
      })
    );
    // Email not confirmed yet → send the user to the verification page
    router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
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

          {/* ── Step 1: Role selection ── */}
          {step === "role" && (
            <>
              <div className="mb-10 text-center">
                <h1 className="text-3xl font-extrabold mb-2" style={{ color: "#042C53" }}>Hesap Oluştur</h1>
                <p className="text-gray-500 text-sm">Nasıl devam etmek istediğini seç.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
                {[
                  {
                    id: "yayinci" as Role,
                    emoji: "🎙️",
                    title: "Yayıncı Olarak Kayıt",
                    desc: "İçerik üreticisi, influencer veya yayıncı olarak platforma katıl. Markalardan sponsorluk teklifleri al.",
                  },
                  {
                    id: "marka" as Role,
                    emoji: "🏢",
                    title: "Marka Olarak Kayıt",
                    desc: "Ürün veya hizmetini tanıtmak için doğru yayıncıyı bul. Bütçene uygun sponsorluk anlaşmaları yap.",
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelected(opt.id)}
                    className="relative flex flex-col items-center text-center gap-4 rounded-2xl border-2 p-8 transition-all hover:-translate-y-1 hover:shadow-lg focus:outline-none bg-white"
                    style={{ borderColor: selected === opt.id ? "#185FA5" : "#E6F1FB" }}
                  >
                    {selected === opt.id && (
                      <span className="absolute top-4 right-4 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: "#185FA5" }}>
                        ✓
                      </span>
                    )}
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: "#E6F1FB" }}>
                      {opt.emoji}
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold mb-1" style={{ color: "#042C53" }}>{opt.title}</h2>
                      <p className="text-sm text-gray-500 leading-relaxed">{opt.desc}</p>
                    </div>
                  </button>
                ))}
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
                  <a href="/login" className="font-semibold hover:underline" style={{ color: "#185FA5" }}>Giriş Yap</a>
                </p>
              </div>
            </>
          )}

          {/* ── Step 3: Email confirmation waiting ── */}
          {step === "confirm-email" && (
            <div className="max-w-md mx-auto text-center">
              <div className="bg-white rounded-2xl shadow-lg p-10">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-6" style={{ backgroundColor: "#E6F1FB" }}>
                  📧
                </div>
                <h2 className="text-2xl font-extrabold mb-3" style={{ color: "#042C53" }}>E-postanı Onayla</h2>
                <p className="text-sm text-gray-500 leading-relaxed mb-2">
                  <span className="font-semibold text-gray-700">{email}</span> adresine bir onay bağlantısı gönderdik.
                </p>
                <p className="text-sm text-gray-500 leading-relaxed mb-8">
                  Bağlantıya tıkladıktan sonra giriş yapabilir ve profil kurulumunu tamamlayabilirsin.
                </p>
                <a
                  href="/login"
                  className="inline-block w-full rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: "#185FA5" }}
                >
                  Giriş Sayfasına Git
                </a>
              </div>
            </div>
          )}

          {/* ── Step 2: Registration form ── */}
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

                  {/* Display name — both roles */}
                  <Field label="Ad Soyad">
                    <input
                      type="text"
                      placeholder={selected === "marka" ? "Yetkili kişinin adı" : "Adın ve soyadın"}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      disabled={loading}
                      className={inputCls}
                    />
                  </Field>

                  {/* Username — both roles */}
                  <Field label="Kullanıcı Adı" hint="3-20 karakter; sadece küçük harf, rakam ve alt çizgi (_).">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="kullanici_adi"
                        value={username}
                        onChange={(e) => handleUsernameChange(e.target.value)}
                        required
                        disabled={loading}
                        className={inputCls + " pr-10"}
                        autoComplete="username"
                      />
                      {usernameStatus === "checking" && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">…</span>
                      )}
                      {usernameStatus === "available" && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 font-bold">✓</span>
                      )}
                      {(usernameStatus === "taken" || usernameStatus === "invalid") && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 font-bold">✗</span>
                      )}
                    </div>
                    {usernameStatus === "available" && (
                      <p className="text-xs text-green-600 mt-1">Kullanılabilir</p>
                    )}
                    {usernameStatus === "taken" && (
                      <p className="text-xs text-red-600 mt-1">Bu kullanıcı adı alınmış</p>
                    )}
                    {usernameStatus === "invalid" && (
                      <p className="text-xs text-red-600 mt-1">En az 3 karakter gerekli; sadece a-z, 0-9 ve _</p>
                    )}
                  </Field>

                  {/* Marka-only fields */}
                  {selected === "marka" && (
                    <>
                      <Field label="Şirket Adı" hint="Fatura ve sözleşmelerde kullanılacaktır.">
                        <input
                          type="text"
                          placeholder="Örn: Acme Teknoloji A.Ş."
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          required
                          disabled={loading}
                          className={inputCls}
                        />
                      </Field>

                      <Field label="Vergi Numarası" hint="10 haneli vergi kimlik numaranız.">
                        <input
                          type="text"
                          placeholder="0000000000"
                          value={taxNumber}
                          onChange={(e) => setTaxNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          required
                          minLength={10}
                          maxLength={10}
                          disabled={loading}
                          className={inputCls}
                        />
                      </Field>
                    </>
                  )}

                  {/* E-posta */}
                  <Field label="E-posta">
                    <input
                      type="email"
                      placeholder="ornek@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className={inputCls}
                    />
                  </Field>

                  {/* Şifre */}
                  <Field label="Şifre">
                    <input
                      type="password"
                      placeholder="En az 6 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={loading}
                      className={inputCls}
                    />
                  </Field>

                  {error && (
                    <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || usernameStatus === "checking" || usernameStatus === "taken" || usernameStatus === "invalid"}
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
                  <a href="/kullanim-sartlari" className="underline hover:text-gray-600">Kullanım Şartları</a>
                  {" "}ve{" "}
                  <a href="/gizlilik-politikasi" className="underline hover:text-gray-600">Gizlilik Politikası</a>
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
