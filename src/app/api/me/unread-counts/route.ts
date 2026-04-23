import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabase } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const [notifsRes, messagesRes] = await Promise.all([
    db.from("notifications").select("id", { count: "exact", head: true }).eq("recipient_id", user.id).eq("is_read", false),
    db.from("messages").select("id", { count: "exact", head: true }).eq("is_read", false).neq("sender_id", user.id),
  ]);

  return NextResponse.json({
    notifications: notifsRes.count ?? 0,
    messages: messagesRes.count ?? 0,
  }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
