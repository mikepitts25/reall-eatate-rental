-- ============================================================================
-- LeaseFlip — seed.sql  (demo data for local development)
--
-- NOTE: Auth users must exist first. With the Supabase CLI you can create them
-- via `supabase auth` or the dashboard. This seed assumes three auth users with
-- the fixed UUIDs below; the handle_new_user trigger will have created matching
-- profiles. We upsert the profiles to set roles/names, then add listings, etc.
--
-- Demo logins to create in Auth (password: "password123"):
--   owner@leaseflip.test     -> 11111111-1111-1111-1111-111111111111
--   operator@leaseflip.test  -> 22222222-2222-2222-2222-222222222222
--   admin@leaseflip.test     -> 33333333-3333-3333-3333-333333333333
-- ============================================================================

-- Profiles (upsert in case trigger already created them) ---------------------
insert into public.profiles (id, role, full_name, email, company_name, is_verified)
values
  ('11111111-1111-1111-1111-111111111111', 'owner',    'Olivia Owner',    'owner@leaseflip.test',    null,                 true),
  ('22222222-2222-2222-2222-222222222222', 'operator', 'Omar Operator',   'operator@leaseflip.test', 'BlueKey Rentals LLC', true),
  ('33333333-3333-3333-3333-333333333333', 'admin',    'Ada Admin',       'admin@leaseflip.test',    null,                 true)
on conflict (id) do update
  set role = excluded.role,
      full_name = excluded.full_name,
      company_name = excluded.company_name,
      is_verified = excluded.is_verified;

-- Properties -----------------------------------------------------------------
insert into public.properties (
  id, owner_id, title, description, property_type, status,
  address_line1, city, state, postal_code, bedrooms, bathrooms, square_feet,
  monthly_mortgage, estimated_market_rent, desired_monthly_rent,
  lease_restrictions, min_lease_months, available_from
) values
  (
    'aaaaaaa1-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'Modern 3BR Single-Family in Austin',
    'Recently renovated single-family home in a quiet neighborhood, 10 minutes from downtown. Great for mid-term corporate rentals.',
    'single_family', 'active',
    '1200 Cedar St', 'Austin', 'TX', '78702',
    3, 2, 1850,
    3000, 6000, 4000,
    'No short-term rentals under 30 days. No pets over 50lbs.',
    12, '2026-07-01'
  ),
  (
    'aaaaaaa1-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'Downtown 2BR Condo with Skyline Views',
    'High-rise condo with concierge and gym. Ideal for corporate housing.',
    'condo', 'active',
    '88 Lavaca St #2104', 'Austin', 'TX', '78701',
    2, 2, 1100,
    2500, 4200, 3000,
    'HOA requires minimum 6-month leases.',
    6, '2026-08-01'
  )
on conflict (id) do nothing;

-- Photos (placeholder URLs) --------------------------------------------------
insert into public.property_photos (property_id, storage_path, public_url, position, is_cover)
values
  ('aaaaaaa1-0000-0000-0000-000000000001', 'aaaaaaa1-0000-0000-0000-000000000001/cover.jpg',
   'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200', 0, true),
  ('aaaaaaa1-0000-0000-0000-000000000002', 'aaaaaaa1-0000-0000-0000-000000000002/cover.jpg',
   'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200', 0, true)
on conflict do nothing;

-- A proposal from the operator on property #1 --------------------------------
insert into public.proposals (
  id, property_id, operator_id, owner_id, status,
  offered_monthly_rent, lease_term_months, security_deposit,
  intended_use, estimated_expenses, message
) values (
  'bbbbbbb1-0000-0000-0000-000000000001',
  'aaaaaaa1-0000-0000-0000-000000000001',
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'pending',
  4000, 24, 4000,
  'Mid-term corporate rentals (30+ day stays)',
  1200,
  'Hi Olivia — we run furnished mid-term rentals for relocating professionals. We''d guarantee $4,000/mo on a 24-month term. Happy to discuss.'
) on conflict (id) do nothing;

-- Seed a couple of messages on that proposal ---------------------------------
insert into public.messages (proposal_id, sender_id, body)
values
  ('bbbbbbb1-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
   'Hi Olivia, looking forward to working with you on this property!'),
  ('bbbbbbb1-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   'Thanks Omar — can you confirm you''ll cover all maintenance under $500?')
on conflict do nothing;
