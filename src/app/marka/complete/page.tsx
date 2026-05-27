"use client";

/*
  Run in Supabase SQL Editor before using this page:

  create table if not exists marka_profiles (
    id            uuid primary key references auth.users(id) on delete cascade,
    company_name  text not null,
    tax_number    text not null,
    sector        text not null,
    website       text,
    phone         text not null,
    contact_name  text not null,
    contact_title text not null,
    contact_phone text not null,
    contact_email text not null,
    plan          text not null default 'free',
    created_at    timestamptz default now()
  );

  alter table marka_profiles enable row level security;

  create policy "Marka insert own"  on marka_profiles for insert with check (auth.uid() = id);
  create policy "Marka update own"  on marka_profiles for update using  (auth.uid() = id);
  create policy "Marka select own"  on marka_profiles for select using  (auth.uid() = id);
*/

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Şirket Bilgileri" },
  { id: 2, label: "İletişim"         },
  { id: 3, label: "Plan"             },
];

const SECTORS = [
  "E-ticaret",
  "Oyun",
  "Teknoloji",
  "Gıda",
  "Moda",
  "Spor",
  "Diğer",
];

const FREE_FEATURES = [
  { text: "Yayıncı profillerini görüntüle",   ok: true  },
  { text: "Kategori ve platform filtresi",     ok: true  },
  { text: "Fiyat bilgilerine erişim",          ok: false },
  { text: "Teklif gönder ve yönet",            ok: false },
  { text: "Yayıncılarla mesajlaş",             ok: false },
  { text: "Öncelikli destek",                  ok: false },
];

const PRO_FEATURES = [
  { text: "Yayıncı profillerini görüntüle",   ok: true },
  { text: "Kategori ve platform filtresi",     ok: true },
  { text: "Fiyat bilgilerine tam erişim",      ok: true },
  { text: "Teklif gönder ve yönet",            ok: true },
  { text: "Yayıncılarla mesajlaş",             ok: true },
  { text: "Öncelikli destek",                  ok: true },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type Plan = "free" | "pro";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validateTaxNumber(v: string): string {
  if (!v) return "Vergi numarası zorunludur.";
  if (!/^\d+$/.test(v)) return "Yalnızca rakam giriniz.";
  if (v.length !== 10) return "Vergi numarası tam 10 haneli olmalıdır.";
  return "";
}

function validatePhone(v: string): string {
  if (!v) return "Telefon numarası zorunludur.";
  const digits = v.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 11) return "Geçerli bir telefon numarası giriniz.";
  return "";
}

function validateEmail(v: string): string {
  if (!v) return "E-posta zorunludur.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Geçerli bir e-posta adresi giriniz.";
  return "";
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ current }: { current: number }) {
  return (
    <div className="w-full mb-10">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" />
        <div
          className="absolute top-4 left-0 h-0.5 z-0 transition-all duration-500"
          style={{ backgroundColor: "#185FA5", width: `${((current - 1) / (STEPS.length - 1)) * 100}%` }}
        />
        {STEPS.map((s) => {
          const done = s.id < current; const active = s.id === current;
          return (
            <div key={s.id} className="flex flex-col items-center gap-2 z-10">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all"
                style={{
                  backgroundColor: done || active ? "#185FA5" : "white",
                  borderColor:     done || active ? "#185FA5" : "#E5E7EB",
                  color:           done || active ? "white"   : "#9CA3AF",
                }}
              >
                {done ? "✓" : s.id}
              </div>
              <span className="text-xs font-semibold hidden sm:block" style={{ color: active ? "#185FA5" : done ? "#6B7280" : "#9CA3AF" }}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/20";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MarkaCompletePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // ── Step 1: Şirket Bilgileri ──
  const [companyName, setCompanyName] = useState("");
  const [taxNumber, setTaxNumber]     = useState("");
  const [sector, setSector]           = useState(SECTORS[0]);
  const [website, setWebsite]         = useState("");
  const [phone, setPhone]             = useState("");

  // ── Step 2: İletişim ──
  const [contactName, setContactName]   = useState("");
  const [contactTitle, setContactTitle] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // ── Step 3: Plan ──
  const [plan, setPlan] = useState<Plan>("free");

  // ── Errors ──
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState("");

  // Pre-fill email from auth session
  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setContactEmail(user.email);
    });
  }, []);

  // ── Validation ──

  function validateStep1(): boolean {
    const errs: Record<string, string> = {};
    if (!companyName.trim()) errs.companyName = "Şirket adı zorunludur.";
    const taxErr = validateTaxNumber(taxNumber);
    if (taxErr) errs.taxNumber = taxErr;
    const phoneErr = validatePhone(phone);
    if (phoneErr) errs.phone = phoneErr;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep2(): boolean {
    const errs: Record<string, string> = {};
    if (!contactName.trim())  errs.contactName  = "Ad soyad zorunludur.";
    if (!contactTitle.trim()) errs.contactTitle = "Ünvan zorunludur.";
    const phoneErr = validatePhone(contactPhone);
    if (phoneErr) errs.contactPhone = phoneErr;
    const emailErr = validateEmail(contactEmail);
    if (emailErr) errs.contactEmail = emailErr;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function goNext() {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setErrors({});
    setStep((s) => s + 1);
  }

  // ── Save ──

  async function handleSave() {
    setSaving(true);
    setSaveError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { error } = await supabase.from("marka_profiles").upsert({
      id:            user.id,
      company_name:  companyName.trim(),
      tax_number:    taxNumber.trim(),
      sector,
      website:       website.trim() || null,
      phone:         phone.trim(),
      contact_name:  contactName.trim(),
      contact_title: contactTitle.trim(),
      contact_phone: contactPhone.trim(),
      contact_email: contactEmail.trim(),
      plan,
    }, { onConflict: "id" });

    if (error) {
      console.error("[marka/complete] upsert error:", error);
      setSaveError("Profil kaydedilirken bir hata oluştu: " + error.message);
      setSaving(false);
      return;
    }

    router.push("/dashboard");
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <a href="/" className="text-2xl font-extrabold tracking-tight" style={{ color: "#185FA5" }}>Sponsorum</a>
          <span className="text-xs font-semibold text-gray-400">Marka Kurulumu</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <ProgressBar current={step} />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 sm:p-9">

          {/* ── Step 1: Şirket Bilgileri ── */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-extrabold mb-1" style={{ color: "#042C53" }}>Şirket Bilgileri</h2>
              <p className="text-sm text-gray-500 mb-7">Markanı temsil eden şirketin temel bilgilerini gir.</p>

              <div className="flex flex-col gap-4">
                {/* Company name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Şirket / Marka Adı</label>
                  <input
                    type="text"
                    placeholder="Örn: Acme A.Ş."
                    value={companyName}
                    onChange={(e) => { setCompanyName(e.target.value); setErrors((p) => ({ ...p, companyName: "" })); }}
                    className={inputCls}
                  />
                  {errors.companyName && <p className="text-xs text-red-600 mt-1">{errors.companyName}</p>}
                </div>

                {/* Tax number */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Vergi Numarası <span className="font-normal text-gray-400">(10 hane)</span></label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="0123456789"
                    value={taxNumber}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setTaxNumber(v);
                      setErrors((p) => ({ ...p, taxNumber: validateTaxNumber(v) }));
                    }}
                    className={inputCls + (taxNumber.length === 10 ? " border-green-400 focus:border-green-500 focus:ring-green-500/20" : "")}
                  />
                  <div className="flex items-center justify-between mt-1">
                    {errors.taxNumber
                      ? <p className="text-xs text-red-600">{errors.taxNumber}</p>
                      : taxNumber.length === 10
                        ? <p className="text-xs text-green-600">✓ Geçerli vergi numarası</p>
                        : <span />
                    }
                    <p className="text-xs text-gray-400 ml-auto">{taxNumber.length}/10</p>
                  </div>
                </div>

                {/* Sector */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Sektör</label>
                  <select
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className={inputCls + " bg-white"}
                  >
                    {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Website */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    Web Sitesi <span className="font-normal text-gray-400">(isteğe bağlı)</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://sirketiniz.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className={inputCls}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Şirket Telefonu</label>
                  <input
                    type="tel"
                    placeholder="0212 000 00 00"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: "" })); }}
                    className={inputCls}
                  />
                  {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: İletişim ── */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-extrabold mb-1" style={{ color: "#042C53" }}>İletişim Kişisi</h2>
              <p className="text-sm text-gray-500 mb-7">Sponsorluk süreçlerini yönetecek kişinin bilgileri.</p>

              <div className="flex flex-col gap-4">
                {/* Contact name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Ad Soyad</label>
                  <input
                    type="text"
                    placeholder="Ahmet Yılmaz"
                    value={contactName}
                    onChange={(e) => { setContactName(e.target.value); setErrors((p) => ({ ...p, contactName: "" })); }}
                    className={inputCls}
                  />
                  {errors.contactName && <p className="text-xs text-red-600 mt-1">{errors.contactName}</p>}
                </div>

                {/* Contact title */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Ünvan / Pozisyon</label>
                  <input
                    type="text"
                    placeholder="Pazarlama Müdürü"
                    value={contactTitle}
                    onChange={(e) => { setContactTitle(e.target.value); setErrors((p) => ({ ...p, contactTitle: "" })); }}
                    className={inputCls}
                  />
                  {errors.contactTitle && <p className="text-xs text-red-600 mt-1">{errors.contactTitle}</p>}
                </div>

                {/* Contact phone */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Cep Telefonu</label>
                  <input
                    type="tel"
                    placeholder="0532 000 00 00"
                    value={contactPhone}
                    onChange={(e) => { setContactPhone(e.target.value); setErrors((p) => ({ ...p, contactPhone: "" })); }}
                    className={inputCls}
                  />
                  {errors.contactPhone && <p className="text-xs text-red-600 mt-1">{errors.contactPhone}</p>}
                </div>

                {/* Contact email */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">İş E-postası</label>
                  <input
                    type="email"
                    placeholder="ahmet@sirket.com"
                    value={contactEmail}
                    onChange={(e) => { setContactEmail(e.target.value); setErrors((p) => ({ ...p, contactEmail: "" })); }}
                    className={inputCls}
                  />
                  {errors.contactEmail && <p className="text-xs text-red-600 mt-1">{errors.contactEmail}</p>}
                  <p className="text-xs text-gray-400 mt-1">Hesabınızın e-postasıyla önceden dolduruldu.</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Abonelik ── */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-extrabold mb-1" style={{ color: "#042C53" }}>Abonelik Planı</h2>
              <p className="text-sm text-gray-500 mb-7">Platformu nasıl kullanmak istediğini seç. Dilediğin zaman yükseltebilirsin.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">

                {/* Free plan */}
                <button
                  onClick={() => setPlan("free")}
                  className="relative flex flex-col rounded-2xl border-2 p-6 text-left transition-all"
                  style={{
                    borderColor:     plan === "free" ? "#185FA5" : "#E5E7EB",
                    backgroundColor: plan === "free" ? "#EBF4FF" : "white",
                  }}
                >
                  {plan === "free" && (
                    <span className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: "#185FA5" }}>✓</span>
                  )}
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Marka</span>
                  <div className="mb-4">
                    <span className="text-3xl font-extrabold" style={{ color: "#042C53" }}>Ücretsiz</span>
                  </div>
                  <ul className="flex flex-col gap-2 flex-1">
                    {FREE_FEATURES.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className={f.ok ? "text-green-500" : "text-gray-300"} style={{ lineHeight: "1.4", flexShrink: 0 }}>
                          {f.ok ? "✓" : "✗"}
                        </span>
                        <span className={f.ok ? "text-gray-700" : "text-gray-400"}>{f.text}</span>
                      </li>
                    ))}
                  </ul>
                </button>

                {/* Pro plan */}
                <button
                  onClick={() => setPlan("pro")}
                  className="relative flex flex-col rounded-2xl border-2 p-6 text-left transition-all"
                  style={{
                    borderColor:     plan === "pro" ? "#185FA5" : "#E5E7EB",
                    backgroundColor: plan === "pro" ? "#EBF4FF" : "white",
                  }}
                >
                  <span className="absolute top-3 left-6 text-xs font-bold rounded-full px-2.5 py-0.5" style={{ backgroundColor: "#185FA5", color: "white" }}>
                    Önerilen
                  </span>
                  {plan === "pro" && (
                    <span className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: "#185FA5" }}>✓</span>
                  )}
                  <span className="text-xs font-bold uppercase tracking-widest mt-5 mb-3" style={{ color: "#185FA5" }}>Marka Pro</span>
                  <div className="mb-4 flex items-end gap-1">
                    <span className="text-3xl font-extrabold" style={{ color: "#042C53" }}>₺299</span>
                    <span className="text-sm text-gray-500 mb-1">/ay</span>
                  </div>
                  <ul className="flex flex-col gap-2 flex-1">
                    {PRO_FEATURES.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-green-500" style={{ lineHeight: "1.4", flexShrink: 0 }}>✓</span>
                        <span className="text-gray-700">{f.text}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              </div>

              {plan === "pro" && (
                <div className="rounded-xl border border-blue-100 px-4 py-3 text-sm text-blue-700" style={{ backgroundColor: "#EBF4FF" }}>
                  Ödeme altyapısı yakında aktif olacak. Şimdilik Pro planı seçerek devam edebilir, ödeme sistemi hazır olduğunda bildirim alırsın.
                </div>
              )}

              {saveError && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mt-4">{saveError}</div>
              )}
            </div>
          )}

          {/* ── Navigation ── */}
          <div className={`flex mt-8 ${step > 1 ? "justify-between" : "justify-end"}`}>
            {step > 1 && (
              <button
                onClick={() => { setErrors({}); setStep((s) => s - 1); }}
                disabled={saving}
                className="rounded-xl px-6 py-3 text-sm font-semibold border-2 transition-all hover:bg-gray-50 disabled:opacity-50"
                style={{ borderColor: "#E5E7EB", color: "#6B7280" }}
              >
                ← Geri
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={goNext}
                className="rounded-xl px-8 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ backgroundColor: "#185FA5" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#042C53")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#185FA5")}
              >
                İleri →
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl px-8 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#185FA5" }}
                onMouseEnter={e => { if (!saving) e.currentTarget.style.backgroundColor = "#042C53"; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#185FA5"; }}
              >
                {saving ? "Kaydediliyor…" : "Kurulumu Tamamla ✓"}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          Adım {step} / {STEPS.length} — {STEPS[step - 1].label}
        </p>
      </div>
    </div>
  );
}
