"use client";
import { useState, useEffect, useRef } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Send, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { timeAgo, cn } from "@/lib/utils";
import type { Message } from "@/types/database";

interface MessageThreadProps {
  threadId: string;
  initialMessages: (Message & { sender: { id: string; username: string; display_name: string; avatar_url: string | null } | null })[];
  currentUserId: string;
  otherUser: { id: string; username: string; display_name: string; avatar_url: string | null } | null;
}

export function MessageThread({ threadId, initialMessages, currentUserId, otherUser }: MessageThreadProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!content.trim() || sending) return;
    setSending(true);
    const optimistic = {
      id: Date.now().toString(),
      thread_id: threadId,
      sender_id: currentUserId,
      content: content.trim(),
      read_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: null,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setMessages(prev => [...prev, optimistic as any]);
    const text = content.trim();
    setContent("");
    try {
      await fetch(`/api/messages/${threadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#282828] px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-[#9CA3AF] hover:text-[#F0F0F0] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        {otherUser && (
          <>
            <Avatar src={otherUser.avatar_url} alt={otherUser.display_name} size="sm" />
            <div>
              <p className="font-bold text-sm text-[#F0F0F0]">{otherUser.display_name}</p>
              <p className="text-xs text-[#71717A]">@{otherUser.username}</p>
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map(msg => {
          const isMe = msg.sender_id === currentUserId;
          return (
            <div key={msg.id} className={cn("flex items-end gap-2", isMe && "flex-row-reverse")}>
              {!isMe && otherUser && (
                <Avatar src={otherUser.avatar_url} alt={otherUser.display_name} size="xs" />
              )}
              <div className={cn("max-w-[70%]", isMe && "items-end flex flex-col")}>
                <div
                  className={cn(
                    "px-3 py-2 rounded text-sm",
                    isMe
                      ? "bg-[#E8311A] text-white rounded-br-none"
                      : "bg-[#282828] text-[#F0F0F0] border border-[#333333] rounded-bl-none"
                  )}
                >
                  {msg.content}
                </div>
                <p className="text-xs text-[#71717A] mt-1 px-1">{timeAgo(msg.created_at)}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-[#282828] px-4 py-3 flex items-center gap-3">
        <input
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Type a message..."
          className="flex-1 bg-[#141414] border border-[#333333] rounded px-3 py-2 text-sm text-[#F0F0F0] placeholder:text-[#71717A] focus:outline-none focus:border-[#444444] transition-colors"
        />
        <Button
          size="sm"
          onClick={handleSend}
          loading={sending}
          disabled={!content.trim()}
          className="px-3 py-2"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
