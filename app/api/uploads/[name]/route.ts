import fs from "node:fs/promises";
import path from "node:path";
import { config } from "@/lib/config";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };

export async function GET(_req: Request, ctx: RouteContext<"/api/uploads/[name]">) {
  const { name } = await ctx.params;
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp|gif)$/.test(name)) return new Response("Not found", { status: 404 });
  try {
    const data = await fs.readFile(path.join(path.resolve(/*turbopackIgnore: true*/ config.uploadsDir), name));
    return new Response(new Uint8Array(data), {
      headers: {
        "content-type": TYPES[name.split(".").pop()!]!,
        "cache-control": "public, max-age=31536000, immutable",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
