import { TrendingUp, Users, MessageSquare, BarChart2, Code2, ArrowRight } from "lucide-react";
import { LoadingLink } from "@/components/ui/loading-link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* PWA standalone mode: redirect to feed if installed */}
      <script dangerouslySetInnerHTML={{ __html: `if(window.navigator.standalone||window.matchMedia('(display-mode:standalone)').matches){window.location.replace('/feed')}` }} />
      {/* Nav */}
      <nav className="border-b border-[#282828] px-8 py-4 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-[#E8311A] font-black text-3xl tracking-tighter leading-none">Huat</span>
          <span className="text-[#E8311A] font-black text-3xl">发</span>
        </div>
        <div className="flex items-center gap-5">
          <LoadingLink
            href="/docs/api"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-[#9CA3AF] hover:text-[#F0F0F0] transition-colors"
          >
            <Code2 className="w-4 h-4" /> API
          </LoadingLink>
          <LoadingLink
            href="/login"
            className="inline-flex items-center justify-center px-5 py-2 text-sm font-semibold text-white bg-[#E8311A] rounded hover:bg-[#c9280f] transition-colors"
          >
            Sign in
          </LoadingLink>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <LoadingLink
            href="/docs/api"
            className="group inline-flex items-center gap-2 px-3 py-1.5 border border-[#282828] bg-[#141414] rounded-full text-xs font-semibold text-[#9CA3AF] hover:border-[#E8311A]/40 hover:text-[#F0F0F0] transition-colors mb-6"
          >
            <span className="text-[#E8311A] font-mono">NEW</span>
            <span>Huat is API-first. Build on us.</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </LoadingLink>
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
            <LoadingLink
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-black text-white bg-[#E8311A] rounded hover:bg-[#c9280f] transition-colors"
            >
              Get started — it&apos;s free
            </LoadingLink>
            <LoadingLink
              href="/stocks"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-[#F0F0F0] border border-[#333333] rounded hover:border-[#444444] transition-colors"
            >
              Browse SGX stocks
            </LoadingLink>
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

        {/* API-first pitch */}
        <div className="mt-24 max-w-4xl mx-auto w-full border border-[#282828] rounded-lg bg-[#080808] p-8 md:p-10 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#E8311A]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-3">
            <Code2 className="w-4 h-4 text-[#E8311A]" />
            <p className="text-[#E8311A] font-mono text-xs uppercase tracking-widest">API-first</p>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-[#F0F0F0] tracking-tight mb-3">
            Every post. Every forecast. Every endpoint.
          </h2>
          <p className="text-[#9CA3AF] leading-relaxed mb-6 max-w-2xl">
            Huat isn&apos;t a walled garden. Bring your trading bot, your portfolio dashboard, your research
            pipeline — plug it straight into the community. Generate a key in one click, call the API in
            thirty seconds.
          </p>
          <div className="bg-[#0A0A0A] border border-[#282828] rounded p-4 font-mono text-xs text-[#E5E7EB] mb-6 overflow-x-auto">
            <span className="text-[#555555]"># Post a bullish call as yourself</span>
            <br />
            <span className="text-[#22C55E]">curl</span> -X POST https://huat.co/api/v1/posts \
            <br />
            {"  "}-H <span className="text-[#F59E0B]">&quot;Authorization: Bearer hk_live_...&quot;</span> \
            <br />
            {"  "}-d <span className="text-[#F59E0B]">&apos;{"{"}&quot;content&quot;:&quot;DBS looking strong&quot;,&quot;tagged_stocks&quot;:[&quot;D05.SI&quot;]{"}"}&apos;</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <LoadingLink
              href="/docs/api"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#E8311A] rounded hover:bg-[#c9280f] transition-colors"
            >
              Read the API docs <ArrowRight className="w-4 h-4" />
            </LoadingLink>
            <LoadingLink
              href="/settings/api"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#F0F0F0] border border-[#333333] rounded hover:border-[#444444] transition-colors"
            >
              Get a key
            </LoadingLink>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#282828] px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[#E8311A] font-black text-xl tracking-tighter">Huat</span>
          <span className="text-[#E8311A] font-black text-xl">发</span>
          <span className="text-[#71717A] text-xs ml-1">huat.co</span>
        </div>
        <nav className="flex items-center gap-5 text-xs text-[#71717A]">
          <LoadingLink href="/docs/api" className="hover:text-[#F0F0F0] transition-colors">API docs</LoadingLink>
          <LoadingLink href="/stocks" className="hover:text-[#F0F0F0] transition-colors">SGX stocks</LoadingLink>
          <span>Singapore&apos;s investor community</span>
        </nav>
      </footer>
    </div>
  );
}
