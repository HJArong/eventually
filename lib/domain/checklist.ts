import { addDays } from "@/lib/format";

export type ChecklistTemplateItem = { title: string; dueOffsetDays: number | null };

export function tasksFromTemplate(template: ChecklistTemplateItem[]) {
  return template.map((t, i) => ({ title: t.title, dueOffsetDays: t.dueOffsetDays, done: false, sort: i }));
}

export function taskDueDate(eventDateIso: string, dueOffsetDays: number | null): string | null {
  return dueOffsetDays == null ? null : addDays(eventDateIso, -dueOffsetDays);
}

export function checklistProgress(tasks: { done: boolean }[]) {
  const done = tasks.filter((t) => t.done).length;
  return { done, total: tasks.length, pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0 };
}

export function eventTitle(eventTypeSlug: string, celebrant: string): string {
  const name = celebrant.trim();
  const possessive = name ? (name.endsWith("s") ? `${name}'` : `${name}'s`) : "";
  switch (eventTypeSlug) {
    case "debut":
      return name ? `${possessive} 18th Debut` : "My Debut";
    case "wedding":
      return name ? `${name} Wedding` : "Our Wedding";
    case "christening":
      return name ? `${possessive} Christening` : "Christening";
    case "kids_party":
      return name ? `${possessive} Party` : "Kids Party";
    case "birthday":
      return name ? `${possessive} Birthday` : "Birthday Party";
    case "fiesta":
      return name ? `${name} Fiesta` : "Fiesta Party";
    case "corporate":
      return name ? `${name} Party` : "Company Party";
    default:
      return name || "My Event";
  }
}
