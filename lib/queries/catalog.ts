import { asc } from "drizzle-orm";
import { cache } from "react";
import { getDb } from "@/lib/db";
import { areas, categories, eventTypes } from "@/lib/db/schema";

export const getCatalog = cache(async () => {
  const db = await getDb();
  const [areaRows, categoryRows, eventTypeRows] = await Promise.all([
    db.select().from(areas).orderBy(asc(areas.sort)),
    db.select().from(categories).orderBy(asc(categories.sort)),
    db.select().from(eventTypes).orderBy(asc(eventTypes.sort)),
  ]);
  return {
    areas: areaRows,
    categories: categoryRows,
    eventTypes: eventTypeRows,
    areaById: new Map(areaRows.map((a) => [a.id, a])),
    categoryById: new Map(categoryRows.map((c) => [c.id, c])),
    categoryBySlug: new Map(categoryRows.map((c) => [c.slug, c])),
    eventTypeBySlug: new Map(eventTypeRows.map((e) => [e.slug, e])),
  };
});

export type Catalog = Awaited<ReturnType<typeof getCatalog>>;
