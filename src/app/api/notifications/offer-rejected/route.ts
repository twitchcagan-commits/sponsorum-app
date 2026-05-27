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
      subject: "Teklifiniz Reddedildi ❌ - Sponsorum",
      html: `
        <h2>Teklifiniz Reddedildi ❌</h2>
        <p><strong>${yayinciName}</strong> bu sefer sponsorluk teklifinizi kabul edemedi.</p>
        <div class="info">
          <div class="row"><span class="lbl">Yayıncı</span><span class="val">${yayinciName}</span></div>
          <div class="row"><span class="lbl">İçerik Türü</span><span class="val">${contentType}</span></div>
        </div>
        <p>Endişelenmeyin! Sponsorum'da hedef kitlenize uygun yüzlerce yayıncı sizi bekliyor. Yeni bir yayıncı bulup tekrar deneyebilirsiniz.</p>
        <a class="btn" href="${appUrl}/search">Yeni Yayıncı Ara →</a>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[offer-rejected notification]", err);
    return NextResponse.json({ error: "E-posta gönderilemedi" }, { status: 500 });
  }
}
