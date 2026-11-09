import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { config } from "@/lib/config";

const MAX_BYTES = 8 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

export class UploadError extends Error {}

/**
 * Stores an uploaded image and returns its public URL. Uses Supabase Storage when a service-role key
 * is configured, otherwise the local disk (served by /api/uploads/[name]).
 */
export async function saveImage(file: File): Promise<string> {
  const ext = TYPES[file.type];
  if (!ext) throw new UploadError("Photos must be JPG, PNG, WEBP or GIF");
  if (file.size > MAX_BYTES) throw new UploadError("Photos must be under 8 MB");
  const name = `${randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  if (config.supabaseUrl && config.supabaseServiceRoleKey) {
    const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, { auth: { persistSession: false } });
    const { error } = await supabase.storage.from(config.supabaseStorageBucket).upload(name, bytes, { contentType: file.type });
    if (error) throw new UploadError(error.message);
    return supabase.storage.from(config.supabaseStorageBucket).getPublicUrl(name).data.publicUrl;
  }

  const dir = path.resolve(/*turbopackIgnore: true*/ config.uploadsDir);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(/*turbopackIgnore: true*/ dir, name), bytes);
  return `/api/uploads/${name}`;
}

export function isFile(v: FormDataEntryValue | null): v is File {
  return typeof v === "object" && v !== null && "arrayBuffer" in v && (v as File).size > 0;
}
