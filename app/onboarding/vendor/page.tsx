import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { getCatalog } from "@/lib/queries/catalog";
import { ownedVendor } from "@/lib/services/access";
import { ShopSetupForm } from "./shop-setup-form";

export const metadata = { title: "Set up your shop" };

const SAMPLES = ["lechon-whole", "catering-buffet", "venue-hall", "styling-debut", "cake-debut", "lights-stage", "photo-camera", "photobooth"].map(
  (s) => `/seed/${s}-2.webp`,
);

export default async function VendorOnboarding() {
  const viewer = await requireRole("vendor");
  if (await ownedVendor(await getDb(), viewer)) redirect("/vendor");
  const catalog = await getCatalog();
  return (
    <main className="pb-10">
      <AppHeader title="Set up your shop" subtitle="Step 1 of 2 · Services next" />
      <ShopSetupForm
        categories={catalog.categories.map((c) => ({ value: String(c.id), label: c.name }))}
        areas={catalog.areas.map((a) => ({ value: String(a.id), label: a.name }))}
        samples={SAMPLES}
      />
    </main>
  );
}
