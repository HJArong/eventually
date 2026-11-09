"use server";

import { and, eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { eventTasks, eventTypes, events, profiles } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/session";
import { eventTitle, tasksFromTemplate } from "@/lib/domain/checklist";
import { todayISO } from "@/lib/format";
import { requireOwnEvent } from "@/lib/services/access";

export type FormState = { error?: string; fieldErrors?: Record<string, string> };

const eventSchema = z.object({
  eventType: z.string().min(1, "Pick an event type"),
  celebrant: z.string().trim().max(60).optional().default(""),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date")
    .refine((d) => d >= todayISO(), "Pick a future date"),
  areaId: z.coerce.number().int().positive("Pick an area"),
  venueText: z.string().trim().max(120).optional().default(""),
  pax: z.coerce.number().int().min(5, "At least 5 guests").max(3000),
  budgetPhp: z.coerce.number().int().min(1000, "Set a budget").max(50_000_000),
});

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

export async function createEventAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireRole("planner");
  const parsed = eventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const data = parsed.data;
  const db = await getDb();
  const [type] = await db.select().from(eventTypes).where(eq(eventTypes.slug, data.eventType));
  if (!type) return { fieldErrors: { eventType: "Pick an event type" } };

  await db.transaction(async (tx) => {
    const [event] = await tx
      .insert(events)
      .values({
        plannerId: viewer.id,
        title: eventTitle(type.slug, data.celebrant),
        eventType: type.slug,
        date: data.date,
        areaId: data.areaId,
        venueText: data.venueText || null,
        pax: data.pax,
        budgetPhp: data.budgetPhp,
      })
      .returning();
    const tasks = tasksFromTemplate(type.checklistTemplate);
    if (tasks.length) await tx.insert(eventTasks).values(tasks.map((t) => ({ ...t, eventId: event!.id })));
    if (!viewer.displayName) await tx.update(profiles).set({ displayName: data.celebrant }).where(eq(profiles.id, viewer.id));
  });
  redirect("/home?welcome=1");
}

export async function toggleTask(formData: FormData) {
  const viewer = await requireRole("planner");
  const taskId = z.string().uuid().parse(formData.get("taskId"));
  const db = await getDb();
  const [task] = await db.select().from(eventTasks).where(eq(eventTasks.id, taskId));
  if (!task) return;
  await requireOwnEvent(db, viewer, task.eventId);
  await db.update(eventTasks).set({ done: !task.done }).where(eq(eventTasks.id, taskId));
  revalidatePath("/event");
}

export async function addTask(formData: FormData) {
  const viewer = await requireRole("planner");
  const eventId = z.string().uuid().parse(formData.get("eventId"));
  const title = z.string().trim().min(1).max(120).safeParse(formData.get("title"));
  if (!title.success) return;
  const db = await getDb();
  await requireOwnEvent(db, viewer, eventId);
  const [row] = await db.select({ m: max(eventTasks.sort) }).from(eventTasks).where(and(eq(eventTasks.eventId, eventId)));
  await db.insert(eventTasks).values({ eventId, title: title.data, sort: (row?.m ?? 0) + 1 });
  revalidatePath("/event");
}
