import { createClient as createSupabase, type SupabaseClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "crypto";

const KEY_PREFIX = "hk_live_";

export interface ApiAuthResult {
  userId: string;
  keyId: string;
  admin: SupabaseClient;
}

export interface ApiAuthError {
  status: number;
  error: string;
}

function adminClient(): SupabaseClient {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function generateApiKey(): { raw: string; prefix: string; hash: string } {
  const raw = KEY_PREFIX + randomBytes(24).toString("base64url");
  return { raw, prefix: raw.slice(0, KEY_PREFIX.length + 6), hash: hashApiKey(raw) };
}

/**
 * Authenticate a /api/v1 request. Returns { userId, admin } on success, or
 * an { status, error } object to return to the caller on failure.
 *
 * Accepts either `Authorization: Bearer hk_live_...` or `x-api-key: hk_live_...`.
 */
export async function authenticateApiRequest(request: Request): Promise<ApiAuthResult | ApiAuthError> {
  const auth = request.headers.get("authorization");
  const xKey = request.headers.get("x-api-key");
  const raw = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : xKey?.trim();

  if (!raw) return { status: 401, error: "Missing API key. Provide Authorization: Bearer <key> or x-api-key header." };
  if (!raw.startsWith(KEY_PREFIX)) return { status: 401, error: "Malformed API key." };

  const admin = adminClient();
  const hash = hashApiKey(raw);

  const { data, error } = await admin
    .from("api_keys")
    .select("id, user_id, revoked_at")
    .eq("key_hash", hash)
    .maybeSingle();

  if (error || !data || data.revoked_at) {
    return { status: 401, error: "Invalid or revoked API key." };
  }

  // Fire-and-forget last_used_at update — don't block the request on it.
  admin.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", data.id).then(() => {});

  return { userId: data.user_id as string, keyId: data.id as string, admin };
}

export function jsonError(status: number, message: string, extra?: Record<string, unknown>): Response {
  return Response.json({ error: message, ...extra }, { status });
}
