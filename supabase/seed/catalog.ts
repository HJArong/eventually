import type { ChecklistTemplateItem } from "@/lib/domain/checklist";

export const AREAS = [
  { slug: "cebu-city", name: "Cebu City" },
  { slug: "mandaue", name: "Mandaue" },
  { slug: "lapu-lapu", name: "Lapu-Lapu/Mactan" },
  { slug: "talisay", name: "Talisay" },
  { slug: "consolacion", name: "Consolacion" },
] as const;

export type AreaSlug = (typeof AREAS)[number]["slug"];

export const CATEGORIES = [
  { slug: "venue", name: "Venues", icon: "building-2" },
  { slug: "catering", name: "Catering", icon: "utensils" },
  { slug: "lechon", name: "Lechon", icon: "flame" },
  { slug: "lights-sounds", name: "Lights & Sounds", icon: "speaker" },
  { slug: "host", name: "Host / Emcee", icon: "mic" },
  { slug: "photo-video", name: "Photo & Video", icon: "camera" },
  { slug: "styling", name: "Styling", icon: "flower-2" },
  { slug: "cakes", name: "Cakes", icon: "cake" },
  { slug: "mobile-bar", name: "Mobile bar", icon: "martini" },
  { slug: "photo-booth", name: "Photo booth", icon: "aperture" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

type EventTypeSeed = {
  slug: string;
  name: string;
  slots: CategorySlug[];
  checklist: ChecklistTemplateItem[];
};

export const EVENT_TYPES: EventTypeSeed[] = [
  {
    slug: "debut",
    name: "Debut",
    slots: ["venue", "catering", "lechon", "lights-sounds", "host", "styling"],
    checklist: [
      { title: "Pick date & venue", dueOffsetDays: 150 },
      { title: "Set budget", dueOffsetDays: 150 },
      { title: "Choose theme & color motif", dueOffsetDays: 120 },
      { title: "Book photo & video team", dueOffsetDays: 100 },
      { title: "Schedule pre-debut shoot", dueOffsetDays: 75 },
      { title: "Finalize 18 roses & 18 candles list", dueOffsetDays: 60 },
      { title: "Send invitations", dueOffsetDays: 45 },
      { title: "Final gown fitting", dueOffsetDays: 21 },
      { title: "Confirm final pax with caterer", dueOffsetDays: 14 },
      { title: "Rehearse the cotillion", dueOffsetDays: 7 },
    ],
  },
  {
    slug: "wedding",
    name: "Wedding",
    slots: ["venue", "catering", "photo-video", "styling", "lights-sounds", "host", "cakes"],
    checklist: [
      { title: "Book church & reception venue", dueOffsetDays: 300 },
      { title: "Set budget with families", dueOffsetDays: 300 },
      { title: "Book photo & video team", dueOffsetDays: 240 },
      { title: "Food tasting with caterer", dueOffsetDays: 120 },
      { title: "Prenup shoot", dueOffsetDays: 90 },
      { title: "Finalize entourage & sponsors", dueOffsetDays: 90 },
      { title: "Send invitations", dueOffsetDays: 60 },
      { title: "Get marriage license", dueOffsetDays: 30 },
      { title: "Confirm final pax with caterer", dueOffsetDays: 14 },
      { title: "Prepare wedding coins, veil & cord", dueOffsetDays: 7 },
    ],
  },
  {
    slug: "christening",
    name: "Christening",
    slots: ["venue", "catering", "lechon", "cakes", "styling"],
    checklist: [
      { title: "Schedule baptism with the parish", dueOffsetDays: 60 },
      { title: "Choose ninongs & ninangs", dueOffsetDays: 45 },
      { title: "Book reception venue", dueOffsetDays: 40 },
      { title: "Order cake & giveaways", dueOffsetDays: 21 },
      { title: "Attend pre-baptism seminar", dueOffsetDays: 14 },
      { title: "Confirm final pax", dueOffsetDays: 7 },
    ],
  },
  {
    slug: "kids_party",
    name: "Kids party",
    slots: ["venue", "catering", "styling", "cakes", "photo-booth", "host"],
    checklist: [
      { title: "Pick a theme with the birthday kid", dueOffsetDays: 60 },
      { title: "Book venue", dueOffsetDays: 45 },
      { title: "Book host & games", dueOffsetDays: 30 },
      { title: "Order themed cake & cupcakes", dueOffsetDays: 21 },
      { title: "Prepare loot bags", dueOffsetDays: 7 },
      { title: "Confirm final pax", dueOffsetDays: 5 },
    ],
  },
  {
    slug: "birthday",
    name: "Birthday",
    slots: ["venue", "catering", "lechon", "cakes", "lights-sounds"],
    checklist: [
      { title: "Pick date & venue", dueOffsetDays: 60 },
      { title: "Set budget", dueOffsetDays: 60 },
      { title: "Book catering", dueOffsetDays: 40 },
      { title: "Order cake", dueOffsetDays: 14 },
      { title: "Send invites", dueOffsetDays: 21 },
      { title: "Confirm final pax", dueOffsetDays: 5 },
    ],
  },
  {
    slug: "fiesta",
    name: "Fiesta",
    slots: ["catering", "lechon", "lights-sounds", "host"],
    checklist: [
      { title: "Coordinate with the barangay hall", dueOffsetDays: 60 },
      { title: "Reserve tents, tables & chairs", dueOffsetDays: 45 },
      { title: "Order lechon", dueOffsetDays: 21 },
      { title: "Book band or lights & sounds", dueOffsetDays: 30 },
      { title: "Plan the program & games", dueOffsetDays: 14 },
    ],
  },
  {
    slug: "corporate",
    name: "Corporate",
    slots: ["venue", "catering", "lights-sounds", "host", "photo-booth"],
    checklist: [
      { title: "Get budget approval", dueOffsetDays: 90 },
      { title: "Book venue", dueOffsetDays: 75 },
      { title: "Plan program & awards", dueOffsetDays: 30 },
      { title: "Book host & lights & sounds", dueOffsetDays: 45 },
      { title: "Send calendar invites", dueOffsetDays: 30 },
      { title: "Confirm headcount", dueOffsetDays: 7 },
    ],
  },
];
