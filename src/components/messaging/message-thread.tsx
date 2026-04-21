"use client";
import { useState, useEffect, useRef } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Send, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { timeAgo, cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { playMessageSound } from "@/lib/sounds";
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
  const [otherTyping, setOtherTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingChannelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherTyping]);

  // Realtime subscription for new messages
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`thread:${threadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `thread_id=eq.${threadId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          if (newMsg.sender_id !== currentUserId) playMessageSound();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [threadId, currentUserId]);

  // Typing indicator via broadcast
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`typing:${threadId}`)
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload?.user_id !== currentUserId) {
          setOtherTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setOtherTyping(false), 3000);
        }
      })
      .subscribe();

    typingChannelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [threadId, currentUserId]);

  function handleTyping() {
    typingChannelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: currentUserId },
    });
  }

  async function sendQuickReply(emoji: string) {
    if (sending) return;
    setSending(true);
    await fetch(`/api/messages/${threadId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: emoji }),
    });
    setSending(false);
  }

  async function handleSend() {
    if (!content.trim() || sending) return;
    setSending(true);
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
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="sticky top-14 z-10 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#282828] px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push("/messages")} className="text-[#9CA3AF] hover:text-[#F0F0F0] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        {otherUser && (
          <>
            <Avatar src={otherUser.avatar_url} alt={otherUser.display_name} size="sm" />
            <div>
              <p className="font-bold text-sm text-[#F0F0F0]">{otherUser.display_name}</p>
              <p className="text-xs text-[#555555]">@{otherUser.username}</p>
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
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
                    "px-3 py-2 rounded-xl text-sm",
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
        {otherTyping && (
          <div className="flex items-end gap-2">
            {otherUser && <Avatar src={otherUser.avatar_url} alt={otherUser.display_name} size="xs" />}
            <div className="bg-[#282828] border border-[#333333] rounded-xl rounded-bl-none px-3 py-2">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-[#282828] px-4 py-3 flex items-end gap-2">
        <textarea
          value={content}
          onChange={e => { setContent(e.target.value); handleTyping(); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 bg-[#141414] border border-[#333333] rounded-xl px-3 py-1.5 text-sm text-text placeholder:text-[#71717A] focus:outline-none focus:border-[#444444] transition-colors resize-none"
          style={{ lineHeight: "20px", minHeight: "36px" }}
        />
        {content.trim() ? (
          <button
            onClick={handleSend}
            disabled={sending}
            className="w-[36px] h-[36px] flex items-center justify-center rounded-lg bg-[#E8311A] text-white hover:bg-[#c9280f] transition-all flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => sendQuickReply("👍")}
            className="w-[36px] h-[36px] flex items-center justify-center rounded-lg hover:bg-[#282828] transition-colors flex-shrink-0 text-xl active:scale-125"
          >
            👍
          </button>
        )}
      </div>
    </div>
  );
}
