import { EmailPreferencesForm } from "@/components/settings/email-preferences";

export const metadata = { title: "Notification Settings — Huat.co" };

export default function NotificationSettingsPage() {
  return (
    <div className="max-w-lg mx-auto px-5 py-8">
      <h1 className="text-lg font-bold text-[#F0F0F0] mb-1">Email Notifications</h1>
      <p className="text-sm text-[#71717A] mb-6">Choose which emails you'd like to receive from Huat.</p>
      <EmailPreferencesForm />
    </div>
  );
}
