import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { getCurrentEvent } from "@/lib/queries/events";
import { runMaintenanceTick } from "@/lib/services/bookings";

export async function tick() {
  await runMaintenanceTick(await getDb());
}

export async function requirePlannerEvent() {
  const viewer = await requireRole("planner");
  const event = await getCurrentEvent(viewer.id);
  if (!event) redirect("/onboarding/planner");
  return { viewer, event };
}
