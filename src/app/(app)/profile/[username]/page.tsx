import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ProfileActions } from "@/components/profile/profile-actions";
import { FeedList } from "@/components/feed/feed-list";
import type { Profile } from "@/types/database";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const { username } = await params;
  return { title: `@${username} — Huat.co` };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const supabase = await createClient();
  const [{ data: { user } }, { data: profile }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("profiles").select("*").eq("username", username).single(),
  ]);

  if (!profile) notFound();

  const [followersRes, followingRes, postsCountRes, myRelRes, myProfileRes] = await Promise.all([
    supabase.from("social_graph").select("id", { count: "exact", head: true }).eq("subject_id", profile.id).eq("rel_type", "follow"),
    supabase.from("social_graph").select("id", { count: "exact", head: true }).eq("actor_id", profile.id).eq("rel_type", "follow"),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("author_id", profile.id).is("parent_id", null),
    user ? supabase.from("social_graph").select("rel_type").eq("actor_id", user.id).eq("subject_id", profile.id) : Promise.resolve({ data: [] }),
    user ? supabase.from("profiles").select("*").eq("id", user.id).single() : Promise.resolve({ data: null }),
  ]);

  const myRelations = (myRelRes.data ?? []).map(r => r.rel_type as string);
  const isOwnProfile = user?.id === profile.id;

  const countryFlag: Record<string, string> = { SG: "🇸🇬", MY: "🇲🇾", US: "🇺🇸" };

  return (
    <div>
      {/* Profile info */}
      <div className="px-5 py-6 border-b border-[#282828]">
        <div className="flex items-start justify-between gap-4">
          <Avatar
            src={profile.avatar_url as string | null}
            alt={profile.display_name as string}
            size="xl"
          />
          {!isOwnProfile && user && (
            <ProfileActions
              profileId={profile.id as string}
              isFollowing={myRelations.includes("follow")}
              isConnected={myRelations.includes("connect")}
              isPending={myRelations.includes("connect_request")}
            />
          )}
          {isOwnProfile && (
            <a
              href="/settings/profile"
              className="px-4 py-1.5 text-sm border border-[#333333] rounded text-[#F0F0F0] hover:border-[#444444] transition-colors font-medium"
            >
              Edit profile
            </a>
          )}
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-[#F0F0F0]">{profile.display_name as string}</h2>
            {profile.is_verified && (
              <span className="text-[#E8311A] text-sm">✓</span>
            )}
            <span className="text-lg">{countryFlag[profile.country as string] ?? ""}</span>
          </div>
          <p className="text-[#9CA3AF] text-sm">@{profile.username as string}</p>

          {profile.bio && (
            <p className="text-[#F0F0F0] text-sm mt-3 leading-relaxed">{profile.bio as string}</p>
          )}

          <div className="flex items-center gap-6 mt-4">
            <div>
              <span className="text-[#F0F0F0] font-bold text-sm">{followingRes.count ?? 0}</span>
              <span className="text-[#9CA3AF] text-sm ml-1">Following</span>
            </div>
            <div>
              <span className="text-[#F0F0F0] font-bold text-sm">{followersRes.count ?? 0}</span>
              <span className="text-[#9CA3AF] text-sm ml-1">Followers</span>
            </div>
            <div>
              <span className="text-[#F0F0F0] font-bold text-sm">{postsCountRes.count ?? 0}</span>
              <span className="text-[#9CA3AF] text-sm ml-1">Posts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <FeedList
        tab="foryou"
        profile={myProfileRes.data as Profile ?? profile as Profile}
        authorId={profile.id as string}
      />
    </div>
  );
}
