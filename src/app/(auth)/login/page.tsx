import { LoginForm } from "@/components/auth/login-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sign in — Huat.co" };

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex justify-center">
      <div className="w-full max-w-6xl flex">
      {/* Left — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-16 border-r border-[#282828] bg-[#080808]">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-[#E8311A] font-black text-5xl tracking-tighter leading-none">Huat</span>
            <span className="text-[#E8311A] font-black text-5xl">发</span>
          </div>
          <p className="text-[#71717A] text-sm mt-2 font-mono">huat.co</p>
        </div>

        <div>
          <blockquote className="text-4xl font-black text-[#F0F0F0] leading-tight tracking-tight">
            "Huat ah!"
          </blockquote>
          <p className="text-[#9CA3AF] mt-4 text-lg leading-relaxed">
            Singapore's social network for retail investors.
            Share forecasts, follow the smart money, prosper together.
          </p>
        </div>

        <div className="flex gap-8">
          {[
            { n: "12K+", label: "Investors" },
            { n: "450+", label: "SGX Stocks" },
            { n: "98%", label: "Forecast accuracy" },
          ].map(stat => (
            <div key={stat.label}>
              <p className="text-2xl font-black text-[#F0F0F0]">{stat.n}</p>
              <p className="text-xs text-[#71717A] uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10 flex items-baseline gap-2">
            <span className="text-[#E8311A] font-black text-4xl tracking-tighter">Huat</span>
            <span className="text-[#E8311A] font-black text-4xl">发</span>
          </div>

          <h1 className="text-2xl font-black text-[#F0F0F0] mb-1">Welcome back</h1>
          <p className="text-[#9CA3AF] text-sm mb-8">Sign in to your account</p>

          <LoginForm />
        </div>
      </div>
      </div>
    </div>
  );
}
