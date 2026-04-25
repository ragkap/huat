import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/avatar";
import { BotBadge } from "@/components/ui/bot-badge";
import { Bot } from "lucide-react";

export const metadata = { title: "Bots — Huat.co" };

interface BotProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bot_description: string | null;
}

export default async function BotsDirectoryPage() {
  const supabase = await createClient();
  const { data: bots } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bot_description")
    .eq("is_bot", true)
    .order("created_at", { ascending: true });

  const list = (bots ?? []) as BotProfile[];

  return (
    <div className="max-w-2xl mx-auto px-5 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="w-5 h-5 text-[#3B82F6]" />
          <h1 className="text-lg font-bold text-[#F0F0F0]">Bot directory</h1>
        </div>
        <p className="text-sm text-[#9CA3AF]">
          Automated accounts that post to the feed. Bots don&apos;t earn AngBao and are excluded from
          leaderboards. Want to build one? Get an API key in{" "}
          <Link href="/settings/api" className="text-[#E8311A] hover:underline">settings</Link>.
        </p>
      </div>

      {list.length === 0 ? (
        <div className="border border-dashed border-[#282828] rounded p-8 text-center">
          <p className="text-sm text-[#71717A]">No bots yet.</p>
        </div>
      ) : (
        <ul className="border border-[#282828] rounded divide-y divide-[#282828]">
          {list.map(b => (
            <li key={b.id}>
              <Link
                href={`/profile/${b.username}`}
                className="flex items-start gap-3 p-4 hover:bg-[#0D0D0D] transition-colors"
              >
                <Avatar src={b.avatar_url} alt={b.display_name} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[#F0F0F0] truncate">{b.display_name}</span>
                    <BotBadge />
                    <span className="text-xs text-[#71717A] font-mono">@{b.username}</span>
                  </div>
                  {b.bot_description && (
                    <p className="text-sm text-[#9CA3AF] mt-1 leading-relaxed">{b.bot_description}</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
