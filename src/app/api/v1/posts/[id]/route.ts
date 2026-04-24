import { authenticateApiRequest, jsonError } from "@/lib/api-auth";

const POST_SELECT = `id, author_id, content, post_type, sentiment, tagged_stocks, attachments, parent_id, quote_of, created_at, updated_at,
  author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url, is_verified, country),
  forecast:forecasts(*)`;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApiRequest(request);
  if ("error" in auth) return jsonError(auth.status, auth.error);

  const { id } = await params;

  const [postRes, repliesRes] = await Promise.all([
    auth.admin.from("posts").select(POST_SELECT).eq("id", id).maybeSingle(),
    auth.admin
      .from("posts")
      .select(POST_SELECT)
      .eq("parent_id", id)
      .order("created_at", { ascending: true })
      .limit(50),
  ]);

  if (postRes.error) return jsonError(500, postRes.error.message);
  if (!postRes.data) return jsonError(404, "Post not found.");

  return Response.json({ post: postRes.data, replies: repliesRes.data ?? [] });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApiRequest(request);
  if ("error" in auth) return jsonError(auth.status, auth.error);

  const { id } = await params;

  // Ensure the caller owns this post before deleting.
  const { data: existing } = await auth.admin.from("posts").select("author_id").eq("id", id).maybeSingle();
  if (!existing) return jsonError(404, "Post not found.");
  if ((existing as { author_id: string }).author_id !== auth.userId) {
    return jsonError(403, "You can only delete your own posts.");
  }

  const { error } = await auth.admin.from("posts").delete().eq("id", id);
  if (error) return jsonError(500, error.message);

  return Response.json({ ok: true });
}
