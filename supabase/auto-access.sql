-- Adreel Academy automatic access. Run once in Supabase: SQL Editor, AFTER admin-setup.sql. Safe to run again.
-- Orders are written only by the server (service_role key). Visitors and the browser can never read or write them.

create table if not exists orders (
  id bigint generated always as identity primary key,
  txnid text unique not null,
  mihpayid text,
  email text,
  phone text,
  firstname text,
  amount numeric,
  access_code text,
  emailed_at timestamptz,
  email_error text,
  raw jsonb,
  created_at timestamptz not null default now()
);
create index if not exists orders_email_idx on orders (lower(email));
create index if not exists orders_phone_idx on orders (right(regexp_replace(coalesce(phone,''), '\D', '', 'g'), 10));
alter table orders enable row level security;

drop policy if exists "admin reads orders" on orders;
create policy "admin reads orders" on orders for select to authenticated
  using ((auth.jwt() ->> 'email') = 'karanbarwad169@gmail.com');

-- Gives one unused code to a verified paid order. Safe if PayU sends the same webhook twice:
-- the same order always gets the same code, and two orders can never get the same code.
create or replace function assign_order_code(
  p_txnid text, p_mihpayid text, p_email text, p_phone text,
  p_firstname text, p_amount numeric, p_raw jsonb
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_code text;
  v_id bigint;
begin
  insert into orders (txnid, mihpayid, email, phone, firstname, amount, raw)
  values (p_txnid, p_mihpayid, p_email, p_phone, p_firstname, p_amount, p_raw)
  on conflict (txnid) do nothing;

  select id, access_code into v_id, v_code from orders where txnid = p_txnid for update;
  if v_code is not null then
    return v_code;
  end if;

  select code into v_code from access_codes
   where assigned_to is null
   order by id
   for update skip locked
   limit 1;
  if v_code is null then
    return null;  -- no codes left; order is saved, admin can assign later
  end if;

  update access_codes
     set assigned_to = coalesce(nullif(p_email, ''), nullif(p_phone, ''), p_txnid),
         assigned_at = now()
   where code = v_code;
  update orders set access_code = v_code where id = v_id;
  return v_code;
end $$;

revoke all on function assign_order_code(text,text,text,text,text,numeric,jsonb) from public, anon, authenticated;
grant execute on function assign_order_code(text,text,text,text,text,numeric,jsonb) to service_role;
