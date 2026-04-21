"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare, X, Send, ChevronDown, Search } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn, timeAgo, ripple } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch thread list
  const fetchThreads = useCallback(async () => {
    setLoadingThreads(true);
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      const parsed: ChatThread[] = (data.threads ?? []).map((t: Record<string, unknown>) => {
        const thread = t.thread as Record<string, unknown> | undefined;
        const msgs = (thread?.messages ?? []) as { content: string; created_at: string; sender_id: string }[];
        const lastMsg = msgs[0];
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

  // Load threads when panel opens
  useEffect(() => {
    if (open && threads.length === 0) fetchThreads();
  }, [open, fetchThreads, threads.length]);

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

  // Realtime subscription for thread list updates
  useEffect(() => {
    if (!open) return;

    const supabase = createClient();
    const channel = supabase
      .channel("chat:threads")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => { fetchThreads(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [open, fetchThreads]);

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
      // Send to existing thread
      const optimistic: ChatMessage = {
        id: Date.now().toString(),
        thread_id: activeThread.thread_id,
        sender_id: currentUserId,
        content: text,
        created_at: new Date().toISOString(),
        sender: null,
      };
      setMessages(prev => [...prev, optimistic]);
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
      {/* FAB */}
      {!open && (
        <button
          onClick={e => { ripple(e); setOpen(true); }}
          className="fixed bottom-24 lg:bottom-6 right-4 lg:right-6 z-50 w-14 h-14 rounded-full bg-[#E8311A] text-white flex items-center justify-center shadow-lg shadow-black/30 hover:bg-[#c9280f] transition-colors active:scale-95 overflow-hidden"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 lg:bottom-6 right-4 lg:right-6 z-50 w-[340px] h-[480px] bg-[#141414] border border-[#282828] rounded-2xl shadow-2xl shadow-black/40 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#282828] bg-[#1C1C1C] flex-shrink-0">
            {activeThread ? (
              <>
                <button onClick={() => setActiveThread(null)} className="text-[#9CA3AF] hover:text-[#F0F0F0] transition-colors mr-2">
                  <ChevronDown className="w-4 h-4 rotate-90" />
                </button>
                <Avatar src={activeThread.other.avatar_url} alt={activeThread.other.display_name} size="xs" />
                <div className="flex-1 min-w-0 ml-2">
                  <p className="text-sm font-semibold text-[#F0F0F0] truncate">{activeThread.other.display_name}</p>
                  <p className="text-[10px] text-[#555555]">@{activeThread.other.username}</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#E8311A]" />
                  <p className="text-sm font-semibold text-[#F0F0F0]">Messages</p>
                </div>
              </>
            )}
            <button onClick={() => { setOpen(false); setActiveThread(null); }} className="text-[#71717A] hover:text-[#F0F0F0] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {activeThread ? (
            /* Thread view */
            <>
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
                <div ref={bottomRef} />
              </div>
              {/* Composer */}
              <div className="flex items-center gap-2 px-3 py-2 border-t border-[#282828] flex-shrink-0">
                <input
                  ref={inputRef}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Write a message…"
                  className="flex-1 bg-[#1C1C1C] border border-[#333333] rounded-lg px-3 py-2 text-sm text-[#F0F0F0] placeholder:text-[#555555] focus:outline-none focus:border-[#444444] transition-colors"
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
            </>
          ) : (
            /* Thread list */
            <>
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
                  filteredThreads.map(t => (
                    <button
                      key={t.thread_id}
                      onClick={() => setActiveThread(t)}
                      className="flex items-center gap-2.5 w-full px-3 py-3 hover:bg-[#1C1C1C] transition-colors border-b border-[#1A1A1A]"
                    >
                      <Avatar src={t.other.avatar_url} alt={t.other.display_name} size="sm" />
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-[#F0F0F0] truncate">{t.other.display_name}</p>
                          {t.lastMessageAt && <span className="text-[10px] text-[#555555] flex-shrink-0 ml-2">{timeAgo(t.lastMessageAt)}</span>}
                        </div>
                        {t.lastMessage && (
                          <p className="text-xs text-[#71717A] truncate mt-0.5">
                            {t.lastSenderId === currentUserId ? "You: " : ""}{t.lastMessage}
                          </p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
