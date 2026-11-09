import { asc, eq } from "drizzle-orm";
import { AppHeader } from "@/components/app-header";
import { LinkButton } from "@/components/ui";
import { getDb } from "@/lib/db";
import { services } from "@/lib/db/schema";
import { requireVendorShop } from "@/lib/vendor";
import { ServiceEditor } from "./service-editor";

export const metadata = { title: "Services" };

export default async function VendorServices({ searchParams }: PageProps<"/vendor/services">) {
  const { vendor } = await requireVendorShop();
  const { onboarding } = await searchParams;
  const db = await getDb();
  const rows = await db.select().from(services).where(eq(services.vendorId, vendor.id)).orderBy(asc(services.sort));
  return (
    <main>
      <AppHeader title="Services & prices" subtitle="Planners see these on your shop and in requests" back="/vendor" />
      {onboarding && (
        <div className="mx-5 mt-4 animate-pop-in rounded-2xl bg-rose-50 p-4 text-rose-700">
          <p className="text-base font-semibold">Your shop is live</p>
          <p className="text-sm text-rose-700/80">Add at least one service with a price so planners can request you.</p>
        </div>
      )}
      <div className="grid gap-3 px-5 pt-4">
        {rows.map((s) => (
          <ServiceEditor key={s.id} service={{ id: s.id, name: s.name, description: s.description, pricePhp: s.pricePhp, unit: s.unit }} />
        ))}
        <ServiceEditor key={`new-${rows.length}`} />
      </div>
      {onboarding && rows.length > 0 && (
        <div className="px-5 pt-5 pb-6">
          <LinkButton href="/vendor" size="lg" className="w-full">
            Go to dashboard
          </LinkButton>
        </div>
      )}
    </main>
  );
}
