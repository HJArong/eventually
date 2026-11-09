import { RotateCcw } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button, DemoNote } from "@/components/ui";
import { config } from "@/lib/config";
import { requireRole } from "@/lib/auth/session";
import { formatPeso } from "@/lib/format";
import { getCatalog } from "@/lib/queries/catalog";
import { listPackages } from "@/lib/queries/packages";
import { resetDemoAction, togglePackagePublished } from "@/app/actions/admin";

export const metadata = { title: "Admin" };

export default async function Admin() {
  const viewer = await requireRole("admin");
  const [pkgs, catalog] = await Promise.all([listPackages({ includeUnpublished: true }), getCatalog()]);
  return (
    <main className="pb-10">
      <AppHeader title="Curator tools" subtitle={`Signed in as ${viewer.displayName}`} back="/" />
      <div className="grid gap-4 px-5 pt-4">
        <DemoNote>
          Packages and vendors are curated through the seed scripts (supabase/seed) and the Supabase dashboard. This page only
          toggles package visibility and resets the demo.
        </DemoNote>
        <ul className="grid gap-2">
          {pkgs.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-xl border border-line bg-white p-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{p.title}</p>
                <p className="text-xs text-muted">
                  {catalog.eventTypeBySlug.get(p.eventType)?.name} · {p.vendorCount} vendors · from {formatPeso(p.fromPricePhp)}
                </p>
              </div>
              <form action={togglePackagePublished}>
                <input type="hidden" name="packageId" value={p.id} />
                <Button size="sm" variant={p.isPublished ? "primary" : "outline"} type="submit">
                  {p.isPublished ? "Published" : "Hidden"}
                </Button>
              </form>
            </li>
          ))}
        </ul>
        {config.demoMode && (
          <form action={resetDemoAction}>
            <Button variant="danger" type="submit" className="w-full">
              <RotateCcw className="size-4" /> Reset demo data
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
