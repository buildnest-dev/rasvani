-- Phase 3: substantive, evidence-reviewed district guide copy.
-- Text is reviewed as one unit with the district's evidence reference; no seeded claims.
alter table public.districts
  add column introduction text check (introduction is null or length(trim(introduction)) between 1 and 500),
  add column heritage_note text check (heritage_note is null or length(trim(heritage_note)) between 1 and 2000);

drop function if exists public.save_district_draft(uuid,text,text,text,text);

create or replace function public.save_district_draft(
  p_district_id uuid, p_region_id text, p_name text, p_slug text,
  p_evidence_reference text, p_introduction text, p_heritage_note text
) returns uuid language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid(); v_id uuid:=coalesce(p_district_id,gen_random_uuid()); v_author uuid;
begin
  if v_user is null or not (public.has_app_role('content_editor') or public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Regional content editor role required'; end if;
  if not exists(select 1 from public.regions where id=p_region_id) then raise exception 'Unknown region'; end if;
  if nullif(trim(p_name),'') is null or length(trim(p_name))>120 or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or nullif(trim(p_evidence_reference),'') is null then raise exception 'District name, valid slug and evidence reference are required'; end if;
  if p_introduction is not null and length(trim(p_introduction))>500 then raise exception 'District introduction is too long'; end if;
  if p_heritage_note is not null and length(trim(p_heritage_note))>2000 then raise exception 'District heritage note is too long'; end if;
  select created_by into v_author from public.districts where id=v_id for update;
  if found and v_author is distinct from v_user and not (public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Only the author or admin may edit this district'; end if;
  insert into public.districts(id,region_id,name,slug,evidence_reference,introduction,heritage_note,publication_status,created_by,reviewer_id,reviewed_at,review_note,updated_at)
  values(v_id,p_region_id,trim(p_name),p_slug,trim(p_evidence_reference),nullif(trim(p_introduction),''),nullif(trim(p_heritage_note),''),'draft',v_user,null,null,null,now())
  on conflict(id) do update set region_id=excluded.region_id,name=excluded.name,slug=excluded.slug,evidence_reference=excluded.evidence_reference,introduction=excluded.introduction,heritage_note=excluded.heritage_note,publication_status='draft',reviewer_id=null,reviewed_at=null,review_note=null,updated_at=now();
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata) values(v_user,'regional.district_guide_draft_saved','districts',v_id::text,jsonb_build_object('region_id',p_region_id,'slug',p_slug,'has_introduction',p_introduction is not null,'has_heritage_note',p_heritage_note is not null));
  return v_id;
end; $$;
revoke all on function public.save_district_draft(uuid,text,text,text,text,text,text) from public,anon;
grant execute on function public.save_district_draft(uuid,text,text,text,text,text,text) to authenticated;

create or replace function public.get_regional_discovery_review_queue()
returns table(record_type text, record_id uuid, parent_name text, record_name text, region_name text, detail text, evidence_reference text, submitted_at timestamptz)
language plpgsql security definer set search_path=public,auth as $$
begin
  if auth.uid() is null or not (public.has_app_role('quality_reviewer') or public.has_app_role('content_editor') or public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Regional review role required'; end if;
  return query
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

comment on column public.districts.introduction is 'Evidence-backed concise district introduction, visible only after district approval.';
comment on column public.districts.heritage_note is 'Evidence-backed local food heritage context, visible only after district approval.';
