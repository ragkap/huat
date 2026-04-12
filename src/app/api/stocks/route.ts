import { NextResponse } from "next/server";
import { searchStocks, getSingaporeStocks } from "@/lib/stocks-db/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  try {
    const stocks = q ? await searchStocks(q) : await getSingaporeStocks();
    return NextResponse.json({ stocks }, {
      headers: { "Cache-Control": q ? "public, s-maxage=60, stale-while-revalidate=300" : "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    console.error("Stocks DB error:", error);
    return NextResponse.json({ stocks: [], error: "Could not fetch stocks" }, { status: 200 });
  }
}
