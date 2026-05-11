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
  partner_package text not null default 'none' check (partner_package in ('none', 'startup_8888', 'partner_16888', 'regional_38888')),
  credit_balance integer not null default 0 check (credit_balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
add column if not exists partner_package text not null default 'none'
check (partner_package in ('none', 'startup_8888', 'partner_16888', 'regional_38888'));

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

create table if not exists public.accounting_accounts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  type text not null check (type in ('asset', 'liability', 'equity', 'revenue', 'expense')),
  normal_balance text not null check (normal_balance in ('debit', 'credit')),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.accounting_journals (
  id uuid primary key default gen_random_uuid(),
  journal_no text not null unique,
  source_module text not null,
  source_id text,
  period text not null,
  journal_date date not null default current_date,
  description text not null,
  status text not null default 'posted' check (status in ('draft', 'posted', 'void')),
  total_debit numeric(14, 2) not null default 0 check (total_debit >= 0),
  total_credit numeric(14, 2) not null default 0 check (total_credit >= 0),
  created_by uuid,
  approved_by uuid,
  posted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (round(total_debit, 2) = round(total_credit, 2))
);

create table if not exists public.accounting_journal_lines (
  id uuid primary key default gen_random_uuid(),
  journal_id uuid not null references public.accounting_journals(id) on delete cascade,
  line_no integer not null,
  account_code text not null references public.accounting_accounts(code),
  account_name text not null,
  debit numeric(14, 2) not null default 0 check (debit >= 0),
  credit numeric(14, 2) not null default 0 check (credit >= 0),
  memo text,
  entity_type text,
  entity_id text,
  created_at timestamptz not null default now(),
  unique (journal_id, line_no),
  check (
    (debit > 0 and credit = 0)
    or (credit > 0 and debit = 0)
  )
);

create table if not exists public.accounting_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  action text not null,
  entity_type text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.accounting_sync_batches (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  period text not null,
  status text not null default 'draft' check (status in ('draft', 'exported', 'synced', 'failed')),
  exported_by uuid,
  file_name text,
  row_count integer not null default 0 check (row_count >= 0),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.accounting_accounts (code, name, type, normal_balance, description)
values
  ('1000', 'Cash / Bank', 'asset', 'debit', '银行入账、FPX、Stripe 结算后现金'),
  ('1100', 'Payment Gateway Clearing', 'asset', 'debit', 'Stripe / FPX / e-wallet 未结算金额'),
  ('1200', 'Accounts Receivable', 'asset', 'debit', '已开单但未收款订单'),
  ('1300', 'Inventory', 'asset', 'debit', '产品库存成本'),
  ('2000', 'Commission Payable', 'liability', 'credit', '待发放佣金'),
  ('2100', 'Partner Pool Payable', 'liability', 'credit', 'Pool Share 待发放金额'),
  ('2200', 'Deferred Revenue', 'liability', 'credit', '课程、订阅、点数未履约部分'),
  ('2300', 'SST / Tax Payable', 'liability', 'credit', 'SST / 税务预留科目'),
  ('3000', 'Owner Equity', 'equity', 'credit', '股东权益 / 保留盈余'),
  ('4000', 'Subscription Revenue', 'revenue', 'credit', '会员订阅收入'),
  ('4100', 'Credit Top-up Revenue', 'revenue', 'credit', '点数充值收入'),
  ('4200', 'Product Sales Revenue', 'revenue', 'credit', '产品商城收入'),
  ('4300', 'Course Sales Revenue', 'revenue', 'credit', '课程收入'),
  ('4400', 'AI Reports Revenue', 'revenue', 'credit', 'AI 报告收入'),
  ('4500', 'Agent Package Revenue', 'revenue', 'credit', '创业配套收入'),
  ('5000', 'Cost of Goods Sold', 'expense', 'debit', '产品销售成本'),
  ('5100', 'AI API Cost', 'expense', 'debit', 'OpenAI / Gemini API 成本'),
  ('5200', 'Commission Expense', 'expense', 'debit', '三层佣金成本'),
  ('5300', 'Partner Pool Expense', 'expense', 'debit', '业绩共享池成本'),
  ('5400', 'Payment Gateway Fees', 'expense', 'debit', 'Stripe / FPX / 本地网关手续费')
on conflict (code) do update
set
  name = excluded.name,
  type = excluded.type,
  normal_balance = excluded.normal_balance,
  description = excluded.description,
  updated_at = now();

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update on public.profiles to anon, authenticated, service_role;
grant select, insert on public.credit_transactions to anon, authenticated, service_role;
grant select, insert, update, delete on public.reports to anon, authenticated, service_role;
grant select, insert, update, delete on public.accounting_accounts to service_role;
grant select, insert, update, delete on public.accounting_journals to service_role;
grant select, insert, update, delete on public.accounting_journal_lines to service_role;
grant select, insert, update, delete on public.accounting_audit_logs to service_role;
grant select, insert, update, delete on public.accounting_sync_batches to service_role;

alter table public.profiles enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.reports enable row level security;
alter table public.accounting_accounts enable row level security;
alter table public.accounting_journals enable row level security;
alter table public.accounting_journal_lines enable row level security;
alter table public.accounting_audit_logs enable row level security;
alter table public.accounting_sync_batches enable row level security;

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
