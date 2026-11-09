import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { ownedVendor } from "@/lib/services/access";

export async function requireVendorShop() {
  const viewer = await requireRole("vendor");
  const vendor = await ownedVendor(await getDb(), viewer);
  if (!vendor) redirect("/onboarding/vendor");
  return { viewer, vendor };
}
