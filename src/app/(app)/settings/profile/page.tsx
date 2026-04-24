import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EditProfileForm } from "@/components/settings/edit-profile";
import type { Profile } from "@/types/database";

export const metadata = { title: "Edit Profile — Huat.co" };

export default async function EditProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/onboarding");

  return (
    <div className="max-w-lg mx-auto px-5 py-8">
      <h1 className="text-lg font-bold text-[#F0F0F0] mb-6">Edit Profile</h1>
      <EditProfileForm profile={profile as Profile} />
    </div>
  );
}
