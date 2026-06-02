import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { insertNotification } from "@/lib/notifications";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export async function POST(req: NextRequest) {
  try {
    const { markaId, yayinciId, contentType, deliveryDeadline } = await req.json();

    if (!markaId || !yayinciId || !contentType || !deliveryDeadline) {
      return NextResponse.json({ error: "Eksik parametre" }, { status: 400 });
    }

    const admin = adminClient();

    const [{ data: markaAuth }, { data: yayinciProfile }] = await Promise.all([
      admin.auth.admin.getUserById(markaId),
      admin.from("profiles").select("username, display_name").eq("id", yayinciId).maybeSingle(),
    ]);

    const markaEmail = markaAuth.user?.email;
    if (!markaEmail) {
      return NextResponse.json({ error: "Marka e-postası bulunamadı" }, { status: 404 });
    }

    const yp = yayinciProfile as { username?: string; display_name?: string } | null;
    const yayinciName = yp?.username ?? yp?.display_name ?? "Yayıncı";

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://sponsorum.com";

    await sendEmail({
      to: markaEmail,
      subject: "Teslim Tarihi Belirlendi 📅 - Sponsorum",
      html: `
        <h2>Yayıncı teslim tarihini belirledi 📅</h2>
        <p><strong>${yayinciName}</strong>, sponsorluk içeriğini aşağıdaki tarihte teslim edeceğini onayladı.</p>
        <div class="info">
          <div class="row"><span class="lbl">Yayıncı</span><span class="val">${yayinciName}</span></div>
          <div class="row"><span class="lbl">İçerik Türü</span><span class="val">${contentType}</span></div>
          <div class="row"><span class="lbl">Teslim Tarihi</span><span class="val">${fmtDateTime(deliveryDeadline)}</span></div>
        </div>
        <p>Bu tarihe kadar teslim gerçekleşmezse tutar otomatik olarak iade edilir. Süreci kampanyalar ekranından takip edebilirsiniz.</p>
        <a class="btn" href="${appUrl}/campaigns">Kampanyalarıma Git →</a>
      `,
    });

    insertNotification({
      user_id: markaId,
      title: "Teslim Tarihi Belirlendi 📅",
      message: `${yayinciName} içeriği ${fmtDateTime(deliveryDeadline)} tarihine kadar teslim edecek.`,
      type: "delivery_scheduled",
      link: "/campaigns",
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[delivery-scheduled notification]", err);
    return NextResponse.json({ error: "E-posta gönderilemedi" }, { status: 500 });
  }
}
