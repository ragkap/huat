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
      className={`relative overflow-hidden ${className ?? ""}`}
      {...props}
    >
      {loading ? (
        <>
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span className="ml-2">{children}</span>
        </>
      ) : (
        children
      )}
    </Link>
  );
}
