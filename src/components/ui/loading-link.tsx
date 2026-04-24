"use client";

import Link from "next/link";
import { useState } from "react";
import { ripple } from "@/lib/utils";

export function LoadingLink({ className, children, ...props }: React.ComponentProps<typeof Link>) {
  const [loading, setLoading] = useState(false);

  return (
    <Link
      onClick={(e) => {
        ripple(e);
        setLoading(true);
      }}
      className={`relative overflow-hidden ${loading ? "[&>*:not([data-spinner])]:opacity-40" : ""} ${className ?? ""}`}
      {...props}
    >
      {children}
      {loading && (
        <span
          data-spinner
          aria-hidden
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </span>
      )}
    </Link>
  );
}
