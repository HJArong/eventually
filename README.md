# eventually

**Plan your Cebu celebration without the chaos.** Eventually is a mobile-first web app that connects people planning debuts, weddings, binyags, birthdays and fiestas in Cebu with local vendors: venues, caterers, lechon, lights & sounds, hosts, stylists and more.

- **Planners** start from a curated package (with a real ₱ estimate for their guest count) or search vendors, send structured quote requests to several vendors in one tap, compare quotes in one inbox, pay a deposit (mock GCash) and track budget, bookings and a checklist on one event dashboard.
- **Vendors** set up a shop in minutes, get requests with date, area, pax and budget up front, reply with line-item quotes, chat, and post their work to a social feed.

Everything runs locally with **zero accounts or credentials**: an embedded Postgres, seeded with 70 fictional Cebu vendors, plus one-click demo logins.

## Quick start

Requirements: Node 20+ and pnpm 10.

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000 (use your browser's phone emulation, or a phone on the same network; the app is designed for a 390px-wide screen). On first request the app creates an embedded Postgres database in `.data/pglite`, runs the migrations and loads the demo data (about a second).

On the sign-in page, use **One-click demo**:

- **Sign in as demo planner**: Hazel, planning *Hazel's Wedding* (May 13, 2027, Cebu City, 150 pax, ₱475k budget).
- **Sign in as demo vendor**: Inday, who runs *Lechon ni Inday*.

You can also sign up as a new user with any email. In local mode the magic link is shown on screen (and printed in the server log) instead of being emailed.

To start over, use **Reset demo data** (planner: Saved & settings; vendor: Shop) or stop the server and run `pnpm db:reset`.

## Demo script (about 3 minutes)

1. **Sign in as demo planner.** Home shows Hazel's wedding, 2 quotes waiting (photo & video, and styling), and *Wedding packages in Cebu City*.
2. Open **Cebu City Wedding Essentials** (reception hall, buffet, lights & sounds, host; about ₱143k for 150 pax). Tap **Swap** on the host and pick another, then **Request quotes from all 4**. Four requests appear in the inbox as *Requested*.
3. **Search** "lechon", open **Lechon ni Inday**, tap **Request a quote**, add *Whole lechon (regular)* and *(spicy)*, and **Send request**.
4. Within a few seconds the demo auto-responder replies in the thread with a **₱18,000 quote**. Tap **Accept & book**, choose GCash on the mock payment screen and **Pay ₱5,400**. The thread shows **Booking confirmed**, and the vendor's date is blocked.
5. Open **Event**. The budget bar shows ₱18,000 committed, the Lechon slot is *Booked*, and the package vendors show *Requested* or *Quote in* as their auto-quotes arrive. Tick a checklist item.
6. Open **Feed**. Save the Bulak Florals wedding reception post, tap **View service**, and send a request for it.
7. **Sign in as demo vendor** (Saved & settings → Sign out, or open a private window). The dashboard shows new requests, profile views, quotes sent and bookings. Tap **Quote** on Paolo's christening request, adjust the line items, deposit and valid-until date, and **Send quote**. Then publish a **New post** tagged *Wedding*, and try **Services** and **Shop** (areas, blocked dates, auto-responder toggle).

The same script runs as an end-to-end test: `pnpm test:e2e`.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server on port 3000 (auto-migrates and seeds the local database) |
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm lint` / `pnpm typecheck` | ESLint, and route-type generation plus `tsc` |
| `pnpm test` | Vitest: pricing, status machine, payments, auto-responder, checklist, sessions, and the full booking flow against an in-memory Postgres |
| `pnpm test:e2e` | Playwright at a 390×844 mobile viewport: demo script, onboarding, and every page rendering without errors or horizontal overflow. Starts `pnpm dev` if nothing is running. Set `CHROME_PATH` to use a system Chrome, `E2E_BASE_URL` to test a running server, `SHOTS_DIR` to save screenshots and `E2E_VIDEO=1` to record. |
| `pnpm db:migrate` | Apply `supabase/migrations/*.sql` |
| `pnpm db:seed` | Migrate, then wipe and reload the demo data |
| `pnpm db:reset` | Delete the local PGlite database and reseed (stop the dev server first: PGlite is single-process) |

## Configuration

All settings are optional environment variables; see [`.env.example`](.env.example).

| Mode | How |
| --- | --- |
| **Local, no accounts** (default) | Nothing to set. Embedded PGlite (Postgres 18 in WebAssembly), local magic links, demo logins, mock payments, uploads in `.data/uploads`. |
| **Docker Postgres** | `docker compose up -d db`, then `DATABASE_URL=postgres://eventually:eventually@localhost:54329/eventually pnpm db:seed` and run the app with the same `DATABASE_URL`. |
| **Supabase CLI local stack** | `supabase start` (applies `supabase/migrations`, including the RLS policies), then `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres pnpm db:seed`. Set `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `supabase status` to use Supabase Auth (magic links arrive in the local mail viewer at :54324). |
| **Netlify / serverless demo, no database** | Nothing to set. Function disks are read-only, so PGlite runs in memory and seeds itself on each cold start. The demo works, but changes reset and aren't shared between function instances. |
| **Netlify + hosted Postgres** | Create a Neon or Supabase Postgres and set `DATABASE_URL` (Neon: the pooled connection string; Supabase: the transaction pooler URI, port 6543) and `AUTH_SECRET`. Load the schema and demo data once from your machine with `DATABASE_URL='<url>' pnpm db:seed`; for Supabase use the session pooler URI (same host, port 5432) for this step. `pnpm db:check` tests a URL and prints a one-line reason when it fails (the same reason appears in the function log). `DB_AUTO_MIGRATE=true` migrates and seeds on the first request instead, but against a distant region that can take longer than a function may run, so prefer seeding from your machine. Then redeploy. `netlify.toml` pins Node 22; Netlify's Next.js adapter is applied automatically. |
| **Hosted (Vercel + Supabase)** | Set `DATABASE_URL` (Supabase pooler URL), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (uploads to a public `media` bucket), `AUTH_SECRET`, and `DEMO_MODE=false` for a real launch. Run `pnpm db:migrate` (or `supabase db push`) and optionally `pnpm db:seed`. In Supabase Auth, enable the Google provider and add `https://<site>/auth/callback` to the redirect URLs. |

When `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set, **Continue with Google** and the email magic link go through Supabase Auth. The callback links the Supabase user to a profile and starts the app session. Without them, Google is disabled and magic links are generated locally.

`DEMO_MODE` (default `true`) enables the demo logins, Reset demo data and the auto-responder. **Set `DEMO_MODE=false` on any public deployment that holds real data**, because Reset demo data wipes the database.

## How it works

**Stack:** Next.js 16 (App Router, server components and server actions), React 19, TypeScript, Tailwind CSS 4, Drizzle ORM on Postgres (PGlite locally, or any Postgres or Supabase), Zod validation, Supabase Auth and Storage when configured, Vitest and Playwright.

```
app/
  (planner)/        home, search, packages, request, feed, event, inbox (+ pay), saved
  vendor/           dashboard, requests (+ quote composer), inbox, feed, posts/new, services, shop
  vendors/[slug]    public vendor profile
  onboarding/       role choice, create event, shop setup
  sign-in, auth/    magic link, Google (Supabase), demo logins
  actions/          server actions (thin: validate with Zod, call lib/services)
  admin/            curator page: publish/unpublish packages, reset demo
components/         UI kit (sticker cards, chips, bottom nav) and feature components
lib/
  domain/           pure logic: pricing, booking status machine, payments interface, auto-responder, checklist
  services/         transactional writes: bookings, quotes, payments, messages, access checks
  queries/          read models for each screen
  auth/             signed session cookie, Supabase auth wiring
  db/               Drizzle schema, connection, migration runner
supabase/
  migrations/       SQL schema and RLS policies (applied by the app or the Supabase CLI)
  seed/             Cebu demo data: areas, categories, event types, 70 vendors, 10 packages, posts, reviews, demo bookings
tests/unit, tests/e2e
```

**Booking requests** follow `draft → requested → quoted → accepted → deposit_paid → confirmed`, with side exits *declined* (vendor), *expired* (quote past its valid-until date) and *cancelled* (planner). Transitions and allowed actors are defined in [`lib/domain/status.ts`](lib/domain/status.ts) and enforced in every service call. Each event-vendor pair has one thread; requests, quotes and system events appear in it as cards.

**Demo auto-responder:** in demo mode, a request to a seeded vendor gets a canned quote 6 seconds later (`DEMO_AUTO_REPLY_DELAY`; staggered when several go out at once), built from the requested services with free delivery for food vendors and a 30% deposit. It runs lazily on page loads and polls, so it also works on serverless hosts. Vendors created through onboarding start with it off, and every vendor can toggle it.

**Payments** go through a `PaymentProvider` interface ([`lib/domain/payments.ts`](lib/domain/payments.ts)). The `MockPaymentProvider` records a deposit in `mock_payments` and always succeeds; a PayMongo or Xendit adapter (GCash, Maya, cards) can replace it without touching the booking flow.

**Live updates:** inbox, threads and badges refresh every few seconds (`router.refresh()` polling), which works with any Postgres. Supabase Realtime on `messages` is the planned upgrade once a hosted project exists.

**Authorization** is enforced in server code: every query and mutation is scoped to the signed-in planner's events or the vendor's own shop. The RLS policies in `supabase/migrations/…_rls.sql` mirror these rules for direct Supabase client access and are applied only when Supabase's `auth` schema exists.

**Design:** a sticker-card look (2px ink outlines, offset shadows) in ube, mango, sunset and calamansi on cream, set in Bricolage Grotesque and Plus Jakarta Sans, with Cebuano and Taglish touches in the copy. Seed photos are AI-generated and every vendor is fictional.

## Not in this MVP

- Real payments, payouts and refunds (mock GCash and card only).
- Email, SMS and push notifications (in-app unread badges only).
- Supabase Realtime (polling instead), map view, an event switcher (a planner can create more events; the newest one is active), reviews written in-app (reviews are seeded), vendor verification, and an admin beyond package publishing and demo reset.
- PostHog analytics and a Lighthouse budget in CI.
