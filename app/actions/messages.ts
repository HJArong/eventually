"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { requireViewer } from "@/lib/auth/session";
import { sendMessage } from "@/lib/services/bookings";
import { UploadError, isFile, saveImage } from "@/lib/storage";

export type MessageState = { error?: string; sentAt?: number };

export async function sendMessageAction(_prev: MessageState, formData: FormData): Promise<MessageState> {
  const viewer = await requireViewer();
  const threadId = z.string().uuid().parse(formData.get("threadId"));
  const body = String(formData.get("body") ?? "");
  const photo = formData.get("photo");
  let imageUrl: string | null = null;
  try {
    if (isFile(photo)) imageUrl = await saveImage(photo);
    await sendMessage(await getDb(), viewer, threadId, body, imageUrl);
  } catch (err) {
    return { error: err instanceof UploadError ? err.message : "Message not sent. Try again." };
  }
  revalidatePath(viewer.role === "vendor" ? `/vendor/inbox/${threadId}` : `/inbox/${threadId}`);
  return { sentAt: Date.now() };
}
