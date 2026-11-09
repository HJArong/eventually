import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { packageItems, packages, services, vendorAreas, vendors } from "@/lib/db/schema";
import { estimatePackage } from "@/lib/domain/pricing";

async function itemsFor(packageIds: string[]) {
  if (!packageIds.length) return [];
  const db = await getDb();
  return db
    .select({ item: packageItems, service: services, vendor: vendors })
    .from(packageItems)
    .innerJoin(services, eq(services.id, packageItems.serviceId))
    .innerJoin(vendors, eq(vendors.id, services.vendorId))
    .where(inArray(packageItems.packageId, packageIds))
    .orderBy(asc(packageItems.sort));
}

function toLine(r: Awaited<ReturnType<typeof itemsFor>>[number]) {
  return {
    pricePhp: r.service.pricePhp,
    unit: r.service.unit,
    qtyRule: r.item.qtyRule,
    qty: r.item.qty,
    minQty: r.service.minQty,
    maxQty: r.service.maxQty,
  };
}

export async function listPackages(opts: { eventType?: string; includeUnpublished?: boolean } = {}) {
  const db = await getDb();
  const conds = [];
  if (!opts.includeUnpublished) conds.push(eq(packages.isPublished, true));
  if (opts.eventType) conds.push(eq(packages.eventType, opts.eventType));
  const rows = await db
    .select()
    .from(packages)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(asc(packages.sort));
  const items = await itemsFor(rows.map((p) => p.id));
  return rows.map((p) => {
    const mine = items.filter((i) => i.item.packageId === p.id);
    return {
      ...p,
      vendorCount: mine.length,
      fromPricePhp: estimatePackage(mine.map(toLine), p.paxMin).total,
      vendorNames: mine.map((i) => i.vendor.name),
    };
  });
}

export type PackageListItem = Awaited<ReturnType<typeof listPackages>>[number];

export async function getPackageDetail(slug: string) {
  const db = await getDb();
  const [pkg] = await db.select().from(packages).where(eq(packages.slug, slug)).limit(1);
  if (!pkg) return null;
  const items = await itemsFor([pkg.id]);

  // Swap candidates: other vendors in the same category, preferring those serving the package area.
  const alternatives = await Promise.all(
    items.map(async (r) => {
      const areaCond = pkg.areaId
        ? sql`exists (select 1 from ${vendorAreas} va where va.vendor_id = ${vendors.id} and va.area_id = ${pkg.areaId})`
        : undefined;
      const others = await db
        .select()
        .from(vendors)
        .where(and(eq(vendors.categoryId, r.vendor.categoryId), ne(vendors.id, r.vendor.id), areaCond))
        .orderBy(desc(vendors.isCurated), desc(vendors.ratingAvg))
        .limit(5);
      const svcs = others.length
        ? await db
            .select()
            .from(services)
            .where(inArray(services.vendorId, others.map((o) => o.id)))
            .orderBy(asc(services.sort))
        : [];
      return others
        .map((vendor) => {
          const own = svcs.filter((s) => s.vendorId === vendor.id);
          // Same position in the menu usually means the same kind of service (e.g. premium buffet).
          const service =
            own.find((s) => s.sort === r.service.sort && s.unit === r.service.unit) ??
            own.find((s) => s.unit === r.service.unit) ??
            own[0];
          return service ? { vendor, service } : null;
        })
        .filter((x): x is NonNullable<typeof x> => Boolean(x));
    }),
  );

  return {
    pkg,
    items: items.map((r, i) => ({
      vendor: r.vendor,
      service: r.service,
      qtyRule: r.item.qtyRule,
      qty: r.item.qty,
      alternatives: alternatives[i]!,
    })),
  };
}

export type PackageDetail = NonNullable<Awaited<ReturnType<typeof getPackageDetail>>>;
