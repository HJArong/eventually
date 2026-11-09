import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatPeso, timeAgo } from "@/lib/format";
import type { InboxItem } from "@/lib/queries/inbox";
import { StatusPill } from "./status-pill";
import { Avatar, EmptyState, LinkButton } from "./ui";

function preview(item: InboxItem, side: "planner" | "vendor") {
  const m = item.lastMessage;
  if (!m) return "No messages yet";
  if (m.kind === "quote") return item.quoteTotalPhp ? `Quote: ${formatPeso(item.quoteTotalPhp)}` : "Sent a quote";
  if (m.kind === "request") return side === "planner" ? "You sent a quote request" : "New quote request";
  if (m.kind === "image") return "Sent a photo";
  return m.body;
}

export function InboxList({ items, side, basePath }: { items: InboxItem[]; side: "planner" | "vendor"; basePath: string }) {
  if (!items.length) {
    return (
      <EmptyState
        title="No conversations yet"
        body={side === "planner" ? "Request a quote from a vendor or a package to start." : "New requests from planners land here."}
        action={side === "planner" ? <LinkButton href="/packages" size="sm">Browse packages</LinkButton> : undefined}
      />
    );
  }
  return (
    <ul className="grid gap-2.5">
      {items.map((item) => {
        const name = side === "planner" ? item.vendor.name : item.planner.displayName;
        return (
          <li key={item.id}>
            <Link
              href={`${basePath}/${item.id}`}
              className={cn(
                "flex items-center gap-3 rounded-2xl border bg-white p-3 press",
                item.unread ? "border-rose-200 shadow-card" : "border-line",
              )}
            >
              <Avatar name={name} size={46} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={cn("truncate font-display text-[16px]", item.unread ? "font-semibold" : "font-semibold")}>{name}</p>
                  <span className="ml-auto shrink-0 text-[11px] text-muted">{timeAgo(item.lastMessageAt)}</span>
                </div>
                <p className="truncate text-xs text-muted">{item.event.title}</p>
                <p className={cn("mt-0.5 truncate text-sm", item.unread ? "font-semibold text-ink" : "text-ink-soft")}>{preview(item, side)}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                {item.status && <StatusPill status={item.status} />}
                {item.unread > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-[11px] font-semibold text-white">
                    {item.unread}
                  </span>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
