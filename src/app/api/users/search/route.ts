import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ profiles: [] });

  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("username, display_name, country")
    .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
    .limit(5);

  return NextResponse.json({ profiles: profiles ?? [] });
}
