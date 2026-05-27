import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export async function POST(req: NextRequest) {
  try {
    const { markaId, yayinciId, contentType, deadline } = await req.json();

    if (!markaId || !yayinciId || !contentType || !deadline) {
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
      subject: "Teklifiniz Kabul Edildi ✅ - Sponsorum",
      html: `
        <h2>Teklifiniz Kabul Edildi! ✅</h2>
        <p><strong>${yayinciName}</strong> sponsorluk teklifinizi kabul etti. Anlaşma süreci başladı.</p>
        <div class="info">
          <div class="row"><span class="lbl">Yayıncı</span><span class="val">${yayinciName}</span></div>
          <div class="row"><span class="lbl">İçerik Türü</span><span class="val">${contentType}</span></div>
          <div class="row"><span class="lbl">Teslim Tarihi</span><span class="val">${fmtDate(deadline)}</span></div>
        </div>
        <p>Yayıncı içeriği belirtilen tarihte teslim edecektir. Detayları mesajlaşma ekranından takip edebilirsiniz.</p>
        <a class="btn" href="${appUrl}/messages">Mesajlara Git →</a>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[offer-accepted notification]", err);
    return NextResponse.json({ error: "E-posta gönderilemedi" }, { status: 500 });
  }
}
