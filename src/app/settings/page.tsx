"use client";
/*
  Run in Supabase SQL Editor before using this page:

  alter table profiles          add column if not exists user_preferences jsonb default '{}'::jsonb;
  alter table profiles          add column if not exists is_suspended boolean default false;
  alter table profiles          add column if not exists avatar_url text;
  alter table yayinci_profiles  add column if not exists iban text;
  -- supporting columns used by this page:
  alter table marka_profiles    add column if not exists billing_address text;
  alter table marka_profiles    add column if not exists pro_expires_at timestamptz;
  alter table yayinci_profiles  add column if not exists pro_expires_at timestamptz;

  -- Public "avatars" storage bucket for profile photos:
  insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

  create policy "Users can upload own avatar"
    on storage.objects for insert to authenticated
    with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

  create policy "Anyone can view avatars"
    on storage.objects for select
    using (bucket_id = 'avatars');
*/

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Avatar from "@/components/Avatar";

type Role = "yayinci" | "marka" | null;
type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid" | "current";

type Prefs = {
  email_offer: boolean;
  email_delivery: boolean;
  email_message: boolean;
  site_notifications: boolean;
};

const DEFAULT_PREFS: Prefs = {
  email_offer: true,
  email_delivery: true,
  email_message: true,
  site_notifications: true,
};

const FREE_ACCOUNT_LIMIT = 5;
const PRO_ACCOUNT_LIMIT  = 15;

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const USERNAME_COOLDOWN_DAYS = 30;

const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const AVATAR_TYPES = ["image/jpeg", "image/png"];

type Tab = "account" | "notifications" | "security" | "subscription" | "payment";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "account",       label: "Hesap Bilgileri",     icon: "👤" },
  { id: "notifications", label: "Bildirim Tercihleri", icon: "🔔" },
  { id: "security",      label: "Gizlilik & Güvenlik", icon: "🔒" },
  { id: "subscription",  label: "Abonelik",            icon: "⭐" },
  { id: "payment",       label: "Ödeme Bilgileri",     icon: "💳" },
];

// ─── Turkish bank codes (5-digit national bank code inside the IBAN) ───────────

const BANK_CODES: Record<string, string> = {
  "00010": "Ziraat Bankası",
  "00012": "Halkbank",
  "00015": "VakıfBank",
  "00032": "TEB",
  "00046": "Akbank",
  "00059": "Şekerbank",
  "00062": "Garanti BBVA",
  "00064": "Türkiye İş Bankası",
  "00067": "Yapı Kredi",
  "00099": "ING",
  "00103": "Fibabanka",
  "00111": "QNB Finansbank",
  "00123": "HSBC",
  "00134": "DenizBank",
  "00146": "Odeabank",
  "00203": "Albaraka Türk",
  "00205": "Kuveyt Türk",
  "00206": "Türkiye Finans",
};

function detectBank(ibanRaw: string): string | null {
  const iban = ibanRaw.replace(/\s+/g, "").toUpperCase();
  if (!/^TR\d{2}\d{5}/.test(iban)) return null;
  return BANK_CODES[iban.slice(4, 9)] ?? null;
}

function formatIban(ibanRaw: string): string {
  const iban = ibanRaw.replace(/\s+/g, "").toUpperCase().slice(0, 26);
  return iban.replace(/(.{4})/g, "$1 ").trim();
}

function isValidIban(ibanRaw: string): boolean {
  const iban = ibanRaw.replace(/\s+/g, "").toUpperCase();
  return /^TR\d{24}$/.test(iban);
}

// ─── Device / session info ─────────────────────────────────────────────────────

function deviceInfo(): { browser: string; os: string } {
  if (typeof navigator === "undefined") return { browser: "Bilinmiyor", os: "Bilinmiyor" };
  const ua = navigator.userAgent;
  let browser = "Tarayıcı";
  if (/Edg\//.test(ua))            browser = "Microsoft Edge";
  else if (/OPR\//.test(ua))       browser = "Opera";
  else if (/Chrome\//.test(ua))    browser = "Google Chrome";
  else if (/Firefox\//.test(ua))   browser = "Mozilla Firefox";
  else if (/Safari\//.test(ua))    browser = "Safari";
  let os = "Cihaz";
  if (/Windows/.test(ua))          os = "Windows";
  else if (/Mac OS X/.test(ua))    os = "macOS";
  else if (/Android/.test(ua))     os = "Android";
  else if (/iPhone|iPad/.test(ua)) os = "iOS";
  else if (/Linux/.test(ua))       os = "Linux";
  return { browser, os };
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

// Username may only be changed once every USERNAME_COOLDOWN_DAYS. Returns whether
// the change is currently locked, how many days remain, and the next allowed date.
function usernameCooldown(changedAt: string | null): { locked: boolean; daysLeft: number; nextDate: string } {
  if (!changedAt) return { locked: false, daysLeft: 0, nextDate: "" };
  const nextMs = new Date(changedAt).getTime() + USERNAME_COOLDOWN_DAYS * 86_400_000;
  const diff = nextMs - Date.now();
  if (diff <= 0) return { locked: false, daysLeft: 0, nextDate: "" };
  return { locked: true, daysLeft: Math.ceil(diff / 86_400_000), nextDate: fmtDate(new Date(nextMs).toISOString()) };
}

// ─── Shared UI ─────────────────────────────────────────────────────────────────

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
      <div className="mb-5 pb-3 border-b border-gray-100">
        <h2 className="text-base font-extrabold" style={{ color: "#042C53" }}>{title}</h2>
        {desc && <p className="text-xs text-gray-400 mt-1">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
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

function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors"
        style={{ backgroundColor: checked ? "#185FA5" : "#D1D5DB" }}
      >
        <span
          className="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? "translateX(22px)" : "translateX(2px)" }}
        />
      </button>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/20";
const primaryBtn = "rounded-xl py-3 px-5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();

  const [pageLoading, setPageLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("account");
  const [role, setRole]   = useState<Role>(null);
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");

  // Avatar
  const [avatarUrl, setAvatarUrl]         = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarErr, setAvatarErr]         = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Account info
  const [displayName, setDisplayName]   = useState("");
  const [username, setUsername]         = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [usernameChangedAt, setUsernameChangedAt] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus]     = useState<UsernameStatus>("idle");
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountMsg, setAccountMsg]       = useState("");
  const [accountErr, setAccountErr]       = useState("");

  // Password
  const [curPw, setCurPw]       = useState("");
  const [newPw, setNewPw]       = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg]       = useState("");
  const [pwErr, setPwErr]       = useState("");

  // Preferences
  const [prefs, setPrefs]       = useState<Prefs>(DEFAULT_PREFS);
  const [prefsSaved, setPrefsSaved] = useState(false);

  // Subscription / role data
  const [isPro, setIsPro]             = useState(false);
  const [proExpiresAt, setProExpiresAt] = useState<string | null>(null);
  const [accountCount, setAccountCount] = useState(0);

  // Payment info — yayinci
  const [iban, setIban]         = useState("");
  const [ibanSaving, setIbanSaving] = useState(false);
  const [ibanMsg, setIbanMsg]   = useState("");
  const [ibanErr, setIbanErr]   = useState("");

  // Payment info — marka
  const [companyName, setCompanyName]   = useState("");
  const [taxNumber, setTaxNumber]       = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingSaving, setBillingSaving] = useState(false);
  const [billingMsg, setBillingMsg]     = useState("");

  // Danger zone
  const [showSuspend, setShowSuspend]   = useState(false);
  const [suspending, setSuspending]     = useState(false);
  const [showDelete, setShowDelete]     = useState(false);
  const [deleteText, setDeleteText]     = useState("");
  const [deleting, setDeleting]         = useState(false);
  const [deleteErr, setDeleteErr]       = useState("");

  const DELETE_PHRASE = "HESABIMI SİL";
  const device = deviceInfo();

  // ── Load ──
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      setUserId(user.id);
      setEmail(user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, display_name, username, user_preferences, username_changed_at, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) { setPageLoading(false); return; }

      const r = (profile.role ?? null) as Role;
      setRole(r);
      setAvatarUrl(profile.avatar_url ?? null);
      setDisplayName(profile.display_name ?? "");
      setUsername(profile.username ?? "");
      setOriginalUsername(profile.username ?? "");
      setUsernameChangedAt(profile.username_changed_at ?? null);
      setPrefs({ ...DEFAULT_PREFS, ...(profile.user_preferences ?? {}) });

      if (r === "marka") {
        const { data: mp } = await supabase
          .from("marka_profiles")
          .select("company_name, tax_number, is_pro, pro_expires_at, billing_address")
          .eq("id", user.id)
          .maybeSingle();
        if (mp) {
          setCompanyName(mp.company_name ?? "");
          setTaxNumber(mp.tax_number ?? "");
          setIsPro(mp.is_pro === true);
          setProExpiresAt(mp.pro_expires_at ?? null);
          setBillingAddress(mp.billing_address ?? "");
        }
      } else if (r === "yayinci") {
        const { data: yp } = await supabase
          .from("yayinci_profiles")
          .select("is_pro, pro_expires_at, social_accounts, iban")
          .eq("id", user.id)
          .maybeSingle();
        if (yp) {
          setIsPro(yp.is_pro === true);
          setProExpiresAt(yp.pro_expires_at ?? null);
          setAccountCount(Array.isArray(yp.social_accounts) ? yp.social_accounts.length : 0);
          setIban(yp.iban ? formatIban(yp.iban) : "");
        }
      }

      setPageLoading(false);
    }
    load();
  }, [router]);

  // ── Username availability ──
  function handleUsernameChange(raw: string) {
    const val = raw.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
    setUsername(val);
    setAccountMsg(""); setAccountErr("");

    if (usernameTimer.current) clearTimeout(usernameTimer.current);

    if (val === originalUsername) { setUsernameStatus("current"); return; }
    if (!val) { setUsernameStatus("idle"); return; }
    if (!USERNAME_RE.test(val)) { setUsernameStatus("invalid"); return; }

    setUsernameStatus("checking");
    usernameTimer.current = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase.from("profiles").select("id").eq("username", val).maybeSingle();
      setUsernameStatus(data ? "taken" : "available");
    }, 500);
  }

  // ── Avatar upload ──
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setAvatarErr("");
    if (!AVATAR_TYPES.includes(file.type)) { setAvatarErr("Sadece JPG veya PNG yükleyebilirsin."); return; }
    if (file.size > AVATAR_MAX_BYTES)      { setAvatarErr("Dosya boyutu 2 MB'tan büyük olamaz."); return; }

    setAvatarUploading(true);
    const supabase = createClient();
    const ext  = file.type === "image/png" ? "png" : "jpg";
    // Folder must be the user id for the storage RLS policy to allow the write.
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { contentType: file.type, upsert: true });

    if (uploadErr) {
      setAvatarUploading(false);
      setAvatarErr("Yükleme başarısız: " + uploadErr.message);
      return;
    }

    // Cache-bust so the overwritten image refreshes immediately everywhere.
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${publicUrl}?t=${Date.now()}`;

    const { error: saveErr } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);
    setAvatarUploading(false);
    if (saveErr) { setAvatarErr("Kaydedilemedi: " + saveErr.message); return; }

    setAvatarUrl(url);
  }

  async function saveAccount() {
    setAccountMsg(""); setAccountErr("");
    if (!displayName.trim()) { setAccountErr("Görünen ad boş olamaz."); return; }
    const changed = username !== originalUsername;
    if (changed) {
      const cd = usernameCooldown(usernameChangedAt);
      if (cd.locked) {
        setAccountErr(`Kullanıcı adınızı ${cd.daysLeft} gün sonra (${cd.nextDate}) değiştirebilirsiniz.`);
        return;
      }
      if (!USERNAME_RE.test(username)) { setAccountErr("Kullanıcı adı 3-20 karakter; sadece a-z, 0-9 ve _."); return; }
      if (usernameStatus === "taken")  { setAccountErr("Bu kullanıcı adı alınmış."); return; }
      if (usernameStatus === "checking") { setAccountErr("Kullanıcı adı kontrol ediliyor, lütfen bekle."); return; }
    }

    setSavingAccount(true);
    const supabase = createClient();
    const nowIso = new Date().toISOString();
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        username: username.trim(),
        ...(changed ? { username_changed_at: nowIso } : {}),
      })
      .eq("id", userId);
    setSavingAccount(false);

    if (error) {
      setAccountErr(error.message.includes("duplicate") ? "Bu kullanıcı adı alınmış." : "Kayıt hatası: " + error.message);
      return;
    }
    setOriginalUsername(username.trim());
    if (changed) setUsernameChangedAt(nowIso);
    setUsernameStatus("current");
    setAccountMsg("Hesap bilgilerin güncellendi.");
  }

  // ── Password ──
  async function changePassword() {
    setPwMsg(""); setPwErr("");
    if (!curPw)             { setPwErr("Mevcut şifreni gir."); return; }
    if (newPw.length < 6)   { setPwErr("Yeni şifre en az 6 karakter olmalı."); return; }
    if (newPw !== confirmPw) { setPwErr("Yeni şifreler eşleşmiyor."); return; }

    setPwSaving(true);
    const supabase = createClient();

    // Verify current password by re-authenticating
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: curPw });
    if (signInErr) {
      setPwSaving(false);
      setPwErr("Mevcut şifre hatalı.");
      return;
    }

    const { error: updErr } = await supabase.auth.updateUser({ password: newPw });
    setPwSaving(false);
    if (updErr) { setPwErr("Şifre güncellenemedi: " + updErr.message); return; }

    setCurPw(""); setNewPw(""); setConfirmPw("");
    setPwMsg("Şifren başarıyla değiştirildi.");
  }

  // ── Preferences (auto-save on toggle) ──
  async function updatePref(key: keyof Prefs, value: boolean) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setPrefsSaved(false);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ user_preferences: next }).eq("id", userId);
    if (!error) {
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 2000);
    }
  }

  // ── IBAN ──
  async function saveIban() {
    setIbanMsg(""); setIbanErr("");
    const compact = iban.replace(/\s+/g, "").toUpperCase();
    if (compact && !isValidIban(compact)) { setIbanErr("Geçerli bir IBAN gir (TR + 24 rakam)."); return; }
    setIbanSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("yayinci_profiles").update({ iban: compact || null }).eq("id", userId);
    setIbanSaving(false);
    if (error) { setIbanErr("Kayıt hatası: " + error.message); return; }
    setIbanMsg("IBAN bilgin kaydedildi.");
  }

  // ── Billing (marka) ──
  async function saveBilling() {
    setBillingMsg("");
    setBillingSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("marka_profiles")
      .update({ company_name: companyName.trim(), billing_address: billingAddress.trim() || null })
      .eq("id", userId);
    setBillingSaving(false);
    if (error) { setBillingMsg("Kayıt hatası: " + error.message); return; }
    setBillingMsg("Ödeme bilgilerin kaydedildi.");
  }

  // ── Suspend ──
  async function suspendAccount() {
    setSuspending(true);
    const supabase = createClient();
    await supabase.from("profiles").update({ is_suspended: true }).eq("id", userId);
    await supabase.auth.signOut();
    router.push("/");
  }

  // ── Delete ──
  async function deleteAccount() {
    setDeleteErr("");
    setDeleting(true);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setDeleting(false); setDeleteErr("Oturum bulunamadı. Tekrar giriş yap."); return; }

    const res = await fetch("/api/account/delete", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setDeleting(false);
      setDeleteErr(body.error ?? "Hesap silinemedi.");
      return;
    }

    await supabase.auth.signOut();
    router.push("/");
  }

  const ibanBank = detectBank(iban);
  const accountLimit = isPro ? PRO_ACCOUNT_LIMIT : FREE_ACCOUNT_LIMIT;
  const usernameLock = usernameCooldown(usernameChangedAt);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* ── Suspend modal ── */}
      {showSuspend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(4,44,83,0.45)", backdropFilter: "blur(2px)" }} onClick={(e) => { if (e.target === e.currentTarget) setShowSuspend(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-base font-extrabold" style={{ color: "#042C53" }}>Hesabı Askıya Al</h3>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 leading-relaxed">
                Hesabın askıya alınacak ve oturumun kapatılacak. Profilin markalara ve yayıncılara görünmeyecek. Tekrar giriş yaparak hesabını yeniden aktif edebilirsin.
              </p>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={suspendAccount} disabled={suspending} className="flex-1 rounded-xl py-3 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors disabled:opacity-60">
                {suspending ? "İşleniyor…" : "Evet, Askıya Al"}
              </button>
              <button onClick={() => setShowSuspend(false)} className="flex-1 rounded-xl py-3 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete modal ── */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(4,44,83,0.45)", backdropFilter: "blur(2px)" }} onClick={(e) => { if (e.target === e.currentTarget && !deleting) { setShowDelete(false); setDeleteText(""); } }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-base font-extrabold text-red-600">Hesabı Kalıcı Olarak Sil</h3>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Bu işlem <strong>geri alınamaz</strong>. Profilin, tüm verilerin ve bildirimlerin kalıcı olarak silinecek. Onaylamak için aşağıya <strong>{DELETE_PHRASE}</strong> yaz.
              </p>
              <input
                type="text"
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                placeholder={DELETE_PHRASE}
                className={inputCls}
              />
              {deleteErr && <p className="text-xs text-red-600 mt-2">{deleteErr}</p>}
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={deleteAccount}
                disabled={deleting || deleteText !== DELETE_PHRASE}
                className="flex-1 rounded-xl py-3 text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleting ? "Siliniyor…" : "Hesabımı Kalıcı Sil"}
              </button>
              <button onClick={() => { setShowDelete(false); setDeleteText(""); setDeleteErr(""); }} disabled={deleting} className="flex-1 rounded-xl py-3 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-60">
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold" style={{ color: "#042C53" }}>Ayarlar</h1>
            <p className="text-sm text-gray-500 mt-1">Hesabını, bildirimlerini ve güvenliğini yönet.</p>
          </div>
          <a href="/dashboard" className="text-sm font-semibold hover:underline" style={{ color: "#185FA5" }}>
            ← Dashboard
          </a>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-start">

          {/* ── Sidebar (desktop) / horizontal tabs (mobile) ── */}
          <aside className="w-full md:w-56 md:flex-shrink-0 md:sticky md:top-20">
            <nav className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-visible pb-1 md:pb-0 -mx-1 px-1">
              {TABS.map((t) => {
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 text-left ${active ? "text-white shadow-sm" : "text-gray-600 hover:bg-[#E6F1FB] hover:text-[#185FA5]"}`}
                    style={active ? { backgroundColor: "#185FA5" } : undefined}
                  >
                    <span className="text-base">{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* ── Active section content ── */}
          <div className="flex-1 min-w-0 w-full flex flex-col gap-5">

          {/* ── 1. HESAP BİLGİLERİ ── */}
          {activeTab === "account" && (
          <Section title="Hesap Bilgileri" desc="Görünen adın, kullanıcı adın ve giriş bilgilerin.">
            {/* Profile photo */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
              <Avatar src={avatarUrl} name={displayName || username || "?"} sizeClass="w-20 h-20" textClass="text-2xl font-black" rounded="rounded-full" />
              <div className="min-w-0">
                <p className="text-sm font-bold mb-0.5" style={{ color: "#042C53" }}>Profil Fotoğrafı</p>
                <p className="text-xs text-gray-400 mb-2.5">JPG veya PNG, en fazla 2 MB.</p>
                <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png" onChange={handleAvatarChange} className="hidden" />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold transition-all hover:bg-gray-50 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ color: "#185FA5" }}
                >
                  {avatarUploading ? "Yükleniyor…" : avatarUrl ? "Fotoğrafı Değiştir" : "Fotoğraf Yükle"}
                </button>
                {avatarErr && <p className="text-xs text-red-600 mt-2">{avatarErr}</p>}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Field label="Görünen Ad">
                <input type="text" value={displayName} onChange={(e) => { setDisplayName(e.target.value); setAccountMsg(""); setAccountErr(""); }} placeholder="Görünen adın" className={inputCls} />
              </Field>

              <Field label="Kullanıcı Adı" hint="3-20 karakter; a-z, 0-9, _">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">@</span>
                  <input type="text" value={username} onChange={(e) => handleUsernameChange(e.target.value)} placeholder="kullanici_adi" className={inputCls + " pl-8 pr-10"} autoComplete="username" />
                  {usernameStatus === "checking" && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">…</span>}
                  {usernameStatus === "available" && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 font-bold">✓</span>}
                  {(usernameStatus === "taken" || usernameStatus === "invalid") && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 font-bold">✗</span>}
                </div>
                {usernameStatus === "available" && <p className="text-xs text-green-600 mt-1">Kullanılabilir</p>}
                {usernameStatus === "taken" && <p className="text-xs text-red-600 mt-1">Bu kullanıcı adı alınmış</p>}
                {usernameStatus === "invalid" && <p className="text-xs text-red-600 mt-1">En az 3 karakter; sadece a-z, 0-9 ve _</p>}
                {usernameLock.locked && (
                  <p className="text-xs text-amber-600 mt-1">
                    🔒 Kullanıcı adınızı {usernameLock.daysLeft} gün sonra ({usernameLock.nextDate}) değiştirebilirsiniz.
                  </p>
                )}
              </Field>

              <Field label="E-posta" hint="değiştirilemez">
                <input type="email" value={email} readOnly disabled className={inputCls + " bg-gray-50 text-gray-500 cursor-not-allowed"} />
              </Field>

              {accountErr && <p className="text-sm text-red-600">{accountErr}</p>}
              {accountMsg && <p className="text-sm text-emerald-600 font-medium">✓ {accountMsg}</p>}

              <button onClick={saveAccount} disabled={savingAccount} className={primaryBtn + " w-full"} style={{ backgroundColor: "#185FA5" }}>
                {savingAccount ? "Kaydediliyor…" : "Bilgileri Kaydet"}
              </button>
            </div>

            {/* Change password */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-bold mb-4" style={{ color: "#042C53" }}>Şifre Değiştir</h3>
              <div className="flex flex-col gap-4">
                <Field label="Mevcut Şifre">
                  <input type="password" value={curPw} onChange={(e) => { setCurPw(e.target.value); setPwMsg(""); setPwErr(""); }} placeholder="••••••••" className={inputCls} autoComplete="current-password" />
                </Field>
                <Field label="Yeni Şifre" hint="en az 6 karakter">
                  <input type="password" value={newPw} onChange={(e) => { setNewPw(e.target.value); setPwMsg(""); setPwErr(""); }} placeholder="••••••••" className={inputCls} autoComplete="new-password" />
                </Field>
                <Field label="Yeni Şifre (Tekrar)">
                  <input type="password" value={confirmPw} onChange={(e) => { setConfirmPw(e.target.value); setPwMsg(""); setPwErr(""); }} placeholder="••••••••" className={inputCls} autoComplete="new-password" />
                </Field>

                {pwErr && <p className="text-sm text-red-600">{pwErr}</p>}
                {pwMsg && <p className="text-sm text-emerald-600 font-medium">✓ {pwMsg}</p>}

                <button onClick={changePassword} disabled={pwSaving} className={primaryBtn + " w-full"} style={{ backgroundColor: "#185FA5" }}>
                  {pwSaving ? "Güncelleniyor…" : "Şifreyi Güncelle"}
                </button>
              </div>
            </div>
          </Section>
          )}

          {/* ── 2. BİLDİRİM TERCİHLERİ ── */}
          {activeTab === "notifications" && (
          <Section title="Bildirim Tercihleri" desc="Hangi durumlarda bilgilendirilmek istediğini seç.">
            <div className="divide-y divide-gray-100">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 pb-2">E-posta Bildirimleri</p>
              <Toggle checked={prefs.email_offer}    onChange={(v) => updatePref("email_offer", v)}    label="Teklif bildirimleri"  desc="Yeni teklif, kabul ve red durumları" />
              <Toggle checked={prefs.email_delivery} onChange={(v) => updatePref("email_delivery", v)} label="Teslim bildirimleri"  desc="Teslim tarihi, içerik teslimi ve onay" />
              <Toggle checked={prefs.email_message}  onChange={(v) => updatePref("email_message", v)}  label="Mesaj bildirimleri"   desc="Yeni mesaj geldiğinde e-posta gönder" />
            </div>
            <div className="divide-y divide-gray-100 mt-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 pb-2">Site İçi Bildirimler</p>
              <Toggle checked={prefs.site_notifications} onChange={(v) => updatePref("site_notifications", v)} label="Site içi bildirimler" desc="Bildirim zilinde anlık bildirimler göster" />
            </div>
            {prefsSaved && <p className="text-xs text-emerald-600 font-medium mt-3">✓ Tercihlerin kaydedildi</p>}
          </Section>
          )}

          {/* ── 4. ABONELİK ── */}
          {activeTab === "subscription" && (
          <Section title="Abonelik" desc="Planını ve avantajlarını yönet.">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Mevcut Plan</p>
                  <p className="text-lg font-extrabold flex items-center gap-2" style={{ color: "#042C53" }}>
                    {isPro ? "⭐ Pro" : "Ücretsiz"}
                  </p>
                </div>
                {isPro && (
                  <span className="text-xs font-bold text-white rounded-full px-3 py-1.5" style={{ backgroundColor: "#185FA5" }}>Aktif</span>
                )}
              </div>

              {isPro && (
                <p className="text-xs text-gray-500 mt-3">Yenileme tarihi: <span className="font-semibold text-gray-700">{fmtDate(proExpiresAt)}</span></p>
              )}

              {role === "yayinci" && (
                <p className="text-xs text-gray-500 mt-3">
                  Hesap kullanımı: <span className="font-semibold text-gray-700">{accountCount}/{accountLimit}</span> sosyal medya hesabı
                </p>
              )}
            </div>

            {!isPro && (
              <a
                href={role === "marka" ? "/marka/pro" : "/yayinci/pro"}
                className="mt-4 flex items-center justify-between rounded-xl px-5 py-4 text-white transition-all hover:opacity-95"
                style={{ background: "linear-gradient(135deg, #042C53 0%, #185FA5 100%)" }}
              >
                <div>
                  <p className="text-sm font-bold">{role === "marka" ? "Marka Pro Ol" : "Yayıncı Pro Ol"}</p>
                  <p className="text-xs text-blue-100 mt-0.5">
                    {role === "marka"
                      ? "Tüm profillere tam erişim ve teklif gönderme"
                      : `${PRO_ACCOUNT_LIMIT} hesaba kadar ekle ve öne çık`}
                  </p>
                </div>
                <span className="text-sm font-black whitespace-nowrap">299 TL/ay →</span>
              </a>
            )}
          </Section>
          )}

          {/* ── 5. ÖDEME BİLGİLERİ ── */}
          {activeTab === "payment" && (
          <Section title="Ödeme Bilgileri" desc={role === "yayinci" ? "Kazançlarının yatırılacağı banka hesabı." : "Fatura bilgilerin."}>
            {role === "yayinci" ? (
              <div className="flex flex-col gap-4">
                <Field label="IBAN" hint="TR ile başlayan 26 haneli" error={ibanErr}>
                  <input
                    type="text"
                    value={iban}
                    onChange={(e) => { setIban(formatIban(e.target.value)); setIbanMsg(""); setIbanErr(""); }}
                    placeholder="TR00 0000 0000 0000 0000 0000 00"
                    className={inputCls + " font-mono tracking-wide"}
                  />
                  {ibanBank && (
                    <p className="text-xs text-emerald-600 mt-1.5 font-medium">🏦 {ibanBank}</p>
                  )}
                </Field>
                {ibanMsg && <p className="text-sm text-emerald-600 font-medium">✓ {ibanMsg}</p>}
                <button onClick={saveIban} disabled={ibanSaving} className={primaryBtn + " w-full"} style={{ backgroundColor: "#185FA5" }}>
                  {ibanSaving ? "Kaydediliyor…" : "Kaydet"}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <Field label="Şirket Adı">
                  <input type="text" value={companyName} onChange={(e) => { setCompanyName(e.target.value); setBillingMsg(""); }} placeholder="Şirket / marka adınız" className={inputCls} />
                </Field>
                <Field label="Vergi Kimlik Numarası (VKN)" hint="değiştirilemez">
                  <input type="text" value={taxNumber || "—"} readOnly disabled className={inputCls + " bg-gray-50 text-gray-500 cursor-not-allowed"} />
                </Field>
                <Field label="Fatura Adresi">
                  <textarea rows={3} value={billingAddress} onChange={(e) => { setBillingAddress(e.target.value); setBillingMsg(""); }} placeholder="Fatura adresinizi girin" className={inputCls + " resize-none"} />
                </Field>
                {billingMsg && <p className={"text-sm font-medium " + (billingMsg.startsWith("Kayıt hatası") ? "text-red-600" : "text-emerald-600")}>{billingMsg.startsWith("Kayıt hatası") ? billingMsg : "✓ " + billingMsg}</p>}
                <button onClick={saveBilling} disabled={billingSaving} className={primaryBtn + " w-full"} style={{ backgroundColor: "#185FA5" }}>
                  {billingSaving ? "Kaydediliyor…" : "Kaydet"}
                </button>
              </div>
            )}
          </Section>
          )}

          {/* ── 3. GİZLİLİK & GÜVENLİK ── */}
          {activeTab === "security" && (
          <Section title="Gizlilik & Güvenlik" desc="Oturumun ve hesap durumun.">
            {/* Active session card */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: "#E6F1FB" }}>💻</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold" style={{ color: "#042C53" }}>Şu an aktif oturum</p>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">AKTİF</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{device.browser} · {device.os}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{email}</p>
              </div>
            </div>

            {/* Suspend */}
            <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50/50 p-5">
              <h3 className="text-sm font-bold text-amber-800 mb-1">Hesabı Askıya Al</h3>
              <p className="text-xs text-amber-600 mb-4">Hesabın geçici olarak devre dışı kalır. Tekrar giriş yaparak yeniden aktif edebilirsin.</p>
              <button onClick={() => setShowSuspend(true)} className="rounded-xl border-2 border-amber-300 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 transition-colors">
                Hesabı Askıya Al
              </button>
            </div>

            {/* Delete */}
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50/50 p-5">
              <h3 className="text-sm font-bold text-red-700 mb-1">Hesabı Kalıcı Sil</h3>
              <p className="text-xs text-red-400 mb-4">Tüm verilerin kalıcı olarak silinir. Bu işlem geri alınamaz.</p>
              <button onClick={() => setShowDelete(true)} className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 transition-colors">
                Hesabı Kalıcı Sil
              </button>
            </div>
          </Section>
          )}

          </div>
        </div>
      </div>
    </div>
  );
}
