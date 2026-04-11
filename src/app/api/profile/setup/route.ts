import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const Schema = z.object({
  username: z.string().min(2).max(30).regex(/^[a-z0-9_]+$/),
  display_name: z.string().min(1).max(60),
  country: z.enum(["SG", "MY", "US"]),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { username, display_name, country } = parsed.data;

  // Check username uniqueness
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", user.id)
    .single();

  if (existing) return NextResponse.json({ error: "Username is taken" }, { status: 409 });

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, username, display_name, country });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
