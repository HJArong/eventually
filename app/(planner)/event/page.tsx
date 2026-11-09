import Link from "next/link";
import { Check, ChevronRight, Plus } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { CategoryIcon } from "@/components/category-icon";
import { SlotPill } from "@/components/status-pill";
import { Card, SectionTitle } from "@/components/ui";
import { cn } from "@/lib/cn";
import { taskDueDate } from "@/lib/domain/checklist";
import { daysBetween, formatDate, formatPeso, formatPesoShort, todayISO } from "@/lib/format";
import { requirePlannerEvent } from "@/lib/planner";
import { getEventOverview } from "@/lib/queries/events";
import { addTask, toggleTask } from "@/app/actions/events";

export const metadata = { title: "Event" };

export default async function EventDashboard() {
  const { event } = await requirePlannerEvent();
  const o = await getEventOverview(event);
  const daysToGo = daysBetween(todayISO(), event.date);
  const today = todayISO();

  return (
    <main>
      <AppHeader
        title={event.title}
        subtitle={`${formatDate(event.date, { weekday: true, year: true })} · ${o.area?.name} · ${event.pax} pax · budget ${formatPeso(event.budgetPhp)}`}
        right={
          <span className="shrink-0 rotate-3 rounded-2xl border-2 border-ink bg-mango px-2.5 py-1 text-center font-display leading-none font-extrabold shadow-pop-sm">
            <span className="block text-lg">{daysToGo}</span>
            <span className="block text-[10px] uppercase">days</span>
          </span>
        }
      />
      <div className="px-5 pt-4">
        <Card className="p-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-bold text-muted uppercase">Committed</p>
              <p className="font-display text-2xl font-extrabold">
                {formatPeso(o.budget.committed)} <span className="text-base text-muted">of {formatPesoShort(o.budget.budget)}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-muted uppercase">Booked</p>
              <p className="font-display text-2xl font-extrabold">
                {o.bookedCount} of {o.slots.length}
              </p>
            </div>
          </div>
          <div
            className="mt-3 flex h-4 overflow-hidden rounded-full border-2 border-ink bg-white"
            role="img"
            aria-label={`${o.budget.committedPct}% of budget committed, ${o.budget.pendingPct}% in open quotes`}
          >
            <div className="h-full bg-calamansi transition-all" style={{ width: `${o.budget.committedPct}%` }} />
            <div className="h-full bg-mango/70 transition-all" style={{ width: `${o.budget.pendingPct}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-muted">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-calamansi" /> Booked
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-mango" /> In quotes {o.budget.pending ? formatPesoShort(o.budget.pending) : ""}
            </span>
            <span className={cn("ml-auto", o.budget.overBudget && "text-sunset")}>
              {o.budget.overBudget ? "Over budget by " + formatPeso(-o.budget.remaining) : formatPeso(o.budget.remaining) + " left"}
            </span>
          </div>
        </Card>

        <section className="mt-6">
          <SectionTitle>Vendors</SectionTitle>
          <Card className="divide-y-2 divide-dashed divide-ink/10 px-3">
            {o.slots.map((slot) => {
              const href = slot.threadId ? `/inbox/${slot.threadId}` : `/search?category=${slot.category.slug}`;
              return (
                <Link key={slot.category.id} href={href} className="flex items-center gap-3 py-3">
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xl border-2 border-ink",
                      slot.status === "booked" ? "bg-calamansi text-white" : "bg-white",
                    )}
                  >
                    {slot.status === "booked" ? <Check className="size-4" strokeWidth={3} /> : <CategoryIcon icon={slot.category.icon} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">{slot.category.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {slot.vendorName ?? "Not chosen yet"}
                      {slot.amountPhp ? ` · ${formatPeso(slot.amountPhp)}` : ""}
                    </span>
                  </span>
                  <SlotPill status={slot.status} />
                  <ChevronRight className="size-4 shrink-0 text-muted" />
                </Link>
              );
            })}
          </Card>
        </section>

        <section className="mt-6 pb-6">
          <SectionTitle action={<span className="text-sm font-bold text-muted">{o.progress.done}/{o.progress.total}</span>}>Checklist</SectionTitle>
          <Card className="px-3">
            <ul className="divide-y-2 divide-dashed divide-ink/10">
              {o.tasks.map((task) => {
                const due = taskDueDate(event.date, task.dueOffsetDays);
                const overdue = !task.done && due && due < today;
                return (
                  <li key={task.id}>
                    <form action={toggleTask}>
                      <input type="hidden" name="taskId" value={task.id} />
                      <button type="submit" className="flex w-full items-center gap-3 py-3 text-left" aria-pressed={task.done}>
                        <span
                          className={cn(
                            "flex size-6 shrink-0 items-center justify-center rounded-lg border-2 border-ink transition",
                            task.done ? "bg-ube text-white" : "bg-white",
                          )}
                        >
                          {task.done && <Check className="size-4" strokeWidth={3} />}
                        </span>
                        <span className={cn("flex-1 text-sm font-semibold", task.done && "text-muted line-through")}>{task.title}</span>
                        {due && (
                          <span className={cn("shrink-0 text-xs font-semibold", overdue ? "text-sunset" : "text-muted")}>
                            {formatDate(due)}
                          </span>
                        )}
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
            <form action={addTask} className="flex items-center gap-2 border-t-2 border-dashed border-ink/10 py-2">
              <input type="hidden" name="eventId" value={event.id} />
              <Plus className="size-4 text-muted" aria-hidden />
              <label htmlFor="new-task" className="sr-only">
                Add task
              </label>
              <input id="new-task" name="title" placeholder="Add task" className="h-9 flex-1 bg-transparent text-sm font-semibold focus:outline-none" />
              <button type="submit" className="rounded-full px-3 py-1 text-xs font-extrabold text-ube">
                Add
              </button>
            </form>
          </Card>
        </section>
      </div>
    </main>
  );
}
