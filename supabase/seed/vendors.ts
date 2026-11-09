import type { Unit } from "@/lib/domain/types";
import type { AreaSlug, CategorySlug } from "./catalog";

export type ServiceTemplate = {
  name: string;
  description: string;
  unit: Unit;
  price: [number, number];
  minQty?: number;
  maxQty?: number;
};

export type VendorSeed = {
  name: string;
  area: AreaSlug;
  tagline?: string;
  curated?: boolean;
  /** Exact services, used by packages and the demo script. Otherwise picked from the category templates. */
  services?: { name: string; description: string; unit: Unit; price: number; minQty?: number; maxQty?: number }[];
  /** Unavailable on the demo event date, to show the availability filter working. */
  blockedOnHeroDate?: boolean;
};

const s = (name: string, description: string, unit: Unit, price: number, minQty?: number, maxQty?: number) => ({
  name,
  description,
  unit,
  price,
  minQty,
  maxQty,
});

export const SERVICE_TEMPLATES: Record<CategorySlug, ServiceTemplate[]> = {
  venue: [
    { name: "Venue rental – 5 hrs", description: "Air-conditioned hall, tables & chairs, holding room, parking.", unit: "flat", price: [32000, 65000] },
    { name: "Tables, chairs & linens upgrade", description: "Tiffany chairs, round tables, premium linens.", unit: "per_pax", price: [60, 120], minQty: 50 },
    { name: "Extra hour", description: "Extend your event past 5 hours.", unit: "per_hour", price: [3000, 6000], maxQty: 4 },
  ],
  catering: [
    { name: "Buffet, 5 viands", description: "Rice, 5 viands, dessert, drinks, waiters and buffet styling.", unit: "per_pax", price: [380, 520], minQty: 50 },
    { name: "Premium buffet, 7 viands + dessert", description: "Carving station, 7 viands, 2 desserts, bottomless iced tea.", unit: "per_pax", price: [620, 850], minQty: 80 },
    { name: "Grazing table", description: "Local cheeses, kakanin, fruits and breads for ~80 guests.", unit: "flat", price: [12000, 22000] },
    { name: "Kakanin & dessert station", description: "Puto, kutsinta, budbod, leche flan and mango float.", unit: "flat", price: [6000, 10000] },
  ],
  lechon: [
    { name: "Whole lechon (regular)", description: "Classic Cebu lechon, 18–22 kg, good for 40–60 guests.", unit: "per_item", price: [7500, 9000], maxQty: 10 },
    { name: "Whole lechon (spicy)", description: "Stuffed with lemongrass, chili and garlic.", unit: "per_item", price: [8500, 10000], maxQty: 10 },
    { name: "Lechon belly roll", description: "Boneless belly, 3 kg, good for 15–20 guests.", unit: "per_item", price: [3000, 4500], maxQty: 10 },
    { name: "Chopping staff", description: "One chopper on site for 3 hours.", unit: "flat", price: [800, 1200] },
  ],
  "lights-sounds": [
    { name: "Basic lights & sounds", description: "2 speakers, mixer, 2 wireless mics, 8 par lights. Good for 150 pax.", unit: "flat", price: [10000, 16000] },
    { name: "Basic L&S + LED wall", description: "Everything in basic plus an 8×12 ft LED wall and technician.", unit: "flat", price: [17000, 28000] },
    { name: "DJ set – 4 hrs", description: "Party DJ with your playlist plus crowd favorites.", unit: "flat", price: [6000, 10000] },
    { name: "Moving heads & haze", description: "4 moving heads plus haze machine for the dance floor.", unit: "flat", price: [5000, 8000] },
  ],
  host: [
    { name: "Debut program, 18 roses/candles", description: "Full program flow, cotillion cueing, 18 roses and candles.", unit: "flat", price: [6000, 12000] },
    { name: "Wedding reception host", description: "Bilingual host, games, program flow with your coordinator.", unit: "flat", price: [8000, 15000] },
    { name: "Kids party host + games", description: "2 hours of games, prizes not included.", unit: "flat", price: [4000, 7000] },
    { name: "Corporate emcee", description: "Awards night or year-end party, English/Bisaya.", unit: "flat", price: [8000, 14000] },
  ],
  "photo-video": [
    { name: "Photo coverage – 6 hrs", description: "2 photographers, 400+ edited photos, online gallery.", unit: "flat", price: [15000, 25000] },
    { name: "Photo + video with same-day edit", description: "Full team, SDE shown at the reception, highlights film.", unit: "flat", price: [35000, 60000] },
    { name: "Pre-event shoot", description: "2-hour shoot at a Cebu location of your choice.", unit: "flat", price: [8000, 15000] },
  ],
  styling: [
    { name: "Backdrop & stage styling", description: "Themed backdrop, stage, entrance arch and cake table.", unit: "flat", price: [15000, 35000] },
    { name: "Full venue styling", description: "Backdrop, centerpieces, ceiling treatment and entrance.", unit: "flat", price: [32000, 70000] },
    { name: "18 roses & candles set", description: "18 long-stem roses and 18 candle holders, styled.", unit: "flat", price: [4000, 7000] },
    { name: "Balloon garland", description: "Organic balloon garland, up to 3 colors.", unit: "flat", price: [3000, 6000] },
  ],
  cakes: [
    { name: "3-tier celebration cake", description: "Fondant or buttercream, fresh flowers, serves 120.", unit: "per_item", price: [6000, 12000], maxQty: 3 },
    { name: "2-tier cake", description: "Serves 60, choice of ube, chocolate or mango.", unit: "per_item", price: [3000, 6000], maxQty: 3 },
    { name: "Cupcake tower (50 pcs)", description: "Themed toppers included.", unit: "per_item", price: [2500, 4000], maxQty: 6 },
  ],
  "mobile-bar": [
    { name: "Mobile bar – 4 hrs, 150 cups", description: "2 mixologists, 4 cocktails, 2 mocktails, glassware.", unit: "flat", price: [15000, 25000] },
    { name: "Mocktail station", description: "Calamansi, mango and tablea drinks for kids and titas.", unit: "flat", price: [8000, 12000] },
    { name: "Extra hour", description: "Keep the bar open longer.", unit: "per_hour", price: [2500, 4000], maxQty: 3 },
  ],
  "photo-booth": [
    { name: "Unlimited photo booth – 3 hrs", description: "Unlimited 4R prints, custom layout, props, attendant.", unit: "flat", price: [6000, 10000] },
    { name: "360° video booth – 2 hrs", description: "Slow-mo 360 videos sent via QR.", unit: "flat", price: [9000, 14000] },
    { name: "Extra hour", description: "Extend the booth.", unit: "per_hour", price: [2000, 3000], maxQty: 3 },
  ],
};

export const CATEGORY_IMAGES: Record<CategorySlug, string[]> = {
  venue: ["venue-hall", "venue-garden", "venue-beach", "venue-function"],
  catering: ["catering-buffet", "catering-spread", "catering-grazing"],
  lechon: ["lechon-whole", "lechon-chopped"],
  "lights-sounds": ["lights-stage", "lights-dj", "lights-uplight"],
  host: ["host-stage", "lights-uplight", "styling-debut"],
  "photo-video": ["photo-camera", "photo-video", "styling-wedding", "venue-garden"],
  styling: ["styling-debut", "styling-roses", "styling-christening", "styling-wedding", "styling-kids"],
  cakes: ["cake-debut", "cake-kids"],
  "mobile-bar": ["mobile-bar"],
  "photo-booth": ["photobooth"],
};

export const CATEGORY_EVENT_TAGS: Record<CategorySlug, string[]> = {
  venue: ["debut", "wedding", "corporate", "christening"],
  catering: ["debut", "wedding", "christening", "fiesta", "birthday"],
  lechon: ["fiesta", "birthday", "christening", "debut"],
  "lights-sounds": ["debut", "corporate", "wedding", "fiesta"],
  host: ["debut", "wedding", "kids_party", "corporate"],
  "photo-video": ["wedding", "debut", "christening"],
  styling: ["debut", "christening", "wedding", "kids_party"],
  cakes: ["debut", "kids_party", "christening", "birthday"],
  "mobile-bar": ["wedding", "corporate", "debut"],
  "photo-booth": ["kids_party", "debut", "corporate", "wedding"],
};

export const TAGLINES: Record<CategorySlug, string[]> = {
  venue: ["Your celebration, our hall", "Garden & hall for 50–300 pax", "Sunset views, zero stress", "A blank canvas for big nights"],
  catering: ["Lutong bahay, pang-handaan", "Buffets that make titas happy", "Filipino favorites for 50–500 pax"],
  lechon: ["Crispy skin, guaranteed", "Talisay-style since 1998", "Lechon that sells itself", "Order before 3pm, deliver tomorrow"],
  "lights-sounds": ["Make the dance floor glow", "Clear sound for every speech", "Lights, LED walls, DJs"],
  host: ["Programs that flow", "Keeps the crowd laughing", "Bisaya, English & Taglish"],
  "photo-video": ["Candid, warm, timeless", "Same-day edits that make lola cry", "Stories, not just photos"],
  styling: ["Backdrops worth the selfie", "Florals & balloon art", "Your theme, styled right"],
  cakes: ["Tiered cakes & dessert tables", "Ube, mango and everything sweet", "Cakes as pretty as they taste"],
  "mobile-bar": ["Cocktails on wheels", "Calamansi spritz, anyone?"],
  "photo-booth": ["Unlimited prints, unlimited fun", "Props, prints & 360 videos"],
};

export const BIOS: Record<CategorySlug, string[]> = {
  venue: [
    "{name} is a family-run events place in {area} with an air-conditioned hall, a garden for cocktails and ample parking. We host debuts, weddings and company parties every weekend.",
    "Tucked away in {area}, {name} has hosted hundreds of Cebuano celebrations. Bring your own caterer or pick from our partners.",
  ],
  catering: [
    "{name} has been cooking for Cebu families since 2009. We do buffets for 50 to 500 guests, with waiters and styling included.",
    "Home-style Filipino food for your handaan, from kare-kare to humba. Based in {area}, serving Metro Cebu.",
  ],
  lechon: [
    "{name} roasts every lechon over charcoal the old Cebu way. No sauce needed. Delivery all over Metro Cebu.",
    "From backyard roasts to fiesta orders of 20 lechons, {name} keeps the skin crispy and the meat juicy.",
  ],
  "lights-sounds": [
    "{name} brings pro audio, intelligent lights and LED walls to debuts, weddings and corporate nights in Metro Cebu.",
    "A small, reliable crew from {area}. We set up early, test everything, and stay until the last song.",
  ],
  host: [
    "{name} has hosted 300+ debuts and weddings around Cebu. Programs that flow and games that actually get people laughing.",
    "Bilingual host from {area}. I coordinate with your planner so the night runs on time.",
  ],
  "photo-video": [
    "{name} is a Cebu-based team of photographers and filmmakers who love candid moments and warm colors.",
    "We document debuts, weddings and christenings across Metro Cebu. Same-day edits available.",
  ],
  styling: [
    "{name} designs backdrops, florals and balloon art that photograph beautifully. Based in {area}.",
    "From pastel debuts to rustic weddings, {name} styles your theme end to end.",
  ],
  cakes: [
    "{name} bakes tiered celebration cakes and dessert tables in {area}. Taste first, then we design together.",
    "Moist, not-too-sweet cakes with local flavors like ube, mango and tablea.",
  ],
  "mobile-bar": ["{name} serves craft cocktails and mocktails with local twists, from calamansi spritz to tablea martinis."],
  "photo-booth": ["{name} brings unlimited prints, fun props and 360° video booths to parties across Metro Cebu."],
};

export const CAPTIONS: Record<CategorySlug, string[]> = {
  venue: [
    "Hall all set for tonight's {event}! Swipe for the garden cocktail area.",
    "Golden hour at the garden. Still a few Saturdays open this season.",
    "Round tables, blush linens and a whole lot of chandelier.",
  ],
  catering: [
    "Buffet for 150 pax this weekend. Kare-kare, humba and our famous lumpia.",
    "Grazing table for a {event} in {area}. Kakanin corner was the first to go!",
    "Food tasting day! Book a slot for your wedding menu.",
  ],
  lechon: [
    "Fresh from the pit for a {event} in {area}. Listen to that crunch!",
    "4 lechons out for a barangay fiesta today. Daghang salamat sa order!",
    "Spicy lechon is back. Lemongrass, sili and garlic in every bite.",
  ],
  "lights-sounds": [
    "LED wall + moving heads for a {event} at {area}. The dance floor was full all night.",
    "Soundcheck done, two hours before doors open. That's how we do it.",
  ],
  host: [
    "18 roses done right. Salamat to the family for trusting me with Sofia's night!",
    "Games that make even the titos join in. Thank you, {area}!",
  ],
  "photo-video": [
    "Candid moments from a {event} last weekend.",
    "Same-day edit screening got everyone teary-eyed.",
    "Pre-event shoot at a secret spot in {area}.",
  ],
  styling: [
    "Pastel dreams for an 18th birthday debut. Balloon garland plus fresh roses.",
    "18 roses backdrop for a {event} in {area}.",
    "Clouds, doves and baby blue for a christening this Sunday.",
    "Rustic-meets-tropical for a garden wedding.",
  ],
  cakes: [
    "Three tiers of ube and white chocolate for a {event}.",
    "Rainbow sprinkles everywhere! Kids party cake for little Gabby.",
    "Debut cake with fresh roses and gold leaf.",
  ],
  "mobile-bar": ["Calamansi spritz and mango mojitos at a {event} in {area}.", "Our rattan bar cart is ready for wedding season."],
  "photo-booth": ["Prints flying for a {event} in {area}!", "Props, glitter wall and 300 prints later..."],
};

export const REVIEW_BODIES = [
  "Super responsive and on time. Our guests kept asking who we booked!",
  "Sulit kaayo for the price. Thank you so much, team!",
  "Everything was set up two hours early, so I had zero stress on the day.",
  "Very easy to talk to and flexible with our budget. Highly recommended.",
  "Lami kaayo! Will definitely book again for our next family event.",
  "They went above and beyond. Even helped our coordinator with the program.",
  "Quality is really good and they listened to every detail I asked for.",
  "Our relatives from Manila were impressed. Salamat kaayo!",
  "Professional from inquiry to cleanup. Five stars.",
  "A bit late at setup but the result was beautiful.",
];

export const REVIEWER_NAMES = [
  "Kristine A.", "Jomar P.", "Liza C.", "Ramon T.", "Pia G.", "Erwin S.", "Mae B.", "Dennis L.",
  "Joy V.", "Carlo R.", "Hazel O.", "Rey M.", "Trish D.", "Nikki Y.", "Arnel F.", "Clarisse U.",
];

/** About 70 fictional Cebu vendors. Names are invented; any resemblance to real businesses is unintended. */
export const VENDORS: Record<CategorySlug, VendorSeed[]> = {
  venue: [
    {
      name: "Casa Mahogany Events Hall",
      area: "cebu-city",
      curated: true,
      tagline: "Lahug's favorite debut hall",
      services: [
        s("Events hall – 5 hrs, up to 150 pax", "Air-conditioned hall in Lahug, tables & chairs, holding room, parking for 40 cars.", "flat", 45000),
        s("Garden cocktail area", "Add the garden for welcome drinks and photos.", "flat", 8000),
        s("Extra hour", "Extend past 5 hours.", "per_hour", 4000, 1, 4),
      ],
    },
    {
      name: "Busay Hilltop Gardens",
      area: "cebu-city",
      curated: true,
      tagline: "City lights from the mountains",
      services: [
        s("Garden venue – 5 hrs, up to 150 pax", "Open-air garden with string lights and a covered pavilion for rain.", "flat", 58000),
        s("Pavilion rain plan", "Clear tent over the garden, just in case.", "flat", 12000),
        s("Extra hour", "Extend past 5 hours.", "per_hour", 5000, 1, 3),
      ],
    },
    {
      name: "Mactan Tide Beach Resort",
      area: "lapu-lapu",
      curated: true,
      tagline: "Barefoot weddings by the sea",
      services: [
        s("Beachfront reception – 5 hrs", "Sunset reception on the sand, up to 150 pax, bridal suite included.", "flat", 85000),
        s("Ceremony setup on the beach", "Aisle, arch and 120 chairs on the shore.", "flat", 18000),
      ],
    },
    { name: "Balay Kahoy Pavilion", area: "talisay" },
    { name: "Mandaue Grand Function Rooms", area: "mandaue", curated: true },
    { name: "Consolacion Garden Court", area: "consolacion" },
    { name: "Lantaw Skyline Hall", area: "cebu-city" },
    { name: "Isla Azul Cove", area: "lapu-lapu" },
  ],
  catering: [
    {
      name: "Kusina Sugbo Catering",
      area: "cebu-city",
      curated: true,
      tagline: "Buffets that make titas happy",
      services: [
        s("Buffet, 5 viands", "Rice, 5 viands, dessert, iced tea, waiters and buffet styling.", "per_pax", 450, 50, 400),
        s("Premium buffet, 7 viands + dessert", "Carving station, 7 viands, 2 desserts, bottomless drinks.", "per_pax", 720, 80, 400),
        s("Kakanin & dessert station", "Puto, kutsinta, budbod, leche flan and mango float.", "flat", 8000),
      ],
    },
    { name: "Lami Kaayo Catering", area: "mandaue", curated: true },
    { name: "Tita Nening's Kitchen", area: "talisay" },
    { name: "Bisaya Feast Co.", area: "cebu-city" },
    { name: "Sugbo Salu-salo Caterers", area: "consolacion" },
    { name: "Mandaue Handaan Catering", area: "mandaue" },
    { name: "Talisay Table Co.", area: "talisay" },
    { name: "Kan-on ug Sud-an", area: "cebu-city" },
    { name: "Mactan Bay Kitchen", area: "lapu-lapu" },
  ],
  lechon: [
    {
      name: "Lechon ni Inday",
      area: "talisay",
      curated: true,
      tagline: "Talisay-style since 1998",
      services: [
        s("Whole lechon (regular)", "Classic Cebu lechon, 18–22 kg, good for 40–60 guests.", "per_item", 8500, 1, 10),
        s("Whole lechon (spicy)", "Stuffed with lemongrass, chili and garlic.", "per_item", 9500, 1, 10),
        s("Lechon belly roll", "Boneless belly, 3 kg, good for 15–20 guests.", "per_item", 3800, 1, 10),
        s("Chopping staff", "One chopper on site for 3 hours.", "flat", 1000),
      ],
    },
    { name: "Carbon Crispy Lechon", area: "cebu-city", blockedOnHeroDate: true },
    { name: "Talisay Lechon House", area: "talisay", curated: true },
    { name: "Sugbo Belly Co.", area: "mandaue" },
    { name: "Lechon Dako", area: "consolacion" },
    { name: "Tatay Berting's Lechon", area: "lapu-lapu" },
    { name: "Opon Roast House", area: "lapu-lapu" },
    { name: "Lechon Bisdak", area: "cebu-city" },
  ],
  "lights-sounds": [
    {
      name: "Sugbo Lights & Sounds",
      area: "cebu-city",
      curated: true,
      tagline: "Make the dance floor glow",
      services: [
        s("Basic L&S + LED wall", "2 speakers, mixer, 4 mics, 12 par lights, 8×12 ft LED wall, technician.", "flat", 18000),
        s("Basic lights & sounds", "2 speakers, mixer, 2 wireless mics, 8 par lights.", "flat", 12000),
        s("DJ set – 4 hrs", "Party DJ with your playlist plus crowd favorites.", "flat", 7500),
      ],
    },
    { name: "Kanta Pro Audio", area: "mandaue" },
    { name: "Dagitab Sound & Lights", area: "talisay", curated: true },
    { name: "Mandaue Beats Productions", area: "mandaue" },
    { name: "Isla Sound Systems", area: "lapu-lapu" },
    { name: "Talisay Groove L&S", area: "talisay" },
    { name: "Bright Night Events Tech", area: "consolacion" },
  ],
  host: [
    {
      name: "Host Migs",
      area: "cebu-city",
      curated: true,
      tagline: "300+ debuts and counting",
      services: [
        s("Debut program, 18 roses/candles", "Full program flow, cotillion cueing, 18 roses and candles.", "flat", 8000),
        s("Wedding reception host", "Bilingual host, games, program flow with your coordinator.", "flat", 12000),
      ],
    },
    {
      name: "Emcee Joanne",
      area: "mandaue",
      tagline: "Warm, witty, always on time",
      services: [
        s("Debut program, 18 roses/candles", "Program script, games and 18 roses/candles flow.", "flat", 9500),
        s("Kids party host + games", "2 hours of games and magic, prizes not included.", "flat", 5500),
      ],
    },
    { name: "Host Rafa Dizon", area: "cebu-city" },
    { name: "MC Kiko Bisaya", area: "talisay" },
    { name: "Host Trisha Lim", area: "lapu-lapu" },
    { name: "Emcee Bong & Co.", area: "consolacion" },
    { name: "Host Danica", area: "mandaue" },
  ],
  "photo-video": [
    { name: "Kaha Studios", area: "cebu-city", curated: true },
    { name: "Lente Cebu", area: "mandaue" },
    { name: "Sinaw Films", area: "cebu-city", curated: true },
    { name: "Pitik Photo Co.", area: "talisay" },
    { name: "Golden Hour Cebu", area: "lapu-lapu" },
    { name: "Mactan Memories Films", area: "lapu-lapu" },
    { name: "Hulagway Studio", area: "consolacion" },
    { name: "Snap Sugbo", area: "mandaue" },
  ],
  styling: [
    {
      name: "Bulak Florals Cebu",
      area: "mandaue",
      curated: true,
      tagline: "Backdrops worth the selfie",
      services: [
        s("18 roses debut backdrop", "Flower wall, balloon garland, marquee 18 and throne chair.", "flat", 22000),
        s("Full venue styling", "Backdrop, centerpieces, ceiling treatment and entrance.", "flat", 48000),
        s("18 roses & candles set", "18 long-stem roses and 18 candle holders, styled.", "flat", 5500),
      ],
    },
    { name: "Pastel Pabalo Styling", area: "cebu-city" },
    { name: "Rosas ug Lace Events", area: "talisay", curated: true },
    { name: "Hiyas Event Styling", area: "cebu-city" },
    { name: "Banderitas Party Styling", area: "consolacion" },
    { name: "Uway Rattan Decor", area: "lapu-lapu" },
    { name: "Tiny Fiesta Kids Styling", area: "mandaue" },
    { name: "Bloom & Bayanihan", area: "cebu-city" },
    { name: "Sampaguita Studio", area: "talisay" },
  ],
  cakes: [
    { name: "Tam-is Cake Studio", area: "cebu-city", curated: true },
    { name: "Mamang's Cake House", area: "mandaue" },
    { name: "Sugar Sugbo", area: "talisay" },
    { name: "Lami Bakes", area: "consolacion" },
    { name: "Cloud Nine Cakes Cebu", area: "lapu-lapu" },
    { name: "Panaderya Fina", area: "cebu-city" },
  ],
  "mobile-bar": [
    { name: "Tagay Mobile Bar", area: "cebu-city", curated: true },
    { name: "Calamansi Cart Co.", area: "mandaue" },
    { name: "Isla Spritz Bar", area: "lapu-lapu" },
    { name: "Kopa Mobile Bar", area: "talisay" },
  ],
  "photo-booth": [
    { name: "Pose Mo Photo Booth", area: "cebu-city", curated: true },
    { name: "Click Sugbo Booth", area: "mandaue" },
    { name: "Smile Station Cebu", area: "talisay" },
    { name: "Flashbox Mandaue", area: "mandaue" },
  ],
};
