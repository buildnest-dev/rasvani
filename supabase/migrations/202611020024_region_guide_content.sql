-- Phase 3: evidence-reviewed state / Union Territory overview copy.
-- Region taxonomy remains distinct from editorial publication. No state claims or foods are seeded.

create table public.region_guides (
  id uuid primary key default gen_random_uuid(),
  region_id text not null unique references public.regions(id) on delete restrict,
  introduction text check (introduction is null or length(trim(introduction)) between 1 and 500),
  food_heritage_note text check (food_heritage_note is null or length(trim(food_heritage_note)) between 1 and 2000),
  evidence_reference text not null check (length(trim(evidence_reference)) between 1 and 1000),
  publication_status public.record_status not null default 'draft',
  created_by uuid references auth.users(id),
  reviewer_id uuid references auth.users(id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index region_guides_public_idx on public.region_guides(region_id) where publication_status='approved';

alter table public.region_guides enable row level security;
revoke all on table public.region_guides from anon, authenticated;
grant all on table public.region_guides to service_role;
grant select on table public.region_guides to anon, authenticated;
create policy approved_region_guides_public_read on public.region_guides
for select to anon, authenticated using (publication_status='approved');

create or replace function public.save_region_guide_draft(
  p_guide_id uuid, p_region_id text, p_introduction text, p_food_heritage_note text, p_evidence_reference text
) returns uuid language plpgsql security definer set search_path=public,auth as $$
declare
  v_user uuid:=auth.uid();
  v_id uuid;
  v_author uuid;
begin
  if v_user is null or not (public.has_app_role('content_editor') or public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Regional content editor role required';
  end if;
  if not exists(select 1 from public.regions where id=p_region_id) then raise exception 'Unknown region'; end if;
  v_id := p_guide_id;
  if v_id is null then select id into v_id from public.region_guides where region_id=p_region_id for update; end if;
  v_id := coalesce(v_id,gen_random_uuid());
  if p_introduction is not null and length(trim(p_introduction))>500 then raise exception 'Region introduction is too long'; end if;
  if p_food_heritage_note is not null and length(trim(p_food_heritage_note))>2000 then raise exception 'Region food heritage note is too long'; end if;
  if nullif(trim(p_evidence_reference),'') is null or length(trim(p_evidence_reference))>1000 then raise exception 'Evidence reference is required'; end if;

  select created_by into v_author from public.region_guides where id=v_id for update;
  if found and exists(select 1 from public.region_guides where id=v_id and region_id<>p_region_id) then raise exception 'Guide ID belongs to a different region'; end if;
  if found and v_author is distinct from v_user and not (public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Only the author or admin may edit this region guide';
  end if;
  insert into public.region_guides(id,region_id,introduction,food_heritage_note,evidence_reference,publication_status,created_by,reviewer_id,reviewed_at,review_note,updated_at)
  values(v_id,p_region_id,nullif(trim(p_introduction),''),nullif(trim(p_food_heritage_note),''),trim(p_evidence_reference),'draft',v_user,null,null,null,now())
  on conflict(id) do update set region_id=excluded.region_id,introduction=excluded.introduction,food_heritage_note=excluded.food_heritage_note,evidence_reference=excluded.evidence_reference,publication_status='draft',reviewer_id=null,reviewed_at=null,review_note=null,updated_at=now();
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
  values(v_user,'regional.region_guide_draft_saved','region_guides',v_id::text,jsonb_build_object('region_id',p_region_id,'has_introduction',p_introduction is not null,'has_food_heritage_note',p_food_heritage_note is not null));
  return v_id;
end; $$;
revoke all on function public.save_region_guide_draft(uuid,text,text,text,text) from public,anon;
grant execute on function public.save_region_guide_draft(uuid,text,text,text,text) to authenticated;

create or replace function public.get_regional_discovery_review_queue()
returns table(record_type text, record_id uuid, parent_name text, record_name text, region_name text, detail text, evidence_reference text, submitted_at timestamptz)
language plpgsql security definer set search_path=public,auth as $$
begin
  if auth.uid() is null or not (public.has_app_role('quality_reviewer') or public.has_app_role('content_editor') or public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Regional review role required'; end if;
  return query
    select 'region_guide'::text,g.id,null::text,r.name,r.name,concat_ws(E'\n\n',g.introduction,g.food_heritage_note),g.evidence_reference,g.updated_at
      from public.region_guides g join public.regions r on r.id=g.region_id where g.publication_status='pending_review'
    union all
    select 'district'::text,d.id,null::text,d.name,r.name,concat_ws(E'\n\n',d.introduction,d.heritage_note),d.evidence_reference,d.updated_at
      from public.districts d join public.regions r on r.id=d.region_id where d.publication_status='pending_review'
    union all
    select 'association'::text,a.id,p.name,a.association_type,r.name,a.relationship_note,a.evidence_reference,a.updated_at
      from public.product_regional_associations a join public.products p on p.id=a.product_id join public.regions r on r.id=a.region_id where a.review_status='pending_review'
    union all
    select 'search_term'::text,t.id,p.name,t.term,t.locale,t.term_type,t.evidence_reference,t.updated_at
      from public.product_search_terms t join public.products p on p.id=t.product_id where t.review_status='pending_review'
    order by submitted_at asc limit 200;
end; $$;
revoke all on function public.get_regional_discovery_review_queue() from public,anon;
grant execute on function public.get_regional_discovery_review_queue() to authenticated;

create or replace function public.submit_regional_discovery_record(p_record_type text,p_record_id uuid)
returns void language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid();
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_record_type='region_guide' then
    update public.region_guides set publication_status='pending_review',reviewer_id=null,reviewed_at=null,review_note=null,updated_at=now() where id=p_record_id and publication_status in ('draft','rejected') and (created_by=v_user or public.has_app_role('admin') or public.has_app_role('super_admin'));
  elsif p_record_type='district' then
    update public.districts set publication_status='pending_review',reviewer_id=null,reviewed_at=null,review_note=null,updated_at=now() where id=p_record_id and publication_status in ('draft','rejected') and (created_by=v_user or public.has_app_role('admin') or public.has_app_role('super_admin'));
  elsif p_record_type='association' then
    update public.product_regional_associations set review_status='pending_review',reviewer_id=null,reviewed_at=null,review_note=null,updated_at=now() where id=p_record_id and review_status in ('draft','rejected') and (created_by=v_user or public.has_app_role('admin') or public.has_app_role('super_admin'));
  elsif p_record_type='search_term' then
    update public.product_search_terms set review_status='pending_review',reviewer_id=null,reviewed_at=null,review_note=null,updated_at=now() where id=p_record_id and review_status in ('draft','rejected') and (created_by=v_user or public.has_app_role('admin') or public.has_app_role('super_admin'));
  else raise exception 'Unsupported regional record type'; end if;
  if not found then raise exception 'Draft not found or submit permission denied'; end if;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata) values(v_user,'regional.record_submitted',p_record_type,p_record_id::text,'{}'::jsonb);
end; $$;
revoke all on function public.submit_regional_discovery_record(text,uuid) from public,anon;
grant execute on function public.submit_regional_discovery_record(text,uuid) to authenticated;

create or replace function public.review_regional_discovery_record(p_record_type text,p_record_id uuid,p_decision text,p_reason text)
returns void language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid();
begin
  if v_user is null or not (public.has_app_role('quality_reviewer') or public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Regional quality reviewer role required'; end if;
  if p_decision not in ('approved','rejected') or nullif(trim(p_reason),'') is null then raise exception 'Review decision and reason are required'; end if;
  if p_record_type='region_guide' then
    if exists(select 1 from public.region_guides where id=p_record_id and created_by=v_user) then
      raise exception 'Authors cannot review their own regional guide';
    end if;
    update public.region_guides set publication_status=p_decision::public.record_status,reviewer_id=v_user,reviewed_at=now(),review_note=trim(p_reason),updated_at=now() where id=p_record_id and publication_status='pending_review';
  elsif p_record_type='district' then
    update public.districts set publication_status=p_decision::public.record_status,reviewer_id=v_user,reviewed_at=now(),review_note=trim(p_reason),updated_at=now() where id=p_record_id and publication_status='pending_review';
  elsif p_record_type='association' then
    update public.product_regional_associations set review_status=p_decision::public.record_status,reviewer_id=v_user,reviewed_at=now(),review_note=trim(p_reason),updated_at=now() where id=p_record_id and review_status='pending_review';
  elsif p_record_type='search_term' then
    update public.product_search_terms set review_status=p_decision::public.record_status,reviewer_id=v_user,reviewed_at=now(),review_note=trim(p_reason),updated_at=now() where id=p_record_id and review_status='pending_review';
  else raise exception 'Unsupported regional record type'; end if;
  if not found then raise exception 'Regional record is not awaiting review'; end if;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata) values(v_user,'regional.record_reviewed',p_record_type,p_record_id::text,jsonb_build_object('decision',p_decision,'reason',trim(p_reason)));
end; $$;
revoke all on function public.review_regional_discovery_record(text,uuid,text,text) from public,anon;
grant execute on function public.review_regional_discovery_record(text,uuid,text,text) to authenticated;

comment on table public.region_guides is 'Evidence-backed state and Union Territory overview copy. Publicly visible only after independent editorial/quality approval.';
