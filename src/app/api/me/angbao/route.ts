import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "0", 10);

  const [balanceRes, txRes] = await Promise.all([
    supabase.from("profiles").select("angbao_balance").eq("id", user.id).single(),
    supabase
      .from("angbao_transactions")
      .select("id, amount, reason, ref_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1),
  ]);

  return NextResponse.json({
    balance: balanceRes.data?.angbao_balance ?? 0,
    transactions: txRes.data ?? [],
  });
}
