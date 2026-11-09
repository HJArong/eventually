import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { requireRole } from "@/lib/auth/session";
import { getCatalog } from "@/lib/queries/catalog";
import { getCurrentEvent } from "@/lib/queries/events";
import { CreateEventForm } from "./create-event-form";

export default async function PlannerOnboarding({ searchParams }: PageProps<"/onboarding/planner">) {
  const viewer = await requireRole("planner");
  const { new: wantsNew } = await searchParams;
  if (!wantsNew && (await getCurrentEvent(viewer.id))) redirect("/home");
  const catalog = await getCatalog();
  return (
    <main className="pb-10">
      <AppHeader title="Let's plan your event" subtitle="Takes 30 seconds. You can change it later." />
      <CreateEventForm
        eventTypes={catalog.eventTypes.map((e) => ({ value: e.slug, label: e.name }))}
        areas={catalog.areas.map((a) => ({ value: String(a.id), label: a.name }))}
      />
    </main>
  );
}
