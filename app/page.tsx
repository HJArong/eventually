import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarCheck, MessageCircle, Package } from "lucide-react";
import { Logo } from "@/components/logo";
import { LinkButton } from "@/components/ui";
import { getViewer, homeFor } from "@/lib/auth/session";

const FEATURES = [
  { icon: Package, title: "Curated packages", body: "Start from a bundle with real ₱ estimates for your guest count." },
  { icon: MessageCircle, title: "One inbox for quotes", body: "Request several vendors at once and compare replies side by side." },
  { icon: CalendarCheck, title: "Everything on one dashboard", body: "Budget, bookings and checklist, always up to date." },
];

export default async function Landing() {
  const viewer = await getViewer();
  if (viewer) redirect(homeFor(viewer.role));

  return (
    <main className="flex min-h-dvh flex-col bg-cream px-5 pt-6 pb-8">
      <Logo size={28} />

      <div className="mt-7 grid h-64 grid-cols-[1.25fr_1fr] grid-rows-2 gap-2.5">
        <div className="relative row-span-2 overflow-hidden rounded-2xl bg-sand">
          <Image src="/seed/styling-wedding.webp" alt="Wedding reception table styled with flowers and candles" fill sizes="240px" className="object-cover" priority />
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-sand">
          <Image src="/seed/venue-garden.webp" alt="Garden venue with string lights" fill sizes="200px" className="object-cover" priority />
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-sand">
          <Image src="/seed/catering-spread.webp" alt="Catering buffet spread" fill sizes="200px" className="object-cover" />
        </div>
      </div>

      <p className="mt-8 text-sm font-medium text-rose-600">Event planning for Cebu</p>
      <h1 className="mt-2 text-[32px] leading-[1.15] font-semibold">Plan your celebration, without the back-and-forth.</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
        Debuts, weddings, christenings and fiestas. Find trusted local vendors and keep every quote, chat and booking in one
        place.
      </p>

      <ul className="mt-7 grid gap-4">
        {FEATURES.map((f) => (
          <li key={f.title} className="flex gap-3.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <f.icon className="size-5" strokeWidth={1.8} />
            </span>
            <span>
              <span className="block text-[15px] font-semibold">{f.title}</span>
              <span className="block text-sm text-muted">{f.body}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-auto grid gap-3 pt-10">
        <LinkButton href="/sign-in" size="lg" variant="primary">
          Get started <ArrowRight className="size-4" />
        </LinkButton>
        <LinkButton href="/sign-in#demo" size="lg" variant="outline">
          Explore the demo
        </LinkButton>
        <p className="text-center text-xs text-muted">Demo data: all vendors are fictional.</p>
      </div>
    </main>
  );
}
