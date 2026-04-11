import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const files = formData.getAll("files") as File[];

  if (!files.length) return NextResponse.json({ error: "No files" }, { status: 400 });
  if (files.length > 4) return NextResponse.json({ error: "Max 4 files" }, { status: 400 });

  const urls: string[] = [];

  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;
    if (file.size > 10 * 1024 * 1024) continue; // 10MB max

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("post-attachments")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (!error) {
      const { data } = supabase.storage.from("post-attachments").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
  }

  return NextResponse.json({ urls });
}
