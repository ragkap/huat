import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/heic",
  "video/mp4", "video/quicktime", "video/webm",
  "application/pdf",
]);
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);

  if (!files.length) return NextResponse.json({ error: "No files" }, { status: 400 });
  if (files.length > 4) return NextResponse.json({ error: "Max 4 files" }, { status: 400 });

  // Use service client for storage uploads (bypasses RLS)
  const storage = await createServiceClient();
  const results: { url: string; type: "image" | "video" | "pdf" }[] = [];
  const errors: string[] = [];

  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) {
      errors.push(`${file.name}: unsupported type`);
      continue;
    }
    if (file.size > MAX_SIZE) {
      errors.push(`${file.name}: exceeds 10MB limit`);
      continue;
    }

    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${user.id}/${randomUUID()}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await storage.storage
      .from("post-attachments")
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (error) {
      errors.push(`${file.name}: ${error.message}`);
    } else {
      const { data } = storage.storage.from("post-attachments").getPublicUrl(path);
      const fileType = file.type.startsWith("image/") ? "image"
        : file.type.startsWith("video/") ? "video"
        : "pdf";
      results.push({ url: data.publicUrl, type: fileType });
    }
  }

  return NextResponse.json({ files: results, urls: results.map(r => r.url), ...(errors.length ? { errors } : {}) });
}
