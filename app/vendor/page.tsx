import Link from "next/link";
import { Bot, Plus, Wrench } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { RequestRow } from "@/components/request-row";
import { Button, EmptyState, LinkButton, SectionTitle } from "@/components/ui";
import { cn } from "@/lib/cn";
import { config } from "@/lib/config";
import { getCatalog } from "@/lib/queries/catalog";
import { getVendorRequests, getVendorStats } from "@/lib/queries/vendor-dashboard";
import { requireVendorShop } from "@/lib/vendor";
import { toggleAutoRespondAction } from "@/app/actions/vendor";

export const metadata = { title: "Vendor dashboard" };

export default async function VendorDashboard() {
  const { vendor } = await requireVendorShop();
  const [stats, needsReply, catalog] = await Promise.all([
    getVendorStats(vendor.id),
    getVendorRequests(vendor.id, ["requested"]),
    getCatalog(),
  ]);
  const tiles = [
    { label: "New requests", value: stats.newRequests, tone: "bg-mango" },
    { label: "Profile views", value: vendor.profileViews, tone: "bg-white" },
    { label: "Quotes sent", value: stats.quotesSent, tone: "bg-white" },
    { label: "Booked", value: stats.booked, tone: "bg-calamansi-100" },
  ];

  return (
    <main>
      <AppHeader
        title={vendor.name}
        subtitle={`${catalog.categoryById.get(vendor.categoryId)?.name} · ${catalog.areaById.get(vendor.baseAreaId)?.name}`}
        right={
          <Link href={`/vendors/${vendor.slug}`} className="text-xs font-bold text-ube">
            View shop
          </Link>
        }
      />
      <div className="px-5 pt-4">
        <div className="grid grid-cols-2 gap-3">
          {tiles.map((t) => (
            <div key={t.label} className={cn("pop rounded-3xl p-3.5", t.tone)}>
              <p className="text-xs font-bold text-ink-soft">{t.label}</p>
              <p className="font-display text-3xl font-extrabold tabular-nums">{t.value}</p>
            </div>
          ))}
        </div>

        {config.demoMode && (
          <form action={toggleAutoRespondAction} className="mt-4 flex items-center gap-3 rounded-3xl border-2 border-dashed border-ink/25 bg-white/70 p-3">
            <Bot className="size-6 shrink-0 text-ube" />
            <p className="flex-1 text-sm">
              <span className="font-bold">Demo auto-responder is {vendor.autoRespond ? "on" : "off"}.</span>{" "}
              <span className="text-muted">{vendor.autoRespond ? "New requests get a sample quote in seconds." : "You answer requests yourself."}</span>
            </p>
            <Button size="sm" variant="outline" type="submit">
              Turn {vendor.autoRespond ? "off" : "on"}
            </Button>
          </form>
        )}

        <section className="mt-6">
          <SectionTitle
            action={
              <Link href="/vendor/requests" className="text-sm font-bold text-ube">
                All requests
              </Link>
            }
          >
            Needs reply
          </SectionTitle>
          {needsReply.length ? (
            <div className="grid gap-3">
              {needsReply.map((r) => (
                <RequestRow key={r.request.id} row={r} catalog={catalog} />
              ))}
            </div>
          ) : (
            <EmptyState title="You're all caught up" body="New requests from planners show up here with date, pax and budget up front." />
          )}
        </section>

        <div className="mt-6 grid grid-cols-2 gap-3 pb-6">
          <LinkButton href="/vendor/services" variant="outline" size="lg">
            <Wrench className="size-4" /> Edit services
          </LinkButton>
          <LinkButton href="/vendor/posts/new" variant="primary" size="lg">
            <Plus className="size-4" /> New post
          </LinkButton>
        </div>
      </div>
    </main>
  );
}
