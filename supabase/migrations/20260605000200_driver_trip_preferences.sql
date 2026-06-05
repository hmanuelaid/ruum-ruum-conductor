alter table public.drivers
  add column if not exists preferred_zones text[] not null default '{}',
  add column if not exists max_trip_distance_km integer not null default 25,
  add column if not exists minimum_trip_pay_mxn integer not null default 350,
  add column if not exists preferred_shift text not null default 'mixto',
  add column if not exists accepts_long_distance boolean not null default true;

alter table public.drivers
  drop constraint if exists drivers_preferred_shift_check;

alter table public.drivers
  add constraint drivers_preferred_shift_check
  check (preferred_shift in ('manana', 'tarde', 'noche', 'mixto'));

drop policy if exists "Drivers can update own driver settings" on public.drivers;
create policy "Drivers can update own driver settings"
on public.drivers
for update
to authenticated
using (auth_id::text = auth.uid()::text)
with check (auth_id::text = auth.uid()::text);
