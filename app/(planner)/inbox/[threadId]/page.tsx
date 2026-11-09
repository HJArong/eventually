import { notFound } from "next/navigation";
import { LiveRefresh } from "@/components/live-refresh";
import { Thread } from "@/components/thread-view";
import { Celebrate } from "@/components/thread-client";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { getCatalog } from "@/lib/queries/catalog";
import { getThreadView } from "@/lib/queries/inbox";
import { ForbiddenError } from "@/lib/services/access";
import { markThreadRead } from "@/lib/services/bookings";

export const metadata = { title: "Conversation" };

export default async function PlannerThread({ params, searchParams }: PageProps<"/inbox/[threadId]">) {
  const viewer = await requireRole("planner");
  const { threadId } = await params;
  const { booked } = await searchParams;
  const view = await getThreadView(viewer, threadId).catch((err) => {
    if (err instanceof ForbiddenError) notFound();
    throw err;
  });
  await markThreadRead(await getDb(), viewer, threadId);
  return (
    <>
      <LiveRefresh intervalMs={3000} />
      {booked && <Celebrate title="You're booked!" body={`${view.vendor.name} is locked in for ${view.event.title}.`} />}
      <Thread view={view} catalog={await getCatalog()} basePath="/inbox" />
    </>
  );
}
