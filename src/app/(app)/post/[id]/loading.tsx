import { ArrowLeft } from "lucide-react";

export default function PostLoading() {
  return (
    <div>
      {/* Back header */}
      <div className="sticky top-14 z-10 flex items-center gap-3 px-4 py-3 border-b border-[#282828] bg-[#0A0A0A]/95 backdrop-blur-md">
        <div className="w-8 h-8 flex items-center justify-center rounded-lg text-[#71717A]">
          <ArrowLeft className="w-4 h-4" />
        </div>
        <p className="text-sm font-bold text-[#F0F0F0]">Post</p>
      </div>

      {/* Main post skeleton */}
      <div className="px-5 pt-5 pb-4 border-b border-[#1A1A1A] animate-pulse">
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-full bg-[#1C1C1C] flex-shrink-0" />
          <div className="flex-1 space-y-2.5">
            <div className="flex gap-2 items-center">
              <div className="h-3 w-28 rounded bg-[#1C1C1C]" />
              <div className="h-2.5 w-10 rounded bg-[#141414]" />
            </div>
            <div className="h-3 w-full rounded bg-[#1C1C1C]" />
            <div className="h-3 w-5/6 rounded bg-[#1C1C1C]" />
            <div className="h-3 w-3/4 rounded bg-[#141414]" />
            <div className="flex gap-6 mt-4 pt-1">
              <div className="h-3 w-6 rounded bg-[#141414]" />
              <div className="h-3 w-6 rounded bg-[#141414]" />
              <div className="h-3 w-6 rounded bg-[#141414]" />
            </div>
          </div>
        </div>
      </div>

      {/* Reply composer skeleton */}
      <div className="flex gap-3 px-5 py-4 border-b border-[#282828] bg-[#080808] animate-pulse">
        <div className="w-8 h-8 rounded-full bg-[#1C1C1C] flex-shrink-0" />
        <div className="flex-1">
          <div className="h-12 rounded bg-[#141414]" />
        </div>
      </div>
    </div>
  );
}
