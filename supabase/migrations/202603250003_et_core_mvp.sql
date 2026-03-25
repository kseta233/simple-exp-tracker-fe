create extension if not exists pgcrypto;

create or replace function public.et_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.et_pockets (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name varchar(120) not null,
  description text,
  type varchar(20) not null,
  currency varchar(10) not null default 'IDR',
  icon varchar(50),
  color varchar(30),
  is_archived boolean not null default false,
  archived_at timestamptz,
  share_mode varchar(20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint et_pockets_type_check check (type in ('personal', 'shared')),
  constraint et_pockets_share_mode_check check (share_mode is null or share_mode in ('invite_only', 'link'))
);

create table if not exists public.et_pocket_members (
  id uuid primary key default gen_random_uuid(),
  pocket_id uuid not null references public.et_pockets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role varchar(20) not null,
  status varchar(20) not null,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint et_pocket_members_unique unique (pocket_id, user_id),
  constraint et_pocket_members_role_check check (role in ('owner', 'member')),
  constraint et_pocket_members_status_check check (status in ('active', 'left', 'removed'))
);

create table if not exists public.et_transactions (
  id uuid primary key default gen_random_uuid(),
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  merchant varchar(255),
  title varchar(255) not null,
  amount numeric(18,2) not null,
  date_trx date not null,
  category_id varchar(100),
  category_label varchar(100),
  note text,
  attachment_uri text,
  source varchar(20) not null,
  original_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by_user_id uuid references auth.users(id) on delete set null,
  constraint et_transactions_amount_check check (amount >= 0),
  constraint et_transactions_source_check check (source in ('manual', 'chat', 'photo', 'text'))
);

create table if not exists public.et_pocket_transactions (
  id uuid primary key default gen_random_uuid(),
  pocket_id uuid not null references public.et_pockets(id) on delete cascade,
  transaction_id uuid not null references public.et_transactions(id) on delete cascade,
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint et_pocket_transactions_unique unique (pocket_id, transaction_id)
);

create table if not exists public.et_pocket_links (
  id uuid primary key default gen_random_uuid(),
  pocket_id uuid not null references public.et_pockets(id) on delete cascade,
  code varchar(120) not null,
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  status varchar(20) not null,
  expires_at timestamptz,
  max_uses integer,
  used_count integer not null default 0,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint et_pocket_links_code_unique unique (code),
  constraint et_pocket_links_status_check check (status in ('active', 'revoked', 'expired')),
  constraint et_pocket_links_used_count_check check (used_count >= 0),
  constraint et_pocket_links_max_uses_check check (max_uses is null or max_uses >= 1)
);

create index if not exists et_pockets_owner_user_id_idx on public.et_pockets(owner_user_id);
create index if not exists et_pockets_type_idx on public.et_pockets(type);
create index if not exists et_pockets_is_archived_idx on public.et_pockets(is_archived);
create index if not exists et_pockets_created_at_desc_idx on public.et_pockets(created_at desc);

create index if not exists et_pocket_members_pocket_status_idx on public.et_pocket_members(pocket_id, status);
create index if not exists et_pocket_members_user_status_idx on public.et_pocket_members(user_id, status);
create index if not exists et_pocket_members_pocket_user_idx on public.et_pocket_members(pocket_id, user_id);

create index if not exists et_transactions_created_by_user_id_idx on public.et_transactions(created_by_user_id);
create index if not exists et_transactions_date_trx_desc_idx on public.et_transactions(date_trx desc);
create index if not exists et_transactions_deleted_at_idx on public.et_transactions(deleted_at);
create index if not exists et_transactions_created_at_desc_idx on public.et_transactions(created_at desc);
create index if not exists et_transactions_category_id_idx on public.et_transactions(category_id);

create index if not exists et_pocket_transactions_pocket_id_idx on public.et_pocket_transactions(pocket_id);
create index if not exists et_pocket_transactions_transaction_id_idx on public.et_pocket_transactions(transaction_id);
create index if not exists et_pocket_transactions_created_at_desc_idx on public.et_pocket_transactions(created_at desc);

create unique index if not exists et_pocket_links_code_uidx on public.et_pocket_links(code);
create index if not exists et_pocket_links_pocket_status_idx on public.et_pocket_links(pocket_id, status);
create index if not exists et_pocket_links_expires_at_idx on public.et_pocket_links(expires_at);

drop trigger if exists et_pockets_set_updated_at on public.et_pockets;
create trigger et_pockets_set_updated_at
before update on public.et_pockets
for each row execute function public.et_set_updated_at();

drop trigger if exists et_pocket_members_set_updated_at on public.et_pocket_members;
create trigger et_pocket_members_set_updated_at
before update on public.et_pocket_members
for each row execute function public.et_set_updated_at();

drop trigger if exists et_transactions_set_updated_at on public.et_transactions;
create trigger et_transactions_set_updated_at
before update on public.et_transactions
for each row execute function public.et_set_updated_at();
