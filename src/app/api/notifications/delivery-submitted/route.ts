import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const { markaId, yayinciId, contentType } = await req.json();

    if (!markaId || !yayinciId || !contentType) {
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
      subject: "İçerik Teslim Edildi — Kanıtları İnceleyin 🔍 - Sponsorum",
      html: `
        <h2>İçerik teslim edildi 🔍</h2>
        <p><strong>${yayinciName}</strong> sponsorluk içeriğini teslim etti ve teslim kanıtlarını yükledi.</p>
        <div class="info">
          <div class="row"><span class="lbl">Yayıncı</span><span class="val">${yayinciName}</span></div>
          <div class="row"><span class="lbl">İçerik Türü</span><span class="val">${contentType}</span></div>
        </div>
        <p>Lütfen kampanyalar ekranından kanıtları inceleyin. İçerik uygunsa <strong>"Teslim Aldım"</strong> diyerek ödemeyi serbest bırakın; bir sorun varsa <strong>"Teslim Almadım"</strong> ile durumu bildirin.</p>
        <a class="btn" href="${appUrl}/campaigns">Kanıtları İncele →</a>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[delivery-submitted notification]", err);
    return NextResponse.json({ error: "E-posta gönderilemedi" }, { status: 500 });
  }
}
