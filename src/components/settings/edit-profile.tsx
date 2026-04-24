"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import type { Profile } from "@/types/database";

export function EditProfileForm({ profile }: { profile: Profile }) {
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith("image/")) { setError("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5MB"); return; }

    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        setAvatarUrl(data.url);
      } else {
        setError(data.error ?? "Upload failed");
      }
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!displayName.trim() || !username.trim()) { setError("Name and username are required"); return; }
    if (username.length < 2 || username.length > 30) { setError("Username must be 2-30 characters"); return; }
    if (!/^[a-z0-9_.]+$/.test(username)) { setError("Username can only contain lowercase letters, numbers, dots, and underscores"); return; }
    if (bio.length > 50) { setError("Bio must be 50 characters or less"); return; }

    setSaving(true);
    setError("");
    setSuccess(false);

    const res = await fetch("/api/profile/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name: displayName.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
      }),
    });

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => {
        router.push(`/profile/${username.trim().toLowerCase()}`);
        router.refresh();
      }, 1000);
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to update profile");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar src={avatarUrl} alt={displayName} size="xl" />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity"
          >
            {uploading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera className="w-5 h-5 text-white" />
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </div>
        <div>
          <p className="text-sm text-[#F0F0F0] font-semibold">{displayName}</p>
          <p className="text-xs text-[#71717A]">@{username}</p>
          <button
            onClick={() => fileRef.current?.click()}
            className="text-xs text-[#E8311A] hover:text-[#c9280f] mt-1 transition-colors"
          >
            {uploading ? "Uploading..." : "Change photo"}
          </button>
        </div>
      </div>

      {/* Display name */}
      <Input
        label="Display name"
        value={displayName}
        onChange={e => setDisplayName(e.target.value)}
        maxLength={60}
      />

      {/* Username */}
      <div>
        <Input
          label="Username"
          value={username}
          onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
          maxLength={30}
        />
        <p className="text-[10px] text-[#555555] mt-1">Lowercase letters, numbers, dots, underscores. 2-30 chars.</p>
      </div>

      {/* Bio */}
      <div>
        <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">Bio</label>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value.slice(0, 50))}
          placeholder="What are you about?"
          rows={2}
          maxLength={50}
          className="w-full bg-[#141414] border border-[#333333] rounded-lg px-3 py-2 text-sm text-text placeholder:text-[#71717A] focus:outline-none focus:border-[#444444] transition-colors resize-none"
        />
        <p className="text-[10px] text-[#555555] mt-1 text-right">{bio.length}/50</p>
      </div>

      {/* Error / Success */}
      {error && <p className="text-sm text-[#EF4444]">{error}</p>}
      {success && <p className="text-sm text-[#22C55E]">Profile updated!</p>}

      {/* Save */}
      <Button onClick={handleSave} loading={saving} className="w-full">
        Save changes
      </Button>
    </div>
  );
}
