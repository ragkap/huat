"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What can you do for me?",
  "Top stock picks for Singapore",
  "Latest on DBS",
  "Singtel vs Starhub",
];

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-[#E8311A]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="w-3.5 h-3.5 text-[#E8311A]" />
        </div>
      )}
      <div className={cn("max-w-[85%] lg:max-w-[75%]", isUser && "flex flex-col items-end")}>
        <div
          className={cn(
            "px-3.5 py-2.5 rounded-xl text-sm leading-relaxed",
            isUser
              ? "bg-[#E8311A] text-white rounded-br-none"
              : "bg-[#141414] text-[#F0F0F0] border border-[#282828] rounded-bl-none"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="ai-prose">
              <FormattedContent content={message.content} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FormattedContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Table
    if (line.trimStart().startsWith("|") && line.trimEnd().endsWith("|")) {
      const tableRows: string[][] = [];
      while (i < lines.length && lines[i].trimStart().startsWith("|") && lines[i].trimEnd().endsWith("|")) {
        const row = lines[i].split("|").slice(1, -1).map(c => c.trim());
        // Skip separator rows (|---|---|)
        if (!row.every(c => /^[-:]+$/.test(c))) {
          tableRows.push(row);
        }
        if (i + 1 < lines.length && lines[i + 1].trimStart().startsWith("|")) i++;
        else break;
      }
      if (tableRows.length > 0) {
        const [header, ...body] = tableRows;
        elements.push(
          <div key={`tbl-${i}`} className="overflow-x-auto my-2">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#333333]">
                  {header.map((h, j) => (
                    <th key={j} className="text-left py-1.5 px-2 text-[#9CA3AF] font-semibold whitespace-nowrap">
                      {formatInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, ri) => (
                  <tr key={ri} className="border-b border-[#282828] last:border-0">
                    {row.map((cell, ci) => (
                      <td key={ci} className={cn("py-1.5 px-2 whitespace-nowrap", ci === 0 ? "text-[#9CA3AF]" : "text-[#F0F0F0]")}>
                        {formatInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    if (line.startsWith("### ")) {
      elements.push(<h3 key={i}>{formatInline(line.slice(4))}</h3>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={i}>{formatInline(line.slice(3))}</h2>);
    } else if (line.startsWith("# ")) {
      elements.push(<h1 key={i}>{formatInline(line.slice(2))}</h1>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && (/^[-*] /.test(lines[i]))) {
        items.push(<li key={i}>{formatInline(lines[i].slice(2))}</li>);
        if (i + 1 < lines.length && /^[-*] /.test(lines[i + 1])) i++;
        else break;
      }
      elements.push(<ul key={`ul-${i}`}>{items}</ul>);
    } else if (/^\d+\. /.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(<li key={i}>{formatInline(lines[i].replace(/^\d+\.\s*/, ""))}</li>);
        if (i + 1 < lines.length && /^\d+\. /.test(lines[i + 1])) i++;
        else break;
      }
      elements.push(<ol key={`ol-${i}`}>{items}</ol>);
    } else if (line.trim() === "") {
      // skip consecutive blank lines
    } else {
      elements.push(<p key={i}>{formatInline(line)}</p>);
    }
  }

  return <>{elements}</>;
}

function formatInline(text: string): React.ReactNode {
  // Process bold, italic, links, and inline code
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Links: [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      parts.push(
        <a key={key++} href={linkMatch[2]} target="_blank" rel="noopener noreferrer">
          {linkMatch[1]}
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Bold: **text**
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
    if (boldMatch) {
      parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic: *text* (single asterisk, not followed by another)
    const italicMatch = remaining.match(/^\*([^*]+)\*/);
    if (italicMatch) {
      parts.push(<em key={key++}>{italicMatch[1]}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Inline code: `text`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      parts.push(
        <code key={key++}>{codeMatch[1]}</code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Regular text up to next special character
    const nextSpecial = remaining.search(/\[|\*|`/);
    if (nextSpecial === -1) {
      parts.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      // Not a match, consume one character
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      parts.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

function ThinkingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-lg bg-[#E8311A]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Sparkles className="w-3.5 h-3.5 text-[#E8311A] animate-pulse" />
      </div>
      <div className="bg-[#141414] border border-[#282828] rounded-xl rounded-bl-none px-3.5 py-2.5">
        <div className="flex gap-1.5 items-center">
          <span className="text-xs text-[#71717A]">Researching</span>
          <span className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
        </div>
      </div>
    </div>
  );
}

export function AiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  async function handleSend(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.content ?? "Sorry, I couldn't process that request.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleReset() {
    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <div className="w-12 h-12 rounded-2xl bg-[#E8311A]/10 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-[#E8311A]" />
            </div>
            <h1 className="text-lg font-bold text-[#F0F0F0] mb-1">Huat AI</h1>
            <p className="text-sm text-[#71717A] mb-8 text-center max-w-sm">
              Your kopitiam uncle that actually reads the research. Ask me anything lah.
            </p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-md">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="text-left px-3 py-2.5 rounded-lg border border-[#282828] bg-[#141414] text-xs text-[#9CA3AF] hover:border-[#383838] hover:text-[#F0F0F0] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {loading && <ThinkingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="flex-shrink-0 border-t border-[#282828] px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          {messages.length > 0 && (
            <button
              onClick={handleReset}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-[#71717A] hover:text-[#F0F0F0] hover:bg-[#141414] transition-colors"
              title="New chat"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <div className="flex-1 flex items-center bg-[#141414] border border-[#333333] rounded-xl px-3.5 py-2.5 focus-within:border-[#444444] transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about any stock, theme, or market…"
              rows={1}
              className="flex-1 bg-transparent text-sm text-[#F0F0F0] placeholder:text-[#71717A] outline-none resize-none min-w-0 leading-relaxed"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className={cn(
                "flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all ml-2",
                input.trim() && !loading
                  ? "bg-[#E8311A] text-white hover:bg-[#c9280f] active:scale-95"
                  : "text-[#555555] cursor-not-allowed"
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="text-center text-[10px] text-[#555555] mt-2 max-w-3xl mx-auto">
          Powered by <a href="https://www.smartkarma.com/profiles/sk/about" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[#9CA3AF] transition-colors">Smartkarma αSK</a>. Not financial advice.
        </p>
      </div>
    </div>
  );
}
