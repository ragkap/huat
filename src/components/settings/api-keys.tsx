"use client";

import { useState } from "react";
import { Copy, Check, Trash2, Plus, KeyRound, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ApiKeyRow {
  id: string;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

interface CreatedKey extends ApiKeyRow {
  raw: string;
}

export function ApiKeysManager({ initialKeys }: { initialKeys: ApiKeyRow[] }) {
  const [keys, setKeys] = useState<ApiKeyRow[]>(initialKeys);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [justCreated, setJustCreated] = useState<CreatedKey | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) { setError("Give the key a name so you can identify it later."); return; }
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/me/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create key"); return; }
      const created = data.key as CreatedKey;
      setJustCreated(created);
      setKeys(prev => [{ ...created, last_used_at: null, revoked_at: null }, ...prev]);
      setNewName("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm("Revoke this key? Any integrations using it will stop working immediately.")) return;
    const prev = keys;
    setKeys(prev.map(k => k.id === id ? { ...k, revoked_at: new Date().toISOString() } : k));
    const res = await fetch(`/api/me/api-keys/${id}`, { method: "DELETE" });
    if (!res.ok) { setKeys(prev); alert("Failed to revoke key."); }
  }

  async function copyRaw(raw: string) {
    await navigator.clipboard.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const active = keys.filter(k => !k.revoked_at);
  const revoked = keys.filter(k => !!k.revoked_at);

  return (
    <div className="space-y-6">
      {/* Reveal-once banner */}
      {justCreated && (
        <div className="border border-[#E8311A]/40 bg-[#E8311A]/5 rounded p-4">
          <div className="flex items-start gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-[#E8311A] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-[#F0F0F0]">Copy this key now — it won&apos;t be shown again.</p>
              <p className="text-xs text-[#9CA3AF] mt-1">Store it somewhere safe. If you lose it, revoke and create a new one.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#0A0A0A] border border-[#282828] rounded px-3 py-2 font-mono text-xs text-[#F0F0F0] break-all">
            <span className="flex-1">{justCreated.raw}</span>
            <button
              onClick={() => copyRaw(justCreated.raw)}
              className="flex items-center gap-1 text-xs text-[#9CA3AF] hover:text-[#F0F0F0] flex-shrink-0"
            >
              {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
            </button>
          </div>
          <button
            onClick={() => setJustCreated(null)}
            className="mt-3 text-xs text-[#9CA3AF] hover:text-[#F0F0F0]"
          >
            I&apos;ve saved it — dismiss
          </button>
        </div>
      )}

      {/* Create form */}
      <div className="border border-[#282828] rounded p-4 bg-[#080808]">
        <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">Create a new key</p>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="e.g. Personal trading bot"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleCreate(); }}
              maxLength={60}
            />
          </div>
          <Button onClick={handleCreate} loading={creating} disabled={!newName.trim()}>
            <Plus className="w-4 h-4 mr-1" /> Generate
          </Button>
        </div>
        {error && <p className="text-xs text-[#EF4444] mt-2">{error}</p>}
      </div>

      {/* Active keys */}
      <div>
        <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-2">
          Active ({active.length})
        </p>
        {active.length === 0 ? (
          <div className="border border-dashed border-[#282828] rounded p-6 text-center">
            <KeyRound className="w-5 h-5 text-[#555555] mx-auto mb-2" />
            <p className="text-sm text-[#71717A]">No active API keys yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#282828] border border-[#282828] rounded">
            {active.map(k => (
              <li key={k.id} className="flex items-center justify-between p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#F0F0F0] truncate">{k.name}</p>
                  <p className="text-xs text-[#71717A] font-mono">
                    {k.key_prefix}••••••••••••••••
                  </p>
                  <p className="text-[11px] text-[#555555] mt-0.5">
                    Created {new Date(k.created_at).toLocaleDateString()} ·{" "}
                    {k.last_used_at
                      ? `Last used ${new Date(k.last_used_at).toLocaleDateString()}`
                      : "Never used"}
                  </p>
                </div>
                <button
                  onClick={() => handleRevoke(k.id)}
                  className="flex items-center gap-1 text-xs text-[#9CA3AF] hover:text-[#EF4444] px-2 py-1 rounded transition-colors flex-shrink-0"
                  title="Revoke key"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {revoked.length > 0 && (
        <div>
          <p className="text-xs font-bold text-[#555555] uppercase tracking-wider mb-2">
            Revoked ({revoked.length})
          </p>
          <ul className="divide-y divide-[#282828] border border-[#282828] rounded opacity-60">
            {revoked.map(k => (
              <li key={k.id} className="p-3">
                <p className="text-sm text-[#9CA3AF] truncate">{k.name}</p>
                <p className="text-xs text-[#71717A] font-mono">{k.key_prefix}••••</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
