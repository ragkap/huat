import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_req: Request, { params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("stock_watchlist")
    .insert({ user_id: user.id, ticker: decodeURIComponent(ticker) });

  if (error && error.code !== "23505") { // ignore duplicate key
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ following: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabase
    .from("stock_watchlist")
    .delete()
    .eq("user_id", user.id)
    .eq("ticker", decodeURIComponent(ticker));

  return NextResponse.json({ following: false });
}
