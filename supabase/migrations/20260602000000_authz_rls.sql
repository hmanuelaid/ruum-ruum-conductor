-- AuthZ baseline for admin and driver routes.
-- Apply with the Supabase CLI after reviewing table/column names in the target project.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_users app_user
    where (
      app_user.id::text = auth.uid()::text
      or app_user.email = auth.jwt() ->> 'email'
    )
    and lower(coalesce(app_user.type, '')) in (
      'admin',
      'administrator',
      'super_admin',
      'superadmin',
      'owner'
    )
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.current_driver_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select driver.id::text
  from public.drivers driver
  where driver.auth_id::text = auth.uid()::text
  limit 1;
$$;

revoke all on function public.current_driver_id() from public;
grant execute on function public.current_driver_id() to authenticated;

alter table public.app_users enable row level security;
alter table public.drivers enable row level security;
alter table public.documents enable row level security;
alter table public.payments enable row level security;
alter table public.trips enable row level security;

do $$
begin
  if to_regclass('public.trip_evidence') is not null then
    alter table public.trip_evidence enable row level security;
  end if;
end $$;

drop policy if exists "Admins can manage app users" on public.app_users;
create policy "Admins can manage app users"
on public.app_users
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users can read own app user" on public.app_users;
create policy "Users can read own app user"
on public.app_users
for select
to authenticated
using (
  id::text = auth.uid()::text
  or email = auth.jwt() ->> 'email'
);

drop policy if exists "Admins can manage drivers" on public.drivers;
create policy "Admins can manage drivers"
on public.drivers
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Drivers can read own profile" on public.drivers;
create policy "Drivers can read own profile"
on public.drivers
for select
to authenticated
using (auth_id::text = auth.uid()::text);

drop policy if exists "Admins can manage documents" on public.documents;
create policy "Admins can manage documents"
on public.documents
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Drivers can manage own documents" on public.documents;
create policy "Drivers can manage own documents"
on public.documents
for all
to authenticated
using (
  owner_type = 'driver'
  and owner_id::text = public.current_driver_id()::text
)
with check (
  owner_type = 'driver'
  and owner_id::text = public.current_driver_id()::text
);

drop policy if exists "Admins can manage payments" on public.payments;
create policy "Admins can manage payments"
on public.payments
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage trips" on public.trips;
create policy "Admins can manage trips"
on public.trips
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Drivers can read assigned trips" on public.trips;
create policy "Drivers can read assigned trips"
on public.trips
for select
to authenticated
using (driver_id::text = public.current_driver_id()::text);

drop policy if exists "Drivers can update assigned trips" on public.trips;
create policy "Drivers can update assigned trips"
on public.trips
for update
to authenticated
using (driver_id::text = public.current_driver_id()::text)
with check (driver_id::text = public.current_driver_id()::text);

do $$
begin
  if to_regclass('public.trip_evidence') is not null then
    drop policy if exists "Admins can manage trip evidence" on public.trip_evidence;
    create policy "Admins can manage trip evidence"
    on public.trip_evidence
    for all
    to authenticated
    using (public.is_admin())
    with check (public.is_admin());

    drop policy if exists "Drivers can manage assigned trip evidence" on public.trip_evidence;
    create policy "Drivers can manage assigned trip evidence"
    on public.trip_evidence
    for all
    to authenticated
    using (
      driver_id::text = public.current_driver_id()::text
      and exists (
        select 1
        from public.trips trip
        where trip.id::text = trip_id::text
        and trip.driver_id::text = public.current_driver_id()::text
      )
    )
    with check (
      driver_id::text = public.current_driver_id()::text
      and exists (
        select 1
        from public.trips trip
        where trip.id::text = trip_id::text
        and trip.driver_id::text = public.current_driver_id()::text
      )
    );
  end if;
end $$;
