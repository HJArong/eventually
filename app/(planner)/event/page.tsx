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
          <span className="shrink-0 rounded-xl bg-rose-50 px-3 py-1.5 text-center leading-none text-rose-700">
            <span className="block text-lg font-semibold">{daysToGo}</span>
            <span className="mt-0.5 block text-[10px] font-medium">days to go</span>
          </span>
        }
      />
      <div className="px-5 pt-4">
        <Card className="p-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-muted">Committed</p>
              <p className="mt-0.5 text-2xl font-semibold tabular-nums">
                {formatPeso(o.budget.committed)} <span className="text-sm font-normal text-muted">of {formatPesoShort(o.budget.budget)}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted">Booked</p>
              <p className="mt-0.5 text-2xl font-semibold tabular-nums">
                {o.bookedCount} of {o.slots.length}
              </p>
            </div>
          </div>
          <div
            className="mt-4 flex h-2 gap-0.5 overflow-hidden rounded-full bg-sand"
            role="img"
            aria-label={`${o.budget.committedPct}% of budget committed, ${o.budget.pendingPct}% in open quotes`}
          >
            <div className="h-full bg-success transition-all" style={{ width: `${o.budget.committedPct}%` }} />
            <div className="h-full bg-rose-200 transition-all" style={{ width: `${o.budget.pendingPct}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-success" /> Booked
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-rose-200" /> In quotes {o.budget.pending ? formatPesoShort(o.budget.pending) : ""}
            </span>
            <span className={cn("ml-auto", o.budget.overBudget && "text-danger")}>
              {o.budget.overBudget ? "Over budget by " + formatPeso(-o.budget.remaining) : formatPeso(o.budget.remaining) + " left"}
            </span>
          </div>
        </Card>

        <section className="mt-6">
          <SectionTitle>Vendors</SectionTitle>
          <Card className="divide-y divide-line/70 px-4">
            {o.slots.map((slot) => {
              const href = slot.threadId ? `/inbox/${slot.threadId}` : `/search?category=${slot.category.slug}`;
              return (
                <Link key={slot.category.id} href={href} className="flex items-center gap-3 py-3">
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xl",
                      slot.status === "booked" ? "bg-success-50 text-success" : "bg-sand text-ink-soft",
                    )}
                  >
                    {slot.status === "booked" ? <Check className="size-4" strokeWidth={2.5} /> : <CategoryIcon icon={slot.category.icon} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{slot.category.name}</span>
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
          <SectionTitle action={<span className="text-sm text-muted">{o.progress.done}/{o.progress.total}</span>}>Checklist</SectionTitle>
          <Card className="px-4">
            <ul className="divide-y divide-line/70">
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
                            "flex size-5 shrink-0 items-center justify-center rounded-md border transition",
                            task.done ? "border-rose-600 bg-rose-600 text-white" : "border-ink/20 bg-white",
                          )}
                        >
                          {task.done && <Check className="size-3.5" strokeWidth={3} />}
                        </span>
                        <span className={cn("flex-1 text-sm", task.done && "text-muted line-through")}>{task.title}</span>
                        {due && (
                          <span className={cn("shrink-0 text-xs", overdue ? "text-danger" : "text-muted")}>
                            {formatDate(due)}
                          </span>
                        )}
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
            <form action={addTask} className="flex items-center gap-2 border-t border-line/70 py-2">
              <input type="hidden" name="eventId" value={event.id} />
              <Plus className="size-4 text-muted" aria-hidden />
              <label htmlFor="new-task" className="sr-only">
                Add task
              </label>
              <input id="new-task" name="title" placeholder="Add task" className="h-9 flex-1 bg-transparent text-sm focus:outline-none" />
              <button type="submit" className="rounded-full px-3 py-1 text-xs font-semibold text-rose-600">
                Add
              </button>
            </form>
          </Card>
        </section>
      </div>
    </main>
  );
}
