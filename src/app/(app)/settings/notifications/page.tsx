import { EmailPreferencesForm } from "@/components/settings/email-preferences";
import { AppPreferences } from "@/components/settings/app-preferences";

export const metadata = { title: "Settings — Huat.co" };

export default function SettingsPage() {
  return (
    <div className="max-w-lg mx-auto px-5 py-8">
      <h1 className="text-lg font-bold text-[#F0F0F0] mb-6">Settings</h1>

      <AppPreferences />

      <div className="mt-8">
        <h2 className="text-sm font-bold text-[#F0F0F0] mb-1">Email Notifications</h2>
        <p className="text-xs text-[#71717A] mb-4">Choose which emails you'd like to receive from Huat.</p>
        <EmailPreferencesForm />
      </div>
    </div>
  );
}
