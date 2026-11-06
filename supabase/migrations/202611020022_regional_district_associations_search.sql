-- Rasvani Phase 3 regional discovery: reviewed district taxonomy, evidence-backed
-- product/region relationships, and locale-aware search terms.
-- No district/food-origin examples are seeded. A relationship never implies exclusivity.

create table public.districts (
  id uuid primary key default gen_random_uuid(),
  region_id text not null references public.regions(id) on delete restrict,
  name text not null check (length(trim(name)) between 1 and 120),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  evidence_reference text not null check (length(trim(evidence_reference)) between 1 and 1000),
  publication_status public.record_status not null default 'draft',
  created_by uuid references auth.users(id),
  reviewer_id uuid references auth.users(id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(region_id, slug)
);
create index districts_public_region_idx on public.districts(region_id, name) where publication_status='approved';

create table public.product_regional_associations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  region_id text not null references public.regions(id) on delete restrict,
  district_id uuid references public.districts(id) on delete restrict,
  association_type text not null check (association_type in ('origin_claim','produced_in','traditionally_associated_with','popular_in')),
  relationship_note text,
  evidence_reference text not null check (length(trim(evidence_reference)) between 1 and 1000),
  review_status public.record_status not null default 'draft',
  created_by uuid references auth.users(id),
  reviewer_id uuid references auth.users(id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index product_regional_associations_public_idx on public.product_regional_associations(region_id, product_id) where review_status='approved';
create index product_regional_associations_district_idx on public.product_regional_associations(district_id) where review_status='approved';

create table public.product_search_terms (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  locale text not null check (locale in ('en','hi','bn','ta','te','mr','gu','pa','kn','ml','or','as')),
  term text not null check (length(trim(term)) between 1 and 160),
  normalized_term text generated always as (lower(trim(term))) stored,
  term_type text not null check (term_type in ('name_variant','regional_spelling','transliteration','synonym')),
  evidence_reference text not null check (length(trim(evidence_reference)) between 1 and 1000),
  review_status public.record_status not null default 'draft',
  created_by uuid references auth.users(id),
  reviewer_id uuid references auth.users(id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(product_id, locale, normalized_term)
);
create index product_search_terms_lookup_idx on public.product_search_terms(locale, normalized_term) where review_status='approved';

-- Ensure a district belongs to the same region as its product association.
create or replace function public.validate_product_regional_association_district()
returns trigger language plpgsql set search_path=public as $$
begin
  if new.district_id is not null and not exists (
    select 1 from public.districts d where d.id=new.district_id and d.region_id=new.region_id
  ) then
    raise exception 'Selected district does not belong to the selected region';
  end if;
  return new;
end; $$;
create trigger product_regional_association_district_guard
before insert or update of district_id, region_id on public.product_regional_associations
for each row execute function public.validate_product_regional_association_district();

alter table public.districts enable row level security;
alter table public.product_regional_associations enable row level security;
alter table public.product_search_terms enable row level security;
revoke all on table public.districts, public.product_regional_associations, public.product_search_terms from anon, authenticated;
grant all on table public.districts, public.product_regional_associations, public.product_search_terms to service_role;
grant select on public.districts, public.product_regional_associations, public.product_search_terms to anon, authenticated;

create policy approved_districts_public_read on public.districts
for select to anon, authenticated using (publication_status='approved');
create policy approved_product_regional_associations_public_read on public.product_regional_associations
for select to anon, authenticated using (
  review_status='approved'
  and exists (select 1 from public.products p where p.id=product_regional_associations.product_id and p.approval_status='approved' and p.published_at is not null)
  and (district_id is null or exists (select 1 from public.districts d where d.id=product_regional_associations.district_id and d.publication_status='approved'))
);
create policy approved_product_search_terms_public_read on public.product_search_terms
for select to anon, authenticated using (
  review_status='approved'
  and exists (select 1 from public.products p where p.id=product_search_terms.product_id and p.approval_status='approved' and p.published_at is not null)
);

-- Draft creation is restricted to staff with regional/editorial responsibility.
create or replace function public.save_district_draft(
  p_district_id uuid, p_region_id text, p_name text, p_slug text, p_evidence_reference text
) returns uuid language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid(); v_id uuid:=coalesce(p_district_id,gen_random_uuid()); v_author uuid;
begin
  if v_user is null or not (public.has_app_role('content_editor') or public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Regional content editor role required'; end if;
  if not exists(select 1 from public.regions where id=p_region_id) then raise exception 'Unknown region'; end if;
  if nullif(trim(p_name),'') is null or length(trim(p_name))>120 or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or nullif(trim(p_evidence_reference),'') is null then raise exception 'District name, valid slug and evidence reference are required'; end if;
  select created_by into v_author from public.districts where id=v_id for update;
  if found and v_author is distinct from v_user and not (public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Only the author or admin may edit this district'; end if;
  insert into public.districts(id,region_id,name,slug,evidence_reference,publication_status,created_by,reviewer_id,reviewed_at,review_note,updated_at)
  values(v_id,p_region_id,trim(p_name),p_slug,trim(p_evidence_reference),'draft',v_user,null,null,null,now())
  on conflict(id) do update set region_id=excluded.region_id,name=excluded.name,slug=excluded.slug,evidence_reference=excluded.evidence_reference,publication_status='draft',reviewer_id=null,reviewed_at=null,review_note=null,updated_at=now();
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata) values(v_user,'regional.district_draft_saved','districts',v_id::text,jsonb_build_object('region_id',p_region_id,'slug',p_slug));
  return v_id;
end; $$;
revoke all on function public.save_district_draft(uuid,text,text,text,text) from public,anon;
grant execute on function public.save_district_draft(uuid,text,text,text,text) to authenticated;

create or replace function public.save_product_regional_association_draft(
  p_association_id uuid, p_product_id uuid, p_region_id text, p_district_id uuid,
  p_association_type text, p_relationship_note text, p_evidence_reference text
) returns uuid language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid(); v_id uuid:=coalesce(p_association_id,gen_random_uuid()); v_author uuid;
begin
  if v_user is null or not (public.has_app_role('content_editor') or public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Regional content editor role required'; end if;
  if not exists(select 1 from public.products where id=p_product_id) or not exists(select 1 from public.regions where id=p_region_id) then raise exception 'Product or region not found'; end if;
  if p_association_type not in ('origin_claim','produced_in','traditionally_associated_with','popular_in') or nullif(trim(p_evidence_reference),'') is null then raise exception 'A supported relationship type and evidence reference are required'; end if;
  if p_district_id is not null and not exists(select 1 from public.districts where id=p_district_id and region_id=p_region_id) then raise exception 'District does not belong to the selected region'; end if;
  select created_by into v_author from public.product_regional_associations where id=v_id for update;
  if found and v_author is distinct from v_user and not (public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Only the author or admin may edit this association'; end if;
  insert into public.product_regional_associations(id,product_id,region_id,district_id,association_type,relationship_note,evidence_reference,review_status,created_by,reviewer_id,reviewed_at,review_note,updated_at)
  values(v_id,p_product_id,p_region_id,p_district_id,p_association_type,nullif(trim(p_relationship_note),''),trim(p_evidence_reference),'draft',v_user,null,null,null,now())
  on conflict(id) do update set product_id=excluded.product_id,region_id=excluded.region_id,district_id=excluded.district_id,association_type=excluded.association_type,relationship_note=excluded.relationship_note,evidence_reference=excluded.evidence_reference,review_status='draft',reviewer_id=null,reviewed_at=null,review_note=null,updated_at=now();
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata) values(v_user,'regional.association_draft_saved','product_regional_associations',v_id::text,jsonb_build_object('product_id',p_product_id,'region_id',p_region_id,'association_type',p_association_type));
  return v_id;
end; $$;
revoke all on function public.save_product_regional_association_draft(uuid,uuid,text,uuid,text,text,text) from public,anon;
grant execute on function public.save_product_regional_association_draft(uuid,uuid,text,uuid,text,text,text) to authenticated;

create or replace function public.save_product_search_term_draft(
  p_term_id uuid, p_product_id uuid, p_locale text, p_term text, p_term_type text, p_evidence_reference text
) returns uuid language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid(); v_id uuid:=coalesce(p_term_id,gen_random_uuid()); v_author uuid;
begin
  if v_user is null or not (public.has_app_role('content_editor') or public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Regional content editor role required'; end if;
  if not exists(select 1 from public.products where id=p_product_id) then raise exception 'Product not found'; end if;
  if p_locale not in ('en','hi','bn','ta','te','mr','gu','pa','kn','ml','or','as') or nullif(trim(p_term),'') is null or length(trim(p_term))>160 or p_term_type not in ('name_variant','regional_spelling','transliteration','synonym') or nullif(trim(p_evidence_reference),'') is null then raise exception 'Supported locale, term, term type and evidence reference are required'; end if;
  select created_by into v_author from public.product_search_terms where id=v_id for update;
  if found and v_author is distinct from v_user and not (public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Only the author or admin may edit this search term'; end if;
  insert into public.product_search_terms(id,product_id,locale,term,term_type,evidence_reference,review_status,created_by,reviewer_id,reviewed_at,review_note,updated_at)
  values(v_id,p_product_id,p_locale,trim(p_term),p_term_type,trim(p_evidence_reference),'draft',v_user,null,null,null,now())
  on conflict(id) do update set product_id=excluded.product_id,locale=excluded.locale,term=excluded.term,term_type=excluded.term_type,evidence_reference=excluded.evidence_reference,review_status='draft',reviewer_id=null,reviewed_at=null,review_note=null,updated_at=now();
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata) values(v_user,'regional.search_term_draft_saved','product_search_terms',v_id::text,jsonb_build_object('product_id',p_product_id,'locale',p_locale,'term_type',p_term_type));
  return v_id;
end; $$;
revoke all on function public.save_product_search_term_draft(uuid,uuid,text,text,text,text) from public,anon;
grant execute on function public.save_product_search_term_draft(uuid,uuid,text,text,text,text) to authenticated;

-- One queue for all regional evidence review; returned content is limited to records
-- awaiting review and requires an authorized staff role.
create or replace function public.get_regional_discovery_review_queue()
returns table(record_type text, record_id uuid, parent_name text, record_name text, region_name text, detail text, evidence_reference text, submitted_at timestamptz)
language plpgsql security definer set search_path=public,auth as $$
begin
  if auth.uid() is null or not (public.has_app_role('quality_reviewer') or public.has_app_role('content_editor') or public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Regional review role required'; end if;
  return query
    select 'district'::text,d.id,null::text,d.name,r.name,null::text,d.evidence_reference,d.updated_at
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
declare v_user uuid:=auth.uid(); v_author uuid;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_record_type='district' then
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
  if p_record_type='district' then
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

comment on table public.districts is 'Evidence-referenced district taxonomy; only approved records are publicly visible.';
comment on table public.product_regional_associations is 'Evidence-reviewed non-exclusive product/region/district relationships; multiple regions per product are permitted.';
comment on table public.product_search_terms is 'Evidence-reviewed locale-aware name variants, spellings, transliterations and synonyms for published product discovery.';
