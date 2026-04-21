import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabase } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { MessageThread } from "@/components/messaging/message-thread";

interface ThreadPageProps {
  params: Promise<{ threadId: string }>;
}

export default async function ThreadPage({ params }: ThreadPageProps) {
  const { threadId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const db = createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Verify participant
  const { data: participation } = await db
    .from("thread_participants")
    .select("thread_id")
    .eq("thread_id", threadId)
    .eq("user_id", user.id)
    .single();

  if (!participation) notFound();

  const [messagesRes, participantsRes] = await Promise.all([
    db
      .from("messages")
      .select("*, sender:profiles!messages_sender_id_fkey(id, username, display_name, avatar_url)")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })
      .limit(50),
    db
      .from("thread_participants")
      .select("profile:profiles(id, username, display_name, avatar_url)")
      .eq("thread_id", threadId)
      .neq("user_id", user.id),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const other = ((participantsRes.data ?? [])[0] as any)?.profile as { id: string; username: string; display_name: string; avatar_url: string | null } | null;

  return (
    <div className="-mb-16 lg:mb-0" style={{ minHeight: 0 }}>
      <MessageThread
        threadId={threadId}
        initialMessages={(messagesRes.data ?? []) as Parameters<typeof MessageThread>[0]["initialMessages"]}
        currentUserId={user.id}
        otherUser={other}
      />
    </div>
  );
}
