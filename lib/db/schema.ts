// Mirrors supabase/migrations/*.sql, which is the source of truth for the database.
import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  serial,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { RequestedService, Unit } from "@/lib/domain/types";
import type { BookingStatus } from "@/lib/domain/status";

export type { BookingStatus };
export type ServiceUnit = Unit;

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  role: text("role").$type<"planner" | "vendor" | "admin">(),
  displayName: text("display_name").notNull().default(""),
  email: text("email").unique(),
  avatarUrl: text("avatar_url"),
  phone: text("phone"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const authTokens = pgTable("auth_tokens", {
  tokenHash: text("token_hash").primaryKey(),
  email: text("email").notNull(),
  expiresAt: ts("expires_at").notNull(),
  usedAt: ts("used_at"),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const areas = pgTable("areas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  sort: integer("sort").notNull().default(0),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  icon: text("icon").notNull(),
  sort: integer("sort").notNull().default(0),
});

export type ChecklistTemplateItem = { title: string; dueOffsetDays: number | null };

export const eventTypes = pgTable("event_types", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  sort: integer("sort").notNull().default(0),
  slotCategories: text("slot_categories").array().notNull().default([]),
  checklistTemplate: jsonb("checklist_template").$type<ChecklistTemplateItem[]>().notNull().default([]),
});

export const vendors = pgTable("vendors", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id"),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  categoryId: integer("category_id").notNull(),
  tagline: text("tagline").notNull().default(""),
  bio: text("bio").notNull().default(""),
  baseAreaId: integer("base_area_id").notNull(),
  fbUrl: text("fb_url"),
  igUrl: text("ig_url"),
  priceBand: smallint("price_band").notNull().default(2),
  startingPricePhp: integer("starting_price_php").notNull().default(0),
  ratingAvg: real("rating_avg").notNull().default(0),
  ratingCount: integer("rating_count").notNull().default(0),
  profileViews: integer("profile_views").notNull().default(0),
  isCurated: boolean("is_curated").notNull().default(false),
  isDemo: boolean("is_demo").notNull().default(false),
  autoRespond: boolean("auto_respond").notNull().default(false),
  coverUrl: text("cover_url"),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const vendorAreas = pgTable(
  "vendor_areas",
  {
    vendorId: uuid("vendor_id").notNull(),
    areaId: integer("area_id").notNull(),
  },
  (t) => [primaryKey({ columns: [t.vendorId, t.areaId] })],
);

export const vendorBlockedDates = pgTable(
  "vendor_blocked_dates",
  {
    vendorId: uuid("vendor_id").notNull(),
    date: date("date").notNull(),
    reason: text("reason"),
  },
  (t) => [primaryKey({ columns: [t.vendorId, t.date] })],
);

export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  pricePhp: integer("price_php").notNull(),
  unit: text("unit").$type<ServiceUnit>().notNull(),
  minQty: integer("min_qty"),
  maxQty: integer("max_qty"),
  sort: integer("sort").notNull().default(0),
});

export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerType: text("owner_type").$type<"vendor" | "post" | "message">().notNull(),
  ownerId: uuid("owner_id").notNull(),
  url: text("url").notNull(),
  width: integer("width"),
  height: integer("height"),
  sort: integer("sort").notNull().default(0),
});

export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").notNull(),
  caption: text("caption").notNull().default(""),
  areaId: integer("area_id"),
  linkedServiceId: uuid("linked_service_id"),
  seedLikes: integer("seed_likes").notNull().default(0),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const postTags = pgTable(
  "post_tags",
  {
    postId: uuid("post_id").notNull(),
    eventType: text("event_type").notNull(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.eventType] })],
);

export const likes = pgTable(
  "likes",
  {
    profileId: uuid("profile_id").notNull(),
    postId: uuid("post_id").notNull(),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.profileId, t.postId] })],
);

export const saves = pgTable(
  "saves",
  {
    profileId: uuid("profile_id").notNull(),
    postId: uuid("post_id").notNull(),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.profileId, t.postId] })],
);

export const follows = pgTable(
  "follows",
  {
    profileId: uuid("profile_id").notNull(),
    vendorId: uuid("vendor_id").notNull(),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.profileId, t.vendorId] })],
);

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").notNull(),
  authorName: text("author_name").notNull(),
  rating: smallint("rating").notNull(),
  body: text("body").notNull(),
  eventType: text("event_type"),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  plannerId: uuid("planner_id").notNull(),
  title: text("title").notNull(),
  eventType: text("event_type").notNull(),
  date: date("date").notNull(),
  areaId: integer("area_id").notNull(),
  venueText: text("venue_text"),
  pax: integer("pax").notNull(),
  budgetPhp: integer("budget_php").notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const eventTasks = pgTable("event_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull(),
  title: text("title").notNull(),
  dueOffsetDays: integer("due_offset_days"),
  done: boolean("done").notNull().default(false),
  sort: integer("sort").notNull().default(0),
});

export const packages = pgTable("packages", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  tagline: text("tagline").notNull().default(""),
  eventType: text("event_type").notNull(),
  areaId: integer("area_id"),
  paxMin: integer("pax_min").notNull(),
  paxMax: integer("pax_max").notNull(),
  description: text("description").notNull().default(""),
  coverUrl: text("cover_url"),
  isPublished: boolean("is_published").notNull().default(true),
  sort: integer("sort").notNull().default(0),
});

export const packageItems = pgTable(
  "package_items",
  {
    packageId: uuid("package_id").notNull(),
    serviceId: uuid("service_id").notNull(),
    qtyRule: text("qty_rule").$type<"per_pax" | "fixed">().notNull(),
    qty: integer("qty").notNull().default(1),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.packageId, t.serviceId] })],
);

export const bookingRequests = pgTable("booking_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull(),
  vendorId: uuid("vendor_id").notNull(),
  packageId: uuid("package_id"),
  status: text("status").$type<BookingStatus>().notNull(),
  requestedServices: jsonb("requested_services").$type<RequestedService[]>().notNull().default([]),
  date: date("date").notNull(),
  timeText: text("time_text"),
  pax: integer("pax").notNull(),
  budgetPhp: integer("budget_php"),
  deliveryAreaId: integer("delivery_area_id"),
  venueText: text("venue_text"),
  notes: text("notes"),
  autoReplyAt: ts("auto_reply_at"),
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
});

export type QuoteStatus = "sent" | "accepted" | "declined" | "expired" | "superseded";

export const quotes = pgTable("quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingRequestId: uuid("booking_request_id").notNull(),
  totalPhp: integer("total_php").notNull(),
  currency: text("currency").notNull().default("PHP"),
  depositPct: integer("deposit_pct").notNull(),
  validUntil: date("valid_until").notNull(),
  message: text("message"),
  status: text("status").$type<QuoteStatus>().notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const quoteItems = pgTable("quote_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  quoteId: uuid("quote_id").notNull(),
  label: text("label").notNull(),
  qty: integer("qty").notNull(),
  unitPricePhp: integer("unit_price_php").notNull(),
  sort: integer("sort").notNull().default(0),
});

export const mockPayments = pgTable("mock_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  quoteId: uuid("quote_id").notNull(),
  method: text("method").$type<"gcash" | "card">().notNull(),
  amountPhp: integer("amount_php").notNull(),
  status: text("status").$type<"pending" | "succeeded" | "failed">().notNull(),
  reference: text("reference").notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const threads = pgTable("threads", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull(),
  vendorId: uuid("vendor_id").notNull(),
  plannerId: uuid("planner_id").notNull(),
  lastMessageAt: ts("last_message_at").notNull().defaultNow(),
});

export type MessageKind = "text" | "image" | "quote" | "request" | "system";
export type SenderRole = "planner" | "vendor" | "system";

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  threadId: uuid("thread_id").notNull(),
  senderId: uuid("sender_id"),
  senderRole: text("sender_role").$type<SenderRole>().notNull(),
  kind: text("kind").$type<MessageKind>().notNull(),
  body: text("body").notNull().default(""),
  quoteId: uuid("quote_id"),
  bookingRequestId: uuid("booking_request_id"),
  imageUrl: text("image_url"),
  createdAt: ts("created_at").notNull().defaultNow(),
  readAt: ts("read_at"),
});
