import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ApiKeysManager } from "@/components/settings/api-keys";

export const metadata = { title: "API Keys — Huat.co" };

interface ApiKeyRow {
  id: string;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export default async function ApiKeysPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, last_used_at, revoked_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-2xl mx-auto px-5 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-[#F0F0F0]">API Keys</h1>
          <p className="text-sm text-[#9CA3AF] mt-1">
            Programmatic access to Huat.{" "}
            <Link href="/docs/api" className="text-[#E8311A] hover:underline">Read the docs →</Link>
          </p>
        </div>
      </div>

      <ApiKeysManager initialKeys={(data ?? []) as ApiKeyRow[]} />
    </div>
  );
}
