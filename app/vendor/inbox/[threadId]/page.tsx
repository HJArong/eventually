import { notFound } from "next/navigation";
import { LiveRefresh } from "@/components/live-refresh";
import { Thread } from "@/components/thread-view";
import { getDb } from "@/lib/db";
import { getCatalog } from "@/lib/queries/catalog";
import { getThreadView } from "@/lib/queries/inbox";
import { ForbiddenError } from "@/lib/services/access";
import { markThreadRead } from "@/lib/services/bookings";
import { tick } from "@/lib/planner";
import { requireVendorShop } from "@/lib/vendor";

export const metadata = { title: "Conversation" };

export default async function VendorThread({ params }: PageProps<"/vendor/inbox/[threadId]">) {
  const { viewer } = await requireVendorShop();
  const { threadId } = await params;
  await tick();
  const view = await getThreadView(viewer, threadId).catch((err) => {
    if (err instanceof ForbiddenError) notFound();
    throw err;
  });
  await markThreadRead(await getDb(), viewer, threadId);
  return (
    <>
      <LiveRefresh intervalMs={3000} />
      <Thread view={view} catalog={await getCatalog()} basePath="/vendor/inbox" />
    </>
  );
}
