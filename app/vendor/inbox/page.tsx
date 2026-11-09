import { AppHeader } from "@/components/app-header";
import { InboxList } from "@/components/inbox-list";
import { LiveRefresh } from "@/components/live-refresh";
import { getInbox } from "@/lib/queries/inbox";
import { tick } from "@/lib/planner";
import { requireVendorShop } from "@/lib/vendor";

export const metadata = { title: "Inbox" };

export default async function VendorInbox() {
  const { viewer } = await requireVendorShop();
  await tick();
  const items = await getInbox(viewer, "vendor");
  return (
    <main>
      <LiveRefresh intervalMs={3000} />
      <AppHeader title="Inbox" subtitle="Conversations with planners" />
      <div className="px-5 pt-4 pb-6">
        <InboxList items={items} side="vendor" basePath="/vendor/inbox" />
      </div>
    </main>
  );
}
