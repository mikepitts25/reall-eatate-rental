-- ============================================================================
-- LeaseFlip — 0001_init.sql
-- Core schema: enums, tables, indexes, triggers.
-- RLS policies live in 0002_rls.sql.
-- ============================================================================

-- Extensions -----------------------------------------------------------------
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- Enums ----------------------------------------------------------------------
create type user_role as enum ('owner', 'operator', 'admin');

create type property_type as enum (
  'single_family', 'multi_family', 'condo', 'townhouse', 'apartment', 'other'
);

create type listing_status as enum (
  'draft', 'active', 'under_offer', 'leased', 'archived'
);

create type proposal_status as enum (
  'pending', 'countered', 'accepted', 'rejected', 'withdrawn'
);

create type agreement_status as enum (
  'draft', 'sent', 'owner_signed', 'operator_signed', 'active', 'terminated'
);

create type payment_status as enum ('scheduled', 'paid', 'late', 'missed');

create type notification_type as enum (
  'proposal_received', 'proposal_updated', 'message_received',
  'agreement_updated', 'payment_due', 'system'
);

-- updated_at helper ----------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- profiles  (1:1 with auth.users)
-- ============================================================================
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  role          user_role   not null default 'owner',
  full_name     text,
  email         text,
  phone         text,
  avatar_url    text,
  company_name  text,
  bio           text,
  is_verified   boolean     not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-provision a profile when a new auth user is created.
-- Reads desired role + name from auth metadata supplied at signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  desired_role user_role;
begin
  begin
    desired_role := coalesce(
      (new.raw_user_meta_data ->> 'role')::user_role, 'owner'
    );
  exception when others then
    desired_role := 'owner';
  end;

  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    desired_role,
    new.raw_user_meta_data ->> 'full_name',
    new.email
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- properties
-- ============================================================================
create table public.properties (
  id                    uuid primary key default gen_random_uuid(),
  owner_id              uuid not null references public.profiles (id) on delete cascade,
  title                 text not null,
  description           text,
  property_type         property_type not null default 'single_family',
  status                listing_status not null default 'draft',
  address_line1         text,
  address_line2         text,
  city                  text,
  state                 text,
  postal_code           text,
  country               text not null default 'US',
  latitude              numeric(9,6),
  longitude             numeric(9,6),
  bedrooms              numeric(4,1),
  bathrooms             numeric(4,1),
  square_feet           integer,
  monthly_mortgage      numeric(12,2) not null default 0,
  estimated_market_rent numeric(12,2) not null default 0,
  desired_monthly_rent  numeric(12,2) not null default 0,
  lease_restrictions    text,
  min_lease_months      integer not null default 12,
  available_from        date,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint chk_amounts_nonneg check (
    monthly_mortgage >= 0 and estimated_market_rent >= 0 and desired_monthly_rent >= 0
  )
);

create index idx_properties_owner   on public.properties (owner_id);
create index idx_properties_status  on public.properties (status);
create index idx_properties_type    on public.properties (property_type);
create index idx_properties_city    on public.properties (lower(city));

create trigger trg_properties_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

-- ============================================================================
-- property_photos
-- ============================================================================
create table public.property_photos (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid not null references public.properties (id) on delete cascade,
  storage_path text not null,
  public_url   text,
  position     integer not null default 0,
  is_cover     boolean not null default false,
  created_at   timestamptz not null default now()
);

create index idx_photos_property on public.property_photos (property_id);

-- ============================================================================
-- proposals
-- ============================================================================
create table public.proposals (
  id                    uuid primary key default gen_random_uuid(),
  property_id           uuid not null references public.properties (id) on delete cascade,
  operator_id           uuid not null references public.profiles (id) on delete cascade,
  owner_id              uuid not null references public.profiles (id) on delete cascade,
  status                proposal_status not null default 'pending',
  offered_monthly_rent  numeric(12,2) not null,
  lease_term_months     integer not null default 12,
  security_deposit      numeric(12,2) not null default 0,
  intended_use          text,
  estimated_expenses    numeric(12,2) not null default 0,
  message               text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint chk_offer_positive check (offered_monthly_rent >= 0),
  -- one active proposal per operator per property
  constraint uq_operator_property unique (property_id, operator_id)
);

create index idx_proposals_property on public.proposals (property_id);
create index idx_proposals_operator on public.proposals (operator_id);
create index idx_proposals_owner    on public.proposals (owner_id);
create index idx_proposals_status   on public.proposals (status);

create trigger trg_proposals_updated_at
  before update on public.proposals
  for each row execute function public.set_updated_at();

-- ============================================================================
-- agreements  (1:1 with an accepted proposal)
-- ============================================================================
create table public.agreements (
  id                 uuid primary key default gen_random_uuid(),
  proposal_id        uuid not null unique references public.proposals (id) on delete cascade,
  property_id        uuid not null references public.properties (id) on delete cascade,
  owner_id           uuid not null references public.profiles (id) on delete cascade,
  operator_id        uuid not null references public.profiles (id) on delete cascade,
  status             agreement_status not null default 'draft',
  monthly_rent       numeric(12,2) not null,
  lease_term_months  integer not null default 12,
  start_date         date,
  end_date           date,
  terms              text,
  owner_signed_at    timestamptz,
  operator_signed_at timestamptz,
  document_url       text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index idx_agreements_owner    on public.agreements (owner_id);
create index idx_agreements_operator on public.agreements (operator_id);
create index idx_agreements_property on public.agreements (property_id);

create trigger trg_agreements_updated_at
  before update on public.agreements
  for each row execute function public.set_updated_at();

-- ============================================================================
-- payments  (obligations under an agreement)
-- ============================================================================
create table public.payments (
  id            uuid primary key default gen_random_uuid(),
  agreement_id  uuid not null references public.agreements (id) on delete cascade,
  due_date      date not null,
  amount        numeric(12,2) not null,
  status        payment_status not null default 'scheduled',
  paid_at       timestamptz,
  method        text,
  reference     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_payments_agreement on public.payments (agreement_id);
create index idx_payments_status     on public.payments (status);

create trigger trg_payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- ============================================================================
-- messages  (threaded by proposal)
-- ============================================================================
create table public.messages (
  id          uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals (id) on delete cascade,
  sender_id   uuid not null references public.profiles (id) on delete cascade,
  body        text not null,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index idx_messages_proposal on public.messages (proposal_id, created_at);
create index idx_messages_sender   on public.messages (sender_id);

-- ============================================================================
-- notifications
-- ============================================================================
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       notification_type not null,
  title      text not null,
  body       text,
  link       text,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on public.notifications (user_id, is_read);

-- ============================================================================
-- audit_logs
-- ============================================================================
create table public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles (id) on delete set null,
  action      text not null,
  entity_type text not null,
  entity_id   uuid,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index idx_audit_entity on public.audit_logs (entity_type, entity_id);
create index idx_audit_actor  on public.audit_logs (actor_id);

-- ============================================================================
-- Helper: is the current user an admin? (used by RLS, avoids recursion)
-- ============================================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Helper: current user's role
create or replace function public.current_role()
returns user_role
language sql
stable
security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;
