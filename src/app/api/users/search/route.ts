import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const limit = Math.min(Math.max(1, Number(searchParams.get("limit") ?? 5)), 20);
  if (!q) return NextResponse.json({ profiles: [] });

  const supabase = await createClient();

  // Use the trgm-backed RPC for fuzzy ranked results. Falls back to ILIKE
  // if the RPC is unavailable (e.g. migration not yet applied).
  const { data: ranked, error: rpcErr } = await supabase.rpc("search_profiles", { q, max_results: limit });

  if (!rpcErr && ranked) {
    return NextResponse.json({ profiles: ranked });
  }

  // Fallback: ILIKE with a safely-escaped pattern. Splitting into two
  // separate queries avoids the injection surface of .or() string filters.
  const pattern = `%${q.replace(/[%_\\]/g, ch => "\\" + ch)}%`;
  const [byUser, byName] = await Promise.all([
    supabase.from("profiles").select("id, username, display_name, avatar_url, country, is_verified, is_bot").ilike("username", pattern).limit(limit),
    supabase.from("profiles").select("id, username, display_name, avatar_url, country, is_verified, is_bot").ilike("display_name", pattern).limit(limit),
  ]);
  const merged = new Map<string, Record<string, unknown>>();
  for (const row of [...(byUser.data ?? []), ...(byName.data ?? [])]) {
    merged.set(row.id as string, row);
  }
  return NextResponse.json({ profiles: Array.from(merged.values()).slice(0, limit) });
}
