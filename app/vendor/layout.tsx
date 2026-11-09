import { BottomNav } from "@/components/bottom-nav";
import { LiveRefresh } from "@/components/live-refresh";
import { tick } from "@/lib/planner";
import { getUnreadCount } from "@/lib/queries/inbox";
import { requireVendorShop } from "@/lib/vendor";

export default async function VendorLayout({ children }: LayoutProps<"/vendor">) {
  const { viewer } = await requireVendorShop();
  await tick();
  const unread = await getUnreadCount(viewer, "vendor");
  return (
    <>
      <div className="pb-24">{children}</div>
      <BottomNav side="vendor" unread={unread} />
      <LiveRefresh intervalMs={8000} />
    </>
  );
}
