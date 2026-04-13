import { StockPageSkeleton } from "@/components/stock/stock-page-skeleton";

export default function StockLoading() {
  return (
    <div>
      <div className="border-b border-[#282828] px-5 pt-4 pb-4 bg-[#080808]">
        <div style={{ background: "linear-gradient(90deg,#1a1a1a 25%,#242424 50%,#1a1a1a 75%)", backgroundSize: "600px 100%", animation: "sk-shimmer 1.4s infinite linear", borderRadius: 4, height: 20, width: 180, marginBottom: 8 }} />
        <div style={{ background: "linear-gradient(90deg,#1a1a1a 25%,#242424 50%,#1a1a1a 75%)", backgroundSize: "600px 100%", animation: "sk-shimmer 1.4s infinite linear", borderRadius: 4, height: 12, width: 120 }} />
      </div>
      <StockPageSkeleton />
    </div>
  );
}
