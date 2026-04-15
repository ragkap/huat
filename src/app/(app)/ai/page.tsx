import { AiChat } from "@/components/ai/chat";

export default function AiPage() {
  return (
    <div className="sticky top-14 h-[calc(100vh-3.5rem-4rem)] lg:h-[calc(100vh-3.5rem)] overflow-hidden">
      <AiChat />
    </div>
  );
}
