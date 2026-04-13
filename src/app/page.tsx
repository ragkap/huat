import Link from "next/link";
import { TrendingUp, Users, MessageSquare, BarChart2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* Nav */}
      <nav className="border-b border-[#282828] px-8 py-4 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-[#E8311A] font-black text-3xl tracking-tighter leading-none">Huat</span>
          <span className="text-[#E8311A] font-black text-3xl">发</span>
        </div>
        <Link
          href="/login"
          className="px-5 py-2 text-sm font-semibold text-white bg-[#E8311A] rounded hover:bg-[#c9280f] transition-colors"
        >
          Sign in
        </Link>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-[#E8311A] font-mono text-sm uppercase tracking-widest mb-6">For Singapore Retail Investors</p>
          <h1 className="text-7xl font-black text-[#F0F0F0] tracking-tighter leading-none mb-4">
            Invest Together.
            <br />
            <span className="text-[#E8311A]">Prosper Together.</span>
          </h1>
          <p className="text-xl text-[#9CA3AF] mt-8 leading-relaxed max-w-xl mx-auto">
            Share stock picks, track forecasts, and connect with Singapore's most active retail investors.
            Huat ah! 发
          </p>

          <div className="flex items-center justify-center gap-4 mt-12">
            <Link
              href="/login"
              className="px-8 py-4 text-base font-black text-white bg-[#E8311A] rounded hover:bg-[#c9280f] transition-colors"
            >
              Get started — it's free
            </Link>
            <Link
              href="/stocks"
              className="px-8 py-4 text-base font-semibold text-[#F0F0F0] border border-[#333333] rounded hover:border-[#444444] transition-colors"
            >
              Browse SGX stocks
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-24 max-w-4xl mx-auto w-full">
          {[
            {
              icon: TrendingUp,
              title: "Stock Forecasts",
              desc: "Post price targets and track your accuracy over time",
            },
            {
              icon: Users,
              title: "Follow Smart Money",
              desc: "Follow top investors and see their picks in real-time",
            },
            {
              icon: MessageSquare,
              title: "Direct Messaging",
              desc: "Connect with fellow investors for private discussions",
            },
            {
              icon: BarChart2,
              title: "Polls & Sentiment",
              desc: "Gauge community sentiment on any SGX stock",
            },
          ].map(feature => (
            <div
              key={feature.title}
              className="border border-[#282828] rounded p-5 text-left hover:border-[#333333] transition-colors bg-[#080808]"
            >
              <feature.icon className="w-6 h-6 text-[#E8311A] mb-3" />
              <h3 className="font-bold text-[#F0F0F0] text-sm mb-1">{feature.title}</h3>
              <p className="text-[#9CA3AF] text-xs leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#282828] px-8 py-6 flex items-center justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[#E8311A] font-black text-xl tracking-tighter">Huat</span>
          <span className="text-[#E8311A] font-black text-xl">发</span>
          <span className="text-[#71717A] text-xs ml-1">huat.co</span>
        </div>
        <p className="text-[#71717A] text-xs">Singapore's investor community</p>
      </footer>
    </div>
  );
}
