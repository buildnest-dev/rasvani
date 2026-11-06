-- Producer facility self-service intake and staff review queue.
-- Facility submission is separate from producer application approval and product approval.

create index if not exists producer_facilities_owner_status_created_idx
  on public.producer_facilities(producer_id, approval_status, created_at desc);

create or replace function public.submit_producer_facility(
  p_name text,
  p_region_id text,
  p_address jsonb
) returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user uuid := auth.uid();
  v_producer uuid;
  v_facility uuid;
  v_address jsonb := coalesce(p_address, '{}'::jsonb);
  v_name text := nullif(trim(p_name), '');
begin
  if v_user is null or not public.has_app_role('producer') then
    raise exception 'Approved producer account required';
  end if;
  select id into v_producer
    from public.producer_profiles
   where user_id = v_user and application_status = 'approved'
   for share;
  if v_producer is null then raise exception 'Producer profile is not approved'; end if;
  if v_name is null or length(v_name) > 180 then
    raise exception 'Facility name is required and must be at most 180 characters';
  end if;
  if not exists(select 1 from public.regions where id = p_region_id) then
    raise exception 'Choose a valid Indian state or Union Territory';
  end if;
  if jsonb_typeof(v_address) <> 'object' then raise exception 'Facility address must be an object'; end if;
  if length(coalesce(v_address->>'address_line_1','')) > 180
     or length(coalesce(v_address->>'address_line_2','')) > 180
     or length(coalesce(v_address->>'city','')) > 100
     or length(coalesce(v_address->>'district','')) > 100
     or length(coalesce(v_address->>'postal_code','')) > 6
     or length(coalesce(v_address->>'facility_type','')) > 40 then
    raise exception 'Facility address fields exceed permitted lengths';
  end if;
  if nullif(trim(coalesce(v_address->>'address_line_1','')),'') is null
     or nullif(trim(coalesce(v_address->>'city','')),'') is null
     or coalesce(v_address->>'postal_code','') !~ '^[1-9][0-9]{5}$' then
    raise exception 'Address line, city and a valid six-digit PIN code are required';
  end if;
  if coalesce(v_address->>'facility_type','') not in ('processing','manufacturing','storage','farm','other') then
    raise exception 'Choose a valid facility type';
  end if;
  if jsonb_typeof(coalesce(v_address->'storage_capabilities','[]'::jsonb)) <> 'array' then
    raise exception 'Storage capabilities must be an array';
  end if;
  if exists (
    select 1 from jsonb_array_elements_text(coalesce(v_address->'storage_capabilities','[]'::jsonb)) s(value)
    where s.value not in ('ambient','chilled','frozen','other')
  ) then raise exception 'Invalid storage capability'; end if;

  -- Serialize submissions per producer to avoid duplicate pending facility records.
  perform pg_advisory_xact_lock(hashtextextended(v_producer::text || ':facility', 0));
  select id into v_facility
    from public.producer_facilities
   where producer_id = v_producer
     and lower(name) = lower(v_name)
     and region_id = p_region_id
     and approval_status = 'pending_review'
   order by created_at desc limit 1
   for update;
  if v_facility is null then
    insert into public.producer_facilities(producer_id, name, address, region_id, approval_status)
    values(v_producer, v_name, v_address, p_region_id, 'pending_review')
    returning id into v_facility;
  else
    update public.producer_facilities
       set name = v_name, address = v_address
     where id = v_facility;
  end if;

  insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, metadata)
  values(v_user, 'producer.facility_submitted', 'producer_facility', v_facility::text,
    jsonb_build_object('region_id', p_region_id, 'facility_type', v_address->>'facility_type'));
  return v_facility;
end;
$$;
revoke all on function public.submit_producer_facility(text,text,jsonb) from public, anon;
grant execute on function public.submit_producer_facility(text,text,jsonb) to authenticated;

create or replace function public.get_my_producer_facilities()
returns table(
  facility_id uuid,
  facility_name text,
  region_id text,
  region_name text,
  address jsonb,
  approval_status public.record_status,
  approved_from date,
  approved_until date,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select f.id, f.name, f.region_id, r.name, f.address, f.approval_status,
         f.approved_from, f.approved_until, f.created_at
    from public.producer_facilities f
    join public.producer_profiles p on p.id = f.producer_id
    left join public.regions r on r.id = f.region_id
   where p.user_id = auth.uid() and public.has_app_role('producer')
   order by f.created_at desc
   limit 100;
$$;
revoke all on function public.get_my_producer_facilities() from public, anon;
grant execute on function public.get_my_producer_facilities() to authenticated;

create or replace function public.get_pending_producer_facilities()
returns table(
  facility_id uuid,
  facility_name text,
  producer_name text,
  region_name text,
  address jsonb,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null or not (
    public.has_app_role('quality_reviewer') or public.has_app_role('admin') or public.has_app_role('super_admin')
  ) then raise exception 'Facility reviewer role required'; end if;
  return query
  select f.id, f.name, coalesce(p.public_name, p.legal_name), r.name, f.address, f.created_at
    from public.producer_facilities f
    join public.producer_profiles p on p.id = f.producer_id
    left join public.regions r on r.id = f.region_id
   where f.approval_status = 'pending_review'
   order by f.created_at asc
   limit 100;
end;
$$;
revoke all on function public.get_pending_producer_facilities() from public, anon;
grant execute on function public.get_pending_producer_facilities() to authenticated;

comment on function public.submit_producer_facility(text,text,jsonb) is
  'Creates or updates one pending facility submission for the authenticated approved producer. Does not approve the facility.';
comment on function public.get_my_producer_facilities() is
  'Returns only facilities belonging to the signed-in approved producer.';
comment on function public.get_pending_producer_facilities() is
  'Returns a bounded pending facility review queue to quality reviewers and admins.';
