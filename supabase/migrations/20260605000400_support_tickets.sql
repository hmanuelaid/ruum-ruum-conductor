create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers(id) on delete cascade,
  category text not null,
  priority text not null default 'normal',
  subject text not null,
  message text not null,
  status text not null default 'abierto',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.support_tickets
  drop constraint if exists support_tickets_category_check;

alter table public.support_tickets
  add constraint support_tickets_category_check
  check (category in ('viaje', 'pago', 'documentos', 'app', 'emergencia', 'otro'));

alter table public.support_tickets
  drop constraint if exists support_tickets_priority_check;

alter table public.support_tickets
  add constraint support_tickets_priority_check
  check (priority in ('normal', 'alta', 'urgente'));

alter table public.support_tickets
  drop constraint if exists support_tickets_status_check;

alter table public.support_tickets
  add constraint support_tickets_status_check
  check (status in ('abierto', 'en_revision', 'resuelto', 'cerrado'));

alter table public.support_tickets enable row level security;

drop policy if exists "Admins can manage support tickets" on public.support_tickets;
create policy "Admins can manage support tickets"
on public.support_tickets
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Drivers can read own support tickets" on public.support_tickets;
create policy "Drivers can read own support tickets"
on public.support_tickets
for select
to authenticated
using (driver_id::text = public.current_driver_id()::text);

drop policy if exists "Drivers can create own support tickets" on public.support_tickets;
create policy "Drivers can create own support tickets"
on public.support_tickets
for insert
to authenticated
with check (driver_id::text = public.current_driver_id()::text);
