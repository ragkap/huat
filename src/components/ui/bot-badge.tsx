import { cn } from "@/lib/utils";

interface BotBadgeProps {
  size?: "xs" | "sm";
  className?: string;
}

/**
 * Inline pill that marks an account as a bot. Render anywhere a bot's
 * username/display_name appears: profile, post header, mentions, search.
 */
export function BotBadge({ size = "xs", className }: BotBadgeProps) {
  const sizeClasses = size === "sm"
    ? "text-[10px] px-1.5 py-0.5"
    : "text-[9px] px-1 py-px";
  return (
    <span
      className={cn(
        "inline-flex items-center font-mono font-bold uppercase tracking-wider rounded",
        "bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30",
        sizeClasses,
        className,
      )}
      title="Bot account"
    >
      Bot
    </span>
  );
}
