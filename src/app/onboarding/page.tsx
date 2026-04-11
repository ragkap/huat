import { OnboardingForm } from "@/components/auth/onboarding-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Setup your profile — huat.co" };

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="flex items-baseline gap-2 mb-10">
          <span className="text-[#E8311A] font-black text-4xl tracking-tighter">huat</span>
          <span className="text-[#E8311A] font-black text-4xl">发</span>
        </div>
        <h1 className="text-2xl font-black text-[#F0F0F0] mb-1">Set up your profile</h1>
        <p className="text-[#9CA3AF] text-sm mb-8">Just a few details to get you started</p>
        <OnboardingForm />
      </div>
    </div>
  );
}
