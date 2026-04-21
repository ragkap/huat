import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabase } from "@supabase/supabase-js";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { MessageSquare } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { RippleLink } from "@/components/ui/ripple-link";

export const metadata = { title: "Messages — Huat.co" };

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const db = createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: participations } = await db
    .from("thread_participants")
    .select("thread_id")
    .eq("user_id", user.id);

  const threadIds = (participations ?? []).map(p => p.thread_id as string);

  interface ParticipantRow {
    thread_id: string;
    profile: { id: string; username: string; display_name: string; avatar_url: string | null } | null;
  }

  interface ThreadRow { id: string; last_msg_at: string; }
  interface MessageRow { thread_id: string; content: string; created_at: string; sender_id: string; }

  let threads: ThreadRow[] = [];
  let allParticipants: ParticipantRow[] = [];
  let lastMessages: MessageRow[] = [];

  if (threadIds.length) {
    const [threadsRes, participantsRes, messagesRes] = await Promise.all([
      db.from("message_threads").select("id, last_msg_at").in("id", threadIds).order("last_msg_at", { ascending: false }),
      db.from("thread_participants").select("thread_id, profile:profiles(id, username, display_name, avatar_url)").in("thread_id", threadIds).neq("user_id", user.id),
      db.from("messages").select("thread_id, content, created_at, sender_id").in("thread_id", threadIds).order("created_at", { ascending: false }),
    ]);
    threads = (threadsRes.data ?? []) as ThreadRow[];
    allParticipants = (participantsRes.data ?? []) as unknown as ParticipantRow[];
    lastMessages = (messagesRes.data ?? []) as MessageRow[];
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[#282828]">
        <MessageSquare className="w-4 h-4 text-[#E8311A]" />
        <p className="text-sm font-bold text-[#F0F0F0]">Messages</p>
      </div>

      {!threads.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
          <MessageSquare className="w-10 h-10 text-[#333333] mb-4" />
          <p className="text-[#F0F0F0] font-bold text-lg mb-2">No messages yet</p>
          <p className="text-[#9CA3AF] text-sm">Connect with investors to start a conversation</p>
        </div>
      ) : (
        <div>
          {threads.map(thread => {
            const others = allParticipants.filter(p => p.thread_id === thread.id).map(p => p.profile).filter(Boolean);
            const lastMsg = lastMessages.find(m => m.thread_id === thread.id);
            const other = others[0];
            if (!other) return null;
            const isUnread = lastMsg && lastMsg.sender_id !== user.id;

            return (
              <RippleLink
                key={thread.id}
                href={`/messages/${thread.id}`}
                className="flex items-center gap-3 px-5 py-4 border-b border-[#141414] hover:bg-[#0D0D0D] transition-colors"
              >
                {isUnread && <span className="w-2 h-2 rounded-full bg-[#22C55E] flex-shrink-0" />}
                <Avatar src={other.avatar_url} alt={other.display_name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className={`text-sm truncate ${isUnread ? "font-bold text-[#F0F0F0]" : "font-semibold text-[#F0F0F0]"}`}>{other.display_name}</p>
                      <span className="text-xs text-[#555555]">@{other.username}</span>
                    </div>
                    {lastMsg && <p className={`text-xs flex-shrink-0 ml-2 ${isUnread ? "text-[#22C55E]" : "text-[#71717A]"}`}>{timeAgo(lastMsg.created_at)}</p>}
                  </div>
                  {lastMsg && (
                    <p className={`text-sm truncate mt-0.5 ${isUnread ? "text-[#F0F0F0]" : "text-[#9CA3AF]"}`}>
                      {lastMsg.sender_id === user.id ? "You: " : ""}{lastMsg.content}
                    </p>
                  )}
                </div>
              </RippleLink>
            );
          })}
        </div>
      )}
    </div>
  );
}
