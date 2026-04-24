import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabase } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const admin = () => createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(request: Request, { params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: alerts } = await admin()
    .from("price_alerts")
    .select("*")
    .eq("user_id", user.id)
    .eq("ticker", decodeURIComponent(ticker))
    .eq("triggered", false);

  return NextResponse.json({ alerts: alerts ?? [] });
}

export async function POST(request: Request, { params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { target_price, direction } = await request.json();
  if (!target_price || !["above", "below"].includes(direction)) {
    return NextResponse.json({ error: "Invalid alert" }, { status: 400 });
  }

  const { data, error } = await admin()
    .from("price_alerts")
    .insert({
      user_id: user.id,
      ticker: decodeURIComponent(ticker),
      target_price: parseFloat(target_price),
      direction,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ alert: data }, { status: 201 });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  await admin().from("price_alerts").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ success: true });
}
