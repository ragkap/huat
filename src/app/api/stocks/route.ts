import { NextResponse } from "next/server";
import { searchStocks, getSingaporeStocks } from "@/lib/stocks-db/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  try {
    const stocks = q ? await searchStocks(q) : await getSingaporeStocks(100);
    return NextResponse.json({ stocks });
  } catch (error) {
    console.error("Stocks DB error:", error);
    return NextResponse.json({ stocks: [], error: "Could not fetch stocks" }, { status: 200 });
  }
}
