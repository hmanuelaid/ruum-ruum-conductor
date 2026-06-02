-- Sensitive documents and evidence must live in private buckets.
-- Access is granted through authenticated API handlers that return signed URLs.

insert into storage.buckets (id, name, public)
values
  ('documents', 'documents', false),
  ('trip-evidence', 'trip-evidence', false),
  ('evidence', 'evidence', false)
on conflict (id) do update
set public = false;

alter table public.documents
add column if not exists storage_path text;

comment on column public.documents.url is 'Legacy locator. API responses replace it with a temporary signed URL when storage_path is present.';
comment on column public.documents.storage_path is 'Canonical private storage object path for document files.';

do $$
begin
  if to_regclass('public.trip_evidence') is not null then
    alter table public.trip_evidence
    add column if not exists photo_storage_path text;

    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'trip_evidence'
        and column_name = 'photo_url'
    ) then
      comment on column public.trip_evidence.photo_url is 'Legacy locator. Use photo_storage_path plus signed URLs for access.';
    end if;

    comment on column public.trip_evidence.photo_storage_path is 'Canonical private storage object path for trip evidence.';
  end if;
end $$;

alter table storage.objects enable row level security;

drop policy if exists "Admins can manage document objects" on storage.objects;
create policy "Admins can manage document objects"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'documents'
  and public.is_admin()
)
with check (
  bucket_id = 'documents'
  and public.is_admin()
);

drop policy if exists "Drivers can manage own document objects" on storage.objects;
create policy "Drivers can manage own document objects"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = 'driver'
  and (storage.foldername(name))[2] = public.current_driver_id()
)
with check (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = 'driver'
  and (storage.foldername(name))[2] = public.current_driver_id()
);

drop policy if exists "Admins can manage evidence objects" on storage.objects;
create policy "Admins can manage evidence objects"
on storage.objects
for all
to authenticated
using (
  bucket_id in ('trip-evidence', 'evidence')
  and public.is_admin()
)
with check (
  bucket_id in ('trip-evidence', 'evidence')
  and public.is_admin()
);

drop policy if exists "Drivers can manage assigned trip evidence objects" on storage.objects;
create policy "Drivers can manage assigned trip evidence objects"
on storage.objects
for all
to authenticated
using (
  bucket_id in ('trip-evidence', 'evidence')
  and exists (
    select 1
    from public.trips trip
    where trip.id::text = (storage.foldername(name))[1]
      and trip.driver_id::text = public.current_driver_id()
  )
)
with check (
  bucket_id in ('trip-evidence', 'evidence')
  and exists (
    select 1
    from public.trips trip
    where trip.id::text = (storage.foldername(name))[1]
      and trip.driver_id::text = public.current_driver_id()
  )
);
