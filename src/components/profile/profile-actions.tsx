"use client";
import { useState } from "react";
import { UserPlus, Link2, Clock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAngBaoToast } from "@/components/angbao/credit-toast";

interface ProfileActionsProps {
  profileId: string;
  isFollowing: boolean;
  isConnected: boolean;
  isPending: boolean;
}

export function ProfileActions({ profileId, isFollowing: initFollow, isConnected: initConnected, isPending: initPending }: ProfileActionsProps) {
  const [following, setFollowing] = useState(initFollow);
  const [connected, setConnected] = useState(initConnected);
  const [pending, setPending] = useState(initPending);
  const [loading, setLoading] = useState(false);
  const angbao = useAngBaoToast();

  async function handleFollow() {
    setLoading(true);
    await fetch("/api/users/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject_id: profileId, rel_type: "follow" }),
    });
    setFollowing(true);
    angbao.showCredit("follow", 0.50);
    setLoading(false);
  }

  async function handleConnect() {
    if (pending || connected) return;
    setLoading(true);
    // Connect implies follow — do both
    if (!following) {
      await fetch("/api/users/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject_id: profileId, rel_type: "follow" }),
      });
      setFollowing(true);
      angbao.showCredit("follow", 0.50);
    }
    await fetch("/api/users/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject_id: profileId, rel_type: "connect_request" }),
    });
    setPending(true);
    setLoading(false);
  }

  // Connected — only show Message button
  if (connected) {
    return (
      <Button variant="primary" size="sm" onClick={() => window.dispatchEvent(new CustomEvent("huat:open-chat", { detail: profileId }))}>
        <MessageSquare className="w-3.5 h-3.5 mr-1" />Message
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        {/* Show Follow only if not yet following */}
        {!following && (
          <Button variant="primary" size="sm" onClick={handleFollow} loading={loading}>
            <UserPlus className="w-3.5 h-3.5 mr-1" />Follow
          </Button>
        )}

        {/* Connect / Pending */}
        {pending ? (
          <Button variant="secondary" size="sm" disabled>
            <Clock className="w-3.5 h-3.5 mr-1" />Pending
          </Button>
        ) : (
          <Button variant={following ? "primary" : "secondary"} size="sm" onClick={handleConnect} loading={loading}>
            <Link2 className="w-3.5 h-3.5 mr-1" />Connect
          </Button>
        )}
      </div>

      <p className="text-[10px] text-[#555555] text-right max-w-[260px] leading-relaxed">
        {!following && !pending && "Follow to see their posts. Connect to message them."}
        {following && !pending && "You're following. Connect to start messaging."}
        {following && pending && "You're following. Connection request pending."}
        {!following && pending && "Connection request sent. Follow to see their posts."}
      </p>
    </div>
  );
}
