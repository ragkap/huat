import { z } from "zod";
import { authenticateApiRequest, jsonError } from "@/lib/api-auth";

const POST_SELECT = `id, author_id, content, post_type, sentiment, tagged_stocks, attachments, parent_id, quote_of, created_at, updated_at,
  author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url, is_verified, is_bot, country)`;

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function GET(request: Request) {
  const auth = await authenticateApiRequest(request);
  if ("error" in auth) return jsonError(auth.status, auth.error);

  const { searchParams } = new URL(request.url);
  const limitRaw = Number(searchParams.get("limit") ?? DEFAULT_LIMIT);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(1, limitRaw), MAX_LIMIT) : DEFAULT_LIMIT;
  const cursor = searchParams.get("cursor");
  const ticker = searchParams.get("ticker");
  const authorId = searchParams.get("author_id");
  const username = searchParams.get("username");

  let query = auth.admin
    .from("posts")
    .select(POST_SELECT)
    .is("parent_id", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) query = query.lt("created_at", cursor);
  if (ticker) query = query.contains("tagged_stocks", [ticker]);
  if (authorId) query = query.eq("author_id", authorId);
  if (username) {
    const { data: profile } = await auth.admin.from("profiles").select("id").eq("username", username).maybeSingle();
    if (!profile) return Response.json({ posts: [], next_cursor: null });
    query = query.eq("author_id", (profile as { id: string }).id);
  }

  const { data, error } = await query;
  if (error) return jsonError(500, error.message);

  const posts = (data ?? []) as Array<Record<string, unknown>>;
  const nextCursor = posts.length === limit ? (posts[posts.length - 1].created_at as string) : null;

  return Response.json({ posts, next_cursor: nextCursor });
}

const CreatePostSchema = z.object({
  content: z.string().min(1).max(1000),
  sentiment: z.enum(["bullish", "bearish", "neutral"]).nullish(),
  post_type: z.enum(["post", "forecast"]).default("post"),
  tagged_stocks: z.array(z.string()).max(5).optional(),
  parent_id: z.string().uuid().nullish(),
  quote_of: z.string().uuid().nullish(),
  forecast: z.object({
    ticker: z.string(),
    target_price: z.number().positive(),
    target_date: z.string(),
  }).optional(),
});

export async function POST(request: Request) {
  const auth = await authenticateApiRequest(request);
  if ("error" in auth) return jsonError(auth.status, auth.error);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid JSON body.");
  }

  const parsed = CreatePostSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "Validation failed.", { details: parsed.error.flatten() });

  const { content, sentiment, post_type, tagged_stocks, parent_id, quote_of, forecast } = parsed.data;

  if (post_type === "forecast" && !forecast) {
    return jsonError(400, "post_type=forecast requires a forecast object.");
  }

  const insertData: Record<string, unknown> = {
    author_id: auth.userId,
    content,
    sentiment: sentiment ?? null,
    post_type,
    tagged_stocks: tagged_stocks ?? [],
    parent_id: parent_id ?? null,
    attachments: [],
  };
  if (quote_of) insertData.quote_of = quote_of;

  const { data: post, error } = await auth.admin.from("posts").insert(insertData).select().single();
  if (error || !post) return jsonError(500, error?.message ?? "Failed to create post.");

  if (post_type === "forecast" && forecast) {
    const { error: fErr } = await auth.admin.from("forecasts").insert({
      post_id: (post as { id: string }).id,
      ticker: forecast.ticker,
      target_price: forecast.target_price,
      target_date: forecast.target_date,
    });
    if (fErr) return jsonError(500, `Post created but forecast insert failed: ${fErr.message}`);
  }

  const { data: full } = await auth.admin
    .from("posts")
    .select(POST_SELECT + ", forecast:forecasts(*)")
    .eq("id", (post as { id: string }).id)
    .single();

  return Response.json({ post: full ?? post }, { status: 201 });
}
