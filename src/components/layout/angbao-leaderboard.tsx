import { createClient } from "@/lib/supabase/server";
import { RippleLink } from "@/components/ui/ripple-link";
import { formatAngBao } from "@/lib/angbao";

export async function AngBaoLeaderboard() {
  const supabase = await createClient();
  const { data: leaders } = await supabase
    .from("profiles")
    .select("username, display_name, angbao_balance")
    .gt("angbao_balance", 0)
    .order("angbao_balance", { ascending: false })
    .limit(10);

  if (!leaders?.length) return null;

  return (
    <div className="border border-[#282828] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm leading-none">🧧</span>
        <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">AngBao Leaderboard</p>
      </div>
      <div className="space-y-0.5">
        {leaders.map((user, i) => (
          <RippleLink
            key={user.username}
            href={`/profile/${user.username}`}
            className="flex items-center justify-between hover:bg-[#141414] -mx-2 px-2 py-1.5 rounded transition-colors group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`text-[10px] font-bold w-4 flex-shrink-0 ${i < 3 ? "text-[#E8311A]" : "text-[#555555]"}`}>
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#E0E0E0] truncate group-hover:text-white leading-tight">{user.display_name}</p>
                <p className="text-[10px] text-[#555555] font-mono">@{user.username}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#22C55E] flex-shrink-0 ml-2 tabular-nums">{formatAngBao(user.angbao_balance)}</span>
          </RippleLink>
        ))}
      </div>
    </div>
  );
}
