-- Rasvani Phase 2: identity, configurable roles, permissions and audit foundation.
-- Apply only to the intended Supabase project after reviewing the migration.
-- No service-role key is required or permitted in browser code.

create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum (
    'customer', 'producer', 'retailer', 'warehouse_operator',
    'quality_reviewer', 'content_editor', 'support_agent', 'admin', 'super_admin'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 120),
  preferred_locale text not null default 'en' check (preferred_locale in ('en','hi','bn','ta','te','mr','gu','pa','kn','ml','or','as')),
  home_region text,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'customer',
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  unique(user_id, role)
);

create table if not exists public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role public.app_role not null,
  permission_key text not null check (permission_key ~ '^[a-z][a-z0-9_.:-]{1,100}$'),
  created_at timestamptz not null default now(),
  unique(role, permission_key)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null check (char_length(action) between 2 and 120),
  entity_type text not null check (char_length(entity_type) between 2 and 80),
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);
create index if not exists audit_logs_actor_idx on public.audit_logs(actor_user_id, created_at desc);
create index if not exists user_roles_user_id_idx on public.user_roles(user_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

-- SECURITY DEFINER helper avoids recursive RLS when checking role assignments.
create or replace function public.has_app_role(required_role public.app_role)
returns boolean language sql stable security definer set search_path = public, auth as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = required_role
  );
$$;
revoke all on function public.has_app_role(public.app_role) from public;
grant execute on function public.has_app_role(public.app_role) to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  insert into public.profiles(id, display_name)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''))
  on conflict (id) do nothing;
  insert into public.user_roles(user_id, role) values (new.id, 'customer')
  on conflict (user_id, role) do nothing;
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public;
drop trigger if exists on_auth_user_created_rasvani on auth.users;
create trigger on_auth_user_created_rasvani after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.audit_logs enable row level security;

-- Explicit table privileges complement RLS; no anonymous access is granted.
revoke all on table public.profiles, public.user_roles, public.role_permissions, public.audit_logs from anon, authenticated;
grant select, update on table public.profiles to authenticated;
grant select on table public.user_roles to authenticated;
grant select, insert, update, delete on table public.role_permissions to authenticated;
grant select on table public.audit_logs to authenticated;
grant all on table public.profiles, public.user_roles, public.role_permissions, public.audit_logs to service_role;

-- Customers may read/update only their own basic profile; elevated profile access is role-gated.
drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin on public.profiles for select to authenticated
using (id = (select auth.uid()) or public.has_app_role('admin') or public.has_app_role('super_admin'));
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Users can see their own role labels; role assignment is never self-service.
drop policy if exists user_roles_select_own_or_admin on public.user_roles;
create policy user_roles_select_own_or_admin on public.user_roles for select to authenticated
using (user_id = (select auth.uid()) or public.has_app_role('admin') or public.has_app_role('super_admin'));
drop policy if exists role_permissions_admin_read on public.role_permissions;
create policy role_permissions_admin_read on public.role_permissions for select to authenticated
using (public.has_app_role('admin') or public.has_app_role('super_admin'));
drop policy if exists role_permissions_super_admin_manage on public.role_permissions;
create policy role_permissions_super_admin_manage on public.role_permissions for all to authenticated
using (public.has_app_role('super_admin')) with check (public.has_app_role('super_admin'));

-- Audit records are immutable to client sessions; privileged server-side writers use a protected server credential.
drop policy if exists audit_logs_admin_read on public.audit_logs;
create policy audit_logs_admin_read on public.audit_logs for select to authenticated
using (public.has_app_role('admin') or public.has_app_role('super_admin'));

-- Explicitly do not add client INSERT/UPDATE/DELETE policies to user_roles or audit_logs.
-- Do not grant a user role based on editable user metadata.
