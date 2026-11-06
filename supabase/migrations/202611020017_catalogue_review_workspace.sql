-- Rasvani catalogue review workspace. Queue RPCs expose only fields required for review.
create or replace function public.get_catalogue_review_queue()
returns table(product_id uuid, sku text, product_name text, description text, category_name text, producer_name text, approval_status text, created_at timestamptz, pending_claim_count bigint)
language plpgsql security definer set search_path=public,auth as $$
begin
  if auth.uid() is null or not (public.has_app_role('quality_reviewer') or public.has_app_role('admin') or public.has_app_role('super_admin') or public.has_app_role('content_editor')) then
    raise exception 'Catalogue review role required';
  end if;
  return query
    select p.id,p.sku,p.name,p.description,c.name,pp.legal_name,p.approval_status::text,p.created_at,
      (select count(*) from public.product_claim_reviews cr where cr.product_id=p.id and cr.review_status='pending_review')
    from public.products p
    left join public.categories c on c.id=p.category_id
    left join public.producer_profiles pp on pp.id=p.producer_id
    where p.approval_status in ('draft','pending_review','rejected','approved')
      and (p.published_at is null)
    order by case p.approval_status when 'pending_review' then 0 when 'draft' then 1 when 'approved' then 2 else 3 end,p.created_at asc
    limit 100;
end;
$$;
revoke all on function public.get_catalogue_review_queue() from public,anon;
grant execute on function public.get_catalogue_review_queue() to authenticated;

create or replace function public.get_catalogue_claim_review_queue()
returns table(claim_id uuid, product_id uuid, product_name text, sku text, claim_type text, claim_text text, evidence_reference text, review_status text)
language plpgsql security definer set search_path=public,auth as $$
begin
  if auth.uid() is null or not (public.has_app_role('quality_reviewer') or public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Quality reviewer role required';
  end if;
  return query
    select cr.id,p.id,p.name,p.sku,cr.claim_type,cr.claim_text,cr.evidence_reference,cr.review_status::text
    from public.product_claim_reviews cr join public.products p on p.id=cr.product_id
    where cr.review_status='pending_review'
    order by p.created_at asc,cr.id asc limit 150;
end;
$$;
revoke all on function public.get_catalogue_claim_review_queue() from public,anon;
grant execute on function public.get_catalogue_claim_review_queue() to authenticated;
