"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

type Role = "yayinci" | "marka" | null;

const YAYINCI_CARDS = [
  {
    icon: "👤",
    title: "Profilini Tamamla",
    desc: "Platform, kategori ve istatistiklerini ekleyerek markalara görünür ol.",
    cta: "Profile Git →",
    href: "/profile/complete",
    accent: "#185FA5",
  },
  {
    icon: "📨",
    title: "Teklifler",
    desc: "Markalardan gelen sponsorluk tekliflerini incele ve yanıtla.",
    cta: "Teklifleri Gör →",
    href: "/offers",
    accent: "#185FA5",
  },
  {
    icon: "💰",
    title: "Kazançlar",
    desc: "Tamamlanan kampanyalarından elde ettiğin kazançları ve ödemeleri takip et.",
    cta: "Kazançları Gör →",
    href: "/earnings",
    accent: "#185FA5",
  },
];

const MARKA_CARDS = [
  {
    icon: "🔍",
    title: "Sponsor Bul",
    desc: "Platform, kategori ve bütçene göre sana uygun yayıncıları filtrele.",
    cta: "Aramaya Başla →",
    href: "/search",
    accent: "#185FA5",
  },
  {
    icon: "📊",
    title: "Kampanyalarım",
    desc: "Aktif ve tamamlanan kampanyalarını yönet, performansı takip et.",
    cta: "Kampanyalara Git →",
    href: "/campaigns",
    accent: "#185FA5",
  },
  {
    icon: "💳",
    title: "Ödemeler",
    desc: "Escrow'daki ödemeleri, fatura geçmişini ve bekleyen işlemleri görüntüle.",
    cta: "Ödemelere Git →",
    href: "/payments",
    accent: "#185FA5",
  },
];

function roleEmoji(role: Role) {
  if (role === "yayinci") return "🎙️";
  if (role === "marka") return "🏢";
  return "👋";
}

export default function DashboardPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }

      // Seed from metadata immediately, then confirm from DB
      setRole((data.user.user_metadata?.role as Role) ?? null);
      supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle()
        .then(({ data: p }) => { if (p?.role) setRole(p.role as Role); });

      // Finish deferred profile insert (email-confirmed users)
      const pending = localStorage.getItem("pendingProfile");
      if (pending) {
        try {
          const p = JSON.parse(pending) as {
            userId: string; role: string; displayName: string; username: string;
            companyName: string; taxNumber: string;
          };

          // Only run if this user matches the stored id
          if (p.userId === data.user.id) {
            console.log("[dashboard] inserting deferred profile for", p.userId);

            const { error: profileError } = await supabase.from("profiles").insert({
              id: p.userId, role: p.role, display_name: p.displayName,
              username: p.username,
              created_at: new Date().toISOString(),
            });
            if (profileError) console.error("[dashboard] profiles insert:", profileError);

            if (p.role === "marka") {
              const { error: e } = await supabase.from("marka_profiles").insert({
                id: p.userId, company_name: p.companyName, tax_number: p.taxNumber,
              });
              if (e) console.error("[dashboard] marka_profiles insert:", e);
            } else {
              const { error: e } = await supabase.from("yayinci_profiles").insert({
                id: p.userId, bio: "", platforms: [],
              });
              if (e) console.error("[dashboard] yayinci_profiles insert:", e);
            }

            localStorage.removeItem("pendingProfile");
            // Update role from stored data if metadata not set yet
            setRole(p.role as Role);
          }
        } catch (err) {
          console.error("[dashboard] pending profile parse error:", err);
          localStorage.removeItem("pendingProfile");
        }
      }

      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#185FA5", borderTopColor: "transparent" }} />
        </div>
      </div>
    );
  }

  const cards = role === "marka" ? MARKA_CARDS : YAYINCI_CARDS;

  return (
    <div className="min-h-screen bg-gray-50">

      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Welcome */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">{roleEmoji(role)}</span>
            <h1 className="text-3xl font-extrabold" style={{ color: "#042C53" }}>
              Hoş geldin!
            </h1>
          </div>
          <p className="text-gray-500 ml-12">
            {role === "yayinci" && "Sponsorluk tekliflerini yönet ve kazançlarını takip et."}
            {role === "marka" && "Kampanyalarını yönet ve doğru yayıncıları bul."}
            {!role && "Hesabın hazır. Hadi başlayalım."}
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {(role === "yayinci"
            ? [
                { label: "Aktif Teklif", value: "0" },
                { label: "Tamamlanan", value: "0" },
                { label: "Toplam Kazanç", value: "₺0" },
              ]
            : [
                { label: "Aktif Kampanya", value: "0" },
                { label: "Tamamlanan", value: "0" },
                { label: "Toplam Harcama", value: "₺0" },
              ]
          ).map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
              <div className="text-2xl font-extrabold mb-1" style={{ color: "#042C53" }}>{stat.value}</div>
              <div className="text-xs text-gray-500 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Action cards */}
        <h2 className="text-lg font-bold mb-5" style={{ color: "#042C53" }}>Ne yapmak istersin?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {cards.map((card) => (
            <a
              key={card.title}
              href={card.href}
              className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 flex flex-col gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all group no-underline"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: "#E6F1FB" }}
              >
                {card.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold mb-1.5" style={{ color: "#042C53" }}>{card.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{card.desc}</p>
              </div>
              <span
                className="text-sm font-semibold transition-colors group-hover:underline"
                style={{ color: "#185FA5" }}
              >
                {card.cta}
              </span>
            </a>
          ))}
        </div>

        {/* Bottom banner */}
        <div
          className="mt-10 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ backgroundColor: "#042C53" }}
        >
          <div>
            <h3 className="text-white font-bold text-lg mb-1">Profilini güçlendir</h3>
            <p className="text-blue-200 text-sm">
              {role === "yayinci"
                ? "Gerçek istatistiklerini ekleyerek daha fazla marka dikkatini çek."
                : "Marka profilini tamamla, yayıncıların sana ulaşmasını kolaylaştır."}
            </p>
          </div>
          <a
            href={role === "yayinci" ? "/profile/edit" : role === "marka" ? "/search" : "/profile/complete"}
            className="flex-shrink-0 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: "#185FA5" }}
          >
            {role === "yayinci" ? "Profili Güncelle →" : role === "marka" ? "Sponsor Bul →" : "Profili Tamamla →"}
          </a>
        </div>

      </main>
    </div>
  );
}
