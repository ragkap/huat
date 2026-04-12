"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/stocks", label: "Stocks", icon: TrendingUp },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-14 h-[calc(100vh-3.5rem)] w-64 flex-shrink-0 border-r border-[#282828] flex flex-col pt-3 pb-6 px-4">
      <nav className="flex flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors",
                active
                  ? "text-[#F0F0F0] bg-[#282828]"
                  : "text-[#9CA3AF] hover:text-[#F0F0F0] hover:bg-[#141414]"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
