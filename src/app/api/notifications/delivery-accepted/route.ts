import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function money(n: number) {
  return "₺" + Math.round(Number(n ?? 0)).toLocaleString("tr-TR");
}

export async function POST(req: NextRequest) {
  try {
    const { yayinciId, contentType, amount } = await req.json();

    if (!yayinciId || !contentType) {
      return NextResponse.json({ error: "Eksik parametre" }, { status: 400 });
    }

    const admin = adminClient();
    const { data: yayinciAuth } = await admin.auth.admin.getUserById(yayinciId);
    const yayinciEmail = yayinciAuth.user?.email;
    if (!yayinciEmail) {
      return NextResponse.json({ error: "Yayıncı e-postası bulunamadı" }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://sponsorum.com";

    await sendEmail({
      to: yayinciEmail,
      subject: "Ödemeniz Serbest Bırakıldı 🎉 - Sponsorum",
      html: `
        <h2>Ödemeniz serbest bırakıldı! 🎉</h2>
        <p>Marka teslim ettiğiniz içeriği onayladı ve anlaşma başarıyla tamamlandı.</p>
        <div class="info">
          <div class="row"><span class="lbl">İçerik Türü</span><span class="val">${contentType}</span></div>
          <div class="row"><span class="lbl">Kazancınız</span><span class="val">${money(amount)}</span></div>
        </div>
        <p>Tutar bakiyenize eklendi. Kazançlarınızı ve ödeme geçmişinizi panelinizden görüntüleyebilirsiniz.</p>
        <a class="btn" href="${appUrl}/earnings">Kazançlarıma Git →</a>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[delivery-accepted notification]", err);
    return NextResponse.json({ error: "E-posta gönderilemedi" }, { status: 500 });
  }
}
