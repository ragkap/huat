"use client";

import { cn } from "@/lib/utils";

interface MentionDropdownProps {
  results: { username: string; display_name: string }[];
  selectedIndex: number;
  onSelect: (username: string) => void;
  loading: boolean;
}

export function MentionDropdown({ results, selectedIndex, onSelect, loading }: MentionDropdownProps) {
  if (!loading && results.length === 0) return null;

  return (
    <div className="absolute left-0 right-0 bottom-full mb-1 z-50 bg-[#1C1C1C] border border-[#333333] rounded-lg shadow-xl py-1 max-h-[200px] overflow-y-auto">
      {loading && results.length === 0 ? (
        <div className="px-3 py-2 text-xs text-[#71717A]">Searching...</div>
      ) : (
        results.map((user, i) => (
          <button
            key={user.username}
            onMouseDown={e => { e.preventDefault(); onSelect(user.username); }}
            className={cn(
              "flex items-center gap-2.5 w-full px-3 py-2 text-left transition-colors",
              i === selectedIndex ? "bg-[#282828]" : "hover:bg-[#282828]"
            )}
          >
            <div className="w-6 h-6 rounded-full bg-[#282828] border border-[#333333] flex items-center justify-center text-[10px] font-bold text-[#9CA3AF] flex-shrink-0">
              {user.display_name[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="text-sm text-[#F0F0F0] font-medium">{user.display_name}</span>
              <span className="text-xs text-[#555555] ml-1.5">@{user.username}</span>
            </div>
          </button>
        ))
      )}
    </div>
  );
}
