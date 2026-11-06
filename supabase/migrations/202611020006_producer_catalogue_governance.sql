-- Rasvani Phase 4/6: controlled producer verification and catalogue publication.
-- No legal credentials, claims, prices, or producer identities are fabricated.

alter table public.producer_applications
  add column if not exists producer_profile_id uuid references public.producer_profiles(id);

create index if not exists producer_applications_review_queue_idx
  on public.producer_applications(status, created_at);
create index if not exists products_catalogue_review_idx
  on public.products(approval_status, created_at);
create index if not exists producer_facilities_review_idx
  on public.producer_facilities(approval_status, producer_id);

-- Review an application. Producer role assignment happens only after approval and
-- is performed by this trusted database function, never by user-editable metadata.
create or replace function public.review_producer_application(
  p_application_id uuid, p_decision text, p_reason text
) returns uuid
language plpgsql security definer set search_path=public,auth as $$
declare
  v_user uuid := auth.uid();
  v_app public.producer_applications%rowtype;
  v_profile_id uuid;
  v_email text;
begin
  if v_user is null or not (public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Admin role required';
  end if;
  if p_decision not in ('approved','rejected') then raise exception 'Decision must be approved or rejected'; end if;
  if p_reason is null or length(trim(p_reason)) < 3 then raise exception 'Review reason is required'; end if;

  select * into v_app from public.producer_applications where id=p_application_id for update;
  if not found then raise exception 'Producer application not found'; end if;
  if v_app.status in ('approved','rejected','archived') then raise exception 'Application has already reached a terminal state'; end if;

  update public.producer_applications
    set status=p_decision::public.record_status, reviewer_id=v_user, reviewed_at=now()
    where id=p_application_id;

  if p_decision='approved' then
    select email into v_email from auth.users where id=v_app.applicant_user_id;
    select id into v_profile_id from public.producer_profiles
      where user_id=v_app.applicant_user_id and v_app.applicant_user_id is not null
      order by created_at limit 1 for update;
    if v_profile_id is null then
      insert into public.producer_profiles(user_id,legal_name,home_region_id,application_status,contact_email,verification_notes)
      values(v_app.applicant_user_id,v_app.legal_name,v_app.region_id,'approved',v_email,trim(p_reason))
      returning id into v_profile_id;
    else
      update public.producer_profiles set legal_name=v_app.legal_name,home_region_id=v_app.region_id,
        application_status='approved',contact_email=coalesce(v_email,contact_email),verification_notes=trim(p_reason),updated_at=now()
      where id=v_profile_id;
    end if;
    update public.producer_applications set producer_profile_id=v_profile_id where id=p_application_id;
    if v_app.applicant_user_id is not null then
      insert into public.user_roles(user_id,role,assigned_by)
      values(v_app.applicant_user_id,'producer',v_user)
      on conflict(user_id,role) do nothing;
    end if;
  end if;

  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
  values(v_user,'producer.application_review','producer_application',p_application_id::text,
    jsonb_build_object('decision',p_decision,'reason',trim(p_reason),'producer_profile_id',v_profile_id));
  return v_profile_id;
end;
$$;
revoke all on function public.review_producer_application(uuid,text,text) from public,anon;
grant execute on function public.review_producer_application(uuid,text,text) to authenticated;

-- Facility approval is separate from producer approval and is time-bounded when dates are supplied.
create or replace function public.review_producer_facility(
  p_facility_id uuid, p_decision text, p_reason text, p_approved_from date default null, p_approved_until date default null
) returns void
language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid(); v_producer uuid;
begin
  if v_user is null or not (public.has_app_role('admin') or public.has_app_role('super_admin') or public.has_app_role('quality_reviewer')) then
    raise exception 'Reviewer role required';
  end if;
  if p_decision not in ('approved','rejected') then raise exception 'Decision must be approved or rejected'; end if;
  if p_reason is null or length(trim(p_reason))<3 then raise exception 'Review reason is required'; end if;
  if p_decision='approved' and p_approved_until is not null and p_approved_from is not null and p_approved_until<p_approved_from then
    raise exception 'Approval end date cannot precede start date';
  end if;
  select producer_id into v_producer from public.producer_facilities where id=p_facility_id for update;
  if not found then raise exception 'Facility not found'; end if;
  if not exists(select 1 from public.producer_profiles where id=v_producer and application_status='approved') then
    raise exception 'Producer must be approved before facility approval';
  end if;
  update public.producer_facilities set approval_status=p_decision::public.record_status,
    approved_from=case when p_decision='approved' then coalesce(p_approved_from,current_date) else null end,
    approved_until=case when p_decision='approved' then p_approved_until else null end
    where id=p_facility_id;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
  values(v_user,'producer.facility_review','producer_facility',p_facility_id::text,
    jsonb_build_object('decision',p_decision,'reason',trim(p_reason),'approved_from',p_approved_from,'approved_until',p_approved_until));
end;
$$;
revoke all on function public.review_producer_facility(uuid,text,text,date,date) from public,anon;
grant execute on function public.review_producer_facility(uuid,text,text,date,date) to authenticated;

-- Claim evidence must be reviewed before a product can be approved. Product approval
-- is distinct from publication; editorial/catalogue publication is a separate action.
create or replace function public.review_product_claim(
  p_claim_id uuid, p_decision text, p_reason text
) returns void
language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid();
begin
  if v_user is null or not (public.has_app_role('quality_reviewer') or public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Quality reviewer role required';
  end if;
  if p_decision not in ('approved','rejected') then raise exception 'Decision must be approved or rejected'; end if;
  if p_reason is null or length(trim(p_reason))<3 then raise exception 'Review reason is required'; end if;
  update public.product_claim_reviews set review_status=p_decision::public.record_status,reviewer_id=v_user,reviewed_at=now()
    where id=p_claim_id and review_status='pending_review';
  if not found then raise exception 'Pending product claim not found'; end if;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
  values(v_user,'catalogue.claim_review','product_claim',p_claim_id::text,jsonb_build_object('decision',p_decision,'reason',trim(p_reason)));
end;
$$;
revoke all on function public.review_product_claim(uuid,text,text) from public,anon;
grant execute on function public.review_product_claim(uuid,text,text) to authenticated;

create or replace function public.review_product_for_catalogue(
  p_product_id uuid, p_decision text, p_reason text
) returns void
language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid(); v_producer uuid; v_category uuid;
begin
  if v_user is null or not (public.has_app_role('admin') or public.has_app_role('super_admin') or public.has_app_role('quality_reviewer')) then
    raise exception 'Catalogue reviewer role required';
  end if;
  if p_decision not in ('approved','rejected') then raise exception 'Decision must be approved or rejected'; end if;
  if p_reason is null or length(trim(p_reason))<3 then raise exception 'Review reason is required'; end if;
  select producer_id,category_id into v_producer,v_category from public.products where id=p_product_id for update;
  if not found then raise exception 'Product not found'; end if;
  if p_decision='approved' then
    if v_producer is null or not exists(select 1 from public.producer_profiles where id=v_producer and application_status='approved') then
      raise exception 'An approved producer is required';
    end if;
    if not exists(select 1 from public.producer_facilities where producer_id=v_producer and approval_status='approved'
      and (approved_from is null or approved_from<=current_date) and (approved_until is null or approved_until>=current_date)) then
      raise exception 'At least one currently approved producer facility is required';
    end if;
    if v_category is null or not exists(select 1 from public.categories where id=v_category and active) then
      raise exception 'An active category is required';
    end if;
    if exists(select 1 from public.product_claim_reviews where product_id=p_product_id and review_status<>'approved') then
      raise exception 'All submitted product claims must be approved first';
    end if;
  end if;
  update public.products set approval_status=p_decision::public.record_status,published_at=null,updated_at=now()
    where id=p_product_id;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
  values(v_user,'catalogue.product_review','product',p_product_id::text,jsonb_build_object('decision',p_decision,'reason',trim(p_reason)));
end;
$$;
revoke all on function public.review_product_for_catalogue(uuid,text,text) from public,anon;
grant execute on function public.review_product_for_catalogue(uuid,text,text) to authenticated;

create or replace function public.publish_catalogue_product(p_product_id uuid)
returns void language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid();
begin
  if v_user is null or not (public.has_app_role('content_editor') or public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Content editor role required';
  end if;
  update public.products p set published_at=now(),updated_at=now()
  where p.id=p_product_id and p.approval_status='approved'
    and exists(select 1 from public.producer_profiles pp where pp.id=p.producer_id and pp.application_status='approved')
    and exists(select 1 from public.producer_facilities pf where pf.producer_id=p.producer_id and pf.approval_status='approved'
      and (pf.approved_from is null or pf.approved_from<=current_date) and (pf.approved_until is null or pf.approved_until>=current_date))
    and exists(select 1 from public.categories c where c.id=p.category_id and c.active)
    and not exists(select 1 from public.product_claim_reviews cr where cr.product_id=p.id and cr.review_status<>'approved');
  if not found then raise exception 'Product is not eligible for publication'; end if;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
  values(v_user,'catalogue.product_publish','product',p_product_id::text,'{}'::jsonb);
end;
$$;
revoke all on function public.publish_catalogue_product(uuid) from public,anon;
grant execute on function public.publish_catalogue_product(uuid) to authenticated;

-- Public reads remain limited to approved and published catalogue records (policies from migration 002).
-- All workflow tables remain protected from direct browser writes.
