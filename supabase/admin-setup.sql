-- Adreel Academy admin panel setup. Run once in Supabase: SQL Editor. Safe to run again.
-- The admin account is the one email below. Change it here AND create that user in Authentication > Users.

alter table payment_claims add column if not exists contact text;
alter table payment_claims add column if not exists access_code text;
alter table payment_claims add column if not exists verified_at timestamptz;

create table if not exists access_codes (
  id bigint generated always as identity primary key,
  code text unique not null,
  assigned_to text,
  claim_id bigint,
  assigned_at timestamptz
);
alter table access_codes enable row level security;

-- Visitors can only add a pending payment claim. They cannot set a code or a verified date.
drop policy if exists "site can add payment claims" on payment_claims;
create policy "site can add payment claims" on payment_claims
  for insert to anon
  with check (status = 'pending' and access_code is null and verified_at is null);

-- Only the admin email can read or change data.
drop policy if exists "admin reads leads" on leads;
create policy "admin reads leads" on leads for select to authenticated
  using ((auth.jwt() ->> 'email') = 'karanbarwad169@gmail.com');
drop policy if exists "admin deletes leads" on leads;
create policy "admin deletes leads" on leads for delete to authenticated
  using ((auth.jwt() ->> 'email') = 'karanbarwad169@gmail.com');

drop policy if exists "admin reads claims" on payment_claims;
create policy "admin reads claims" on payment_claims for select to authenticated
  using ((auth.jwt() ->> 'email') = 'karanbarwad169@gmail.com');
drop policy if exists "admin updates claims" on payment_claims;
create policy "admin updates claims" on payment_claims for update to authenticated
  using ((auth.jwt() ->> 'email') = 'karanbarwad169@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'karanbarwad169@gmail.com');
drop policy if exists "admin deletes claims" on payment_claims;
create policy "admin deletes claims" on payment_claims for delete to authenticated
  using ((auth.jwt() ->> 'email') = 'karanbarwad169@gmail.com');

drop policy if exists "admin reads codes" on access_codes;
create policy "admin reads codes" on access_codes for select to authenticated
  using ((auth.jwt() ->> 'email') = 'karanbarwad169@gmail.com');
drop policy if exists "admin updates codes" on access_codes;
create policy "admin updates codes" on access_codes for update to authenticated
  using ((auth.jwt() ->> 'email') = 'karanbarwad169@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'karanbarwad169@gmail.com');
