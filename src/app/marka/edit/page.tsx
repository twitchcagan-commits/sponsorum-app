"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

// ─── Constants ────────────────────────────────────────────────────────────────

const SECTORS = ["E-ticaret", "Oyun", "Teknoloji", "Gıda", "Moda", "Spor", "Diğer"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validateTaxNumber(v: string): string {
  if (!v) return "Vergi numarası zorunludur.";
  if (!/^\d+$/.test(v)) return "Yalnızca rakam giriniz.";
  if (v.length !== 10)  return "Vergi numarası tam 10 haneli olmalıdır.";
  return "";
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
      <h2 className="text-base font-extrabold mb-5 pb-3 border-b border-gray-100" style={{ color: "#042C53" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label, hint, error, children,
}: {
  label: string; hint?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">
        {label}
        {hint && <span className="font-normal text-gray-400 ml-1">({hint})</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/20";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MarkaEditPage() {
  const router = useRouter();

  const [pageLoading, setPageLoading] = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // profiles table
  const [displayName,  setDisplayName]  = useState("");

  // marka_profiles table
  const [companyName,  setCompanyName]  = useState("");
  const [taxNumber,    setTaxNumber]    = useState("");
  const [sector,       setSector]       = useState(SECTORS[0]);
  const [website,      setWebsite]      = useState("");
  const [phone,        setPhone]        = useState("");
  const [contactName,  setContactName]  = useState("");
  const [contactTitle, setContactTitle] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Load ──

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, display_name")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role !== "marka") { router.push("/dashboard"); return; }

      setDisplayName(profile.display_name ?? "");

      const { data: mp } = await supabase
        .from("marka_profiles")
        .select("company_name, tax_number, sector, website, phone, contact_name, contact_title")
        .eq("id", user.id)
        .maybeSingle();

      if (mp) {
        setCompanyName(mp.company_name  ?? "");
        setTaxNumber(  mp.tax_number    ?? "");
        setSector(     mp.sector        ?? SECTORS[0]);
        setWebsite(    mp.website       ?? "");
        setPhone(      mp.phone         ?? "");
        setContactName( mp.contact_name  ?? "");
        setContactTitle(mp.contact_title ?? "");
      }

      setPageLoading(false);
    }
    load();
  }, [router]);

  // ── Validation ──

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!displayName.trim())  errs.displayName  = "Marka adı zorunludur.";
    if (!companyName.trim())  errs.companyName  = "Şirket adı zorunludur.";
    const taxErr = validateTaxNumber(taxNumber);
    if (taxErr)               errs.taxNumber    = taxErr;
    if (!contactName.trim())  errs.contactName  = "Ad soyad zorunludur.";
    if (!contactTitle.trim()) errs.contactTitle = "Ünvan zorunludur.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Save ──

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const [profileRes, markaRes] = await Promise.all([
      supabase
        .from("profiles")
        .update({ display_name: displayName.trim() })
        .eq("id", user.id),
      supabase
        .from("marka_profiles")
        .upsert({
          id:            user.id,
          company_name:  companyName.trim(),
          tax_number:    taxNumber.trim(),
          sector,
          website:       website.trim() || null,
          phone:         phone.trim() || null,
          contact_name:  contactName.trim(),
          contact_title: contactTitle.trim(),
        }, { onConflict: "id" }),
    ]);

    if (profileRes.error || markaRes.error) {
      setSaveError("Kayıt hatası: " + (profileRes.error?.message ?? markaRes.error?.message));
      setSaving(false);
      return;
    }

    setSaveSuccess(true);
    setSaving(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Loading ──

  if (pageLoading) {
    return (
      <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #E6F1FB 0%, #ffffff 60%)" }}>
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#185FA5", borderTopColor: "transparent" }} />
        </div>
      </div>
    );
  }

  // ── Render ──

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold" style={{ color: "#042C53" }}>Profili Düzenle</h1>
            <p className="text-sm text-gray-500 mt-1">Marka profilini güncel tut.</p>
          </div>
          <a href="/dashboard" className="text-sm font-semibold hover:underline" style={{ color: "#185FA5" }}>
            ← Dashboard
          </a>
        </div>

        {/* Success banner */}
        {saveSuccess && (
          <div className="mb-6 rounded-2xl px-5 py-4 flex items-center gap-3 text-sm font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200">
            <span className="text-lg">✅</span>
            Profilin başarıyla güncellendi!
          </div>
        )}

        <div className="flex flex-col gap-5">

          {/* ── Hesap Bilgileri ── */}
          <Section title="Hesap Bilgileri">
            <Field label="Marka Adı" error={errors.displayName}>
              <input
                type="text"
                placeholder="Görünen marka adınız"
                value={displayName}
                onChange={(e) => { setDisplayName(e.target.value); setErrors((p) => ({ ...p, displayName: "" })); }}
                className={inputCls}
              />
            </Field>
          </Section>

          {/* ── Şirket Bilgileri ── */}
          <Section title="Şirket Bilgileri">
            <div className="flex flex-col gap-4">

              <Field label="Şirket / Marka Adı" error={errors.companyName}>
                <input
                  type="text"
                  placeholder="Örn: Acme A.Ş."
                  value={companyName}
                  onChange={(e) => { setCompanyName(e.target.value); setErrors((p) => ({ ...p, companyName: "" })); }}
                  className={inputCls}
                />
              </Field>

              <Field label="Vergi Numarası" hint="10 hane" error={errors.taxNumber}>
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
                  {taxNumber.length === 10 && !errors.taxNumber && (
                    <p className="text-xs text-green-600">✓ Geçerli vergi numarası</p>
                  )}
                  <p className="text-xs text-gray-400 ml-auto">{taxNumber.length}/10</p>
                </div>
              </Field>

              <Field label="Sektör">
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className={inputCls + " bg-white"}
                >
                  {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>

              <Field label="Web Sitesi" hint="isteğe bağlı">
                <input
                  type="url"
                  placeholder="https://sirketiniz.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className={inputCls}
                />
              </Field>

              <Field label="Şirket Telefonu" hint="isteğe bağlı">
                <input
                  type="tel"
                  placeholder="0212 000 00 00"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputCls}
                />
              </Field>

            </div>
          </Section>

          {/* ── İletişim Kişisi ── */}
          <Section title="İletişim Kişisi">
            <div className="flex flex-col gap-4">

              <Field label="Ad Soyad" error={errors.contactName}>
                <input
                  type="text"
                  placeholder="Ahmet Yılmaz"
                  value={contactName}
                  onChange={(e) => { setContactName(e.target.value); setErrors((p) => ({ ...p, contactName: "" })); }}
                  className={inputCls}
                />
              </Field>

              <Field label="Ünvan / Pozisyon" error={errors.contactTitle}>
                <input
                  type="text"
                  placeholder="Pazarlama Müdürü"
                  value={contactTitle}
                  onChange={(e) => { setContactTitle(e.target.value); setErrors((p) => ({ ...p, contactTitle: "" })); }}
                  className={inputCls}
                />
              </Field>

            </div>
          </Section>

          {/* Save */}
          {saveError && (
            <div className="rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">
              {saveError}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-2xl py-4 text-base font-semibold text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            style={{ backgroundColor: "#185FA5" }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.backgroundColor = "#042C53"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#185FA5"; }}
          >
            {saving ? "Kaydediliyor…" : "Değişiklikleri Kaydet ✓"}
          </button>

        </div>
      </div>
    </div>
  );
}
