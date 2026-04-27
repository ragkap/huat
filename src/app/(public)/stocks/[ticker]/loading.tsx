import { StockPageSkeleton } from "@/components/stock/stock-page-skeleton";

export default function StockLoading() {
  return (
    <div>
      <div className="border-b border-[#282828] px-5 pt-4 pb-4 bg-[#080808] animate-pulse">
        <div className="h-5 w-44 bg-[#1A1A1A] rounded mb-2" />
        <div className="h-3 w-28 bg-[#1A1A1A] rounded" />
      </div>
      <StockPageSkeleton />
    </div>
  );
}
