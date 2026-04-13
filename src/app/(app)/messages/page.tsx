import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { timeAgo } from "@/lib/utils";

export const metadata = { title: "Messages — Huat.co" };

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Join thread_participants directly to get threads with other participant profiles and last message in one pass
  const { data: participations } = await supabase
    .from("thread_participants")
    .select("thread_id")
    .eq("user_id", user.id);

  const threadIds = (participations ?? []).map(p => p.thread_id as string);

  interface ParticipantRow {
    thread_id: string;
    profile: { id: string; username: string; display_name: string; avatar_url: string | null } | null;
  }

  interface ThreadRow {
    id: string;
    last_msg_at: string;
  }

  interface MessageRow {
    thread_id: string;
    content: string;
    created_at: string;
    sender_id: string;
  }

  let threads: ThreadRow[] = [];
  let allParticipants: ParticipantRow[] = [];
  let lastMessages: MessageRow[] = [];

  if (threadIds.length) {
    const [threadsRes, participantsRes, messagesRes] = await Promise.all([
      supabase.from("message_threads").select("id, last_msg_at").in("id", threadIds).order("last_msg_at", { ascending: false }),
      supabase.from("thread_participants").select("thread_id, profile:profiles(id, username, display_name, avatar_url)").in("thread_id", threadIds).neq("user_id", user.id),
      supabase.from("messages").select("thread_id, content, created_at, sender_id").in("thread_id", threadIds).order("created_at", { ascending: false }),
    ]);
    threads = (threadsRes.data ?? []) as ThreadRow[];
    allParticipants = (participantsRes.data ?? []) as unknown as ParticipantRow[];
    lastMessages = (messagesRes.data ?? []) as MessageRow[];
  }

  return (
    <div>
      {!threads.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
          <div className="flex items-end gap-0.5 mb-5">
            {[0.5, 1, 0.7].map((h, i) => (
              <span key={i} className="w-1 rounded-full bg-[#E8311A] opacity-40" style={{ height: `${h * 24}px` }} />
            ))}
          </div>
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

            return (
              <Link
                key={thread.id}
                href={`/messages/${thread.id}`}
                className="flex items-center gap-3 px-5 py-4 border-b border-[#141414] hover:bg-[#0D0D0D] transition-colors"
              >
                <Avatar src={other.avatar_url} alt={other.display_name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm text-[#F0F0F0]">{other.display_name}</p>
                    {lastMsg && <p className="text-xs text-[#71717A]">{timeAgo(lastMsg.created_at)}</p>}
                  </div>
                  {lastMsg && (
                    <p className="text-sm text-[#9CA3AF] truncate mt-0.5">
                      {lastMsg.sender_id === user.id ? "You: " : ""}{lastMsg.content}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
