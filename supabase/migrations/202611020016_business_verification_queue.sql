-- Admin-only business verification queue; excludes tax identifiers and contact details.
create or replace function public.get_pending_business_accounts()
returns jsonb language plpgsql stable security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid(); v_result jsonb;
begin
 if v_user is null or not (public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Admin role required'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'legal_name',legal_name,'created_at',created_at) order by created_at asc),'[]'::jsonb)
 into v_result from (select id,legal_name,created_at from public.business_accounts where verification_status='pending_review' order by created_at asc limit 100) q;
 return v_result;
end; $$;
revoke all on function public.get_pending_business_accounts() from public,anon;
grant execute on function public.get_pending_business_accounts() to authenticated;
