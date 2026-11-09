import { and, asc, eq } from "drizzle-orm";
import { AppHeader } from "@/components/app-header";
import { getDb } from "@/lib/db";
import { media, services } from "@/lib/db/schema";
import { getCatalog } from "@/lib/queries/catalog";
import { requireVendorShop } from "@/lib/vendor";
import { PostComposer } from "./post-composer";

export const metadata = { title: "New post" };

export default async function NewPost() {
  const { vendor } = await requireVendorShop();
  const db = await getDb();
  const [catalog, svcs, gallery] = await Promise.all([
    getCatalog(),
    db.select().from(services).where(eq(services.vendorId, vendor.id)).orderBy(asc(services.sort)),
    db.select().from(media).where(and(eq(media.ownerType, "vendor"), eq(media.ownerId, vendor.id))).orderBy(asc(media.sort)),
  ]);
  const samples = [...new Set([...gallery.map((g) => g.url), "/seed/lechon-chopped-3.webp", "/seed/fiesta-2.webp"])].slice(0, 8);
  return (
    <main>
      <AppHeader title="New post" back="/vendor/feed" />
      <PostComposer
        samples={samples}
        eventTypes={catalog.eventTypes.map((e) => ({ value: e.slug, label: e.name }))}
        areas={catalog.areas.map((a) => ({ value: String(a.id), label: a.name }))}
        defaultAreaId={String(vendor.baseAreaId)}
        services={svcs.map((s) => ({ value: s.id, label: s.name }))}
      />
    </main>
  );
}
