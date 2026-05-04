create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  birth_date date not null,
  birth_time time,
  gender text not null,
  email text not null,
  phone text,
  region text,
  membership_tier text not null default 'free' check (membership_tier in ('free', 'tactical', 'strategic')),
  credit_balance integer not null default 0 check (credit_balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null,
  source text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  tag text not null,
  points integer not null default 0,
  summary text not null,
  sections jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update on public.profiles to anon, authenticated, service_role;
grant select, insert on public.credit_transactions to anon, authenticated, service_role;
grant select, insert, update, delete on public.reports to anon, authenticated, service_role;

alter table public.profiles enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.reports enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "Users can read own credit transactions" on public.credit_transactions;
create policy "Users can read own credit transactions"
on public.credit_transactions for select
using (auth.uid() = user_id);

drop policy if exists "Users can read own reports" on public.reports;
create policy "Users can read own reports"
on public.reports for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own reports" on public.reports;
create policy "Users can insert own reports"
on public.reports for insert
with check (auth.uid() = user_id);
