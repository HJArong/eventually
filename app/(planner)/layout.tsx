import { BottomNav } from "@/components/bottom-nav";
import { LiveRefresh } from "@/components/live-refresh";
import { requireRole } from "@/lib/auth/session";
import { tick } from "@/lib/planner";
import { getUnreadCount } from "@/lib/queries/inbox";

export default async function PlannerLayout({ children }: LayoutProps<"/">) {
  const viewer = await requireRole("planner");
  await tick();
  const unread = await getUnreadCount(viewer, "planner");
  return (
    <>
      <div className="pb-24">{children}</div>
      <BottomNav side="planner" unread={unread} />
      <LiveRefresh intervalMs={8000} />
    </>
  );
}
