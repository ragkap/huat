import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/auth/login-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Join Huat.co — Invest Together, Prosper Together" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ redirect?: string; refname?: string; ref?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const params = await searchParams;
  if (user) {
    redirect(params.redirect ?? "/feed");
  }
  const refName = params.refname ?? null;
  const isReferral = !!params.ref;
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
            {isReferral && refName ? (
              <>
                <p className="text-[#E8311A] text-lg font-bold mb-2">🧧 You&apos;ve been invited!</p>
                <blockquote className="text-4xl font-black text-[#F0F0F0] leading-tight tracking-tight">
                  Let&apos;s <span className="text-[#E8311A]">Huat</span> together.
                </blockquote>
                <p className="text-[#9CA3AF] mt-4 text-lg leading-relaxed">
                  {refName} invited you to join Singapore&apos;s investing community. Follow stocks, share insights, and prosper together.
                </p>
              </>
            ) : (
              <>
                <blockquote className="text-4xl font-black text-[#F0F0F0] leading-tight tracking-tight">
                  Invest Together.<br />Prosper Together.
                </blockquote>
                <p className="text-[#9CA3AF] mt-4 text-lg leading-relaxed">
                  Singapore&apos;s social network for retail investors.
                  Follow stocks, share forecasts, and grow your wealth with the community.
                </p>
              </>
            )}
          </div>

          <div className="space-y-3">
            {[
              "Follow SGX stocks",
              "See what other investors are saying",              
              "Share forecasts and track your calls",
            ].map((point, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-[#E8311A]/10 border border-[#E8311A]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E8311A]" />
                </span>
                <p className="text-sm text-[#9CA3AF] leading-snug">{point}</p>
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

            <h1 className="text-2xl font-black text-[#F0F0F0] mb-1">
              {isReferral && refName ? `${refName} invited you!` : "Welcome to Huat.co"}
            </h1>
            <p className="text-[#9CA3AF] text-sm mb-2">
              {isReferral
                ? "Join Singapore's investing community. Sign up below to get started."
                : "New here? Create your free account below — or sign in if you're back."}
            </p>
            {isReferral && (
              <div className="flex items-center gap-2 bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-lg px-3 py-2 mb-6">
                <span className="text-base">🧧</span>
                <p className="text-xs text-[#22C55E] font-semibold">You&apos;ll earn AngBao social credits when you join!</p>
              </div>
            )}
            {!isReferral && <div className="mb-6" />}

            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
