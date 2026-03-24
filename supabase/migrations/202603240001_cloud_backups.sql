create table if not exists public.cloud_backups (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload text not null,
  updated_at timestamptz not null default now()
);

alter table public.cloud_backups enable row level security;

grant select, insert, update on public.cloud_backups to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'cloud_backups'
      and policyname = 'cloud_backups_select_own'
  ) then
    create policy cloud_backups_select_own
      on public.cloud_backups
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'cloud_backups'
      and policyname = 'cloud_backups_insert_own'
  ) then
    create policy cloud_backups_insert_own
      on public.cloud_backups
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'cloud_backups'
      and policyname = 'cloud_backups_update_own'
  ) then
    create policy cloud_backups_update_own
      on public.cloud_backups
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end;
$$;
