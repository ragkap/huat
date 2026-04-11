import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Get social stats
  const [followersRes, followingRes, connectsRes, postsRes, relRes] = await Promise.all([
    supabase.from("social_graph").select("id", { count: "exact" }).eq("subject_id", profile.id).eq("rel_type", "follow"),
    supabase.from("social_graph").select("id", { count: "exact" }).eq("actor_id", profile.id).eq("rel_type", "follow"),
    supabase.from("social_graph").select("id", { count: "exact" }).eq("actor_id", profile.id).eq("rel_type", "connect"),
    supabase.from("posts").select("id", { count: "exact" }).eq("author_id", profile.id).is("parent_id", null),
    user
      ? supabase.from("social_graph").select("rel_type").eq("actor_id", user.id).eq("subject_id", profile.id)
      : Promise.resolve({ data: [] }),
  ]);

  const myRelation = (relRes.data ?? []).map(r => r.rel_type as string);

  return NextResponse.json({
    profile,
    stats: {
      followers: followersRes.count ?? 0,
      following: followingRes.count ?? 0,
      connections: connectsRes.count ?? 0,
      posts: postsRes.count ?? 0,
    },
    relation: {
      is_following: myRelation.includes("follow"),
      is_connected: myRelation.includes("connect"),
      connect_pending: myRelation.includes("connect_request"),
    },
  });
}
