import Image from "next/image";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = { xs: 24, sm: 32, md: 40, lg: 48, xl: 64 };
const classes = { xs: "w-6 h-6", sm: "w-8 h-8", md: "w-10 h-10", lg: "w-12 h-12", xl: "w-16 h-16" };

export function Avatar({ src, alt, size = "md", className }: AvatarProps) {
  const px = sizes[size];
  const initials = alt
    .split(" ")
    .map(w => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (!src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-[#282828] border border-[#333333] text-[#9CA3AF] font-bold flex-shrink-0",
          classes[size],
          className
        )}
        style={{ fontSize: px * 0.35 }}
      >
        {initials}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={px}
      height={px}
      className={cn("rounded-full object-cover flex-shrink-0", classes[size], className)}
    />
  );
}
