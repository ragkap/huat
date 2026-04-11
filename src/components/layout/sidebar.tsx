"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bell, MessageSquare, Bookmark, User, TrendingUp, Search, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types/database";

const navItems = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/explore", label: "Explore", icon: Search },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/stocks", label: "Stocks", icon: TrendingUp },
];

interface SidebarProps {
  profile: Profile;
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 border-r border-[#282828] flex flex-col py-6 px-4">
      {/* Logo */}
      <Link href="/feed" className="flex items-center gap-2 px-2 mb-8 group">
        <span className="text-[#E8311A] font-black text-3xl tracking-tighter leading-none">huat</span>
        <span className="text-[#E8311A] font-black text-3xl">发</span>
      </Link>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
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

      {/* Profile + Logout */}
      <div className="border-t border-[#282828] pt-4 mt-4">
        <Link
          href={`/profile/${profile.username}`}
          className="flex items-center gap-3 px-3 py-2.5 rounded hover:bg-[#141414] transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-[#282828] border border-[#333333] flex items-center justify-center text-xs font-bold text-[#9CA3AF]">
            {profile.display_name[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#F0F0F0] truncate">{profile.display_name}</p>
            <p className="text-xs text-[#9CA3AF] truncate">@{profile.username}</p>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#141414] transition-colors mt-1"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
