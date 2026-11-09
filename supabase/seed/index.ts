import { sql } from "drizzle-orm";
import type { DB } from "@/lib/db";
import * as t from "@/lib/db/schema";
import { tasksFromTemplate } from "@/lib/domain/checklist";
import { defaultQty } from "@/lib/domain/pricing";
import type { QuoteLine, RequestedService } from "@/lib/domain/types";
import { addDays, slugify, todayISO } from "@/lib/format";
import { AREAS, CATEGORIES, EVENT_TYPES, type AreaSlug, type CategorySlug } from "./catalog";
import { PACKAGES } from "./packages";
import {
  BIOS,
  CAPTIONS,
  CATEGORY_EVENT_TAGS,
  CATEGORY_IMAGES,
  REVIEW_BODIES,
  REVIEWER_NAMES,
  SERVICE_TEMPLATES,
  TAGLINES,
  VENDORS,
} from "./vendors";

import { DEMO_ADMIN_EMAIL, DEMO_PLANNER_EMAIL, DEMO_VENDOR_EMAIL } from "@/lib/demo";

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let r = Math.imul(a ^ (a >>> 15), 1 | a);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const TABLES = [
  "messages", "threads", "mock_payments", "quote_items", "quotes", "booking_requests", "package_items",
  "packages", "event_tasks", "events", "reviews", "follows", "saves", "likes", "post_tags", "posts", "media",
  "services", "vendor_blocked_dates", "vendor_areas", "vendors", "event_types", "categories", "areas",
  "auth_tokens", "profiles",
];

async function insertChunked<T extends Record<string, unknown>>(
  db: DB,
  table: Parameters<DB["insert"]>[0],
  rows: T[],
  size = 250,
) {
  for (let i = 0; i < rows.length; i += size) {
    await db.insert(table).values(rows.slice(i, i + size) as never);
  }
}

/** Next May 13 that is at least `minDays` away, so the demo wedding is always in the future. */
function heroEventDate(today: string, minDays = 60): string {
  let year = Number(today.slice(0, 4));
  for (;;) {
    const candidate = `${year}-05-13`;
    if (candidate >= addDays(today, minDays)) return candidate;
    year += 1;
  }
}

/**
 * Stable v4-shaped UUIDs, so every seed (and every in-memory serverless instance) gives the demo
 * accounts and threads the same ids and session cookies stay valid across instances and resets.
 */
function seededUuid(seed: number) {
  const rand = mulberry32(seed);
  return () => {
    const hex = Array.from({ length: 32 }, () => Math.floor(rand() * 16).toString(16));
    hex[12] = "4";
    hex[16] = "89ab"[Math.floor(rand() * 4)]!;
    const h = hex.join("");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  };
}

export type SeedSummary = Record<string, number>;

export async function seedDatabase(db: DB, opts: { now?: Date } = {}): Promise<SeedSummary> {
  const now = opts.now ?? new Date();
  const today = todayISO(now);
  const heroDate = heroEventDate(today);
  const rand = mulberry32(20261109);
  const uid = seededUuid(20261110);
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]!;
  const between = (lo: number, hi: number) => lo + rand() * (hi - lo);
  const roundPrice = (n: number) => (n >= 2000 ? Math.round(n / 500) * 500 : Math.round(n / 10) * 10);
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000);
  const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000);

  await db.execute(sql.raw(`truncate ${TABLES.join(", ")} restart identity cascade`));

  // Catalog
  const areaRows = await db
    .insert(t.areas)
    .values(AREAS.map((a, i) => ({ name: a.name, slug: a.slug, sort: i })))
    .returning();
  const areaId = Object.fromEntries(areaRows.map((a) => [a.slug, a.id])) as Record<AreaSlug, number>;
  const areaName = Object.fromEntries(areaRows.map((a) => [a.id, a.name])) as Record<number, string>;

  const catRows = await db
    .insert(t.categories)
    .values(CATEGORIES.map((c, i) => ({ name: c.name, slug: c.slug, icon: c.icon, sort: i })))
    .returning();
  const catId = Object.fromEntries(catRows.map((c) => [c.slug, c.id])) as Record<CategorySlug, number>;

  await db.insert(t.eventTypes).values(
    EVENT_TYPES.map((e, i) => ({
      slug: e.slug,
      name: e.name,
      sort: i,
      slotCategories: e.slots,
      checklistTemplate: e.checklist,
    })),
  );

  // Demo people
  const people = {
    hazel: { id: uid(), name: "Hazel", email: DEMO_PLANNER_EMAIL, role: "planner" as const },
    inday: { id: uid(), name: "Inday Cabahug", email: DEMO_VENDOR_EMAIL, role: "vendor" as const },
    curator: { id: uid(), name: "Eventually Curators", email: DEMO_ADMIN_EMAIL, role: "admin" as const },
    paolo: { id: uid(), name: "Paolo Ybañez", email: "paolo@demo.eventually.app", role: "planner" as const },
    jen: { id: uid(), name: "Jen Abellana", email: "jen@demo.eventually.app", role: "planner" as const },
    carla: { id: uid(), name: "Carla Sy", email: "carla@demo.eventually.app", role: "planner" as const },
    mark: { id: uid(), name: "Mark Tan", email: "mark@demo.eventually.app", role: "planner" as const },
  };
  await db.insert(t.profiles).values(
    Object.values(people).map((p) => ({ id: p.id, role: p.role, displayName: p.name, email: p.email, isDemo: true })),
  );

  // Vendors, services, media, reviews
  type VendorBuilt = {
    id: string;
    name: string;
    category: CategorySlug;
    areaId: number;
    services: { id: string; name: string; pricePhp: number; unit: t.ServiceUnit; minQty: number | null; maxQty: number | null }[];
    images: string[];
  };
  const vendorsByName = new Map<string, VendorBuilt>();
  const vendorRows: (typeof t.vendors.$inferInsert)[] = [];
  const serviceRows: (typeof t.services.$inferInsert)[] = [];
  const mediaRows: (typeof t.media.$inferInsert)[] = [];
  const vendorAreaRows: (typeof t.vendorAreas.$inferInsert)[] = [];
  const blockedRows: (typeof t.vendorBlockedDates.$inferInsert)[] = [];
  const reviewRows: (typeof t.reviews.$inferInsert)[] = [];
  const allAreaSlugs = AREAS.map((a) => a.slug);

  for (const category of CATEGORIES.map((c) => c.slug)) {
    const pool = CATEGORY_IMAGES[category].flatMap((img) => [`${img}`, `${img}-2`, `${img}-3`]);
    VENDORS[category].forEach((seed, idx) => {
      const id = uid();
      const templates = SERVICE_TEMPLATES[category];
      const services = (
        seed.services ??
        templates.map((tpl) => ({
          name: tpl.name,
          description: tpl.description,
          unit: tpl.unit,
          price: roundPrice(between(tpl.price[0], tpl.price[1])),
          minQty: tpl.minQty,
          maxQty: tpl.maxQty,
        }))
      ).map((svc, i) => ({
        id: uid(),
        vendorId: id,
        name: svc.name,
        description: svc.description,
        pricePhp: svc.price,
        unit: svc.unit,
        minQty: svc.minQty ?? null,
        maxQty: svc.maxQty ?? null,
        sort: i,
      }));
      serviceRows.push(...services);

      const [lo, hi] = templates[0]!.price;
      const position = (services[0]!.pricePhp - lo) / Math.max(1, hi - lo);
      const priceBand = position < 0.34 ? 1 : position < 0.67 ? 2 : 3;

      // Rotate through the category pool so neighbouring vendors don't share a cover.
      const count = 4 + Math.floor(rand() * 3);
      const images = Array.from({ length: count }, (_, k) => pool[(idx * 2 + k * 3) % pool.length]!);
      const uniqueImages = [...new Set(images)];
      uniqueImages.forEach((img, k) =>
        mediaRows.push({ ownerType: "vendor", ownerId: id, url: `/seed/${img}.webp`, width: 1200, height: 900, sort: k }),
      );

      const served = new Set<AreaSlug>([seed.area]);
      if (seed.curated) allAreaSlugs.forEach((a) => served.add(a));
      else if (category !== "venue") {
        const extra = 1 + Math.floor(rand() * 3);
        for (let k = 0; k < extra; k++) served.add(pick(allAreaSlugs));
      }
      if (seed.name === "Lechon ni Inday") allAreaSlugs.forEach((a) => served.add(a));
      served.forEach((a) => vendorAreaRows.push({ vendorId: id, areaId: areaId[a] }));

      const blocked = new Set<string>();
      for (let k = 0; k < 2 + Math.floor(rand() * 3); k++) {
        const d = addDays(today, 7 + Math.floor(rand() * 170));
        if (d !== heroDate) blocked.add(d);
      }
      if (seed.blockedOnHeroDate) blocked.add(heroDate);
      blocked.forEach((d) => blockedRows.push({ vendorId: id, date: d, reason: "Booked" }));

      const nReviews = 3 + Math.floor(rand() * 5);
      let ratingSum = 0;
      for (let k = 0; k < nReviews; k++) {
        const rating = rand() < 0.72 ? 5 : rand() < 0.85 ? 4 : 3;
        ratingSum += rating;
        reviewRows.push({
          vendorId: id,
          authorName: pick(REVIEWER_NAMES),
          rating,
          body: rating === 3 ? REVIEW_BODIES[9]! : pick(REVIEW_BODIES.slice(0, 9)),
          eventType: pick(CATEGORY_EVENT_TAGS[category]),
          createdAt: hoursAgo(24 * (5 + Math.floor(rand() * 300))),
        });
      }

      const area = areaName[areaId[seed.area]]!;
      vendorRows.push({
        id,
        ownerId: seed.name === "Lechon ni Inday" ? people.inday.id : null,
        name: seed.name,
        slug: slugify(seed.name),
        categoryId: catId[category],
        tagline: seed.tagline ?? pick(TAGLINES[category]),
        bio: pick(BIOS[category]).replaceAll("{name}", seed.name).replaceAll("{area}", area),
        baseAreaId: areaId[seed.area],
        fbUrl: `https://facebook.com/${slugify(seed.name).replaceAll("-", "")}`,
        igUrl: rand() < 0.7 ? `https://instagram.com/${slugify(seed.name).replaceAll("-", "")}` : null,
        priceBand,
        startingPricePhp: Math.min(...services.map((x) => x.pricePhp)),
        ratingAvg: Math.round((ratingSum / nReviews) * 10) / 10,
        ratingCount: nReviews,
        profileViews: seed.name === "Lechon ni Inday" ? 214 : 40 + Math.floor(rand() * 340),
        isCurated: Boolean(seed.curated),
        isDemo: true,
        autoRespond: true,
        coverUrl: `/seed/${uniqueImages[0]}.webp`,
      });
      vendorsByName.set(seed.name, {
        id,
        name: seed.name,
        category,
        areaId: areaId[seed.area],
        services: services.map((x) => ({
          id: x.id,
          name: x.name,
          pricePhp: x.pricePhp,
          unit: x.unit,
          minQty: x.minQty,
          maxQty: x.maxQty,
        })),
        images: uniqueImages,
      });
    });
  }

  await insertChunked(db, t.vendors, vendorRows);
  await insertChunked(db, t.services, serviceRows);
  await insertChunked(db, t.vendorAreas, vendorAreaRows);
  await insertChunked(db, t.vendorBlockedDates, blockedRows);
  await insertChunked(db, t.reviews, reviewRows);

  const V = (name: string) => {
    const v = vendorsByName.get(name);
    if (!v) throw new Error(`Seed references unknown vendor "${name}"`);
    return v;
  };

  // Feed posts (~150)
  const postRows: (typeof t.posts.$inferInsert)[] = [];
  const postTagRows: (typeof t.postTags.$inferInsert)[] = [];
  const allVendors = [...vendorsByName.values()];
  const extraPostCategories = new Set<CategorySlug>(["styling", "photo-video", "cakes", "lechon", "venue"]);
  allVendors.forEach((v, vi) => {
    const n = extraPostCategories.has(v.category) ? 3 : 2;
    for (let k = 0; k < n; k++) {
      const id = uid();
      const eventTag = pick(CATEGORY_EVENT_TAGS[v.category]);
      const area = rand() < 0.6 ? v.areaId : areaId[pick(allAreaSlugs)];
      const caption = CAPTIONS[v.category][(vi + k) % CAPTIONS[v.category].length]!
        .replaceAll("{event}", EVENT_TYPES.find((e) => e.slug === eventTag)!.name.toLowerCase())
        .replaceAll("{area}", areaName[area]!);
      postRows.push({
        id,
        vendorId: v.id,
        caption,
        areaId: area,
        linkedServiceId: rand() < 0.65 ? v.services[k % v.services.length]!.id : null,
        seedLikes: 4 + Math.floor(rand() * 180),
        createdAt: hoursAgo(3 + rand() * 24 * 40),
      });
      postTagRows.push({ postId: id, eventType: eventTag });
      if (rand() < 0.3) {
        const second = pick(CATEGORY_EVENT_TAGS[v.category]);
        if (second !== eventTag) postTagRows.push({ postId: id, eventType: second });
      }
      const nImg = 1 + Math.floor(rand() * Math.min(3, v.images.length));
      for (let m = 0; m < nImg; m++) {
        mediaRows.push({
          ownerType: "post",
          ownerId: id,
          url: `/seed/${v.images[(k + m + 1) % v.images.length]}.webp`,
          width: 1200,
          height: 900,
          sort: m,
        });
      }
    }
  });

  // The hero post on home and in the feed: a stylist's wedding reception, posted 2 hours ago.
  const bulak = V("Bulak Florals Cebu");
  const heroPostId = uid();
  postRows.push({
    id: heroPostId,
    vendorId: bulak.id,
    caption: "Ivory and greenery reception for Joy & Marco in Cebu City. Eucalyptus runners, white blooms and candlelight.",
    areaId: areaId["cebu-city"],
    linkedServiceId: bulak.services[3]!.id,
    seedLikes: 236,
    createdAt: hoursAgo(2),
  });
  postTagRows.push({ postId: heroPostId, eventType: "wedding" });
  mediaRows.push(
    { ownerType: "post", ownerId: heroPostId, url: "/seed/styling-wedding.webp", width: 1200, height: 900, sort: 0 },
    { ownerType: "post", ownerId: heroPostId, url: "/seed/venue-garden.webp", width: 1200, height: 900, sort: 1 },
  );

  await insertChunked(db, t.posts, postRows);
  await insertChunked(db, t.postTags, postTagRows);
  await insertChunked(db, t.media, mediaRows);

  // Curated packages
  let packageItemCount = 0;
  for (const [i, p] of PACKAGES.entries()) {
    const id = uid();
    await db.insert(t.packages).values({
      id,
      title: p.title,
      slug: slugify(p.title),
      tagline: p.tagline,
      eventType: p.eventType,
      areaId: p.area ? areaId[p.area] : null,
      paxMin: p.paxMin,
      paxMax: p.paxMax,
      description: p.description,
      coverUrl: p.cover,
      isPublished: true,
      sort: i,
    });
    await db.insert(t.packageItems).values(
      p.items.map((item, k) => {
        const svc = V(item.vendor).services[item.service ?? 0];
        if (!svc) throw new Error(`Package "${p.title}" references a missing service of ${item.vendor}`);
        return { packageId: id, serviceId: svc.id, qtyRule: item.qtyRule, qty: item.qty ?? 1, sort: k };
      }),
    );
    packageItemCount += p.items.length;
  }

  // Conversations: helpers
  const eventTypeBySlug = new Map(EVENT_TYPES.map((e) => [e.slug, e]));
  async function createEvent(input: {
    plannerId: string;
    title: string;
    eventType: string;
    date: string;
    area: AreaSlug;
    venueText?: string;
    pax: number;
    budgetPhp: number;
    doneTasks?: number;
  }) {
    const id = uid();
    await db.insert(t.events).values({
      id,
      plannerId: input.plannerId,
      title: input.title,
      eventType: input.eventType,
      date: input.date,
      areaId: areaId[input.area],
      venueText: input.venueText ?? null,
      pax: input.pax,
      budgetPhp: input.budgetPhp,
      createdAt: hoursAgo(24 * 12),
    });
    const tasks = tasksFromTemplate(eventTypeBySlug.get(input.eventType)!.checklist);
    await db
      .insert(t.eventTasks)
      .values(tasks.map((task, i) => ({ ...task, eventId: id, done: i < (input.doneTasks ?? 0) })));
    return { id, ...input };
  }

  type Step =
    | { at: Date; role: "planner" | "vendor"; text: string }
    | { at: Date; role: "system"; text: string };

  async function conversation(input: {
    event: Awaited<ReturnType<typeof createEvent>>;
    vendor: VendorBuilt;
    services: { index: number; qty?: number }[];
    notes: string;
    timeText?: string;
    budgetPhp?: number;
    deliveryArea?: AreaSlug;
    requestedAt: Date;
    status: t.BookingStatus;
    quote?: { at: Date; items?: QuoteLine[]; depositPct?: number; validDays?: number; message: string };
    paidAt?: Date;
    chatter?: Step[];
    readByPlanner?: boolean;
    readByVendor?: boolean;
  }) {
    const ev = input.event;
    const requested: RequestedService[] = input.services.map(({ index, qty }) => {
      const svc = input.vendor.services[index]!;
      return {
        serviceId: svc.id,
        name: svc.name,
        qty: qty ?? defaultQty(svc, ev.pax),
        unit: svc.unit,
        pricePhp: svc.pricePhp,
      };
    });
    const requestId = uid();
    await db.insert(t.bookingRequests).values({
      id: requestId,
      eventId: ev.id,
      vendorId: input.vendor.id,
      status: input.status,
      requestedServices: requested,
      date: ev.date,
      timeText: input.timeText ?? null,
      pax: ev.pax,
      budgetPhp: input.budgetPhp ?? null,
      deliveryAreaId: input.deliveryArea ? areaId[input.deliveryArea] : null,
      venueText: ev.venueText ?? null,
      notes: input.notes,
      createdAt: input.requestedAt,
      updatedAt: input.quote?.at ?? input.requestedAt,
    });
    const threadId = uid();
    const msgs: (typeof t.messages.$inferInsert)[] = [
      {
        threadId,
        senderId: ev.plannerId,
        senderRole: "planner",
        kind: "request",
        body: input.notes,
        bookingRequestId: requestId,
        createdAt: input.requestedAt,
      },
    ];
    for (const step of input.chatter ?? []) {
      msgs.push({
        threadId,
        senderId: step.role === "planner" ? ev.plannerId : step.role === "vendor" ? null : null,
        senderRole: step.role,
        kind: step.role === "system" ? "system" : "text",
        body: step.text,
        createdAt: step.at,
      });
    }
    let quoteId: string | null = null;
    if (input.quote) {
      quoteId = uid();
      const items =
        input.quote.items ?? requested.map((r) => ({ label: r.name, qty: r.qty, unitPricePhp: r.pricePhp }));
      const total = items.reduce((sum, i) => sum + i.qty * i.unitPricePhp, 0);
      const depositPct = input.quote.depositPct ?? 30;
      const quoteStatus: t.QuoteStatus = ["accepted", "deposit_paid", "confirmed"].includes(input.status)
        ? "accepted"
        : "sent";
      await db.insert(t.quotes).values({
        id: quoteId,
        bookingRequestId: requestId,
        totalPhp: total,
        depositPct,
        validUntil: addDays(today, input.quote.validDays ?? 14),
        message: input.quote.message,
        status: quoteStatus,
        createdAt: input.quote.at,
      });
      await db.insert(t.quoteItems).values(items.map((item, k) => ({ ...item, quoteId: quoteId!, sort: k })));
      msgs.push({
        threadId,
        senderRole: "vendor",
        kind: "quote",
        body: input.quote.message,
        quoteId,
        bookingRequestId: requestId,
        createdAt: input.quote.at,
      });
      if (input.paidAt) {
        const amount = Math.round((total * depositPct) / 100);
        await db.insert(t.mockPayments).values({
          quoteId,
          method: "gcash",
          amountPhp: amount,
          status: "succeeded",
          reference: `DEMO-GC-${requestId.slice(0, 8).toUpperCase()}`,
          createdAt: input.paidAt,
        });
        msgs.push({
          threadId,
          senderRole: "system",
          kind: "system",
          body: `Deposit of ₱${amount.toLocaleString("en-PH")} paid via GCash (demo). Booking confirmed!`,
          bookingRequestId: requestId,
          createdAt: input.paidAt,
        });
        await db
          .insert(t.vendorBlockedDates)
          .values({ vendorId: input.vendor.id, date: ev.date, reason: "Booked via Eventually" })
          .onConflictDoNothing();
      }
    }
    msgs.sort((a, b) => a.createdAt!.getTime() - b.createdAt!.getTime());
    const last = msgs[msgs.length - 1]!.createdAt!;
    await db.insert(t.threads).values({
      id: threadId,
      eventId: ev.id,
      vendorId: input.vendor.id,
      plannerId: ev.plannerId,
      lastMessageAt: last,
    });
    await db.insert(t.messages).values(
      msgs.map((m) => ({
        ...m,
        readAt:
          (m.senderRole === "planner" && input.readByVendor !== false) ||
          (m.senderRole !== "planner" && input.readByPlanner !== false)
            ? m.createdAt
            : null,
      })),
    );
    return { requestId, threadId, quoteId };
  }

  // Hazel, the demo planner: her own wedding, with 2 quotes waiting.
  const wedding = await createEvent({
    plannerId: people.hazel.id,
    title: "Hazel's Wedding",
    eventType: "wedding",
    date: heroDate,
    area: "cebu-city",
    venueText: "Lahug, Cebu City",
    pax: 150,
    budgetPhp: 475_000,
    doneTasks: 4,
  });
  await conversation({
    event: wedding,
    vendor: V("Kaha Studios"),
    services: [{ index: 1 }, { index: 2 }],
    notes: "Hi! Photo and video with a same-day edit for our wedding, plus a prenup shoot at Sirao flower farm if possible.",
    requestedAt: hoursAgo(50),
    status: "quoted",
    budgetPhp: 60_000,
    quote: { at: hoursAgo(30), message: "Hi Hazel! Congratulations! Sirao is perfect for golden hour. Here's our package po." },
    readByPlanner: false,
  });
  await conversation({
    event: wedding,
    vendor: bulak,
    services: [{ index: 3 }, { index: 4 }],
    notes: "Sage green and ivory motif for the church and reception. Can you do a floral arch at the altar?",
    requestedAt: hoursAgo(28),
    status: "quoted",
    budgetPhp: 70_000,
    chatter: [{ at: hoursAgo(27), role: "vendor", text: "Yes po! We can do an altar arch with eucalyptus and white roses that week." }],
    quote: { at: hoursAgo(5), message: "Here's the quote for the church and reception styling, plus the bouquet and entourage flowers." },
    readByPlanner: false,
  });
  for (const name of ["Bulak Florals Cebu", "Kusina Sugbo Catering", "Host Migs"]) {
    await db.insert(t.follows).values({ profileId: people.hazel.id, vendorId: V(name).id });
  }

  // Inday, the demo vendor: requests waiting, a quote out, a confirmed booking.
  const inday = V("Lechon ni Inday");
  const paoloEvent = await createEvent({
    plannerId: people.paolo.id,
    title: "Baby Lucas' Christening",
    eventType: "christening",
    date: addDays(today, 133),
    area: "mandaue",
    venueText: "Subangdaku, Mandaue",
    pax: 50,
    budgetPhp: 60_000,
    doneTasks: 2,
  });
  await conversation({
    event: paoloEvent,
    vendor: inday,
    services: [{ index: 0, qty: 1 }],
    notes: "One regular lechon for the binyag lunch, deliver by 11am please.",
    timeText: "Deliver by 11 am",
    budgetPhp: 9_000,
    deliveryArea: "mandaue",
    requestedAt: minutesAgo(95),
    status: "requested",
    readByVendor: false,
  });
  const jenEvent = await createEvent({
    plannerId: people.jen.id,
    title: "Barangay Pusok Fiesta",
    eventType: "fiesta",
    date: addDays(today, 147),
    area: "lapu-lapu",
    venueText: "Pusok, Lapu-Lapu",
    pax: 200,
    budgetPhp: 120_000,
  });
  await conversation({
    event: jenEvent,
    vendor: inday,
    services: [{ index: 0, qty: 3 }, { index: 1, qty: 1 }],
    notes: "4 lechon for our fiesta! 3 regular, 1 spicy. Can you include a chopper?",
    timeText: "Deliver by 10 am",
    budgetPhp: 40_000,
    deliveryArea: "lapu-lapu",
    requestedAt: hoursAgo(6),
    status: "requested",
    readByVendor: false,
  });
  const carlaEvent = await createEvent({
    plannerId: people.carla.id,
    title: "Lola Pining's 80th Birthday",
    eventType: "birthday",
    date: addDays(today, 40),
    area: "cebu-city",
    venueText: "Guadalupe, Cebu City",
    pax: 90,
    budgetPhp: 80_000,
  });
  await conversation({
    event: carlaEvent,
    vendor: inday,
    services: [{ index: 0, qty: 2 }],
    notes: "2 lechon for Lola's 80th. Please make one less salty for the seniors.",
    budgetPhp: 18_000,
    deliveryArea: "cebu-city",
    requestedAt: hoursAgo(48),
    status: "quoted",
    quote: {
      at: hoursAgo(44),
      items: [
        { label: "Whole lechon (regular)", qty: 1, unitPricePhp: 8500 },
        { label: "Whole lechon (regular, less salt)", qty: 1, unitPricePhp: 8500 },
        { label: "Delivery – Cebu City", qty: 1, unitPricePhp: 0 },
      ],
      message: "Happy 80th to Lola Pining! We'll go easy on the salt for one.",
    },
  });
  const markEvent = await createEvent({
    plannerId: people.mark.id,
    title: "Mark & Aileen Wedding",
    eventType: "wedding",
    date: addDays(today, 26),
    area: "talisay",
    venueText: "Balay Kahoy Pavilion, Talisay",
    pax: 150,
    budgetPhp: 450_000,
    doneTasks: 7,
  });
  await conversation({
    event: markEvent,
    vendor: inday,
    services: [{ index: 0, qty: 2 }, { index: 1, qty: 1 }, { index: 3, qty: 1 }],
    notes: "3 lechon for the reception plus a chopper.",
    budgetPhp: 30_000,
    deliveryArea: "talisay",
    requestedAt: hoursAgo(24 * 9),
    status: "confirmed",
    quote: { at: hoursAgo(24 * 8.8), message: "Congrats Mark & Aileen! See you in Talisay." },
    paidAt: hoursAgo(24 * 8),
    chatter: [{ at: hoursAgo(24 * 7.9), role: "planner", text: "Paid na! Salamat kaayo, Inday." }],
  });

  return {
    areas: areaRows.length,
    categories: catRows.length,
    vendors: vendorRows.length,
    services: serviceRows.length,
    posts: postRows.length,
    media: mediaRows.length,
    reviews: reviewRows.length,
    packages: PACKAGES.length,
    packageItems: packageItemCount,
  };
}
