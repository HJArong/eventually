import { asc, eq } from "drizzle-orm";
import { Bot, LogOut, RotateCcw, X } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Avatar, Button, Input, SectionTitle } from "@/components/ui";
import { config } from "@/lib/config";
import { getDb } from "@/lib/db";
import { vendorAreas, vendorBlockedDates } from "@/lib/db/schema";
import { formatDate, todayISO } from "@/lib/format";
import { getCatalog } from "@/lib/queries/catalog";
import { requireVendorShop } from "@/lib/vendor";
import { signOut } from "@/app/actions/auth";
import { resetDemoAction } from "@/app/actions/admin";
import { addBlockedDateAction, removeBlockedDateAction, toggleAutoRespondAction } from "@/app/actions/vendor";
import { ShopForm } from "./shop-form";

export const metadata = { title: "My shop" };

export default async function VendorShop() {
  const { viewer, vendor } = await requireVendorShop();
  const db = await getDb();
  const [catalog, areaRows, blocked] = await Promise.all([
    getCatalog(),
    db.select().from(vendorAreas).where(eq(vendorAreas.vendorId, vendor.id)),
    db.select().from(vendorBlockedDates).where(eq(vendorBlockedDates.vendorId, vendor.id)).orderBy(asc(vendorBlockedDates.date)),
  ]);
  const upcoming = blocked.filter((b) => b.date >= todayISO());

  return (
    <main>
      <AppHeader title="My shop" subtitle={viewer.email} />
      <div className="px-5 pt-4">
        <div className="pop flex items-center gap-3 rounded-3xl p-4">
          <Avatar name={vendor.name} src={vendor.coverUrl} size={52} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg font-extrabold">{vendor.name}</p>
            <p className="truncate text-sm text-muted">{viewer.displayName}</p>
          </div>
          <form action={signOut}>
            <Button variant="outline" size="sm" type="submit">
              <LogOut className="size-4" /> Sign out
            </Button>
          </form>
        </div>

        <section className="mt-7">
          <SectionTitle>Shop details</SectionTitle>
          <ShopForm
            vendor={{ name: vendor.name, tagline: vendor.tagline, bio: vendor.bio, fbUrl: vendor.fbUrl ?? "", igUrl: vendor.igUrl ?? "" }}
            areas={catalog.areas.map((a) => ({ value: String(a.id), label: a.name }))}
            selectedAreas={areaRows.map((a) => String(a.areaId))}
          />
        </section>

        <section className="mt-7">
          <SectionTitle>Blocked dates</SectionTitle>
          <p className="-mt-2 mb-3 text-sm text-muted">Planners searching these dates won&apos;t see you. Booked dates are blocked automatically.</p>
          {upcoming.length > 0 && (
            <ul className="mb-3 flex flex-wrap gap-2">
              {upcoming.map((b) => (
                <li key={b.date}>
                  <form action={removeBlockedDateAction}>
                    <input type="hidden" name="date" value={b.date} />
                    <button
                      type="submit"
                      className="inline-flex h-9 items-center gap-1.5 rounded-full border-2 border-ink bg-sand px-3 text-sm font-semibold"
                      aria-label={`Unblock ${formatDate(b.date)}`}
                      title={b.reason ?? undefined}
                    >
                      {formatDate(b.date)} <X className="size-3.5" />
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <form action={addBlockedDateAction} className="flex gap-2">
            <Input name="date" type="date" min={todayISO()} required aria-label="Date to block" className="flex-1" />
            <Button type="submit" variant="outline">
              Block date
            </Button>
          </form>
        </section>

        {config.demoMode && (
          <section className="mt-7 pb-8">
            <SectionTitle>Demo</SectionTitle>
            <div className="flex flex-wrap gap-2">
              <form action={toggleAutoRespondAction}>
                <Button variant="outline" size="sm" type="submit">
                  <Bot className="size-4" /> Auto-responder: {vendor.autoRespond ? "on" : "off"}
                </Button>
              </form>
              <form action={resetDemoAction}>
                <Button variant="danger" size="sm" type="submit">
                  <RotateCcw className="size-4" /> Reset demo data
                </Button>
              </form>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
