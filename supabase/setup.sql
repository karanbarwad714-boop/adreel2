-- Adreel Academy: Supabase tables. Safe to run more than once.
create table if not exists leads (
  id bigint generated always as identity primary key,
  created_at timestamptz default now()
);
alter table leads add column if not exists first_name text;
alter table leads add column if not exists email text;
alter table leads add column if not exists consent boolean;

create table if not exists payment_claims (
  id bigint generated always as identity primary key,
  created_at timestamptz default now()
);
alter table payment_claims add column if not exists name text;
alter table payment_claims add column if not exists transaction_id text;
alter table payment_claims add column if not exists amount text;
alter table payment_claims add column if not exists status text default 'pending';

alter table leads enable row level security;
alter table payment_claims enable row level security;

-- The website may only ADD rows. Nobody can read them except you in the Supabase dashboard.
drop policy if exists "site can add leads" on leads;
create policy "site can add leads" on leads
  for insert to anon with check (true);

drop policy if exists "site can add payment claims" on payment_claims;
create policy "site can add payment claims" on payment_claims
  for insert to anon with check (status = 'pending');
