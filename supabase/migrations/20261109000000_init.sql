-- Eventually MVP schema. Runs unchanged on Supabase Postgres, plain Postgres and PGlite.
-- Money is stored as whole pesos in *_php integer columns.

create extension if not exists pg_trgm;

create table profiles (
  id uuid primary key default gen_random_uuid(), -- equals auth.users.id when Supabase Auth is used
  role text check (role in ('planner', 'vendor', 'admin')), -- null until the user picks a role
  display_name text not null default '',
  email text unique,
  avatar_url text,
  phone text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

-- Local (no-Supabase) magic links. Only the token hash is stored.
create table auth_tokens (
  token_hash text primary key,
  email text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table areas (
  id serial primary key,
  name text not null,
  slug text not null unique,
  sort integer not null default 0
);

create table categories (
  id serial primary key,
  name text not null,
  slug text not null unique,
  icon text not null,
  sort integer not null default 0
);

create table event_types (
  slug text primary key,
  name text not null,
  sort integer not null default 0,
  slot_categories text[] not null default '{}', -- category slugs shown as vendor slots on the dashboard
  checklist_template jsonb not null default '[]' -- [{ title, dueOffsetDays }]
);

create table vendors (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles (id) on delete set null,
  name text not null,
  slug text not null unique,
  category_id integer not null references categories (id),
  tagline text not null default '',
  bio text not null default '',
  base_area_id integer not null references areas (id),
  fb_url text,
  ig_url text,
  price_band smallint not null default 2 check (price_band between 1 and 3),
  starting_price_php integer not null default 0,
  rating_avg real not null default 0,
  rating_count integer not null default 0,
  profile_views integer not null default 0,
  is_curated boolean not null default false,
  is_demo boolean not null default false,
  auto_respond boolean not null default false, -- demo auto-responder sends a canned quote
  cover_url text,
  created_at timestamptz not null default now()
);
create index vendors_category_idx on vendors (category_id);
create index vendors_name_trgm_idx on vendors using gin (name gin_trgm_ops);

create table vendor_areas (
  vendor_id uuid not null references vendors (id) on delete cascade,
  area_id integer not null references areas (id),
  primary key (vendor_id, area_id)
);

create table vendor_blocked_dates (
  vendor_id uuid not null references vendors (id) on delete cascade,
  date date not null,
  reason text,
  primary key (vendor_id, date)
);

create table services (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors (id) on delete cascade,
  name text not null,
  description text not null default '',
  price_php integer not null check (price_php >= 0),
  unit text not null check (unit in ('per_pax', 'per_item', 'flat', 'per_hour')),
  min_qty integer,
  max_qty integer,
  sort integer not null default 0
);
create index services_vendor_idx on services (vendor_id);

create table media (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null check (owner_type in ('vendor', 'post', 'message')),
  owner_id uuid not null,
  url text not null,
  width integer,
  height integer,
  sort integer not null default 0
);
create index media_owner_idx on media (owner_type, owner_id);

create table posts (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors (id) on delete cascade,
  caption text not null default '',
  area_id integer references areas (id),
  linked_service_id uuid references services (id) on delete set null,
  seed_likes integer not null default 0, -- demo engagement added to real like counts
  created_at timestamptz not null default now()
);
create index posts_created_idx on posts (created_at desc);

create table post_tags (
  post_id uuid not null references posts (id) on delete cascade,
  event_type text not null references event_types (slug),
  primary key (post_id, event_type)
);

create table likes (
  profile_id uuid not null references profiles (id) on delete cascade,
  post_id uuid not null references posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, post_id)
);

create table saves (
  profile_id uuid not null references profiles (id) on delete cascade,
  post_id uuid not null references posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, post_id)
);

create table follows (
  profile_id uuid not null references profiles (id) on delete cascade,
  vendor_id uuid not null references vendors (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, vendor_id)
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors (id) on delete cascade,
  author_name text not null,
  rating smallint not null check (rating between 1 and 5),
  body text not null,
  event_type text references event_types (slug),
  created_at timestamptz not null default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  planner_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  event_type text not null references event_types (slug),
  date date not null,
  area_id integer not null references areas (id),
  venue_text text,
  pax integer not null check (pax > 0),
  budget_php integer not null check (budget_php >= 0),
  created_at timestamptz not null default now()
);
create index events_planner_idx on events (planner_id);

create table event_tasks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  title text not null,
  due_offset_days integer, -- days before the event date
  done boolean not null default false,
  sort integer not null default 0
);

create table packages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  tagline text not null default '',
  event_type text not null references event_types (slug),
  area_id integer references areas (id),
  pax_min integer not null,
  pax_max integer not null,
  description text not null default '',
  cover_url text,
  is_published boolean not null default true,
  sort integer not null default 0
);

create table package_items (
  package_id uuid not null references packages (id) on delete cascade,
  service_id uuid not null references services (id) on delete cascade,
  qty_rule text not null check (qty_rule in ('per_pax', 'fixed')),
  qty integer not null default 1, -- used when qty_rule = 'fixed'
  sort integer not null default 0,
  primary key (package_id, service_id)
);

create table booking_requests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  vendor_id uuid not null references vendors (id) on delete cascade,
  package_id uuid references packages (id) on delete set null,
  status text not null check (status in ('draft', 'requested', 'quoted', 'accepted', 'deposit_paid', 'confirmed', 'declined', 'expired', 'cancelled')),
  requested_services jsonb not null default '[]', -- [{ serviceId, name, qty, unit, pricePhp }]
  date date not null,
  time_text text,
  pax integer not null,
  budget_php integer,
  delivery_area_id integer references areas (id),
  venue_text text,
  notes text,
  auto_reply_at timestamptz, -- when the demo auto-responder should answer
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index booking_requests_event_idx on booking_requests (event_id);
create index booking_requests_vendor_idx on booking_requests (vendor_id, status);
create index booking_requests_auto_reply_idx on booking_requests (auto_reply_at) where auto_reply_at is not null;

create table quotes (
  id uuid primary key default gen_random_uuid(),
  booking_request_id uuid not null references booking_requests (id) on delete cascade,
  total_php integer not null,
  currency text not null default 'PHP',
  deposit_pct integer not null check (deposit_pct between 0 and 100),
  valid_until date not null,
  message text,
  status text not null check (status in ('sent', 'accepted', 'declined', 'expired', 'superseded')),
  created_at timestamptz not null default now()
);
create index quotes_request_idx on quotes (booking_request_id);

create table quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes (id) on delete cascade,
  label text not null,
  qty integer not null check (qty > 0),
  unit_price_php integer not null check (unit_price_php >= 0),
  sort integer not null default 0
);

create table mock_payments (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes (id) on delete cascade,
  method text not null check (method in ('gcash', 'card')),
  amount_php integer not null,
  status text not null check (status in ('pending', 'succeeded', 'failed')),
  reference text not null,
  created_at timestamptz not null default now()
);

create table threads (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  vendor_id uuid not null references vendors (id) on delete cascade,
  planner_id uuid not null references profiles (id) on delete cascade,
  last_message_at timestamptz not null default now(),
  unique (event_id, vendor_id)
);
create index threads_planner_idx on threads (planner_id, last_message_at desc);
create index threads_vendor_idx on threads (vendor_id, last_message_at desc);

create table messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references threads (id) on delete cascade,
  sender_id uuid references profiles (id) on delete set null,
  sender_role text not null check (sender_role in ('planner', 'vendor', 'system')),
  kind text not null check (kind in ('text', 'image', 'quote', 'request', 'system')),
  body text not null default '',
  quote_id uuid references quotes (id) on delete cascade,
  booking_request_id uuid references booking_requests (id) on delete cascade,
  image_url text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index messages_thread_idx on messages (thread_id, created_at);
