"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ProfileActionsProps {
  profileId: string;
  isFollowing: boolean;
  isConnected: boolean;
  isPending: boolean;
}

export function ProfileActions({ profileId, isFollowing: initFollow, isConnected, isPending: initPending }: ProfileActionsProps) {
  const [following, setFollowing] = useState(initFollow);
  const [pending, setPending] = useState(initPending);
  const [loading, setLoading] = useState(false);

  async function handleFollow() {
    setLoading(true);
    const method = following ? "DELETE" : "POST";
    await fetch("/api/users/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject_id: profileId, rel_type: "follow" }),
    });
    if (following) {
      await fetch("/api/users/connections", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject_id: profileId, rel_type: "follow" }),
      });
      setFollowing(false);
    } else {
      setFollowing(true);
    }
    void method; // suppress unused variable
    setLoading(false);
  }

  async function handleConnect() {
    if (pending || isConnected) return;
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
    <div className="flex items-center gap-2">
      <Button
        variant={following ? "secondary" : "primary"}
        size="sm"
        onClick={handleFollow}
        loading={loading}
      >
        {following ? "Following" : "Follow"}
      </Button>
      {!isConnected && (
        <Button
          variant="secondary"
          size="sm"
          onClick={handleConnect}
          loading={loading}
          disabled={pending || isConnected}
        >
          {isConnected ? "Connected" : pending ? "Pending" : "Connect"}
        </Button>
      )}
    </div>
  );
}
