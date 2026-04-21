"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare, X, Send, ChevronDown, Search } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn, timeAgo, ripple } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { playMessageSound } from "@/lib/sounds";
import type { Profile } from "@/types/database";

interface ChatThread {
  thread_id: string;
  other: { id: string; username: string; display_name: string; avatar_url: string | null };
  lastMessage?: string;
  lastMessageAt?: string;
  lastSenderId?: string;
}

interface ChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: { id: string; username: string; display_name: string; avatar_url: string | null } | null;
}

export function FloatingChat({ currentUserId, profile }: { currentUserId: string; profile: Profile }) {
  const [open, setOpen] = useState(false);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ username: string; display_name: string; id?: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [readThreads, setReadThreads] = useState<Set<string>>(new Set());
  const [otherTyping, setOtherTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingChannelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Always listen for new messages (even when FAB is closed) to show unread badge
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("chat:unread")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as ChatMessage;
          // Only count messages from others, and only when panel is closed or viewing a different thread
          if (msg.sender_id !== currentUserId) {
            playMessageSound();
            if (!open || activeThread?.thread_id !== msg.thread_id) {
              setUnreadCount(c => c + 1);
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, open, activeThread]);

  // Fetch thread list
  const fetchThreads = useCallback(async () => {
    setLoadingThreads(true);
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      const parsed: ChatThread[] = (data.threads ?? []).map((t: Record<string, unknown>) => {
        const thread = t.thread as Record<string, unknown> | undefined;
        const msgs = (thread?.messages ?? []) as { content: string; created_at: string; sender_id: string }[];
        const lastMsg = msgs.length ? msgs[msgs.length - 1] : undefined;
        return {
          thread_id: t.thread_id as string,
          other: t.other as ChatThread["other"],
          lastMessage: lastMsg?.content,
          lastMessageAt: lastMsg?.created_at ?? thread?.last_msg_at as string,
          lastSenderId: lastMsg?.sender_id,
        };
      });
      setThreads(parsed);
    } finally {
      setLoadingThreads(false);
    }
  }, []);

  // Fetch messages for active thread (silent=true skips loading spinner for polls)
  const fetchMessages = useCallback(async (threadId: string, silent = false) => {
    if (!silent) setLoadingMessages(true);
    try {
      const res = await fetch(`/api/messages/${threadId}`);
      const data = await res.json();
      setMessages(data.messages ?? []);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }, []);

  // Listen for "open chat with user" events from profile page
  useEffect(() => {
    function onOpenChat(e: Event) {
      const userId = (e as CustomEvent).detail as string;
      setOpen(true);
      fetchThreads().then(() => {
        // Try to find existing thread with this user
        setThreads(prev => {
          const existing = prev.find(t => t.other.id === userId);
          if (existing) {
            setActiveThread(existing);
            setReadThreads(p => new Set(p).add(existing.thread_id));
            setUnreadCount(0);
          }
          return prev;
        });
      });
    }
    window.addEventListener("huat:open-chat", onOpenChat);
    return () => window.removeEventListener("huat:open-chat", onOpenChat);
  }, [fetchThreads]);

  // Load/refresh threads when panel opens
  useEffect(() => {
    if (open) fetchThreads();
  }, [open, fetchThreads]);

  // Load messages when thread selected + Realtime subscription
  useEffect(() => {
    if (!activeThread) { setMessages([]); return; }
    fetchMessages(activeThread.thread_id, false);

    const supabase = createClient();
    const channel = supabase
      .channel(`chat:${activeThread.thread_id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `thread_id=eq.${activeThread.thread_id}` },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeThread, fetchMessages]);

  // Typing indicator via Realtime broadcast
  useEffect(() => {
    if (!activeThread) { setOtherTyping(false); typingChannelRef.current = null; return; }

    const supabase = createClient();
    const channel = supabase.channel(`typing:${activeThread.thread_id}`)
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload?.user_id !== currentUserId) {
          setOtherTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setOtherTyping(false), 3000);
        }
      })
      .subscribe();

    typingChannelRef.current = channel;
    return () => { supabase.removeChannel(channel); setOtherTyping(false); };
  }, [activeThread, currentUserId]);

  // Broadcast typing event when user types
  function handleTyping() {
    if (typingChannelRef.current && activeThread) {
      typingChannelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { user_id: currentUserId },
      });
    }
  }

  // Realtime subscription for thread list updates (always active)
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat:threads:${currentUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as ChatMessage;
          // Update thread's last message in place
          setThreads(prev => prev.map(t =>
            t.thread_id === msg.thread_id
              ? { ...t, lastMessage: msg.content, lastMessageAt: msg.created_at, lastSenderId: msg.sender_id }
              : t
          ));
          // Also mark thread as unread if from someone else
          if (msg.sender_id !== currentUserId) {
            setReadThreads(prev => { const next = new Set(prev); next.delete(msg.thread_id); return next; });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Search for users to start new conversation
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data.profiles ?? []);
      } finally {
        setSearching(false);
      }
    }, 250);
  }, [searchQuery]);

  async function handleSend() {
    if (!content.trim() || sending) return;
    setSending(true);
    const text = content.trim();
    setContent("");

    if (activeThread) {
      // Send to existing thread — Realtime will deliver the message back
      await fetch(`/api/messages/${activeThread.thread_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
    }
    setSending(false);
    inputRef.current?.focus();
  }

  async function startNewThread(recipientId: string, recipientProfile: ChatThread["other"]) {
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient_id: recipientId, content: `👋` }),
      });
      if (res.ok) {
        const data = await res.json();
        const newThread: ChatThread = {
          thread_id: data.thread_id,
          other: recipientProfile,
          lastMessage: "👋",
          lastMessageAt: new Date().toISOString(),
          lastSenderId: currentUserId,
        };
        setThreads(prev => [newThread, ...prev.filter(t => t.thread_id !== data.thread_id)]);
        setActiveThread(newThread);
        setSearchQuery("");
        setSearchResults([]);
      } else {
        const err = await res.json();
        alert(err.error ?? "Cannot message this user. You need to be connected first.");
      }
    } finally {
      setSending(false);
    }
  }

  const filteredThreads = searchQuery.trim()
    ? threads.filter(t => t.other.display_name.toLowerCase().includes(searchQuery.toLowerCase()) || t.other.username.toLowerCase().includes(searchQuery.toLowerCase()))
    : threads;

  return (
    <>
    {/* Thread panel — fixed independently to the left */}
    {open && activeThread && (
      <div className="hidden lg:flex fixed bottom-0 right-[348px] z-50 w-[320px] h-[440px] bg-[#141414] border border-[#333333] rounded-t-xl flex-col overflow-hidden shadow-2xl shadow-black/30">
          {/* Thread header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#282828] bg-[#1C1C1C] flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Avatar src={activeThread.other.avatar_url} alt={activeThread.other.display_name} size="xs" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#F0F0F0] truncate">{activeThread.other.display_name}</p>
                <p className="text-[10px] text-[#555555]">@{activeThread.other.username}</p>
              </div>
            </div>
            <button onClick={() => setActiveThread(null)} className="text-[#71717A] hover:text-[#F0F0F0] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages area inside left panel */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <span className="w-5 h-5 border-2 border-[#333333] border-t-[#E8311A] rounded-full animate-spin" />
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.sender_id === currentUserId;
                return (
                  <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[80%] px-3 py-2 rounded-xl text-sm",
                      isMe
                        ? "bg-[#E8311A] text-white rounded-br-none"
                        : "bg-[#282828] text-[#F0F0F0] border border-[#333333] rounded-bl-none"
                    )}>
                      <p>{msg.content}</p>
                      <p className={cn("text-[10px] mt-0.5", isMe ? "text-white/50" : "text-[#555555]")}>{timeAgo(msg.created_at)}</p>
                    </div>
                  </div>
                );
              })
            )}
            {otherTyping && (
              <div className="flex justify-start">
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
          <div className="flex items-end gap-2 px-3 py-2 border-t border-[#282828] flex-shrink-0">
            <textarea
              ref={inputRef as unknown as React.RefObject<HTMLTextAreaElement>}
              value={content}
              onChange={e => { setContent(e.target.value); handleTyping(); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 80) + "px"; }}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Write a message…"
              rows={1}
              className="flex-1 bg-[#1C1C1C] border border-[#333333] rounded-lg px-3 py-2 text-sm text-[#F0F0F0] placeholder:text-[#555555] focus:outline-none focus:border-[#444444] transition-colors resize-none leading-relaxed"
            />
            <button
              onClick={handleSend}
              disabled={!content.trim() || sending}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-lg transition-all flex-shrink-0",
                content.trim() && !sending ? "bg-[#E8311A] text-white hover:bg-[#c9280f]" : "text-[#555555]"
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
      </div>
    )}

    <div className="hidden lg:block fixed bottom-0 right-6 z-50 w-[320px]">
      {/* Thread list panel */}
      {open && (
        <div className="w-[320px] h-[400px] bg-[#141414] border border-[#333333] border-b-0 rounded-t-xl flex flex-col overflow-hidden shadow-2xl shadow-black/30 flex-shrink-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#282828] bg-[#1C1C1C] flex-shrink-0">
            <p className="text-sm font-semibold text-[#F0F0F0]">Conversations</p>
            <button onClick={() => { setOpen(false); setActiveThread(null); setReadThreads(new Set()); }} className="text-[#71717A] hover:text-[#F0F0F0] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
              {/* Search */}
              <div className="px-3 py-2 border-b border-[#282828] flex-shrink-0">
                <div className="flex items-center gap-2 bg-[#1C1C1C] border border-[#333333] rounded-lg px-2.5 py-1.5">
                  <Search className="w-3.5 h-3.5 text-[#555555] flex-shrink-0" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search or start new chat…"
                    className="flex-1 bg-transparent text-sm text-[#F0F0F0] placeholder:text-[#555555] outline-none"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* New chat search results */}
                {searchQuery.trim() && searchResults.length > 0 && (
                  <div className="border-b border-[#282828]">
                    <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-[#555555] uppercase tracking-wider">Start new chat</p>
                    {searchResults.map(user => (
                      <button
                        key={user.username}
                        onClick={() => startNewThread(
                          (user as Record<string, unknown>).id as string ?? "",
                          { id: (user as Record<string, unknown>).id as string ?? "", username: user.username, display_name: user.display_name, avatar_url: null }
                        )}
                        className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-[#1C1C1C] transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#282828] border border-[#333333] flex items-center justify-center text-xs font-bold text-[#9CA3AF]">
                          {user.display_name[0]?.toUpperCase()}
                        </div>
                        <div className="text-left min-w-0">
                          <p className="text-sm text-[#F0F0F0] font-medium truncate">{user.display_name}</p>
                          <p className="text-[10px] text-[#555555]">@{user.username}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Existing threads */}
                {loadingThreads ? (
                  <div className="flex items-center justify-center py-8">
                    <span className="w-5 h-5 border-2 border-[#333333] border-t-[#E8311A] rounded-full animate-spin" />
                  </div>
                ) : filteredThreads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <MessageSquare className="w-8 h-8 text-[#333333] mb-2" />
                    <p className="text-xs text-[#555555]">
                      {searchQuery ? "No conversations found" : "No messages yet. Search for someone to start chatting!"}
                    </p>
                  </div>
                ) : (
                  filteredThreads.map(t => {
                    const isUnread = t.lastSenderId && t.lastSenderId !== currentUserId && !readThreads.has(t.thread_id);
                    return (
                    <button
                      key={t.thread_id}
                      onClick={() => { setActiveThread(t); setReadThreads(prev => new Set(prev).add(t.thread_id)); setUnreadCount(0); }}
                      className="flex items-center gap-2.5 w-full px-3 py-3 hover:bg-[#1C1C1C] transition-colors border-b border-[#1A1A1A]"
                    >
                      {isUnread && <span className="w-2 h-2 rounded-full bg-[#22C55E] flex-shrink-0" />}
                      <Avatar src={t.other.avatar_url} alt={t.other.display_name} size="sm" />
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between">
                          <p className={cn("text-sm truncate", isUnread ? "font-bold text-[#F0F0F0]" : "font-semibold text-[#F0F0F0]")}>{t.other.display_name}</p>
                          {t.lastMessageAt && <span className={cn("text-[10px] flex-shrink-0 ml-2", isUnread ? "text-[#22C55E]" : "text-[#555555]")}>{timeAgo(t.lastMessageAt)}</span>}
                        </div>
                        {t.lastMessage && (
                          <p className={cn("text-xs truncate mt-0.5", isUnread ? "text-[#F0F0F0]" : "text-[#71717A]")}>
                            {t.lastSenderId === currentUserId ? "You: " : ""}{t.lastMessage}
                          </p>
                        )}
                      </div>
                    </button>
                    );
                  })
                )}
              </div>
        </div>
      )}

      {/* Docked bar */}
      <button
        onClick={e => { ripple(e); setOpen(o => !o); if (!open) setUnreadCount(0); }}
        className={cn(
          "relative overflow-hidden flex items-center gap-2 px-4 py-2.5 bg-[#1C1C1C] border border-[#333333] hover:bg-[#222222] transition-colors w-full",
          open ? "border-t-0" : "rounded-t-xl"
        )}
      >
        <MessageSquare className="w-4 h-4 text-[#E8311A]" />
        <span className="text-sm font-semibold text-[#F0F0F0]">Messaging</span>
        {unreadCount > 0 && (
          <span className="min-w-[18px] h-[18px] bg-[#22C55E] rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1 leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
        <div className="flex-1" />
        <ChevronDown className={cn("w-4 h-4 text-[#71717A] transition-transform", !open && "rotate-180")} />
      </button>
    </div>
    </>
  );
}
