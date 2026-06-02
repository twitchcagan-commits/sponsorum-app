import { createClient } from "@supabase/supabase-js";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type NotifInput = {
  user_id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
};

export async function insertNotification(notif: NotifInput): Promise<void> {
  const admin = adminClient();
  const { error } = await admin.from("notifications").insert(notif);
  if (error) console.error("[insertNotification]", error.message);
}

export async function insertNotifications(notifs: NotifInput[]): Promise<void> {
  if (!notifs.length) return;
  const admin = adminClient();
  const { error } = await admin.from("notifications").insert(notifs);
  if (error) console.error("[insertNotifications]", error.message);
}
