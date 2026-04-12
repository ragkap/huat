"use client";
import { usePathname } from "next/navigation";

export function RightAside({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Stock ticker pages have their own RHS column via nested layout
  const isStockPage = /^\/stocks\/[^/]+/.test(pathname);

  if (isStockPage) return null;

  return (
    <aside className="w-72 xl:w-80 flex-shrink-0 p-6 hidden xl:block">
      <div className="sticky top-20">
        {children}
      </div>
    </aside>
  );
}
