"use client";
import { useState } from "react";
import { UserPlus, UserCheck, Link2, Clock, MessageSquare, Check } from "lucide-react";
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
    if (following) {
      await fetch("/api/users/connections", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject_id: profileId, rel_type: "follow" }),
      });
      setFollowing(false);
    } else {
      await fetch("/api/users/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject_id: profileId, rel_type: "follow" }),
      });
      setFollowing(true);
      angbao.showCredit("follow", 0.50);
    }
    setLoading(false);
  }

  async function handleConnect() {
    if (pending || connected) return;
    setLoading(true);
    await fetch("/api/users/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject_id: profileId, rel_type: "connect_request" }),
    });
    setPending(true);
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant={following ? "secondary" : "primary"}
          size="sm"
          onClick={handleFollow}
          loading={loading}
        >
          {following ? <><UserCheck className="w-3.5 h-3.5 mr-1" />Following</> : <><UserPlus className="w-3.5 h-3.5 mr-1" />Follow</>}
        </Button>

        {connected ? (
          <Button variant="secondary" size="sm" disabled>
            <Check className="w-3.5 h-3.5 mr-1" />Connected
          </Button>
        ) : pending ? (
          <Button variant="secondary" size="sm" disabled>
            <Clock className="w-3.5 h-3.5 mr-1" />Pending
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={handleConnect} loading={loading}>
            <Link2 className="w-3.5 h-3.5 mr-1" />Connect
          </Button>
        )}

        {connected && (
          <Button variant="secondary" size="sm" onClick={() => window.dispatchEvent(new CustomEvent("huat:open-chat", { detail: profileId }))}>
            <MessageSquare className="w-3.5 h-3.5 mr-1" />Message
          </Button>
        )}
      </div>

      {/* Explanation text */}
      <p className="text-[10px] text-[#555555] text-right max-w-[260px] leading-relaxed">
        {!following && !connected && "Follow to see their posts in your feed. Connect to message them."}
        {following && !connected && !pending && "You're following. Connect to start messaging."}
        {following && pending && "You're following. Connection request pending."}
        {following && connected && "You're connected! You can message each other."}
        {!following && connected && "You're connected. Follow to also see their posts."}
        {!following && pending && "Connection request pending. Follow to see their posts."}
      </p>
    </div>
  );
}
