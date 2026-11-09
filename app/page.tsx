import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarHeart, MessageCircle, Package } from "lucide-react";
import { Logo } from "@/components/logo";
import { LinkButton } from "@/components/ui";
import { getViewer, homeFor } from "@/lib/auth/session";

export default async function Landing() {
  const viewer = await getViewer();
  if (viewer) redirect(homeFor(viewer.role));

  return (
    <main className="confetti-bg flex min-h-dvh flex-col px-5 pt-6 pb-8">
      <Logo size={30} />

      <div className="relative mt-8 h-72">
        <div className="pop absolute top-0 left-0 h-48 w-[58%] -rotate-3 overflow-hidden rounded-3xl">
          <Image src="/seed/styling-debut.webp" alt="Pastel debut backdrop with an 18 marquee" fill sizes="240px" className="object-cover" priority />
        </div>
        <div className="pop absolute top-6 right-0 h-40 w-[46%] rotate-3 overflow-hidden rounded-3xl">
          <Image src="/seed/lechon-whole.webp" alt="Whole Cebu lechon on banana leaves" fill sizes="200px" className="object-cover" priority />
        </div>
        <div className="pop absolute right-[18%] bottom-0 h-36 w-[50%] -rotate-1 overflow-hidden rounded-3xl">
          <Image src="/seed/venue-garden.webp" alt="Garden venue with string lights" fill sizes="220px" className="object-cover" />
        </div>
        <span className="absolute bottom-6 left-2 -rotate-6 rounded-full border-2 border-ink bg-mango px-3 py-1 font-display text-sm font-extrabold shadow-pop-sm">
          Made for Cebu
        </span>
      </div>

      <h1 className="mt-8 text-[40px] leading-[1.02] font-extrabold">
        Plan your Cebu celebration <span className="text-ube">without the chaos.</span>
      </h1>
      <p className="mt-3 text-[15px] text-ink-soft">
        Debuts, weddings, binyags and fiestas. Find local vendors, start from a curated package, and keep every quote and
        chat in one place, not across 20 Messenger threads.
      </p>

      <ul className="mt-6 grid gap-2.5 text-sm font-semibold">
        <li className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl border-2 border-ink bg-ube-100"><Package className="size-4" /></span>
          Curated packages with real ₱ estimates
        </li>
        <li className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl border-2 border-ink bg-mango-100"><MessageCircle className="size-4" /></span>
          Request quotes from 4 vendors in one tap
        </li>
        <li className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl border-2 border-ink bg-calamansi-100"><CalendarHeart className="size-4" /></span>
          Budget, bookings and checklist on one dashboard
        </li>
      </ul>

      <div className="mt-auto grid gap-3 pt-8">
        <LinkButton href="/sign-in" size="lg" variant="primary">
          Get started <ArrowRight className="size-5" />
        </LinkButton>
        <LinkButton href="/sign-in#demo" size="lg" variant="outline">
          Try the demo
        </LinkButton>
        <p className="text-center text-xs text-muted">Demo data: all vendors are fictional.</p>
      </div>
    </main>
  );
}
