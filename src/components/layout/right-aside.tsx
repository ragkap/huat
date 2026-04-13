"use client";
import { usePathname } from "next/navigation";

export function RightAside({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Stock ticker pages have their own RHS column via nested layout
  // /stocks list page doesn't need the sidebar either
  const isStockPage = /^\/stocks(\/|$)/.test(pathname);

  if (isStockPage) return null;

  return (
    <aside className="w-80 flex-shrink-0 p-5 hidden xl:block border-l border-[#282828]">
      <div className="sticky top-20">
        {children}
      </div>
    </aside>
  );
}
