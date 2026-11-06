-- Rasvani public vegetarian discovery safeguard.
-- Existing catalogue records remain unverified until an authorised reviewer
-- records a dietary classification and supporting evidence.

alter table public.products
  add column if not exists dietary_classification text not null default 'unverified'
    check (dietary_classification in ('vegetarian','vegan','non_vegetarian','unverified')),
  add column if not exists dietary_review_status text not null default 'pending_review'
    check (dietary_review_status in ('pending_review','approved','rejected')),
  add column if not exists dietary_evidence_reference text,
  add column if not exists dietary_reviewed_by uuid references auth.users(id),
  add column if not exists dietary_reviewed_at timestamptz;

create index if not exists products_approved_vegetarian_discovery_idx
  on public.products (dietary_classification, dietary_review_status, approval_status, published_at)
  where dietary_classification in ('vegetarian','vegan') and dietary_review_status='approved';

create or replace function public.review_product_dietary_classification(
  p_product_id uuid,
  p_classification text,
  p_decision text,
  p_evidence_reference text,
  p_reason text
) returns void
language plpgsql security definer set search_path=public,auth as $$
declare
  v_user uuid := auth.uid();
  v_product_name text;
begin
  if v_user is null or not (
    public.has_app_role('quality_reviewer') or
    public.has_app_role('admin') or
    public.has_app_role('super_admin')
  ) then
    raise exception 'Product quality reviewer role required';
  end if;
  if p_classification is null or p_classification not in ('vegetarian','vegan','non_vegetarian') then
    raise exception 'Choose vegetarian, vegan or non_vegetarian classification';
  end if;
  if p_decision is null or p_decision not in ('approved','rejected') then
    raise exception 'Decision must be approved or rejected';
  end if;
  if p_reason is null or length(trim(p_reason)) < 3 then
    raise exception 'Dietary review reason is required';
  end if;
  if p_decision='approved' and (p_evidence_reference is null or length(trim(p_evidence_reference)) < 5) then
    raise exception 'Supporting dietary evidence reference is required for approval';
  end if;

  select name into v_product_name from public.products where id=p_product_id for update;
  if not found then raise exception 'Product not found'; end if;

  update public.products
     set dietary_classification=case when p_decision='approved' then p_classification else 'unverified' end,
         dietary_review_status=p_decision,
         dietary_evidence_reference=case when p_decision='approved' then trim(p_evidence_reference) else null end,
         dietary_reviewed_by=v_user,
         dietary_reviewed_at=now(),
         updated_at=now()
   where id=p_product_id;

  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
  values(v_user,'catalogue.product_dietary_review','product',p_product_id::text,
    jsonb_build_object(
      'product_name',v_product_name,
      'classification',case when p_decision='approved' then p_classification else 'unverified' end,
      'decision',p_decision,
      'evidence_reference',case when p_decision='approved' then trim(p_evidence_reference) else null end,
      'reason',trim(p_reason)
    ));
end;
$$;

revoke all on function public.review_product_dietary_classification(uuid,text,text,text,text) from public,anon;
grant execute on function public.review_product_dietary_classification(uuid,text,text,text,text) to authenticated;

comment on column public.products.dietary_classification is
  'Dietary category reviewed by quality staff; unverified is never eligible for vegetarian discovery.';
comment on column public.products.dietary_review_status is
  'Separate quality review gate for public vegetarian/vegan discovery.';
comment on function public.review_product_dietary_classification(uuid,text,text,text,text) is
  'Role-protected dietary classification decision with mandatory evidence and audit log. Only approved vegetarian/vegan products may enter vegetarian discovery.';
