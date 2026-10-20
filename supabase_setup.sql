-- Run this ONCE in Supabase → SQL Editor → New query → Run
create table if not exists bot_kv (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);
-- the bot uses the service_role key (server only), which bypasses RLS.
-- Keep RLS ON so nobody can read your data with the public anon key:
alter table bot_kv enable row level security;
