"use client";

import { formatAngBao } from "@/lib/angbao";
import { ripple } from "@/lib/utils";
import { useAngBaoToast } from "@/components/angbao/credit-toast";

export function AngBaoBadge() {
  const { balance } = useAngBaoToast();

  return (
    <button
      onClick={e => {
        ripple(e);
        window.dispatchEvent(new CustomEvent("huat:open-referral", { detail: null }));
      }}
      className="relative overflow-hidden flex items-center gap-1.5 h-10 px-2.5 rounded-lg bg-[#E8311A]/10 hover:bg-[#E8311A]/15 transition-colors"
      title="Your AngBao — tap to invite & earn more"
    >
      <span className="text-sm">🧧</span>
      <span className="text-xs font-bold text-[#E8311A] tabular-nums sm:hidden">{formatAngBao(balance, true)}</span>
      <span className="text-xs font-bold text-[#E8311A] tabular-nums hidden sm:inline">{formatAngBao(balance)}</span>
    </button>
  );
}
