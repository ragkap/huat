import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabase } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";

const Schema = z.object({
  display_name: z.string().min(1).max(60),
  username: z.string().min(2).max(30).regex(/^[a-z0-9_.]+$/),
  bio: z.string().max(50).nullable(),
  avatar_url: z.string().nullable(),
});

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { display_name, username, bio, avatar_url } = parsed.data;
  const db = createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Check username uniqueness
  const { data: existing } = await db
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", user.id)
    .single();

  if (existing) return NextResponse.json({ error: "Username is taken" }, { status: 409 });

  const { error } = await db
    .from("profiles")
    .update({ display_name, username, bio, avatar_url })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
