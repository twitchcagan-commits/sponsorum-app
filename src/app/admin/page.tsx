"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";

// ─── Admin API client ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function callAdmin(password: string, action: string, payload?: any) {
  const res = await fetch("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password, action, payload }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error ?? "İstek başarısız");
  return json;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function money(n: number): string {
  return "₺" + Math.round(n ?? 0).toLocaleString("tr-TR");
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function initials(name: string): string {
  const parts = (name || "?").trim().split(/\s+/);
  return (parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : (name || "?").slice(0, 2)).toUpperCase();
}

function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function proofPublicUrl(value: string): string {
  const supabase = createClient();
  const match = value.match(/\/proofs\/(.+?)(\?|$)/);
  const path = match ? match[1] : value;
  return supabase.storage.from("proofs").getPublicUrl(path).data.publicUrl;
}

// ─── Status config ──────────────────────────────────────────────────────────

type OfferStatus = "pending" | "accepted" | "rejected" | "completed" | "disputed" | "refunded";

const OFFER_STATUS: Record<OfferStatus, { label: string; bg: string; text: string }> = {
  pending:   { label: "Beklemede",     bg: "#EBF4FF", text: "#185FA5" },
  accepted:  { label: "Kabul Edildi",  bg: "#ECFDF5", text: "#065F46" },
  rejected:  { label: "Reddedildi",    bg: "#FEF2F2", text: "#991B1B" },
  completed: { label: "Tamamlandı",    bg: "#ECFDF5", text: "#047857" },
  disputed:  { label: "Anlaşmazlık",   bg: "#FFFBEB", text: "#92400E" },
  refunded:  { label: "İade Edildi",   bg: "#F5F3FF", text: "#6D28D9" },
};

const ALL_STATUSES: OfferStatus[] = ["pending", "accepted", "rejected", "completed", "disputed", "refunded"];

const PROOF_LABELS: Record<string, string> = {
  ig_stats_30d: "Instagram İstatistik (30g)", ig_demographics: "Instagram Demografi", ig_reels_perf: "Instagram Reels Performans",
  tt_analytics: "TikTok Analytics", tt_avg_views: "TikTok Ort. İzlenme", tt_demographics: "TikTok Demografi",
  yt_analytics: "YouTube Analytics", yt_demographics: "YouTube Demografi", yt_watch_time: "YouTube İzlenme Süresi",
  kick_viewers: "Kick İzleyici", kick_stats: "Kick İstatistik",
  twitch_viewers: "Twitch İzleyici", twitch_stats: "Twitch İstatistik",
  x_analytics: "X Analytics", x_profile_stats: "X Profil İstatistik",
};

const ROLE_LABEL: Record<string, string> = { yayinci: "Yayıncı", marka: "Marka" };

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Chip({ label, bg, text }: { label: string; bg: string; text: string }) {
  return (
    <span className="inline-block text-xs font-semibold rounded-full px-2.5 py-1 whitespace-nowrap" style={{ backgroundColor: bg, color: text }}>
      {label}
    </span>
  );
}

function StatusChip({ status }: { status: string }) {
  const s = OFFER_STATUS[status as OfferStatus] ?? { label: status, bg: "#F3F4F6", text: "#6B7280" };
  return <Chip label={s.label} bg={s.bg} text={s.text} />;
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#185FA5", borderTopColor: "transparent" }} />
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{message}</div>;
}

function Empty({ text }: { text: string }) {
  return <div className="py-16 text-center text-sm text-gray-400">{text}</div>;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>{children}</div>;
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-extrabold" style={{ color: "#042C53" }}>{title}</h1>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(4,44,83,0.5)" }} onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[88vh] flex flex-col`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-base font-extrabold" style={{ color: "#042C53" }}>{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

const thCls = "text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap";
const inputCls = "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/20";

// ─── Login ──────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (pw: string) => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await callAdmin(pw, "settings_get"); // validates password server-side
      onLogin(pw);
    } catch {
      setError("Hatalı şifre. Lütfen tekrar dene.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg, #042C53 0%, #185FA5 100%)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl font-black text-white tracking-tight">Sponsorum</span>
          <p className="text-blue-200 text-sm mt-1">Yönetim Paneli</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-lg font-extrabold mb-6" style={{ color: "#042C53" }}>Yönetici Girişi</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "#042C53" }}>Şifre</label>
              <input type="password" placeholder="••••••••••••" value={pw} onChange={(e) => setPw(e.target.value)} disabled={loading}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-all focus:border-[#185FA5] focus:ring-2 focus:ring-[#185FA5]/20 disabled:opacity-60" />
            </div>
            {error && <ErrorBox message={error} />}
            <button type="submit" disabled={loading || !pw} className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: "#185FA5" }}>
              {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Stat card + chart ──────────────────────────────────────────────────────

function StatCard({ icon, value, label, accent }: { icon: string; value: string; label: string; accent?: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-2xl font-extrabold mb-0.5" style={{ color: accent ?? "#042C53" }}>{value}</p>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
    </Card>
  );
}

function RevenueChart({ data }: { data: { date: string; value: number }[] }) {
  const W = 720, H = 240, padL = 48, padR = 16, padT = 16, padB = 30;
  const max = Math.max(1, ...data.map((d) => d.value));
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const x = (i: number) => padL + (data.length <= 1 ? 0 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => padT + innerH - (v / max) * innerH;

  const linePts = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
  const areaPts = `${padL},${padT + innerH} ${linePts} ${padL + innerW},${padT + innerH}`;
  const ticks = [0, 0.5, 1].map((f) => Math.round(max * f));
  const dateTicks = data.length ? [0, Math.floor(data.length / 2), data.length - 1] : [];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#185FA5" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#185FA5" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t, i) => {
        const yy = y(t);
        return (
          <g key={i}>
            <line x1={padL} y1={yy} x2={W - padR} y2={yy} stroke="#F1F5F9" strokeWidth="1" />
            <text x={padL - 8} y={yy + 4} textAnchor="end" fontSize="11" fill="#94A3B8">{money(t)}</text>
          </g>
        );
      })}
      <polygon points={areaPts} fill="url(#revFill)" />
      <polyline points={linePts} fill="none" stroke="#185FA5" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {dateTicks.map((i) => (
        <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#94A3B8">
          {new Date(data[i].date).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
        </text>
      ))}
    </svg>
  );
}

// ─── 1. Özet ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function OverviewSection({ overview, loading }: { overview: any; loading: boolean }) {
  if (loading || !overview) return <Spinner />;
  return (
    <div>
      <SectionTitle title="Özet" subtitle="Platform genel durumu" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <StatCard icon="👥" value={String(overview.usersCount)} label="Toplam Kullanıcı" />
        <StatCard icon="🤝" value={String(overview.activeOffers)} label="Aktif Anlaşma" />
        <StatCard icon="💰" value={money(overview.monthlyRevenue)} label="Bu Ay Komisyon Geliri" accent="#185FA5" />
        <StatCard icon="⏳" value={String(overview.pendingVerifications)} label="Bekleyen Onay" />
      </div>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-extrabold" style={{ color: "#042C53" }}>Günlük Komisyon Geliri</h2>
          <span className="text-xs text-gray-400">Son 30 gün</span>
        </div>
        <RevenueChart data={overview.revenueSeries ?? []} />
      </Card>
    </div>
  );
}

// ─── 2. Kullanıcılar ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function UsersSection({ api }: { api: (action: string, payload?: any) => Promise<any> }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { users } = await api("users");
      setUsers(users);
    } catch (e) { setError(e instanceof Error ? e.message : "Hata"); }
    setLoading(false);
  }, [api]);

  useEffect(() => { load(); }, [load]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function togglePro(u: any) {
    setBusy(u.id);
    try {
      await api("toggle_pro", { userId: u.id, role: u.role, value: !u.isPro });
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, isPro: !x.isPro } : x));
    } catch (e) { alert(e instanceof Error ? e.message : "Hata"); }
    setBusy(null);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function toggleBan(u: any) {
    if (!u.isBanned && !confirm(`@${u.username} kullanıcısını banlamak istediğine emin misin?`)) return;
    setBusy(u.id);
    try {
      await api("ban_user", { userId: u.id, value: !u.isBanned });
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, isBanned: !x.isBanned } : x));
    } catch (e) { alert(e instanceof Error ? e.message : "Hata"); }
    setBusy(null);
  }

  const filtered = users.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!u.username.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div>
      <SectionTitle title="Kullanıcılar" subtitle={`${users.length} kayıtlı kullanıcı`} />
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input placeholder="Kullanıcı adı veya e-posta ara…" value={search} onChange={(e) => setSearch(e.target.value)} className={inputCls + " sm:max-w-xs"} />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={inputCls + " sm:w-44"}>
          <option value="all">Tüm Roller</option>
          <option value="yayinci">Yayıncı</option>
          <option value="marka">Marka</option>
        </select>
      </div>
      {error && <div className="mb-4"><ErrorBox message={error} /></div>}
      <Card className="overflow-hidden">
        {loading ? <Spinner /> : filtered.length === 0 ? <Empty text="Kullanıcı bulunamadı." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                {["Kullanıcı", "Rol", "E-posta", "Kayıt", "Pro", "Durum", "İşlem"].map((h) => <th key={h} className={thCls}>{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors" style={{ opacity: u.isBanned ? 0.55 : 1 }}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0" style={{ backgroundColor: "#042C53" }}>{initials(u.displayName || u.username)}</div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 truncate">@{u.username || "—"}</p>
                          <p className="text-xs text-gray-400 truncate">{u.displayName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><Chip label={ROLE_LABEL[u.role] ?? u.role} bg="#E6F1FB" text="#185FA5" /></td>
                    <td className="px-5 py-3.5 text-gray-600">{u.email}</td>
                    <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                    <td className="px-5 py-3.5">{u.isPro ? <Chip label="Pro" bg="#FEF3C7" text="#92400E" /> : <span className="text-xs text-gray-300">—</span>}</td>
                    <td className="px-5 py-3.5">{u.isBanned ? <Chip label="Banlı" bg="#FEF2F2" text="#991B1B" /> : <Chip label="Aktif" bg="#ECFDF5" text="#065F46" />}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        {u.username && <a href={`/profile/${u.username}`} target="_blank" rel="noreferrer" className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors hover:bg-gray-50" style={{ borderColor: "#E6F1FB", color: "#185FA5" }}>Profil</a>}
                        <button onClick={() => togglePro(u)} disabled={busy === u.id} className="text-xs font-bold px-2.5 py-1.5 rounded-lg text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: u.isPro ? "#9CA3AF" : "#F59E0B" }}>{u.isPro ? "Pro Kaldır" : "Pro Yap"}</button>
                        <button onClick={() => toggleBan(u)} disabled={busy === u.id} className="text-xs font-bold px-2.5 py-1.5 rounded-lg text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: u.isBanned ? "#10B981" : "#EF4444" }}>{u.isBanned ? "Ban Kaldır" : "Banla"}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── 3. Yayıncı Onay ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function VerificationsSection({ api, onChange }: { api: (action: string, payload?: any) => Promise<any>; onChange: () => void }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [viewing, setViewing] = useState<any | null>(null);

  const load = useCallback(async () => {
    try {
      const { verifications } = await api("verifications");
      setList(verifications);
    } catch (e) { setError(e instanceof Error ? e.message : "Hata"); }
    setLoading(false);
  }, [api]);
  useEffect(() => { load(); }, [load]);

  async function act(id: string, approve: boolean) {
    if (!approve && !confirm("Reddetmek kanıt dosyalarını temizler ve yayıncının yeniden yükleme yapmasını gerektirir. Devam edilsin mi?")) return;
    setBusy(id);
    try {
      await api("verify_action", { userId: id, approve });
      setList((prev) => prev.filter((x) => x.id !== id));
      onChange();
    } catch (e) { alert(e instanceof Error ? e.message : "Hata"); }
    setBusy(null);
  }

  return (
    <div>
      <SectionTitle title="Yayıncı Onay" subtitle={`${list.length} bekleyen doğrulama`} />
      {error && <div className="mb-4"><ErrorBox message={error} /></div>}
      <Card className="overflow-hidden">
        {loading ? <Spinner /> : list.length === 0 ? <Empty text="Bekleyen doğrulama yok." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                {["Yayıncı", "Platform", "Kanıt", "İşlem"].map((h) => <th key={h} className={thCls}>{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {list.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0" style={{ backgroundColor: "#042C53" }}>{initials(v.displayName || v.username)}</div>
                        <div><p className="font-semibold text-gray-800">@{v.username}</p><p className="text-xs text-gray-400">{v.displayName}</p></div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">{v.platforms.map((p: string) => <span key={p} className="text-xs bg-gray-100 rounded-lg px-2 py-0.5 text-gray-600 font-medium">{p}</span>)}<span className="text-xs text-gray-400 ml-1">({v.platformCount})</span></div>
                    </td>
                    <td className="px-5 py-3.5 font-semibold" style={{ color: "#185FA5" }}>{v.proofCount} dosya</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <button onClick={() => setViewing(v)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors hover:bg-gray-50" style={{ borderColor: "#E6F1FB", color: "#185FA5" }}>Kanıtları Gör</button>
                        <button onClick={() => act(v.id, true)} disabled={busy === v.id} className="text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: "#10B981" }}>Onayla</button>
                        <button onClick={() => act(v.id, false)} disabled={busy === v.id} className="text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: "#EF4444" }}>Reddet</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {viewing && (
        <Modal title={`@${viewing.username} — Kanıt Dosyaları`} onClose={() => setViewing(null)}>
          <div className="flex flex-col gap-2">
            {Object.entries(viewing.proofFiles as Record<string, string>).map(([key, path]) => (
              <div key={key} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2.5 bg-gray-50">
                <span className="text-sm text-gray-700">{PROOF_LABELS[key] ?? key}</span>
                <a href={proofPublicUrl(path)} target="_blank" rel="noreferrer" className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: "#185FA5" }}>Aç</a>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── 4. Anlaşmalar ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function OffersSection({ api }: { api: (action: string, payload?: any) => Promise<any> }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [detail, setDetail] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const { offers } = await api("offers");
      setOffers(offers);
    } catch (e) { setError(e instanceof Error ? e.message : "Hata"); }
    setLoading(false);
  }, [api]);
  useEffect(() => { load(); }, [load]);

  async function changeStatus(offerId: string, status: string) {
    setBusy(true);
    try {
      await api("offer_status", { offerId, status });
      setOffers((prev) => prev.map((o) => o.id === offerId ? { ...o, status } : o));
      setDetail((d: any) => d && d.id === offerId ? { ...d, status } : d); // eslint-disable-line @typescript-eslint/no-explicit-any
    } catch (e) { alert(e instanceof Error ? e.message : "Hata"); }
    setBusy(false);
  }

  const filtered = statusFilter === "all" ? offers : offers.filter((o) => o.status === statusFilter);

  return (
    <div>
      <SectionTitle title="Anlaşmalar" subtitle={`${offers.length} toplam teklif`} />
      <div className="flex gap-3 mb-5">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputCls + " sm:w-52"}>
          <option value="all">Tüm Durumlar</option>
          {ALL_STATUSES.map((s) => <option key={s} value={s}>{OFFER_STATUS[s].label}</option>)}
        </select>
      </div>
      {error && <div className="mb-4"><ErrorBox message={error} /></div>}
      <Card className="overflow-hidden">
        {loading ? <Spinner /> : filtered.length === 0 ? <Empty text="Anlaşma bulunamadı." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                {["ID", "Marka", "Yayıncı", "İçerik", "Tutar", "Komisyon", "Durum", "Tarih"].map((h) => <th key={h} className={thCls}>{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((o) => (
                  <tr key={o.id} onClick={() => setDetail(o)} className="hover:bg-gray-50 transition-colors cursor-pointer">
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-400">#{String(o.id).slice(0, 8)}</td>
                    <td className="px-5 py-3.5 font-semibold text-gray-800">{o.markaName}</td>
                    <td className="px-5 py-3.5 text-gray-600">@{o.yayinciUsername}</td>
                    <td className="px-5 py-3.5 text-gray-500 max-w-[160px] truncate">{o.contentType}</td>
                    <td className="px-5 py-3.5 font-bold" style={{ color: "#042C53" }}>{money(o.amount)}</td>
                    <td className="px-5 py-3.5 font-semibold" style={{ color: "#185FA5" }}>{money(o.platformFee)}</td>
                    <td className="px-5 py-3.5"><StatusChip status={o.status} /></td>
                    <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{fmtDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {detail && (
        <Modal title={`Anlaşma #${String(detail.id).slice(0, 8)}`} onClose={() => setDetail(null)} wide>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <Field label="Marka" value={`${detail.markaName} (@${detail.markaUsername})`} />
            <Field label="Yayıncı" value={`${detail.yayinciName} (@${detail.yayinciUsername})`} />
            <Field label="İçerik Türü" value={detail.contentType} />
            <Field label="Teslim Tarihi" value={fmtDate(detail.deadline)} />
            <Field label="Tutar" value={money(detail.amount)} />
            <Field label="Komisyon" value={money(detail.platformFee)} />
            <Field label="Toplam" value={money(detail.total)} />
            <Field label="Oluşturulma" value={fmtDateTime(detail.createdAt)} />
          </div>
          {detail.brief && <div className="mb-4"><p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Brifing</p><p className="text-sm text-gray-700 whitespace-pre-wrap">{detail.brief}</p></div>}
          {detail.specialRequests && <div className="mb-4"><p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Özel İstekler</p><p className="text-sm text-gray-700 whitespace-pre-wrap">{detail.specialRequests}</p></div>}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Durum Değiştir</p>
            <div className="flex items-center gap-3">
              <select value={detail.status} onChange={(e) => changeStatus(detail.id, e.target.value)} disabled={busy} className={inputCls + " sm:w-56"}>
                {ALL_STATUSES.map((s) => <option key={s} value={s}>{OFFER_STATUS[s].label}</option>)}
              </select>
              {busy && <span className="text-xs text-gray-400">Kaydediliyor…</span>}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-800">{value}</p>
    </div>
  );
}

// ─── 5. Anlaşmazlıklar ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DisputesSection({ api }: { api: (action: string, payload?: any) => Promise<any> }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [threadOffer, setThreadOffer] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { offers } = await api("offers");
      setDisputes(offers.filter((o: any) => o.status === "disputed")); // eslint-disable-line @typescript-eslint/no-explicit-any
    } catch (e) { setError(e instanceof Error ? e.message : "Hata"); }
    setLoading(false);
  }, [api]);
  useEffect(() => { load(); }, [load]);

  async function resolve(offerId: string, outcome: "marka" | "yayinci") {
    const label = outcome === "marka" ? "Marka lehine (iade)" : "Yayıncı lehine (tamamlandı)";
    if (!confirm(`${label} olarak çözülsün mü?`)) return;
    setBusy(offerId);
    try {
      await api("dispute_resolve", { offerId, outcome });
      setDisputes((prev) => prev.filter((d) => d.id !== offerId));
    } catch (e) { alert(e instanceof Error ? e.message : "Hata"); }
    setBusy(null);
  }

  return (
    <div>
      <SectionTitle title="Anlaşmazlıklar" subtitle={`${disputes.length} açık anlaşmazlık`} />
      {error && <div className="mb-4"><ErrorBox message={error} /></div>}
      <Card className="overflow-hidden">
        {loading ? <Spinner /> : disputes.length === 0 ? <Empty text="Açık anlaşmazlık yok." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                {["ID", "Marka", "Yayıncı", "Tutar", "Sebep", "İşlem"].map((h) => <th key={h} className={thCls}>{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {disputes.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-400">#{String(d.id).slice(0, 8)}</td>
                    <td className="px-5 py-3.5 font-semibold text-gray-800">{d.markaName}</td>
                    <td className="px-5 py-3.5 text-gray-600">@{d.yayinciUsername}</td>
                    <td className="px-5 py-3.5 font-bold" style={{ color: "#042C53" }}>{money(d.amount)}</td>
                    <td className="px-5 py-3.5 text-gray-500 max-w-[200px] truncate">{d.disputeReason || "—"}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <button onClick={() => setThreadOffer(d.id)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors hover:bg-gray-50" style={{ borderColor: "#E6F1FB", color: "#185FA5" }}>Mesajlar</button>
                        <button onClick={() => resolve(d.id, "marka")} disabled={busy === d.id} className="text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: "#6D28D9" }}>Marka Lehine</button>
                        <button onClick={() => resolve(d.id, "yayinci")} disabled={busy === d.id} className="text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: "#10B981" }}>Yayıncı Lehine</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {threadOffer && <ThreadModal api={api} offerId={threadOffer} onClose={() => setThreadOffer(null)} />}
    </div>
  );
}

// ─── 6. Mesajlar ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ThreadModal({ api, offerId, onClose }: { api: (action: string, payload?: any) => Promise<any>; offerId: string; onClose: () => void }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [thread, setThread] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [info, setInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const r = await api("messages_thread", { offerId }); setThread(r.thread); setInfo(r.info); } catch { /* ignore */ }
      setLoading(false);
    })();
  }, [api, offerId]);

  return (
    <Modal title={info ? `@${info.markaUsername} ↔ @${info.yayinciUsername}` : "Mesaj Geçmişi"} onClose={onClose} wide>
      {loading ? <Spinner /> : thread.length === 0 ? <Empty text="Bu anlaşmada mesaj yok." /> : (
        <div className="flex flex-col gap-3">
          {thread.map((m) => (
            <div key={m.id} className={`flex ${m.senderRole === "marka" ? "justify-start" : "justify-end"}`}>
              <div className="max-w-[75%]">
                <p className={`text-xs text-gray-400 mb-1 ${m.senderRole === "marka" ? "text-left" : "text-right"}`}>
                  {m.senderRole === "marka" ? "🏢" : "🎙️"} @{m.senderUsername} · {fmtDateTime(m.createdAt)}
                </p>
                <div className="px-4 py-2.5 rounded-2xl text-sm" style={m.senderRole === "marka" ? { backgroundColor: "#F3F4F6", color: "#111827" } : { backgroundColor: "#185FA5", color: "white" }}>
                  {m.content && <p className="whitespace-pre-wrap">{m.content}</p>}
                  {m.fileUrl && m.fileType === "image" && <img src={m.fileUrl} alt="" className="rounded-lg mt-1 max-h-60" />}
                  {m.fileUrl && m.fileType === "video" && <video src={m.fileUrl} controls className="rounded-lg mt-1 max-h-60" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MessagesSection({ api }: { api: (action: string, payload?: any) => Promise<any> }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [convs, setConvs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openOffer, setOpenOffer] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { conversations } = await api("messages_list");
      setConvs(conversations);
    } catch (e) { setError(e instanceof Error ? e.message : "Hata"); }
    setLoading(false);
  }, [api]);
  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <SectionTitle title="Mesajlar" subtitle={`${convs.length} konuşma`} />
      {error && <div className="mb-4"><ErrorBox message={error} /></div>}
      <Card className="overflow-hidden">
        {loading ? <Spinner /> : convs.length === 0 ? <Empty text="Konuşma yok." /> : (
          <div className="divide-y divide-gray-50">
            {convs.map((c) => (
              <button key={c.offerId} onClick={() => setOpenOffer(c.offerId)} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: "#042C53" }}>💬</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold" style={{ color: "#042C53" }}>@{c.markaUsername}</span>
                    <span className="text-gray-300">↔</span>
                    <span className="text-sm font-bold" style={{ color: "#042C53" }}>@{c.yayinciUsername}</span>
                    <StatusChip status={c.status} />
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{c.lastMessage}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-400">{fmtDate(c.lastTime)}</p>
                  <p className="text-xs font-semibold mt-1" style={{ color: "#185FA5" }}>{c.count} mesaj</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>
      {openOffer && <ThreadModal api={api} offerId={openOffer} onClose={() => setOpenOffer(null)} />}
    </div>
  );
}

// ─── 7. Gelir & Muhasebe ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RevenueSection({ api }: { api: (action: string, payload?: any) => Promise<any> }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"komisyon" | "marka" | "yayinci">("komisyon");
  const [period, setPeriod] = useState<"byDay" | "byMonth" | "byYear">("byMonth");

  const load = useCallback(async () => {
    try {
      const result = await api("revenue");
      setData(result);
    } catch (e) { setError(e instanceof Error ? e.message : "Hata"); }
    setLoading(false);
  }, [api]);
  useEffect(() => { load(); }, [load]);

  if (loading) return <div><SectionTitle title="Gelir & Muhasebe" /><Spinner /></div>;
  if (error) return <div><SectionTitle title="Gelir & Muhasebe" /><ErrorBox message={error} /></div>;

  const TABS: { id: typeof tab; label: string }[] = [
    { id: "komisyon", label: "Komisyon" },
    { id: "marka", label: "Marka Pro" },
    { id: "yayinci", label: "Yayıncı Pro" },
  ];
  const PERIOD_LABEL = { byDay: "Gün", byMonth: "Ay", byYear: "Yıl" };

  function exportKomisyon() {
    downloadCSV(`komisyon-${period}.csv`, ["Dönem", "Komisyon (₺)"], data[period].map((r: any) => [r.key, Math.round(r.value)])); // eslint-disable-line @typescript-eslint/no-explicit-any
  }
  function exportMarka() {
    downloadCSV("marka-pro.csv", ["Şirket", "Kullanıcı", "Kayıt"], data.markaPro.map((m: any) => [m.company, m.username, fmtDate(m.createdAt)])); // eslint-disable-line @typescript-eslint/no-explicit-any
  }
  function exportYayinci() {
    downloadCSV("yayinci-pro.csv", ["Kullanıcı", "Ad", "Kayıt"], data.yayinciPro.map((y: any) => [y.username, y.displayName, fmtDate(y.createdAt)])); // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  return (
    <div>
      <SectionTitle title="Gelir & Muhasebe" subtitle="Komisyon ve Pro abonelik gelirleri" />
      <div className="flex items-center gap-2 mb-5 border-b border-gray-100">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className="px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px" style={{ borderColor: tab === t.id ? "#185FA5" : "transparent", color: tab === t.id ? "#185FA5" : "#9CA3AF" }}>{t.label}</button>
        ))}
      </div>

      {tab === "komisyon" && (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <StatCard icon="💰" value={money(data.total)} label="Toplam Komisyon" accent="#185FA5" />
            <StatCard icon="📅" value={money(data.byMonth[0]?.value ?? 0)} label="Bu Ay" />
            <StatCard icon="🗓️" value={money(data.byYear[0]?.value ?? 0)} label="Bu Yıl" />
            <StatCard icon="🤝" value={String(data.byDay.length)} label="Gelirli Gün" />
          </div>
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex gap-1.5">
                {(["byDay", "byMonth", "byYear"] as const).map((p) => (
                  <button key={p} onClick={() => setPeriod(p)} className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors" style={{ backgroundColor: period === p ? "#185FA5" : "#F3F4F6", color: period === p ? "white" : "#6B7280" }}>{PERIOD_LABEL[p]}</button>
                ))}
              </div>
              <button onClick={exportKomisyon} className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50" style={{ borderColor: "#E6F1FB", color: "#185FA5" }}>↓ CSV İndir</button>
            </div>
            {data[period].length === 0 ? <Empty text="Komisyon kaydı yok." /> : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100"><th className={thCls}>Dönem</th><th className={thCls}>Komisyon</th></tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {data[period].map((r: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                    <tr key={r.key} className="hover:bg-gray-50"><td className="px-5 py-3 font-medium text-gray-700">{r.key}</td><td className="px-5 py-3 font-bold" style={{ color: "#185FA5" }}>{money(r.value)}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      )}

      {tab === "marka" && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-600">{data.markaPro.length} Pro marka</span>
            <button onClick={exportMarka} className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50" style={{ borderColor: "#E6F1FB", color: "#185FA5" }}>↓ CSV İndir</button>
          </div>
          {data.markaPro.length === 0 ? <Empty text="Pro marka yok." /> : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">{["Şirket", "Kullanıcı", "Kayıt"].map((h) => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-50">
                {data.markaPro.map((m: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                  <tr key={m.id} className="hover:bg-gray-50"><td className="px-5 py-3 font-semibold text-gray-800">{m.company}</td><td className="px-5 py-3 text-gray-600">@{m.username}</td><td className="px-5 py-3 text-gray-500">{fmtDate(m.createdAt)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === "yayinci" && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-600">{data.yayinciPro.length} Pro yayıncı</span>
            <button onClick={exportYayinci} className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50" style={{ borderColor: "#E6F1FB", color: "#185FA5" }}>↓ CSV İndir</button>
          </div>
          {data.yayinciPro.length === 0 ? <Empty text="Pro yayıncı yok." /> : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">{["Kullanıcı", "Ad", "Kayıt"].map((h) => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-50">
                {data.yayinciPro.map((y: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                  <tr key={y.id} className="hover:bg-gray-50"><td className="px-5 py-3 font-semibold text-gray-800">@{y.username}</td><td className="px-5 py-3 text-gray-600">{y.displayName}</td><td className="px-5 py-3 text-gray-500">{fmtDate(y.createdAt)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  );
}

// ─── 8. Platform Ayarları ──────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SettingsSection({ api }: { api: (action: string, payload?: any) => Promise<any> }) {
  const [commissionRate, setCommissionRate] = useState("15");
  const [minOrder, setMinOrder] = useState("750");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { settings } = await api("settings_get");
        setCommissionRate(String(settings.commissionRate));
        setMinOrder(String(settings.minOrder));
        setMaintenanceMode(settings.maintenanceMode);
        setAnnouncementText(settings.announcementText);
      } catch (e) { setError(e instanceof Error ? e.message : "Hata"); }
      setLoading(false);
    })();
  }, [api]);

  async function save() {
    setSaving(true); setError(""); setSaved(false);
    try {
      await api("settings_save", { commissionRate, minOrder, maintenanceMode, announcementText });
      setSaved(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Hata"); }
    setSaving(false);
  }

  if (loading) return <div><SectionTitle title="Platform Ayarları" /><Spinner /></div>;

  return (
    <div className="max-w-2xl">
      <SectionTitle title="Platform Ayarları" subtitle="Genel platform yapılandırması" />
      <Card className="p-6 flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "#042C53" }}>Komisyon Oranı (%)</label>
            <input type="number" value={commissionRate} onChange={(e) => { setCommissionRate(e.target.value); setSaved(false); }} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "#042C53" }}>Minimum Sipariş (₺)</label>
            <input type="number" value={minOrder} onChange={(e) => { setMinOrder(e.target.value); setSaved(false); }} className={inputCls} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 bg-gray-50">
          <div>
            <p className="text-sm font-semibold" style={{ color: "#042C53" }}>Bakım Modu</p>
            <p className="text-xs text-gray-400">Açıkken platform ziyaretçilere kapalı gösterilir.</p>
          </div>
          <button onClick={() => { setMaintenanceMode((v) => !v); setSaved(false); }} className="relative w-12 h-6 rounded-full transition-colors flex-shrink-0" style={{ backgroundColor: maintenanceMode ? "#185FA5" : "#D1D5DB" }}>
            <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform" style={{ transform: maintenanceMode ? "translateX(24px)" : "translateX(0)" }} />
          </button>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "#042C53" }}>Duyuru Metni</label>
          <textarea rows={3} value={announcementText} onChange={(e) => { setAnnouncementText(e.target.value); setSaved(false); }} placeholder="Tüm kullanıcılara gösterilecek duyuru…" className={inputCls + " resize-none"} />
        </div>

        {error && <ErrorBox message={error} />}
        {saved && <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700">✓ Ayarlar kaydedildi.</div>}

        <button onClick={save} disabled={saving} className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: "#185FA5" }}>
          {saving ? "Kaydediliyor…" : "Ayarları Kaydet"}
        </button>
      </Card>
    </div>
  );
}

// ─── Dashboard shell ────────────────────────────────────────────────────────

const NAV = [
  { id: "ozet",           label: "Özet",               icon: "📊" },
  { id: "kullanicilar",   label: "Kullanıcılar",       icon: "👥" },
  { id: "onay",           label: "Yayıncı Onay",       icon: "✅" },
  { id: "anlasmalar",     label: "Anlaşmalar",         icon: "🤝" },
  { id: "anlasmazliklar", label: "Anlaşmazlıklar",     icon: "⚖️" },
  { id: "mesajlar",       label: "Mesajlar",           icon: "💬" },
  { id: "gelir",          label: "Gelir & Muhasebe",   icon: "💰" },
  { id: "ayarlar",        label: "Platform Ayarları",  icon: "⚙️" },
] as const;

type NavId = typeof NAV[number]["id"];

function AdminDashboard({ password, onLogout }: { password: string; onLogout: () => void }) {
  const [active, setActive] = useState<NavId>("ozet");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [overview, setOverview] = useState<any>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const api = useCallback((action: string, payload?: any) => callAdmin(password, action, payload), [password]);

  const refreshOverview = useCallback(async () => {
    try {
      const data = await api("overview");
      setOverview(data);
    } catch { /* ignore */ }
    setOverviewLoading(false);
  }, [api]);

  useEffect(() => { refreshOverview(); }, [refreshOverview]);

  function go(id: NavId) { setActive(id); setSidebarOpen(false); }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform`}>
        <div className="h-16 flex items-center gap-2 px-6 border-b border-gray-100">
          <span className="text-xl font-extrabold tracking-tight" style={{ color: "#185FA5" }}>Sponsorum</span>
          <span className="text-xs font-bold rounded-full px-2 py-0.5 text-white" style={{ backgroundColor: "#042C53" }}>Admin</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
          {NAV.map((n) => {
            const isActive = active === n.id;
            const badge = n.id === "onay" && overview?.pendingVerifications > 0 ? overview.pendingVerifications : null;
            return (
              <button key={n.id} onClick={() => go(n.id)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors text-left" style={{ backgroundColor: isActive ? "#EBF4FF" : "transparent", color: isActive ? "#185FA5" : "#6B7280" }}>
                <span className="text-base">{n.icon}</span>
                <span className="flex-1">{n.label}</span>
                {badge && <span className="text-xs font-bold rounded-full px-1.5 py-0.5 text-white" style={{ backgroundColor: "#EF4444" }}>{badge}</span>}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <button onClick={onLogout} className="w-full text-sm font-medium px-3 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:border-[#185FA5] hover:text-[#185FA5] transition-colors">Çıkış Yap</button>
        </div>
      </aside>

      {sidebarOpen && <div className="lg:hidden fixed inset-0 z-30 bg-black/40" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 p-2 -ml-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <span className="text-sm font-semibold text-gray-500">{NAV.find((n) => n.id === active)?.label}</span>
          <span className="hidden sm:block text-sm text-gray-400">Yönetici</span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {active === "ozet"           && <OverviewSection overview={overview} loading={overviewLoading} />}
          {active === "kullanicilar"   && <UsersSection api={api} />}
          {active === "onay"           && <VerificationsSection api={api} onChange={refreshOverview} />}
          {active === "anlasmalar"     && <OffersSection api={api} />}
          {active === "anlasmazliklar" && <DisputesSection api={api} />}
          {active === "mesajlar"       && <MessagesSection api={api} />}
          {active === "gelir"          && <RevenueSection api={api} />}
          {active === "ayarlar"        && <SettingsSection api={api} />}
        </main>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [password, setPassword] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("admin_pw");
    if (stored) setPassword(stored);
  }, []);

  function login(pw: string) {
    sessionStorage.setItem("admin_pw", pw);
    setPassword(pw);
  }
  function logout() {
    sessionStorage.removeItem("admin_pw");
    setPassword(null);
  }

  return password
    ? <AdminDashboard password={password} onLogout={logout} />
    : <LoginScreen onLogin={login} />;
}
