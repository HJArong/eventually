"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import {
  acceptQuote,
  cancelRequest,
  createBookingRequests,
  declineQuote,
  declineRequest,
  payDeposit,
  sendQuote,
} from "@/lib/services/bookings";
import { getCurrentEvent } from "@/lib/queries/events";
import { todayISO } from "@/lib/format";

export type ActionState = { error?: string };

const selectionSchema = z.array(z.object({ serviceId: z.string().uuid(), qty: z.coerce.number().int().min(1).max(5000) }));

const requestSchema = z.object({
  vendorId: z.string().uuid(),
  services: z.string().transform((s, ctx) => {
    try {
      return selectionSchema.parse(JSON.parse(s));
    } catch {
      ctx.addIssue({ code: "custom", message: "Pick at least one service" });
      return z.NEVER;
    }
  }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeText: z.string().trim().max(60).optional(),
  pax: z.coerce.number().int().min(1).max(5000),
  budgetPhp: z.coerce.number().int().min(0).max(50_000_000).optional().or(z.literal("").transform(() => undefined)),
  venueText: z.string().trim().max(160).optional(),
  deliveryAreaId: z.coerce.number().int().positive().optional(),
  notes: z.string().trim().max(1000).optional(),
});

export async function sendRequestAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const viewer = await requireRole("planner");
  const parsed = requestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  if (!parsed.data.services.length) return { error: "Pick at least one service" };
  const db = await getDb();
  const event = await getCurrentEvent(viewer.id);
  if (!event) redirect("/onboarding/planner");
  const d = parsed.data;
  const [created] = await createBookingRequests(db, viewer, {
    eventId: event.id,
    requests: [
      {
        vendorId: d.vendorId,
        serviceSelections: d.services,
        date: d.date,
        timeText: d.timeText,
        pax: d.pax,
        budgetPhp: d.budgetPhp ?? null,
        venueText: d.venueText,
        deliveryAreaId: d.deliveryAreaId ?? event.areaId,
        notes: d.notes,
      },
    ],
  });
  redirect(`/inbox/${created!.threadId}?sent=1`);
}

const packageRequestSchema = z.object({
  packageId: z.string().uuid(),
  items: z.string().transform((s) =>
    z.array(z.object({ vendorId: z.string().uuid(), serviceId: z.string().uuid(), qty: z.number().int().min(1) })).parse(JSON.parse(s)),
  ),
  notes: z.string().trim().max(1000).optional(),
});

export async function requestPackageQuotes(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const viewer = await requireRole("planner");
  const parsed = packageRequestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Something's off with this package. Refresh and try again." };
  const db = await getDb();
  const event = await getCurrentEvent(viewer.id);
  if (!event) redirect("/onboarding/planner");
  await createBookingRequests(db, viewer, {
    eventId: event.id,
    packageId: parsed.data.packageId,
    requests: parsed.data.items.map((i) => ({
      vendorId: i.vendorId,
      serviceSelections: [{ serviceId: i.serviceId, qty: i.qty }],
      notes: parsed.data.notes || "Requesting a quote for this package via Eventually.",
    })),
  });
  redirect(`/inbox?sent=${parsed.data.items.length}`);
}

export async function acceptQuoteAction(formData: FormData) {
  const viewer = await requireRole("planner");
  const quoteId = z.string().uuid().parse(formData.get("quoteId"));
  const threadId = z.string().uuid().parse(formData.get("threadId"));
  await acceptQuote(await getDb(), viewer, quoteId);
  redirect(`/inbox/${threadId}/pay/${quoteId}`);
}

export async function declineQuoteAction(formData: FormData) {
  const viewer = await requireRole("planner");
  const quoteId = z.string().uuid().parse(formData.get("quoteId"));
  await declineQuote(await getDb(), viewer, quoteId);
  revalidatePath("/inbox");
}

export async function cancelRequestAction(formData: FormData) {
  const viewer = await requireRole("planner");
  const requestId = z.string().uuid().parse(formData.get("requestId"));
  await cancelRequest(await getDb(), viewer, requestId);
  revalidatePath("/inbox");
}

export async function payDepositAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const viewer = await requireRole("planner");
  const quoteId = z.string().uuid().parse(formData.get("quoteId"));
  const threadId = z.string().uuid().parse(formData.get("threadId"));
  const method = z.enum(["gcash", "card"]).parse(formData.get("method"));
  try {
    await payDeposit(await getDb(), viewer, quoteId, method);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Payment failed" };
  }
  redirect(`/inbox/${threadId}?booked=1`);
}

const quoteSchema = z.object({
  requestId: z.string().uuid(),
  items: z.string().transform((s, ctx) => {
    try {
      return z
        .array(z.object({ label: z.string().trim().min(1).max(120), qty: z.number().int().min(1).max(5000), unitPricePhp: z.number().int().min(0).max(10_000_000) }))
        .min(1)
        .parse(JSON.parse(s));
    } catch {
      ctx.addIssue({ code: "custom", message: "Each line needs a label, quantity and price" });
      return z.NEVER;
    }
  }),
  depositPct: z.coerce.number().int().min(0).max(100),
  validUntil: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid-until date")
    .refine((d) => d >= todayISO(), "Valid-until must be today or later"),
  message: z.string().trim().max(1000).optional(),
});

export async function sendQuoteAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const viewer = await requireRole("vendor");
  const parsed = quoteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the quote" };
  const { requestId, ...input } = parsed.data;
  let threadId: string;
  try {
    ({ threadId } = await sendQuote(await getDb(), viewer, requestId, input));
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Couldn't send the quote" };
  }
  redirect(`/vendor/inbox/${threadId}?quoted=1`);
}

export async function declineRequestAction(formData: FormData) {
  const viewer = await requireRole("vendor");
  const requestId = z.string().uuid().parse(formData.get("requestId"));
  const reason = z.string().trim().max(200).optional().parse(formData.get("reason") || undefined);
  await declineRequest(await getDb(), viewer, requestId, reason);
  redirect("/vendor/requests");
}
