import Link from "next/link";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F0F0F0]">
      <nav className="border-b border-[#282828] px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0A0A0A]/95 backdrop-blur-md z-20">
        <Link href="/" className="flex items-baseline gap-1.5">
          <span className="text-[#E8311A] font-black text-2xl tracking-tighter leading-none">Huat</span>
          <span className="text-[#E8311A] font-black text-2xl">发</span>
          <span className="text-[#71717A] text-xs ml-2 hidden sm:inline">Docs</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/settings/api" className="text-[#9CA3AF] hover:text-[#F0F0F0]">Get a key</Link>
          <Link
            href="/feed"
            className="px-3 py-1.5 text-xs font-semibold text-white bg-[#E8311A] rounded hover:bg-[#c9280f] transition-colors"
          >
            Open app
          </Link>
        </div>
      </nav>
      {children}
    </div>
  );
}
