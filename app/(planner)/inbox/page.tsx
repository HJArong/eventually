import { AppHeader } from "@/components/app-header";
import { InboxList } from "@/components/inbox-list";
import { LiveRefresh } from "@/components/live-refresh";
import { ChipLink } from "@/components/ui";
import { requirePlannerEvent, tick } from "@/lib/planner";
import { getInbox } from "@/lib/queries/inbox";

export const metadata = { title: "Inbox" };

export default async function Inbox({ searchParams }: PageProps<"/inbox">) {
  const { viewer } = await requirePlannerEvent();
  const { filter: raw, sent } = await searchParams;
  const filter = raw === "quotes" || raw === "unread" ? raw : "all";
  await tick();
  const [items, all] = await Promise.all([getInbox(viewer, "planner", filter), getInbox(viewer, "planner")]);
  const quoteCount = all.filter((i) => i.status === "quoted" || i.status === "accepted").length;
  const unreadCount = all.filter((i) => i.unread > 0).length;

  return (
    <main>
      <LiveRefresh intervalMs={3000} />
      <AppHeader title="Inbox" subtitle="Quotes and chats with your vendors" />
      <div className="flex gap-2 px-5 pt-4">
        <ChipLink href="/inbox" selected={filter === "all"}>
          All
        </ChipLink>
        <ChipLink href="/inbox?filter=quotes" selected={filter === "quotes"}>
          Quotes ({quoteCount})
        </ChipLink>
        <ChipLink href="/inbox?filter=unread" selected={filter === "unread"}>
          Unread ({unreadCount})
        </ChipLink>
      </div>
      {sent && (
        <p className="mx-5 mt-4 animate-pop-in rounded-2xl border-2 border-ink bg-calamansi-100 px-4 py-3 text-sm font-semibold">
          Sent {sent === "1" ? "your request" : `${sent} requests`}! Vendors usually reply with a quote right here.
        </p>
      )}
      <div className="px-5 pt-4 pb-6">
        <InboxList items={items} side="planner" basePath="/inbox" />
      </div>
    </main>
  );
}
