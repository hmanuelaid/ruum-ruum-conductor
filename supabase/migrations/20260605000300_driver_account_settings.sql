alter table public.drivers
  add column if not exists bank_name text not null default '',
  add column if not exists bank_account_holder text not null default '',
  add column if not exists bank_clabe text not null default '';

alter table public.drivers
  drop constraint if exists drivers_bank_clabe_check;

alter table public.drivers
  add constraint drivers_bank_clabe_check
  check (bank_clabe = '' or bank_clabe ~ '^[0-9]{18}$');
