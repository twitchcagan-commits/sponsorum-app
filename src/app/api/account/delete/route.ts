import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Requires SUPABASE_SERVICE_ROLE_KEY in env (server-only, no NEXT_PUBLIC prefix)
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Permanently deletes the authenticated user and all of their data.
// The caller must send their Supabase access token as a Bearer token so we
// can verify identity — a user may only delete their own account.
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) {
      return NextResponse.json({ error: "Yetkisiz istek" }, { status: 401 });
    }

    const admin = adminClient();

    // Verify the token and resolve which user is asking to be deleted
    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) {
      return NextResponse.json({ error: "Oturum doğrulanamadı" }, { status: 401 });
    }

    const uid = user.id;

    // Remove role-specific and shared rows first (FKs may not cascade)
    await admin.from("notifications").delete().eq("user_id", uid);
    await admin.from("yayinci_profiles").delete().eq("id", uid);
    await admin.from("marka_profiles").delete().eq("id", uid);
    await admin.from("profiles").delete().eq("id", uid);

    // Finally remove the auth user itself
    const { error: delErr } = await admin.auth.admin.deleteUser(uid);
    if (delErr) {
      console.error("[account/delete] deleteUser error:", delErr.message);
      return NextResponse.json({ error: "Hesap silinemedi" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[account/delete]", err);
    return NextResponse.json({ error: "Hesap silinemedi" }, { status: 500 });
  }
}
