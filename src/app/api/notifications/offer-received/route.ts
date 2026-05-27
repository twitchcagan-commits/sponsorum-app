import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

// Requires SUPABASE_SERVICE_ROLE_KEY in env (server-only, no NEXT_PUBLIC prefix)
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function fmtAmount(n: number) {
  return "₺" + Math.round(n).toLocaleString("tr-TR");
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[offer-received] called with body:", body);

    const { yayinciId, markaId, contentType, amount, deadline } = body;

    if (!yayinciId || !markaId || !contentType || !amount || !deadline) {
      return NextResponse.json({ error: "Eksik parametre" }, { status: 400 });
    }

    const admin = adminClient();

    const [{ data: yayinciAuth }, { data: markaProfile }] = await Promise.all([
      admin.auth.admin.getUserById(yayinciId),
      admin.from("marka_profiles").select("company_name").eq("id", markaId).maybeSingle(),
    ]);

    const yayinciEmail = yayinciAuth.user?.email;
    if (!yayinciEmail) {
      return NextResponse.json({ error: "Yayıncı e-postası bulunamadı" }, { status: 404 });
    }

    const markaName = (markaProfile as { company_name?: string } | null)?.company_name ?? "Marka";

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://sponsorum.com";

    await sendEmail({
      to: yayinciEmail,
      subject: "Yeni Sponsorluk Teklifi Aldınız 🎉 - Sponsorum",
      html: `
        <h2>Yeni Sponsorluk Teklifi Aldınız! 🎉</h2>
        <p><strong>${markaName}</strong> sana bir sponsorluk teklifi gönderdi. Aşağıdaki detayları inceleyin ve teklife yanıt verin.</p>
        <div class="info">
          <div class="row"><span class="lbl">Marka</span><span class="val">${markaName}</span></div>
          <div class="row"><span class="lbl">İçerik Türü</span><span class="val">${contentType}</span></div>
          <div class="row"><span class="lbl">Teklif Tutarı</span><span class="val">${fmtAmount(amount)}</span></div>
          <div class="row"><span class="lbl">Son Teslim Tarihi</span><span class="val">${fmtDate(deadline)}</span></div>
        </div>
        <p>Teklifi kabul veya reddedebilmek için Sponsorum'daki teklifler sayfanızı ziyaret edin.</p>
        <a class="btn" href="${appUrl}/offers">Teklifi İncele →</a>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[offer-received notification]", err);
    return NextResponse.json({ error: "E-posta gönderilemedi" }, { status: 500 });
  }
}
