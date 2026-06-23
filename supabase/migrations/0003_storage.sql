-- ============================================================================
-- LeaseFlip — 0003_storage.sql
-- Storage bucket + policies for property photos.
-- Bucket layout: property-photos/{property_id}/{filename}
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('property-photos', 'property-photos', true)
on conflict (id) do nothing;

-- Public read (bucket is public, but make the intent explicit & portable).
create policy "property-photos: public read"
  on storage.objects for select
  using (bucket_id = 'property-photos');

-- Authenticated users may upload into a folder named after a property they own.
create policy "property-photos: owner upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'property-photos'
    and exists (
      select 1 from public.properties p
      where p.id::text = (storage.foldername(name))[1]
        and p.owner_id = auth.uid()
    )
  );

create policy "property-photos: owner update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'property-photos'
    and exists (
      select 1 from public.properties p
      where p.id::text = (storage.foldername(name))[1]
        and p.owner_id = auth.uid()
    )
  );

create policy "property-photos: owner delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'property-photos'
    and exists (
      select 1 from public.properties p
      where p.id::text = (storage.foldername(name))[1]
        and p.owner_id = auth.uid()
    )
  );
