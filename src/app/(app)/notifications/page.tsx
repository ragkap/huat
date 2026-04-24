import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabase } from "@supabase/supabase-js";
import { Avatar } from "@/components/ui/avatar";
import { timeAgo } from "@/lib/utils";
import { ConnectActions } from "@/components/profile/connect-actions";
import type { Notification } from "@/types/database";

export const metadata = { title: "Notifications — Huat.co" };

const notifLabel: Record<string, string> = {
  reaction: "reacted to your post",
  reply: "replied to your post",
  follow: "followed you",
  connect_request: "sent you a connection request",
  connect_accept: "accepted your connection",
  forecast_resolved: "Your forecast was resolved",
  mention: "mentioned you",
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const db = createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Fetch and mark as read in parallel
  const [{ data: notifications }] = await Promise.all([
    db
      .from("notifications")
      .select("*, actor:profiles!notifications_actor_id_fkey(id, username, display_name, avatar_url)")
      .eq("recipient_id", user?.id ?? "")
      .order("created_at", { ascending: false })
      .limit(50),
    db
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_id", user?.id ?? "")
      .eq("is_read", false),
  ]);

  return (
    <div>
      {!notifications?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
          <div className="flex items-end gap-0.5 mb-5">
            {[0.5, 1, 0.7].map((h, i) => (
              <span key={i} className="w-1 rounded-full bg-[#E8311A] opacity-40" style={{ height: `${h * 24}px` }} />
            ))}
          </div>
          <p className="text-[#F0F0F0] font-bold text-lg mb-2">All caught up</p>
          <p className="text-[#9CA3AF] text-sm">Notifications will appear here</p>
        </div>
      ) : (
        <div>
          {(notifications as (Notification & { actor: { username: string; display_name: string; avatar_url: string | null } | null })[]).map(notif => (
            <div
              key={notif.id}
              className={`flex items-start gap-3 px-5 py-4 border-b border-[#141414] ${!notif.is_read ? "bg-[#0D0D0D]" : ""}`}
            >
              {notif.actor && (
                <div className="relative flex-shrink-0">
                  {!notif.is_read && (
                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#E8311A]" />
                  )}
                  <Avatar
                    src={notif.actor.avatar_url}
                    alt={notif.actor.display_name}
                    size="sm"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#F0F0F0]">
                  {notif.actor && (
                    <a href={`/profile/${notif.actor.username}`} className="font-bold hover:underline">
                      {notif.actor.display_name}
                    </a>
                  )}{" "}
                  {notifLabel[notif.type] ?? notif.type}
                </p>
                <p className="text-xs text-[#71717A] mt-0.5">{timeAgo(notif.created_at)}</p>
                {notif.type === "connect_request" && notif.actor && (
                  <ConnectActions actorId={notif.actor.id} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
