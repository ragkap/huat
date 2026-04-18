import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const relType = searchParams.get("rel_type") ?? "follow";

  const { data } = await supabase
    .from("social_graph")
    .select("subject_id")
    .eq("actor_id", user.id)
    .eq("rel_type", relType);

  return NextResponse.json({ ids: (data ?? []).map(r => r.subject_id) });
}

const Schema = z.object({
  subject_id: z.string().uuid(),
  rel_type: z.enum(["follow", "connect_request", "connect"]),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { subject_id, rel_type } = parsed.data;
  if (subject_id === user.id) return NextResponse.json({ error: "Cannot connect to yourself" }, { status: 400 });

  // Handle connect acceptance (when subject accepts actor's request)
  if (rel_type === "connect") {
    // Verify there's a pending request from subject to actor
    const { data: pendingReq } = await supabase
      .from("social_graph")
      .select("id")
      .eq("actor_id", subject_id)
      .eq("subject_id", user.id)
      .eq("rel_type", "connect_request")
      .single();

    if (!pendingReq) return NextResponse.json({ error: "No pending request" }, { status: 404 });

    // Delete the request and create bidirectional connect
    await supabase.from("social_graph").delete().eq("id", pendingReq.id);
    await supabase.from("social_graph").insert([
      { actor_id: user.id, subject_id, rel_type: "connect" },
      { actor_id: subject_id, subject_id: user.id, rel_type: "connect" },
    ]);
    return NextResponse.json({ success: true });
  }

  const { error } = await supabase
    .from("social_graph")
    .upsert({ actor_id: user.id, subject_id, rel_type });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subject_id, rel_type } = await request.json();

  await supabase
    .from("social_graph")
    .delete()
    .eq("actor_id", user.id)
    .eq("subject_id", subject_id)
    .eq("rel_type", rel_type);

  // If disconnecting, also remove the other direction
  if (rel_type === "connect") {
    await supabase
      .from("social_graph")
      .delete()
      .eq("actor_id", subject_id)
      .eq("subject_id", user.id)
      .eq("rel_type", "connect");
  }

  return NextResponse.json({ success: true });
}
