-- Rasvani Phase 11: aggregate operational reporting with explicit role gates.
-- No customer/producer PII, commercial assumptions or fabricated KPI targets are exposed.
-- Apply after migrations 001-008.

create index if not exists producer_applications_review_idx
  on public.producer_applications(status, created_at desc);
create index if not exists producer_facilities_review_idx
  on public.producer_facilities(approval_status, created_at desc);
create index if not exists product_claim_reviews_queue_idx
  on public.product_claim_reviews(review_status, product_id);
create index if not exists business_accounts_review_idx
  on public.business_accounts(verification_status, created_at desc);
create index if not exists trade_enquiries_status_idx
  on public.trade_enquiries(status, created_at desc);
create index if not exists receipt_return_cases_status_idx
  on public.receipt_return_cases(status, created_at desc);

-- High-level counts only; never returns names, addresses, order values or contact details.
create or replace function public.get_admin_operations_summary()
returns jsonb
language plpgsql stable security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid(); v_result jsonb;
begin
  if v_user is null or not (public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Admin role required';
  end if;
  select jsonb_build_object(
    'generated_at',now(),
    'producer_applications_pending', (select count(*) from public.producer_applications where status='pending_review'),
    'facilities_pending', (select count(*) from public.producer_facilities where approval_status='pending_review'),
    'products_pending', (select count(*) from public.products where approval_status='pending_review'),
    'claims_pending', (select count(*) from public.product_claim_reviews where review_status='pending_review'),
    'business_accounts_pending', (select count(*) from public.business_accounts where verification_status='pending_review'),
    'editorial_pending', (select count(*) from public.editorial_content where status='pending_review'),
    'translations_pending', (select count(*) from public.editorial_translations where review_status='pending_review'),
    'receipts_pending', (select count(*) from public.receipts where status='pending_inspection'),
    'batches_quarantined', (select count(*) from public.inventory_batches where status='quarantined'),
    'batches_expiring_30d', (select count(*) from public.inventory_batches where status='sellable' and inspection_status='accepted' and coalesce(expiry_date,best_before_date) between current_date and current_date+30),
    'returns_quarantined', (select count(*) from public.receipt_return_cases where status='quarantined'),
    'trade_enquiries_open', (select count(*) from public.trade_enquiries where status in ('new','reviewing')),
    'orders_open', (select count(*) from public.customer_orders where status in ('placed','confirmed','allocated','packed'))
  ) into v_result;
  return v_result;
end; $$;
revoke all on function public.get_admin_operations_summary() from public,anon;
grant execute on function public.get_admin_operations_summary() to authenticated;

-- Warehouse operators receive per-warehouse stock status totals, not customer/order details.
create or replace function public.get_warehouse_stock_summary()
returns jsonb
language plpgsql stable security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid(); v_result jsonb;
begin
  if v_user is null or not (
    public.has_app_role('warehouse_operator') or public.has_app_role('quality_reviewer') or
    public.has_app_role('admin') or public.has_app_role('super_admin')
  ) then raise exception 'Warehouse or quality role required'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'warehouse_id',w.id,'warehouse_code',w.code,'warehouse_name',w.name,
    'sellable_batches',coalesce(s.sellable_batches,0),
    'quarantined_batches',coalesce(s.quarantined_batches,0),
    'rejected_or_damaged_batches',coalesce(s.rejected_or_damaged_batches,0),
    'expired_or_recalled_batches',coalesce(s.expired_or_recalled_batches,0)
  ) order by w.code),'[]'::jsonb)
  into v_result
  from public.warehouses w
  left join lateral (
    select count(*) filter(where b.status='sellable' and b.inspection_status='accepted') as sellable_batches,
      count(*) filter(where b.status='quarantined') as quarantined_batches,
      count(*) filter(where b.status in ('rejected','damaged')) as rejected_or_damaged_batches,
      count(*) filter(where b.status in ('expired','recalled')) as expired_or_recalled_batches
    from public.inventory_batches b where b.warehouse_id=w.id
  ) s on true
  where w.active=true;
  return v_result;
end; $$;
revoke all on function public.get_warehouse_stock_summary() from public,anon;
grant execute on function public.get_warehouse_stock_summary() to authenticated;

-- Editorial locale coverage is an aggregate only; no untranslated content is auto-approved.
create or replace function public.get_editorial_locale_coverage()
returns jsonb
language plpgsql stable security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid(); v_result jsonb;
begin
  if v_user is null or not (
    public.has_app_role('content_editor') or public.has_app_role('quality_reviewer') or
    public.has_app_role('admin') or public.has_app_role('super_admin')
  ) then raise exception 'Editorial or quality role required'; end if;
  select jsonb_agg(jsonb_build_object(
    'locale',l.locale,'approved_translations',coalesce(t.approved_count,0),
    'pending_review',coalesce(t.pending_count,0),'draft_or_rejected',coalesce(t.other_count,0)
  ) order by l.locale) into v_result
  from unnest(array['en','hi','bn','ta','te','mr','gu','pa','kn','ml','or','as']::text[]) l(locale)
  left join lateral (
    select count(*) filter(where et.review_status='approved') as approved_count,
      count(*) filter(where et.review_status='pending_review') as pending_count,
      count(*) filter(where et.review_status in ('draft','rejected')) as other_count
    from public.editorial_translations et where et.locale=l.locale
  ) t on true;
  return coalesce(v_result,'[]'::jsonb);
end; $$;
revoke all on function public.get_editorial_locale_coverage() from public,anon;
grant execute on function public.get_editorial_locale_coverage() to authenticated;

-- These RPCs are read-only aggregates. They intentionally do not provide arbitrary filters,
-- mutation endpoints, customer-level data or exports.
