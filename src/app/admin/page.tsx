"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ApprovalStatus = "pending" | "approved" | "rejected";
type DealStatus = "Tamamlandı" | "Ödeme Bekleniyor" | "İçerik Üretiminde" | "İptal Edildi" | "Anlaşmazlık";
type DisputeStatus = "İnceleniyor" | "Çözüldü" | "Beklemede";

type PendingCreator = {
  id: number;
  username: string;
  initials: string;
  platforms: string[];
  followers: number;
  registeredAt: string;
  status: ApprovalStatus;
};

type Dispute = {
  id: string;
  marka: string;
  yayinci: string;
  amount: number;
  reason: string;
  status: DisputeStatus;
};

type Deal = {
  id: string;
  marka: string;
  yayinci: string;
  amount: number;
  status: DealStatus;
  date: string;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const STATS = [
  { label: "Toplam Kullanıcı", value: "1.248",  icon: "👥", delta: "+12 bu hafta" },
  { label: "Aktif Anlaşma",    value: "37",      icon: "🤝", delta: "+5 bu hafta" },
  { label: "Bekleyen Onay",    value: "8",       icon: "⏳", delta: "4 yeni bugün" },
  { label: "Aylık Gelir",      value: "₺42.300", icon: "💰", delta: "+%18 geçen ay" },
];

const INITIAL_CREATORS: PendingCreator[] = [
  { id: 1, username: "techreviewer",  initials: "MÖ", platforms: ["YouTube"],             followers: 210000, registeredAt: "24.05.2026", status: "pending" },
  { id: 2, username: "lifestyle_tr",  initials: "AK", platforms: ["Instagram"],            followers: 45000,  registeredAt: "25.05.2026", status: "pending" },
  { id: 3, username: "muzisyencan",   initials: "CY", platforms: ["TikTok", "YouTube"],    followers: 18000,  registeredAt: "26.05.2026", status: "pending" },
  { id: 4, username: "sporcu_mert",   initials: "MK", platforms: ["Instagram", "X"],       followers: 32000,  registeredAt: "27.05.2026", status: "pending" },
];

const DISPUTES: Dispute[] = [
  { id: "#ANL-001", marka: "Monster Energy", yayinci: "@gamerturk",   amount: 3500, reason: "İçerik Onaylanmadı", status: "İnceleniyor" },
  { id: "#ANL-002", marka: "Nike TR",        yayinci: "@futboleditr", amount: 2000, reason: "Geç Teslimat",       status: "Beklemede"   },
];

const DEALS: Deal[] = [
  { id: "#ANL-037", marka: "Razer",      yayinci: "@gamerturk",    amount: 3500, status: "Tamamlandı",        date: "27.05.2026" },
  { id: "#ANL-036", marka: "Puma TR",    yayinci: "@mizahkral",    amount: 6000, status: "Ödeme Bekleniyor",  date: "26.05.2026" },
  { id: "#ANL-035", marka: "Samsung TR", yayinci: "@techreviewer", amount: 5000, status: "İçerik Üretiminde", date: "25.05.2026" },
  { id: "#ANL-034", marka: "Red Bull",   yayinci: "@beatmaker34",  amount: 2500, status: "Tamamlandı",        date: "24.05.2026" },
  { id: "#ANL-033", marka: "Adidas",     yayinci: "@lifewithayse", amount: 1200, status: "İptal Edildi",      date: "23.05.2026" },
];

// ─── Style helpers ────────────────────────────────────────────────────────────

const DEAL_STATUS_STYLE: Record<DealStatus, { bg: string; text: string }> = {
  "Tamamlandı":        { bg: "#ECFDF5", text: "#065F46" },
  "Ödeme Bekleniyor":  { bg: "#FFFBEB", text: "#92400E" },
  "İçerik Üretiminde": { bg: "#EBF4FF", text: "#185FA5" },
  "İptal Edildi":      { bg: "#FEF2F2", text: "#991B1B" },
  "Anlaşmazlık":       { bg: "#FEF2F2", text: "#991B1B" },
};

const DISPUTE_STATUS_STYLE: Record<DisputeStatus, { bg: string; text: string }> = {
  "İnceleniyor": { bg: "#FFFBEB", text: "#92400E" },
  "Çözüldü":     { bg: "#ECFDF5", text: "#065F46" },
  "Beklemede":   { bg: "#F3F4F6", text: "#6B7280" },
};

function Chip({ label, style }: { label: string; style: { bg: string; text: string } }) {
  return (
    <span className="inline-block text-xs font-semibold rounded-full px-2.5 py-1" style={{ backgroundColor: style.bg, color: style.text }}>
      {label}
    </span>
  );
}

function fmt(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(0) + "K";
  return String(n);
}

// ─── Login screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    if (pw === "sponsorum2026") {
      onLogin();
    } else {
      setError("Hatalı şifre. Lütfen tekrar dene.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg, #042C53 0%, #185FA5 100%)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl font-black text-white tracking-tight">Sponsorum</span>
          <p className="text-blue-200 text-sm mt-1">Admin Paneli</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-lg font-extrabold mb-6" style={{ color: "#042C53" }}>Yönetici Girişi</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "#042C53" }}>Şifre</label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                disabled={loading}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-all focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/20 disabled:opacity-60"
              />
            </div>
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
            )}
            <button
              type="submit"
              disabled={loading || !pw}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#185FA5" }}
            >
              {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <h2 className="text-sm font-extrabold" style={{ color: "#042C53" }}>{title}</h2>
        {count !== undefined && (
          <span className="text-xs font-bold rounded-full px-2 py-0.5 text-white" style={{ backgroundColor: "#185FA5" }}>{count}</span>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Admin dashboard ──────────────────────────────────────────────────────────

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [creators, setCreators] = useState<PendingCreator[]>(INITIAL_CREATORS);

  function approve(id: number) {
    setCreators((prev) => prev.map((c) => c.id === id ? { ...c, status: "approved" } : c));
  }
  function reject(id: number) {
    setCreators((prev) => prev.map((c) => c.id === id ? { ...c, status: "rejected" } : c));
  }

  const pending = creators.filter((c) => c.status === "pending").length;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <span className="text-xl font-extrabold tracking-tight" style={{ color: "#185FA5" }}>Sponsorum</span>
            <span className="text-xs font-bold rounded-full px-2.5 py-1 text-white" style={{ backgroundColor: "#042C53" }}>
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-sm text-gray-500">admin@sponsorum.com</span>
            <button
              onClick={onLogout}
              className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:border-[#185FA5] hover:text-[#185FA5] transition-colors"
            >
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-7">

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{s.icon}</span>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">{s.delta}</span>
              </div>
              <p className="text-2xl font-extrabold mb-0.5" style={{ color: "#042C53" }}>{s.value}</p>
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Bekleyen Yayıncı Onayları ── */}
        <Section title="Bekleyen Yayıncı Onayları" count={pending}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Yayıncı", "Platform", "Takipçi", "Kayıt Tarihi", "Durum", "İşlem"].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {creators.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors" style={{ opacity: c.status !== "pending" ? 0.5 : 1 }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0" style={{ backgroundColor: "#042C53" }}>
                          {c.initials}
                        </div>
                        <span className="font-semibold text-gray-800">@{c.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {c.platforms.map((p) => (
                          <span key={p} className="text-xs bg-gray-100 rounded-lg px-2 py-0.5 text-gray-600 font-medium">{p}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold" style={{ color: "#185FA5" }}>{fmt(c.followers)}</td>
                    <td className="px-6 py-4 text-gray-500">{c.registeredAt}</td>
                    <td className="px-6 py-4">
                      {c.status === "pending"   && <Chip label="Bekliyor"  style={{ bg: "#FFFBEB", text: "#92400E" }} />}
                      {c.status === "approved"  && <Chip label="Onaylandı" style={{ bg: "#ECFDF5", text: "#065F46" }} />}
                      {c.status === "rejected"  && <Chip label="Reddedildi" style={{ bg: "#FEF2F2", text: "#991B1B" }} />}
                    </td>
                    <td className="px-6 py-4">
                      {c.status === "pending" ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => approve(c.id)}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-all hover:opacity-90"
                            style={{ backgroundColor: "#10B981" }}
                          >
                            Onayla
                          </button>
                          <button
                            onClick={() => reject(c.id)}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-all hover:opacity-90"
                            style={{ backgroundColor: "#EF4444" }}
                          >
                            Reddet
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">İşlem yapıldı</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* ── Anlaşmazlıklar ── */}
        <Section title="Anlaşmazlıklar" count={DISPUTES.length}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Anlaşma ID", "Marka", "Yayıncı", "Tutar", "Sebep", "Durum", "İşlem"].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {DISPUTES.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-gray-500">{d.id}</td>
                    <td className="px-6 py-4 font-semibold text-gray-800">{d.marka}</td>
                    <td className="px-6 py-4 text-gray-600">{d.yayinci}</td>
                    <td className="px-6 py-4 font-bold" style={{ color: "#042C53" }}>₺{d.amount.toLocaleString("tr-TR")}</td>
                    <td className="px-6 py-4 text-gray-500">{d.reason}</td>
                    <td className="px-6 py-4">
                      <Chip label={d.status} style={DISPUTE_STATUS_STYLE[d.status]} />
                    </td>
                    <td className="px-6 py-4">
                      <button
                        className="text-xs font-bold px-3 py-1.5 rounded-lg border-2 transition-all hover:bg-[#185FA5] hover:text-white"
                        style={{ borderColor: "#185FA5", color: "#185FA5" }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#185FA5"; e.currentTarget.style.color = "white"; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#185FA5"; }}
                      >
                        İncele
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* ── Son Anlaşmalar ── */}
        <Section title="Son Anlaşmalar">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Anlaşma ID", "Marka", "Yayıncı", "Tutar", "Tarih", "Durum"].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {DEALS.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-gray-500">{d.id}</td>
                    <td className="px-6 py-4 font-semibold text-gray-800">{d.marka}</td>
                    <td className="px-6 py-4 text-gray-600">{d.yayinci}</td>
                    <td className="px-6 py-4 font-bold" style={{ color: "#042C53" }}>₺{d.amount.toLocaleString("tr-TR")}</td>
                    <td className="px-6 py-4 text-gray-500">{d.date}</td>
                    <td className="px-6 py-4">
                      <Chip label={d.status} style={DEAL_STATUS_STYLE[d.status]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

      </main>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  return authed
    ? <AdminDashboard onLogout={() => setAuthed(false)} />
    : <LoginScreen onLogin={() => setAuthed(true)} />;
}
