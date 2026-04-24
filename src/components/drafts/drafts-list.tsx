"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Send, Trash2, AlertCircle, FileText } from "lucide-react";
import type { DraftRow } from "@/app/(app)/drafts/page";

export function DraftsList({ initialDrafts }: { initialDrafts: DraftRow[] }) {
  const [drafts, setDrafts] = useState(initialDrafts);
  const [busy, setBusy] = useState<string | null>(null);
  const router = useRouter();

  async function handlePublish(id: string) {
    if (busy) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/drafts/${id}/publish`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "Failed to publish"); return; }
      setDrafts(prev => prev.filter(d => d.id !== id));
      router.push("/feed");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(id: string) {
    if (busy) return;
    if (!confirm("Delete this draft?")) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/drafts/${id}`, { method: "DELETE" });
      if (!res.ok) { alert("Failed to delete"); return; }
      setDrafts(prev => prev.filter(d => d.id !== id));
    } finally {
      setBusy(null);
    }
  }

  async function handleUnschedule(id: string) {
    if (busy) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/drafts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduled_for: null }),
      });
      if (!res.ok) { alert("Failed to unschedule"); return; }
      setDrafts(prev => prev.map(d => d.id === id ? { ...d, scheduled_for: null, publish_error: null } : d));
    } finally {
      setBusy(null);
    }
  }

  if (!drafts.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FileText className="w-8 h-8 text-[#555555] mb-3" />
        <p className="text-[#F0F0F0] font-bold text-base mb-1">No drafts yet</p>
        <p className="text-[#9CA3AF] text-sm">Save a post as a draft from the composer and it&apos;ll show up here.</p>
      </div>
    );
  }

  const scheduled = drafts.filter(d => d.scheduled_for);
  const plain = drafts.filter(d => !d.scheduled_for);

  return (
    <div className="space-y-6">
      {scheduled.length > 0 && (
        <section>
          <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">
            Scheduled ({scheduled.length})
          </p>
          <ul className="space-y-2">
            {scheduled.map(d => (
              <DraftItem
                key={d.id}
                draft={d}
                busy={busy === d.id}
                onPublish={() => handlePublish(d.id)}
                onDelete={() => handleDelete(d.id)}
                onUnschedule={() => handleUnschedule(d.id)}
              />
            ))}
          </ul>
        </section>
      )}

      {plain.length > 0 && (
        <section>
          <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">
            Drafts ({plain.length})
          </p>
          <ul className="space-y-2">
            {plain.map(d => (
              <DraftItem
                key={d.id}
                draft={d}
                busy={busy === d.id}
                onPublish={() => handlePublish(d.id)}
                onDelete={() => handleDelete(d.id)}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function DraftItem({
  draft,
  busy,
  onPublish,
  onDelete,
  onUnschedule,
}: {
  draft: DraftRow;
  busy: boolean;
  onPublish: () => void;
  onDelete: () => void;
  onUnschedule?: () => void;
}) {
  const schedAt = draft.scheduled_for ? new Date(draft.scheduled_for) : null;
  return (
    <li className="border border-[#282828] rounded p-4 bg-[#080808]">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          {draft.tagged_stocks[0] && (
            <span className="text-xs font-mono font-bold text-[#E8311A] bg-[#E8311A]/10 border border-[#E8311A]/20 rounded px-2 py-0.5">
              {draft.tagged_stocks[0]}
            </span>
          )}
          {draft.post_type === "forecast" && (
            <span className="text-[10px] font-bold text-[#3B82F6] bg-[#3B82F6]/10 border border-[#3B82F6]/20 rounded px-2 py-0.5 uppercase">
              Forecast
            </span>
          )}
          {schedAt && (
            <span className="inline-flex items-center gap-1 text-xs text-[#9CA3AF]">
              <Clock className="w-3 h-3" />
              {schedAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
            </span>
          )}
        </div>
        <span className="text-[10px] text-[#555555] flex-shrink-0">
          Updated {new Date(draft.updated_at).toLocaleDateString()}
        </span>
      </div>

      <p className="text-sm text-[#F0F0F0] whitespace-pre-wrap break-words mb-3">
        {draft.content || <span className="text-[#71717A] italic">(empty)</span>}
      </p>

      {draft.publish_error && (
        <div className="flex items-start gap-2 text-xs text-[#EF4444] bg-[#EF4444]/5 border border-[#EF4444]/20 rounded px-3 py-2 mb-3">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>Scheduled publish failed: {draft.publish_error}</span>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onPublish}
          disabled={busy || !draft.content.trim()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#E8311A] rounded hover:bg-[#c9280f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-3 h-3" /> Publish now
        </button>
        {onUnschedule && (
          <button
            onClick={onUnschedule}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#9CA3AF] border border-[#333333] rounded hover:border-[#444444] hover:text-[#F0F0F0] transition-colors disabled:opacity-50"
          >
            Unschedule
          </button>
        )}
        <button
          onClick={onDelete}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#9CA3AF] hover:text-[#EF4444] transition-colors ml-auto disabled:opacity-50"
        >
          <Trash2 className="w-3 h-3" /> Delete
        </button>
      </div>
    </li>
  );
}
