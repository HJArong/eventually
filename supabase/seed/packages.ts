import type { AreaSlug } from "./catalog";

export type PackageSeed = {
  title: string;
  tagline: string;
  eventType: string;
  area: AreaSlug | null;
  paxMin: number;
  paxMax: number;
  description: string;
  cover: string;
  /** vendor name + service index (0 = first service) */
  items: { vendor: string; service?: number; qtyRule: "per_pax" | "fixed"; qty?: number }[];
};

export const PACKAGES: PackageSeed[] = [
  {
    title: "Cebu City Wedding Essentials",
    tagline: "The reception, sorted: hall, buffet, sound and a host",
    eventType: "wedding",
    area: "cebu-city",
    paxMin: 100,
    paxMax: 150,
    description:
      "A complete reception in the city: an air-conditioned Lahug hall, a buffet for your guests, lights & sounds with an LED wall, and a bilingual host who runs the program with your coordinator.",
    cover: "/seed/venue-hall.webp",
    items: [
      { vendor: "Casa Mahogany Events Hall", qtyRule: "fixed" },
      { vendor: "Kusina Sugbo Catering", qtyRule: "per_pax" },
      { vendor: "Sugbo Lights & Sounds", qtyRule: "fixed" },
      { vendor: "Host Migs", service: 1, qtyRule: "fixed" },
    ],
  },
  {
    title: "Debut Starter",
    tagline: "Everything for a classic 18th, minus the stress",
    eventType: "debut",
    area: "cebu-city",
    paxMin: 100,
    paxMax: 150,
    description:
      "Our most-booked debut bundle: a Lahug hall, a crowd-pleasing buffet, lights & sounds with an LED wall, and a host who knows the 18 roses flow by heart.",
    cover: "/seed/venue-hall.webp",
    items: [
      { vendor: "Casa Mahogany Events Hall", qtyRule: "fixed" },
      { vendor: "Kusina Sugbo Catering", qtyRule: "per_pax" },
      { vendor: "Sugbo Lights & Sounds", qtyRule: "fixed" },
      { vendor: "Host Migs", qtyRule: "fixed" },
    ],
  },
  {
    title: "Garden Debut, Busay",
    tagline: "City lights, fairy lights, and a flower wall",
    eventType: "debut",
    area: "cebu-city",
    paxMin: 80,
    paxMax: 150,
    description: "An open-air debut up in Busay with a styled 18 roses backdrop and full photo coverage.",
    cover: "/seed/venue-garden.webp",
    items: [
      { vendor: "Busay Hilltop Gardens", qtyRule: "fixed" },
      { vendor: "Kusina Sugbo Catering", service: 1, qtyRule: "per_pax" },
      { vendor: "Bulak Florals Cebu", qtyRule: "fixed" },
      { vendor: "Emcee Joanne", qtyRule: "fixed" },
      { vendor: "Kaha Studios", qtyRule: "fixed" },
    ],
  },
  {
    title: "Glam Debut Night",
    tagline: "Hotel ballroom energy in Mandaue",
    eventType: "debut",
    area: "mandaue",
    paxMin: 150,
    paxMax: 250,
    description: "For the big 18th: function rooms, premium buffet, LED wall, full styling and same-day edit video.",
    cover: "/seed/styling-debut.webp",
    items: [
      { vendor: "Mandaue Grand Function Rooms", qtyRule: "fixed" },
      { vendor: "Lami Kaayo Catering", service: 1, qtyRule: "per_pax" },
      { vendor: "Dagitab Sound & Lights", service: 1, qtyRule: "fixed" },
      { vendor: "Rosas ug Lace Events", service: 1, qtyRule: "fixed" },
      { vendor: "Sinaw Films", service: 1, qtyRule: "fixed" },
    ],
  },
  {
    title: "Mactan Beach Wedding",
    tagline: "Say I do with your toes in the sand",
    eventType: "wedding",
    area: "lapu-lapu",
    paxMin: 80,
    paxMax: 150,
    description: "Sunset ceremony and reception on the beach, tropical styling, cocktails and a full photo + video team.",
    cover: "/seed/venue-beach.webp",
    items: [
      { vendor: "Mactan Tide Beach Resort", qtyRule: "fixed" },
      { vendor: "Mactan Bay Kitchen", service: 1, qtyRule: "per_pax" },
      { vendor: "Uway Rattan Decor", service: 1, qtyRule: "fixed" },
      { vendor: "Golden Hour Cebu", service: 1, qtyRule: "fixed" },
      { vendor: "Isla Spritz Bar", qtyRule: "fixed" },
    ],
  },
  {
    title: "Intimate Garden Wedding",
    tagline: "Small guest list, big feelings",
    eventType: "wedding",
    area: "talisay",
    paxMin: 50,
    paxMax: 100,
    description: "A pavilion wedding in Talisay with home-style catering, florals, a host and photos.",
    cover: "/seed/styling-wedding.webp",
    items: [
      { vendor: "Balay Kahoy Pavilion", qtyRule: "fixed" },
      { vendor: "Tita Nening's Kitchen", qtyRule: "per_pax" },
      { vendor: "Sampaguita Studio", qtyRule: "fixed" },
      { vendor: "Pitik Photo Co.", qtyRule: "fixed" },
    ],
  },
  {
    title: "Binyag Lunch",
    tagline: "After-church lunch for the ninongs and ninangs",
    eventType: "christening",
    area: "mandaue",
    paxMin: 40,
    paxMax: 80,
    description: "A relaxed christening lunch: function room, buffet, a whole lechon, cake and soft blue styling.",
    cover: "/seed/styling-christening.webp",
    items: [
      { vendor: "Mandaue Grand Function Rooms", qtyRule: "fixed" },
      { vendor: "Mandaue Handaan Catering", qtyRule: "per_pax" },
      { vendor: "Sugbo Belly Co.", qtyRule: "fixed", qty: 1 },
      { vendor: "Mamang's Cake House", service: 1, qtyRule: "fixed", qty: 1 },
      { vendor: "Tiny Fiesta Kids Styling", service: 3, qtyRule: "fixed" },
    ],
  },
  {
    title: "Kids Party Fun Pack",
    tagline: "Games, cake, balloons and a photo booth",
    eventType: "kids_party",
    area: "cebu-city",
    paxMin: 30,
    paxMax: 80,
    description: "Bright styling, a host with games, a themed cake and unlimited photo booth prints.",
    cover: "/seed/styling-kids.webp",
    items: [
      { vendor: "Bisaya Feast Co.", qtyRule: "per_pax" },
      { vendor: "Hiyas Event Styling", service: 3, qtyRule: "fixed" },
      { vendor: "Emcee Joanne", service: 1, qtyRule: "fixed" },
      { vendor: "Tam-is Cake Studio", service: 1, qtyRule: "fixed", qty: 1 },
      { vendor: "Pose Mo Photo Booth", qtyRule: "fixed" },
    ],
  },
  {
    title: "Barangay Fiesta Feast",
    tagline: "Lechon for the whole street",
    eventType: "fiesta",
    area: "talisay",
    paxMin: 150,
    paxMax: 300,
    description: "Four whole lechons, a buffet, lights & sounds for the evening disco and a host for the games.",
    cover: "/seed/fiesta.webp",
    items: [
      { vendor: "Talisay Lechon House", qtyRule: "fixed", qty: 4 },
      { vendor: "Talisay Table Co.", qtyRule: "per_pax" },
      { vendor: "Talisay Groove L&S", qtyRule: "fixed" },
      { vendor: "MC Kiko Bisaya", qtyRule: "fixed" },
    ],
  },
  {
    title: "Office Year-End Party",
    tagline: "Awards, raffles and a dance floor",
    eventType: "corporate",
    area: "cebu-city",
    paxMin: 80,
    paxMax: 200,
    description: "A city function hall, premium buffet, LED wall, a corporate emcee and a photo booth.",
    cover: "/seed/venue-function.webp",
    items: [
      { vendor: "Lantaw Skyline Hall", qtyRule: "fixed" },
      { vendor: "Kan-on ug Sud-an", service: 1, qtyRule: "per_pax" },
      { vendor: "Sugbo Lights & Sounds", qtyRule: "fixed" },
      { vendor: "Host Rafa Dizon", service: 3, qtyRule: "fixed" },
      { vendor: "Click Sugbo Booth", qtyRule: "fixed" },
    ],
  },
  {
    title: "60th Birthday Salo-salo",
    tagline: "A proper handaan for Lola and Lolo",
    eventType: "birthday",
    area: null,
    paxMin: 60,
    paxMax: 120,
    description: "Catering, two lechons, a cake and a host to run the family program, anywhere in Metro Cebu.",
    cover: "/seed/catering-spread.webp",
    items: [
      { vendor: "Sugbo Salu-salo Caterers", qtyRule: "per_pax" },
      { vendor: "Lechon ni Inday", qtyRule: "fixed", qty: 2 },
      { vendor: "Panaderya Fina", service: 1, qtyRule: "fixed", qty: 1 },
      { vendor: "Host Danica", qtyRule: "fixed" },
    ],
  },
];
