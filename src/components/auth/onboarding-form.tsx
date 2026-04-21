"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const COUNTRIES = [
  { code: "SG", label: "Singapore 🇸🇬", desc: "SGX investor" },
  { code: "MY", label: "Malaysia 🇲🇾", desc: "Bursa investor" },
  { code: "US", label: "United States 🇺🇸", desc: "NYSE/NASDAQ investor" },
] as const;

export function OnboardingForm() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [country, setCountry] = useState<"SG" | "MY" | "US" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit() {
    if (!username || !displayName || !country) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/profile/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          display_name: displayName,
          country,
          referral_code: typeof window !== "undefined" ? localStorage.getItem("huat_ref") : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to set up profile");
      } else {
        localStorage.removeItem("huat_ref");
        router.push("/feed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Country */}
      <div>
        <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider block mb-3">
          Where are you based?
        </label>
        <div className="grid grid-cols-3 gap-2">
          {COUNTRIES.map(c => (
            <button
              key={c.code}
              onClick={() => setCountry(c.code)}
              className={cn(
                "flex flex-col items-center p-3 rounded border text-center transition-colors",
                country === c.code
                  ? "border-[#E8311A] bg-[#E8311A]/10 text-[#F0F0F0]"
                  : "border-[#333333] text-[#9CA3AF] hover:border-[#444444]"
              )}
            >
              <span className="text-xl mb-1">{c.label.split(" ")[1]}</span>
              <span className="text-xs font-bold">{c.code}</span>
              <span className="text-xs text-[#71717A] mt-0.5">{c.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <Input
        label="Display name"
        placeholder="e.g. Ah Huat"
        value={displayName}
        onChange={e => setDisplayName(e.target.value)}
      />

      {/* Username */}
      <div>
        <Input
          label="Username"
          placeholder="e.g. ahhuat88"
          value={username}
          onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
        />
        <p className="text-xs text-[#71717A] mt-1">Letters, numbers, and underscores only</p>
      </div>

      {error && <p className="text-sm text-[#EF4444]">{error}</p>}

      <Button
        className="w-full"
        onClick={handleSubmit}
        loading={loading}
        disabled={!username || !displayName || !country}
      >
        Let's go — Huat ah! 发
      </Button>
    </div>
  );
}
