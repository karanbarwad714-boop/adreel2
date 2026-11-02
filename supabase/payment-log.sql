-- Adreel Academy payment log. Run once in Supabase SQL Editor (safe to run again).
-- Records failed / pending / cancelled payments, hash mismatches and server errors. Written only by the server; only the admin can read.
create table if not exists payment_logs (
  id bigint generated always as identity primary key,
  event text not null,
  txnid text,
  status text,
  amount numeric,
  message text,
  test_mode boolean default false,
  created_at timestamptz not null default now()
);
create index if not exists payment_logs_created_idx on payment_logs (created_at desc);
alter table payment_logs enable row level security;
drop policy if exists "admin reads payment_logs" on payment_logs;
create policy "admin reads payment_logs" on payment_logs for select to authenticated
  using ((auth.jwt() ->> 'email') = 'karanbarwad169@gmail.com');
