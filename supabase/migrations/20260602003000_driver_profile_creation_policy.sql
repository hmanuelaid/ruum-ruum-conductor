drop policy if exists "Authenticated users can create own driver profile" on public.drivers;
create policy "Authenticated users can create own driver profile"
on public.drivers
for insert
to authenticated
with check (
  auth_id::text = auth.uid()::text
  and lower(coalesce(status, '')) = 'pendiente_validacion'
);
