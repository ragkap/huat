import { authenticateApiRequest, jsonError } from "@/lib/api-auth";

export async function GET(request: Request) {
  const auth = await authenticateApiRequest(request);
  if ("error" in auth) return jsonError(auth.status, auth.error);

  const { data, error } = await auth.admin
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, country, is_verified, created_at")
    .eq("id", auth.userId)
    .single();

  if (error || !data) return jsonError(500, error?.message ?? "Profile not found.");
  return Response.json({ profile: data });
}
