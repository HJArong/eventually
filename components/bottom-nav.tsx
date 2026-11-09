"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarHeart,
  House,
  LayoutDashboard,
  MessageCircle,
  Search,
  Sparkles,
  Store,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

type Item = { href: string; label: string; icon: LucideIcon; match: string[]; badge?: number };

export function BottomNav({ side, unread }: { side: "planner" | "vendor"; unread: number }) {
  const pathname = usePathname();
  const items: Item[] =
    side === "planner"
      ? [
          { href: "/home", label: "Home", icon: House, match: ["/home", "/packages"] },
          { href: "/search", label: "Search", icon: Search, match: ["/search", "/vendors"] },
          { href: "/feed", label: "Feed", icon: Sparkles, match: ["/feed", "/saved"] },
          { href: "/event", label: "Event", icon: CalendarHeart, match: ["/event"] },
          { href: "/inbox", label: "Inbox", icon: MessageCircle, match: ["/inbox"], badge: unread },
        ]
      : [
          { href: "/vendor", label: "Dashboard", icon: LayoutDashboard, match: ["/vendor$"] },
          { href: "/vendor/requests", label: "Requests", icon: ClipboardList, match: ["/vendor/requests"] },
          { href: "/vendor/inbox", label: "Inbox", icon: MessageCircle, match: ["/vendor/inbox"], badge: unread },
          { href: "/vendor/feed", label: "Feed", icon: Sparkles, match: ["/vendor/feed", "/vendor/posts"] },
          { href: "/vendor/shop", label: "Shop", icon: Store, match: ["/vendor/shop", "/vendor/services"] },
        ];

  const isActive = (item: Item) =>
    item.match.some((m) => (m.endsWith("$") ? pathname === m.slice(0, -1) : pathname.startsWith(m)));

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[440px] border-t border-line/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex flex-col items-center gap-1 pt-2.5 pb-2.5 text-[11px] font-medium"
                aria-current={active ? "page" : undefined}
              >
                <span className="relative flex h-7 w-12 items-center justify-center">
                  <Icon className={cn("size-[22px]", active ? "text-rose-600" : "text-muted")} strokeWidth={active ? 2.2 : 1.8} aria-hidden />
                  {item.badge ? (
                    <span className="absolute -top-1 right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] leading-none font-semibold text-white ring-2 ring-white">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  ) : null}
                </span>
                <span className={active ? "text-rose-700" : "text-muted"}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
