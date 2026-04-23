"use client";

import { useState, useEffect } from "react";

interface Preferences {
  new_message: boolean;
  new_follower: boolean;
  connect_request: boolean;
  connect_accepted: boolean;
  post_reply: boolean;
  post_reaction: boolean;
  post_repost: boolean;
  angbao_milestone: boolean;
  weekly_digest: boolean;
  pause_all: boolean;
}

const SECTIONS = [
  {
    title: "Messages",
    items: [
      { key: "new_message", label: "New message", desc: "When someone sends you a direct message" },
    ],
  },
  {
    title: "Social",
    items: [
      { key: "new_follower", label: "New follower", desc: "When someone follows you" },
      { key: "connect_request", label: "Connection request", desc: "When someone wants to connect" },
      { key: "connect_accepted", label: "Connection accepted", desc: "When your connection request is accepted" },
    ],
  },
  {
    title: "Posts",
    items: [
      { key: "post_reply", label: "Replies", desc: "When someone replies to your post" },
      { key: "post_reaction", label: "Reactions", desc: "When someone reacts to your post" },
      { key: "post_repost", label: "Reposts", desc: "When someone reposts your content" },
    ],
  },
  {
    title: "Digest & Milestones",
    items: [
      { key: "weekly_digest", label: "Weekly digest", desc: "Summary of your week including top posts and trending stocks" },
      { key: "angbao_milestone", label: "AngBao milestones", desc: "When your AngBao balance hits a milestone" },
    ],
  },
] as const;

const DEFAULT_PREFS: Preferences = {
  new_message: true, new_follower: true, connect_request: true, connect_accepted: true,
  post_reply: true, post_reaction: false, post_repost: false,
  angbao_milestone: true, weekly_digest: true, pause_all: false,
};

export function EmailPreferencesForm() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me/email-preferences")
      .then(r => r.json())
      .then(d => { if (d.preferences) setPrefs(d.preferences); })
      .finally(() => setLoading(false));
  }, []);

  async function toggle(key: keyof Preferences) {
    const newValue = !prefs[key];
    setPrefs(p => ({ ...p, [key]: newValue }));
    setSaving(key);
    await fetch("/api/me/email-preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: newValue }),
    });
    setSaving(null);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 bg-[#141414] rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pause all */}
      <div className="flex items-center justify-between bg-[#141414] border border-[#282828] rounded-lg px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-[#F0F0F0]">Pause all emails</p>
          <p className="text-xs text-[#71717A] mt-0.5">Temporarily stop all email notifications</p>
        </div>
        <button
          onClick={() => toggle("pause_all")}
          className={`w-10 h-5 rounded-full relative transition-colors ${prefs.pause_all ? "bg-[#E8311A]" : "bg-[#333333]"}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${prefs.pause_all ? "left-5.5" : "left-0.5"}`}
            style={{ left: prefs.pause_all ? 22 : 2 }} />
        </button>
      </div>

      {!prefs.pause_all && SECTIONS.map(section => (
        <div key={section.title}>
          <h2 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">{section.title}</h2>
          <div className="bg-[#141414] border border-[#282828] rounded-lg divide-y divide-[#282828]">
            {section.items.map(item => (
              <div key={item.key} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0 mr-3">
                  <p className="text-sm text-[#F0F0F0]">{item.label}</p>
                  <p className="text-xs text-[#71717A] mt-0.5">{item.desc}</p>
                </div>
                <button
                  onClick={() => toggle(item.key as keyof Preferences)}
                  disabled={saving === item.key}
                  className={`w-10 h-5 rounded-full relative transition-colors flex-shrink-0 ${prefs[item.key as keyof Preferences] ? "bg-[#22C55E]" : "bg-[#333333]"}`}
                >
                  <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                    style={{ left: prefs[item.key as keyof Preferences] ? 22 : 2 }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {prefs.pause_all && (
        <p className="text-sm text-[#71717A] text-center py-4">
          All email notifications are paused. Toggle above to resume.
        </p>
      )}
    </div>
  );
}
