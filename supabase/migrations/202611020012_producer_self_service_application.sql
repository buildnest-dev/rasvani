-- Producer self-service onboarding. Applications remain private and are submitted
-- through authenticated, narrowly scoped SECURITY DEFINER functions.
-- Review/approval continues to use migration 006; submission never grants a producer role.

create index if not exists producer_applications_applicant_status_idx
  on public.producer_applications(applicant_user_id, status, created_at desc);

create or replace function public.submit_producer_application(
  p_legal_name text,
  p_region_id text,
  p_contact_details jsonb,
  p_application_data jsonb
) returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user uuid := auth.uid();
  v_application_id uuid;
  v_email text := coalesce(auth.jwt() ->> 'email', '');
  v_contact jsonb := coalesce(p_contact_details, '{}'::jsonb);
  v_details jsonb := coalesce(p_application_data, '{}'::jsonb);
  v_existing_pending boolean := false;
begin
  if v_user is null then raise exception 'Sign in is required'; end if;
  if not (public.has_app_role('customer') or public.has_app_role('producer')) then
    raise exception 'A customer account is required to apply';
  end if;
  if nullif(trim(p_legal_name), '') is null or length(trim(p_legal_name)) > 180 then
    raise exception 'Legal/business name is required and must be at most 180 characters';
  end if;
  if not exists(select 1 from public.regions where id = p_region_id) then
    raise exception 'Choose a valid Indian state or Union Territory';
  end if;
  if jsonb_typeof(v_contact) <> 'object' or jsonb_typeof(v_details) <> 'object' then
    raise exception 'Contact details and application details must be objects';
  end if;
  if length(coalesce(v_contact ->> 'phone', '')) > 30
     or length(coalesce(v_contact ->> 'contact_name', '')) > 120
     or length(coalesce(v_details ->> 'introduction', '')) > 3000
     or length(coalesce(v_details ->> 'product_categories', '')) > 600 then
    raise exception 'One or more application fields exceed the permitted length';
  end if;
  if nullif(trim(coalesce(v_contact ->> 'email', v_email)), '') is null then
    raise exception 'A contact email is required';
  end if;
  if exists(select 1 from public.producer_profiles where user_id = v_user and application_status = 'approved') then
    raise exception 'This account already has an approved producer profile';
  end if;

  -- Serialize submissions per account so concurrent first submissions cannot
  -- create duplicate pending applications. Rejected applicants may reapply.
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));
  select id into v_application_id
  from public.producer_applications
  where applicant_user_id = v_user and status = 'pending_review'
  order by created_at desc limit 1 for update;

  if v_application_id is null then
    insert into public.producer_applications(
      applicant_user_id, legal_name, contact_details, region_id, application_data, status
    ) values (
      v_user, trim(p_legal_name),
      v_contact || jsonb_build_object('email', coalesce(nullif(trim(v_contact ->> 'email'), ''), v_email)),
      p_region_id, v_details, 'pending_review'
    ) returning id into v_application_id;
  else
    v_existing_pending := true;
    update public.producer_applications
      set legal_name = trim(p_legal_name),
          contact_details = v_contact || jsonb_build_object('email', coalesce(nullif(trim(v_contact ->> 'email'), ''), v_email)),
          region_id = p_region_id,
          application_data = v_details
      where id = v_application_id;
  end if;

  insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, metadata)
  values(v_user, 'producer.application_submitted', 'producer_application', v_application_id::text,
    jsonb_build_object('region_id', p_region_id, 'updated_existing_pending', v_existing_pending));
  return v_application_id;
end;
$$;
revoke all on function public.submit_producer_application(text,text,jsonb,jsonb) from public, anon;
grant execute on function public.submit_producer_application(text,text,jsonb,jsonb) to authenticated;

create or replace function public.get_my_producer_application()
returns table(
  application_id uuid,
  legal_name text,
  region_id text,
  status public.record_status,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  has_producer_profile boolean
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select a.id, a.legal_name, a.region_id, a.status, a.created_at, a.reviewed_at,
         exists(select 1 from public.producer_profiles p where p.user_id = auth.uid() and p.application_status = 'approved')
  from public.producer_applications a
  where a.applicant_user_id = auth.uid()
  order by a.created_at desc
  limit 1;
$$;
revoke all on function public.get_my_producer_application() from public, anon;
grant execute on function public.get_my_producer_application() to authenticated;

comment on function public.submit_producer_application(text,text,jsonb,jsonb) is
  'Authenticated producer applicant submits/updates one pending application. Does not grant producer role or approve claims/facilities.';
comment on function public.get_my_producer_application() is
  'Returns only the signed-in user latest producer application status.';
