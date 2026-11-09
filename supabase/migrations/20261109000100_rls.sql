-- Row Level Security for Supabase. The app server talks to Postgres directly (and enforces the same
-- rules in lib/queries), so these policies protect any browser access through the Supabase anon key,
-- such as Realtime subscriptions. Skipped on databases without Supabase's auth schema (PGlite, plain Postgres).

do $rls$
begin
  if not exists (select 1 from pg_namespace where nspname = 'auth') then
    raise notice 'auth schema not found, skipping RLS policies';
    return;
  end if;

  -- Public catalog: readable by anyone.
  execute 'alter table areas enable row level security';
  execute 'alter table categories enable row level security';
  execute 'alter table event_types enable row level security';
  execute 'alter table vendors enable row level security';
  execute 'alter table vendor_areas enable row level security';
  execute 'alter table vendor_blocked_dates enable row level security';
  execute 'alter table services enable row level security';
  execute 'alter table posts enable row level security';
  execute 'alter table post_tags enable row level security';
  execute 'alter table reviews enable row level security';
  execute 'alter table packages enable row level security';
  execute 'alter table package_items enable row level security';
  execute 'create policy "public read" on areas for select using (true)';
  execute 'create policy "public read" on categories for select using (true)';
  execute 'create policy "public read" on event_types for select using (true)';
  execute 'create policy "public read" on vendors for select using (true)';
  execute 'create policy "public read" on vendor_areas for select using (true)';
  execute 'create policy "public read" on vendor_blocked_dates for select using (true)';
  execute 'create policy "public read" on services for select using (true)';
  execute 'create policy "public read" on posts for select using (true)';
  execute 'create policy "public read" on post_tags for select using (true)';
  execute 'create policy "public read" on reviews for select using (true)';
  execute 'create policy "public read" on packages for select using (is_published)';
  execute 'create policy "public read" on package_items for select using (true)';

  -- Vendors manage their own catalog rows.
  execute 'create policy "owner write" on vendors for all using (owner_id = auth.uid()) with check (owner_id = auth.uid())';
  execute 'create policy "owner write" on services for all using (exists (select 1 from vendors v where v.id = vendor_id and v.owner_id = auth.uid()))';
  execute 'create policy "owner write" on posts for all using (exists (select 1 from vendors v where v.id = vendor_id and v.owner_id = auth.uid()))';
  execute 'create policy "owner write" on vendor_blocked_dates for all using (exists (select 1 from vendors v where v.id = vendor_id and v.owner_id = auth.uid()))';

  execute 'alter table media enable row level security';
  execute 'create policy "public read" on media for select using (owner_type <> ''message'')';

  -- Private per-user data.
  execute 'alter table profiles enable row level security';
  execute 'create policy "self" on profiles for all using (id = auth.uid()) with check (id = auth.uid())';
  execute 'alter table auth_tokens enable row level security'; -- no policies: server only

  execute 'alter table likes enable row level security';
  execute 'alter table saves enable row level security';
  execute 'alter table follows enable row level security';
  execute 'create policy "self" on likes for all using (profile_id = auth.uid()) with check (profile_id = auth.uid())';
  execute 'create policy "self" on saves for all using (profile_id = auth.uid()) with check (profile_id = auth.uid())';
  execute 'create policy "self" on follows for all using (profile_id = auth.uid()) with check (profile_id = auth.uid())';

  -- Planners see their own events; vendors see what is addressed to them.
  execute 'alter table events enable row level security';
  execute 'create policy "planner" on events for all using (planner_id = auth.uid()) with check (planner_id = auth.uid())';
  execute 'alter table event_tasks enable row level security';
  execute 'create policy "planner" on event_tasks for all using (exists (select 1 from events e where e.id = event_id and e.planner_id = auth.uid()))';

  execute 'alter table booking_requests enable row level security';
  execute 'create policy "participants" on booking_requests for select using (
    exists (select 1 from events e where e.id = event_id and e.planner_id = auth.uid())
    or exists (select 1 from vendors v where v.id = vendor_id and v.owner_id = auth.uid()))';

  execute 'alter table quotes enable row level security';
  execute 'create policy "participants" on quotes for select using (exists (
    select 1 from booking_requests br
    join events e on e.id = br.event_id
    join vendors v on v.id = br.vendor_id
    where br.id = booking_request_id and (e.planner_id = auth.uid() or v.owner_id = auth.uid())))';
  execute 'alter table quote_items enable row level security';
  execute 'create policy "participants" on quote_items for select using (exists (
    select 1 from quotes q
    join booking_requests br on br.id = q.booking_request_id
    join events e on e.id = br.event_id
    join vendors v on v.id = br.vendor_id
    where q.id = quote_id and (e.planner_id = auth.uid() or v.owner_id = auth.uid())))';
  execute 'alter table mock_payments enable row level security';

  execute 'alter table threads enable row level security';
  execute 'create policy "participants" on threads for select using (
    planner_id = auth.uid() or exists (select 1 from vendors v where v.id = vendor_id and v.owner_id = auth.uid()))';
  execute 'alter table messages enable row level security';
  execute 'create policy "participants" on messages for select using (exists (
    select 1 from threads t
    where t.id = thread_id
      and (t.planner_id = auth.uid() or exists (select 1 from vendors v where v.id = t.vendor_id and v.owner_id = auth.uid()))))';
end
$rls$;
