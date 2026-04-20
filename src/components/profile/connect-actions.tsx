"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ConnectActions({ actorId }: { actorId: string }) {
  const [status, setStatus] = useState<"pending" | "accepted" | "declined">("pending");
  const [loading, setLoading] = useState(false);

  async function handleAccept() {
    setLoading(true);
    await fetch("/api/users/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject_id: actorId, rel_type: "connect" }),
    });
    setStatus("accepted");
    setLoading(false);
  }

  async function handleDecline() {
    setLoading(true);
    await fetch("/api/users/connections", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject_id: actorId, rel_type: "connect_request" }),
    });
    setStatus("declined");
    setLoading(false);
  }

  if (status === "accepted") {
    return <p className="text-xs text-[#22C55E] mt-1.5 font-semibold">Connected!</p>;
  }
  if (status === "declined") {
    return <p className="text-xs text-[#71717A] mt-1.5">Declined</p>;
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <Button size="sm" onClick={handleAccept} loading={loading}>
        Accept
      </Button>
      <Button size="sm" variant="ghost" onClick={handleDecline} loading={loading}>
        Decline
      </Button>
    </div>
  );
}
