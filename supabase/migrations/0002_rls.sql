-- ============================================================================
-- LeaseFlip — 0002_rls.sql
-- Row Level Security. Default deny; explicit allow per role.
-- ============================================================================

alter table public.profiles        enable row level security;
alter table public.properties      enable row level security;
alter table public.property_photos enable row level security;
alter table public.proposals       enable row level security;
alter table public.agreements      enable row level security;
alter table public.payments        enable row level security;
alter table public.messages        enable row level security;
alter table public.notifications   enable row level security;
alter table public.audit_logs      enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
-- Anyone authenticated can read profiles (needed to show counterpart name).
create policy "profiles: read for authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles: insert self"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "profiles: update self or admin"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- properties
-- ---------------------------------------------------------------------------
-- Active listings are visible to all authenticated users; owners see their own
-- in any status; admins see everything.
create policy "properties: read active or own or admin"
  on public.properties for select
  to authenticated
  using (
    status = 'active'
    or owner_id = auth.uid()
    or public.is_admin()
  );

create policy "properties: owner insert"
  on public.properties for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "properties: owner or admin update"
  on public.properties for update
  to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

create policy "properties: owner or admin delete"
  on public.properties for delete
  to authenticated
  using (owner_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- property_photos  (follow the parent property's visibility)
-- ---------------------------------------------------------------------------
create policy "photos: read with property"
  on public.property_photos for select
  to authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id
        and (p.status = 'active' or p.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "photos: owner manage"
  on public.property_photos for all
  to authenticated
  using (
    exists (select 1 from public.properties p
            where p.id = property_id and (p.owner_id = auth.uid() or public.is_admin()))
  )
  with check (
    exists (select 1 from public.properties p
            where p.id = property_id and (p.owner_id = auth.uid() or public.is_admin()))
  );

-- ---------------------------------------------------------------------------
-- proposals
-- ---------------------------------------------------------------------------
-- Visible to the operator who made it, the owner of the property, or admin.
create policy "proposals: read participants"
  on public.proposals for select
  to authenticated
  using (
    operator_id = auth.uid()
    or owner_id = auth.uid()
    or public.is_admin()
  );

-- Only operators may submit; owner_id must match the property's owner.
create policy "proposals: operator insert"
  on public.proposals for insert
  to authenticated
  with check (
    operator_id = auth.uid()
    and public.current_role() = 'operator'
    and exists (
      select 1 from public.properties p
      where p.id = property_id
        and p.owner_id = owner_id
        and p.status = 'active'
    )
  );

-- Operator can update own (e.g. withdraw); owner can update (accept/counter/reject).
create policy "proposals: participant update"
  on public.proposals for update
  to authenticated
  using (operator_id = auth.uid() or owner_id = auth.uid() or public.is_admin())
  with check (operator_id = auth.uid() or owner_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- agreements
-- ---------------------------------------------------------------------------
create policy "agreements: read participants"
  on public.agreements for select
  to authenticated
  using (owner_id = auth.uid() or operator_id = auth.uid() or public.is_admin());

create policy "agreements: participant insert"
  on public.agreements for insert
  to authenticated
  with check (owner_id = auth.uid() or operator_id = auth.uid() or public.is_admin());

create policy "agreements: participant update"
  on public.agreements for update
  to authenticated
  using (owner_id = auth.uid() or operator_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or operator_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- payments  (visibility follows the parent agreement)
-- ---------------------------------------------------------------------------
create policy "payments: read participants"
  on public.payments for select
  to authenticated
  using (
    exists (
      select 1 from public.agreements a
      where a.id = agreement_id
        and (a.owner_id = auth.uid() or a.operator_id = auth.uid() or public.is_admin())
    )
  );

create policy "payments: participant manage"
  on public.payments for all
  to authenticated
  using (
    exists (select 1 from public.agreements a
            where a.id = agreement_id
              and (a.owner_id = auth.uid() or a.operator_id = auth.uid() or public.is_admin()))
  )
  with check (
    exists (select 1 from public.agreements a
            where a.id = agreement_id
              and (a.owner_id = auth.uid() or a.operator_id = auth.uid() or public.is_admin()))
  );

-- ---------------------------------------------------------------------------
-- messages  (only the two proposal participants)
-- ---------------------------------------------------------------------------
create policy "messages: read participants"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.proposals pr
      where pr.id = proposal_id
        and (pr.operator_id = auth.uid() or pr.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "messages: participant send"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.proposals pr
      where pr.id = proposal_id
        and (pr.operator_id = auth.uid() or pr.owner_id = auth.uid())
    )
  );

-- Allow marking messages read (update read_at) by either participant.
create policy "messages: participant update"
  on public.messages for update
  to authenticated
  using (
    exists (select 1 from public.proposals pr
            where pr.id = proposal_id
              and (pr.operator_id = auth.uid() or pr.owner_id = auth.uid()))
  )
  with check (
    exists (select 1 from public.proposals pr
            where pr.id = proposal_id
              and (pr.operator_id = auth.uid() or pr.owner_id = auth.uid()))
  );

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create policy "notifications: read own"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

create policy "notifications: update own"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Inserts happen via service role / triggers; allow self-targeted inserts too.
create policy "notifications: insert self or admin"
  on public.notifications for insert
  to authenticated
  with check (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- audit_logs  (admin read; participants write via app/service)
-- ---------------------------------------------------------------------------
create policy "audit: admin read"
  on public.audit_logs for select
  to authenticated
  using (public.is_admin());

create policy "audit: insert self"
  on public.audit_logs for insert
  to authenticated
  with check (actor_id = auth.uid() or public.is_admin());
