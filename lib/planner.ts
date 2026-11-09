import { redirect } from "next/navigation";
import { cache } from "react";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { getCurrentEvent } from "@/lib/queries/events";
import { runMaintenanceTick } from "@/lib/services/bookings";

/** Runs the auto-responder and quote expiry once per request; pages await it before reading so updates show immediately. */
export const tick = cache(async () => {
  await runMaintenanceTick(await getDb());
});

export async function requirePlannerEvent() {
  const viewer = await requireRole("planner");
  const event = await getCurrentEvent(viewer.id);
  if (!event) redirect("/onboarding/planner");
  return { viewer, event };
}
