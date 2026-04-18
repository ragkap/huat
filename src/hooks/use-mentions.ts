"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface MentionResult {
  username: string;
  display_name: string;
  country?: string;
}

interface UseMentionsReturn {
  mentionResults: MentionResult[];
  mentionLoading: boolean;
  mentionActive: boolean;
  selectedIndex: number;
  selectMention: (username: string) => void;
  dismissMention: () => void;
  handleChange: (value: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => boolean;
}

export function useMentions(
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
  content: string,
  setContent: (value: string) => void,
): UseMentionsReturn {
  const [mentionResults, setMentionResults] = useState<MentionResult[]>([]);
  const [mentionLoading, setMentionLoading] = useState(false);
  const [mentionActive, setMentionActive] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissMention = useCallback(() => {
    setMentionActive(false);
    setMentionResults([]);
    setMentionStart(-1);
    setSelectedIndex(0);
  }, []);

  // Extract mention query from content at cursor position
  function getMentionQuery(text: string, cursorPos: number): { query: string; start: number } | null {
    // Walk backwards from cursor to find @
    let i = cursorPos - 1;
    while (i >= 0 && /[\w.]/.test(text[i])) i--;
    if (i < 0 || text[i] !== "@") return null;
    // Check that @ is at start of text or preceded by whitespace/newline
    if (i > 0 && !/\s/.test(text[i - 1])) return null;
    const query = text.slice(i + 1, cursorPos);
    if (query.length === 0) return null;
    return { query, start: i };
  }

  function handleChange(value: string) {
    setContent(value);
    const cursor = textareaRef.current?.selectionStart ?? value.length;
    const mention = getMentionQuery(value, cursor);
    if (mention) {
      setMentionStart(mention.start);
      setMentionActive(true);
      setSelectedIndex(0);
      // Debounce search
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setMentionLoading(true);
        try {
          const res = await fetch(`/api/users/search?q=${encodeURIComponent(mention.query)}`);
          const data = await res.json();
          setMentionResults(data.profiles ?? []);
        } catch {
          setMentionResults([]);
        } finally {
          setMentionLoading(false);
        }
      }, 200);
    } else {
      dismissMention();
    }
  }

  const selectMention = useCallback((username: string) => {
    if (mentionStart < 0) return;
    const cursor = textareaRef.current?.selectionStart ?? content.length;
    const before = content.slice(0, mentionStart);
    const after = content.slice(cursor);
    const newContent = `${before}@${username} ${after}`;
    setContent(newContent);
    dismissMention();
    // Restore cursor position after React re-render
    requestAnimationFrame(() => {
      const pos = mentionStart + username.length + 2; // @username + space
      textareaRef.current?.setSelectionRange(pos, pos);
      textareaRef.current?.focus();
    });
  }, [content, mentionStart, setContent, dismissMention, textareaRef]);

  // Returns true if the key event was handled (should preventDefault)
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): boolean {
    if (!mentionActive || mentionResults.length === 0) return false;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => (i + 1) % mentionResults.length);
      return true;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => (i - 1 + mentionResults.length) % mentionResults.length);
      return true;
    }
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      selectMention(mentionResults[selectedIndex].username);
      return true;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      dismissMention();
      return true;
    }
    return false;
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  return {
    mentionResults,
    mentionLoading,
    mentionActive,
    selectedIndex,
    selectMention,
    dismissMention,
    handleChange,
    handleKeyDown,
  };
}
