import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { insertNotifications } from "@/lib/notifications";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const { markaId, yayinciId, contentType, reason } = await req.json();

    if (!markaId || !yayinciId || !contentType) {
      return NextResponse.json({ error: "Eksik parametre" }, { status: 400 });
    }

    const admin = adminClient();

    const [{ data: markaAuth }, { data: yayinciAuth }, { data: markaProfile }, { data: yayinciProfile }] = await Promise.all([
      admin.auth.admin.getUserById(markaId),
      admin.auth.admin.getUserById(yayinciId),
      admin.from("marka_profiles").select("company_name").eq("id", markaId).maybeSingle(),
      admin.from("profiles").select("username, display_name").eq("id", yayinciId).maybeSingle(),
    ]);

    const markaEmail   = markaAuth.user?.email;
    const yayinciEmail = yayinciAuth.user?.email;

    const markaName   = (markaProfile as { company_name?: string } | null)?.company_name ?? "Marka";
    const yp          = yayinciProfile as { username?: string; display_name?: string } | null;
    const yayinciName = yp?.username ?? yp?.display_name ?? "Yayıncı";

    const appUrl     = process.env.NEXT_PUBLIC_APP_URL ?? "https://sponsorum.com";
    const reasonText = (reason && String(reason).trim()) || "Gerekçe belirtilmedi.";

    const reasonBlock = `
      <div class="info">
        <div class="row"><span class="lbl">Marka</span><span class="val">${markaName}</span></div>
        <div class="row"><span class="lbl">Yayıncı</span><span class="val">${yayinciName}</span></div>
        <div class="row"><span class="lbl">İçerik Türü</span><span class="val">${contentType}</span></div>
      </div>
      <p style="background:#FFFBEB;border-radius:10px;padding:14px 16px"><strong>Gerekçe:</strong> ${reasonText}</p>
    `;

    const tasks: Promise<unknown>[] = [];

    // → Marka
    if (markaEmail) {
      tasks.push(sendEmail({
        to: markaEmail,
        subject: "Teslimatı Reddettiniz — Anlaşmazlık Açıldı ⚖️ - Sponsorum",
        html: `
          <h2>Anlaşmazlık açıldı ⚖️</h2>
          <p>Yayıncının teslimatını reddettiniz. Durum Sponsorum ekibine iletildi ve inceleniyor.</p>
          ${reasonBlock}
          <p>Ekibimiz iki tarafı ve teslim kanıtlarını değerlendirip sonucu bildirecektir.</p>
          <a class="btn" href="${appUrl}/campaigns">Kampanyalarıma Git →</a>
        `,
      }));
    }

    // → Yayıncı
    if (yayinciEmail) {
      tasks.push(sendEmail({
        to: yayinciEmail,
        subject: "Teslimatınız İçin Anlaşmazlık Açıldı ⚖️ - Sponsorum",
        html: `
          <h2>Teslimatınız için anlaşmazlık açıldı ⚖️</h2>
          <p><strong>${markaName}</strong> teslim ettiğiniz içeriği onaylamadı. Durum Sponsorum ekibine iletildi ve inceleniyor.</p>
          ${reasonBlock}
          <p>Ekibimiz teslim kanıtlarınızı ve mesaj geçmişini değerlendirip sonucu bildirecektir.</p>
          <a class="btn" href="${appUrl}/offers">Tekliflerime Git →</a>
        `,
      }));
    }

    // → Admin notification
    const adminEmail = process.env.ADMIN_EMAIL ?? "destek@sponsorum.com";
    tasks.push(sendEmail({
      to: adminEmail,
      subject: "🚨 Yeni Anlaşmazlık — İnceleme Gerekiyor - Sponsorum",
      html: `
        <h2>🚨 Yeni anlaşmazlık</h2>
        <p>Bir marka teslimatı reddetti ve anlaşmazlık açıldı. Yönetim panelinden inceleyin.</p>
        ${reasonBlock}
        <a class="btn" href="${appUrl}/admin">Yönetim Paneline Git →</a>
      `,
    }));

    tasks.push(insertNotifications([
      {
        user_id: markaId,
        title: "Anlaşmazlık Açıldı ⚖️",
        message: "Teslimatı reddettiniz. Durum Sponsorum ekibine iletildi ve inceleniyor.",
        type: "dispute_opened",
        link: "/campaigns",
      },
      {
        user_id: yayinciId,
        title: "Anlaşmazlık Açıldı ⚖️",
        message: `${markaName} teslimatınızı onaylamadı. Durum Sponsorum ekibine iletildi.`,
        type: "dispute_opened",
        link: "/offers",
      },
    ]));

    await Promise.allSettled(tasks);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[delivery-rejected notification]", err);
    return NextResponse.json({ error: "E-posta gönderilemedi" }, { status: 500 });
  }
}
