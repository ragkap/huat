"use client";

import Link from "next/link";
import { ripple } from "@/lib/utils";

export function RippleLink({ className, children, ...props }: React.ComponentProps<typeof Link>) {
  return (
    <Link
      onClick={ripple}
      className={`relative overflow-hidden ${className ?? ""}`}
      {...props}
    >
      {children}
    </Link>
  );
}
