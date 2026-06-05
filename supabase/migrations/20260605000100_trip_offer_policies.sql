-- Allow drivers to see and claim trips that are offered globally.

drop policy if exists "Drivers can read offered trips" on public.trips;
create policy "Drivers can read offered trips"
on public.trips
for select
to authenticated
using (
  status = 'pendiente_asignacion'
  and driver_id is null
);

drop policy if exists "Drivers can accept offered trips" on public.trips;
create policy "Drivers can accept offered trips"
on public.trips
for update
to authenticated
using (
  status = 'pendiente_asignacion'
  and driver_id is null
)
with check (
  status = 'conductor_asignado'
  and driver_id::text = public.current_driver_id()::text
);
