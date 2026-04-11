import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "bullish" | "bearish" | "neutral" | "brand" | "default";
  className?: string;
}

const variants = {
  bullish: "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20",
  bearish: "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20",
  neutral: "bg-[#9CA3AF]/10 text-[#9CA3AF] border border-[#9CA3AF]/20",
  brand: "bg-[#E8311A]/10 text-[#E8311A] border border-[#E8311A]/20",
  default: "bg-[#282828] text-[#9CA3AF] border border-[#333333]",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", variants[variant], className)}>
      {children}
    </span>
  );
}
