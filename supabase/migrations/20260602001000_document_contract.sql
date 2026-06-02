do $$
begin
  if to_regclass('public.documents') is null then
    raise notice 'Skipping document contract migration because public.documents does not exist.';
    return;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'documents'
      and column_name = 'url'
  ) then
    alter table public.documents add column url text;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'documents'
      and column_name = 'file_url'
  ) then
    update public.documents
    set url = file_url
    where (url is null or btrim(url) = '')
      and file_url is not null
      and btrim(file_url) <> '';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'documents'
      and column_name = 'status'
  ) then
    update public.documents
    set status = case
      when status in ('pendiente', 'pending') then 'pendiente_carga'
      when status in ('uploaded', 'review', 'pendiente_revision', 'pendiente_validacion') then 'en_revision'
      when status = 'approved' then 'aprobado'
      when status = 'rejected' then 'rechazado'
      when status = 'expired' then 'vencido'
      when status in ('pendiente_carga', 'en_revision', 'aprobado', 'rechazado', 'vencido') then status
      else 'pendiente_carga'
    end
    where status is not null;

    if not exists (
      select 1
      from pg_constraint
      where conname = 'documents_status_check'
        and conrelid = 'public.documents'::regclass
    ) then
      alter table public.documents
      add constraint documents_status_check
      check (status in ('pendiente_carga', 'en_revision', 'aprobado', 'rechazado', 'vencido'));
    end if;
  end if;

  comment on column public.documents.url is 'Canonical document file URL. Legacy file_url is read as fallback only.';
end $$;
