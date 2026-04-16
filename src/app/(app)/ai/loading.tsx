import { Sparkles } from "lucide-react";

export default function AiLoading() {
  return (
    <div className="sticky top-14 h-[calc(100vh-3.5rem-4rem)] lg:h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center">
      <Sparkles className="w-8 h-8 text-[#555555] animate-pulse mb-3" />
      <p className="text-sm text-[#555555]">Loading...</p>
    </div>
  );
}
