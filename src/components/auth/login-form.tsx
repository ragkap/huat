"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const [mode, setMode] = useState<"oauth" | "phone">("oauth");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setError(error.message); setLoading(false); }
  }

  async function handleSendOtp() {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) { setError(error.message); }
    else { setStep("otp"); }
    setLoading(false);
  }

  async function handleVerifyOtp() {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
    if (error) { setError(error.message); }
    else { router.push("/feed"); }
    setLoading(false);
  }

  async function handlePasskey() {
    setLoading(true);
    setError("");
    try {
      const { startAuthentication } = await import("@simplewebauthn/browser");
      const optRes = await fetch("/api/auth/passkey/options");
      const options = await optRes.json();
      const assertion = await startAuthentication(options);
      const verRes = await fetch("/api/auth/passkey/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assertion),
      });
      const { token } = await verRes.json();
      if (token) {
        await supabase.auth.setSession(token);
        router.push("/feed");
      }
    } catch (e: unknown) {
      setError((e as Error).message ?? "Passkey authentication failed");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      {/* Google */}
      <Button
        variant="secondary"
        className="w-full justify-center gap-3"
        onClick={handleGoogle}
        loading={loading && mode === "oauth"}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Sign up / Sign in with Google
      </Button>

      {/* Passkey */}
      <Button
        variant="secondary"
        className="w-full justify-center gap-3"
        onClick={handlePasskey}
        loading={loading}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
        Sign up / Sign in with Passkey
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#282828]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[#0A0A0A] px-3 text-[#71717A]">or use phone</span>
        </div>
      </div>

      {/* Phone OTP */}
      {step === "phone" ? (
        <div className="space-y-3">
          <Input
            label="Phone number"
            type="tel"
            placeholder="+65 9123 4567"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
          <Button
            className="w-full"
            onClick={handleSendOtp}
            loading={loading}
            disabled={!phone.trim()}
          >
            Continue with phone
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-[#9CA3AF]">Enter the 6-digit code sent to {phone}</p>
          <Input
            label="One-time password"
            type="text"
            inputMode="numeric"
            placeholder="123456"
            maxLength={6}
            value={otp}
            onChange={e => setOtp(e.target.value)}
          />
          <Button
            className="w-full"
            onClick={handleVerifyOtp}
            loading={loading}
            disabled={otp.length !== 6}
          >
            Verify & Sign in
          </Button>
          <button
            onClick={() => setStep("phone")}
            className="w-full text-sm text-[#9CA3AF] hover:text-[#F0F0F0] transition-colors"
          >
            Use a different number
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-[#EF4444] text-center">{error}</p>
      )}

      <p className="text-xs text-center text-[#71717A]">
        By signing in you agree to our{" "}
        <a href="/terms" className="text-[#9CA3AF] hover:underline">Terms</a> and{" "}
        <a href="/privacy" className="text-[#9CA3AF] hover:underline">Privacy Policy</a>
      </p>
    </div>
  );
}
