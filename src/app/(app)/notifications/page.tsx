import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/avatar";
import { timeAgo } from "@/lib/utils";
import type { Notification } from "@/types/database";

export const metadata = { title: "Notifications — huat.co" };

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

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*, actor:profiles!notifications_actor_id_fkey(id, username, display_name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(50);

  // Mark all as read
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("is_read", false);

  return (
    <div>
      <div className="sticky top-14 z-10 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#282828] hidden sm:flex sm:items-center px-5 py-4">
        <h1 className="text-xl font-black text-[#F0F0F0]">Notifications</h1>
      </div>

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
              {!notif.is_read && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#E8311A] mt-2 flex-shrink-0" />
              )}
              {notif.actor && (
                <Avatar
                  src={notif.actor.avatar_url}
                  alt={notif.actor.display_name}
                  size="sm"
                />
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
