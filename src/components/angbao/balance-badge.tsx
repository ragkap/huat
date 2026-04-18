"use client";

import Link from "next/link";
import { formatAngBao } from "@/lib/angbao";
import { ripple } from "@/lib/utils";
import { useAngBaoToast } from "@/components/angbao/credit-toast";

export function AngBaoBadge({ username }: { username: string }) {
  const { balance } = useAngBaoToast();

  return (
    <Link
      href={`/profile/${username}`}
      onClick={ripple}
      className="relative overflow-hidden flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E8311A]/10 border border-[#E8311A]/20 hover:bg-[#E8311A]/15 transition-colors"
      title="Your AngBao balance"
    >
      <span className="text-sm">🧧</span>
      <span className="text-xs font-bold text-[#E8311A] tabular-nums">{formatAngBao(balance)}</span>
    </Link>
  );
}
