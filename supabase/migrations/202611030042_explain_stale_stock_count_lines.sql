-- Phase 10: explain stale snapshot state at the affected batch-line level.
-- This is a read-only diagnostic extension. It never refreshes snapshots or
-- changes inventory and preserves the independent approval guard.

-- Completed counts are historical decisions. Their expected snapshot can differ
-- after approved adjustments, so only active counts can be labelled stale.
create or replace function public.get_warehouse_inventory_stock_counts()
returns table(
  stock_count_id uuid, warehouse_id uuid, warehouse_name text, status text,
  created_by uuid, started_at timestamptz, submitted_at timestamptz, reviewed_at timestamptz,
  batch_line_count bigint, counted_line_count bigint, variance_line_count bigint,
  escalation_level text, warning_line_count bigint, critical_line_count bigint,
  review_required_line_count bigint, cancelled_by uuid, cancelled_at timestamptz,
  cancellation_reason text, submitted_by uuid, reviewed_by uuid, review_reason text,
  count_notes text, stale_line_count bigint, is_stale boolean
)
language plpgsql stable security definer set search_path=public,auth as $$
begin
  if auth.uid() is null or not (
    public.has_app_role('warehouse_operator') or
    public.has_app_role('quality_reviewer') or
    public.has_app_role('admin') or
    public.has_app_role('super_admin')
  ) then
    raise exception 'Warehouse or quality role required';
  end if;

  return query
  select
    c.id, c.warehouse_id, w.name, c.status, c.created_by, c.created_at,
    c.submitted_at, c.reviewed_at, count(l.id),
    count(l.id) filter (where l.counted_quantity is not null),
    count(l.id) filter (where l.counted_quantity is not null and l.counted_quantity <> l.expected_quantity),
    c.escalation_level,
    count(l.id) filter (where l.escalation_level = 'warning'),
    count(l.id) filter (where l.escalation_level = 'critical'),
    count(l.id) filter (where l.escalation_level = 'review_required'),
    c.cancelled_by, c.cancelled_at, c.cancellation_reason, c.submitted_by,
    c.reviewed_by, c.review_reason, c.notes,
    count(l.id) filter (where c.status in ('counting','submitted') and (
      b.id is null or b.stock_updated_at is distinct from l.expected_stock_updated_at or
      b.quantity_on_hand is distinct from l.expected_quantity or b.status = 'disposed'
    )),
    coalesce(bool_or(c.status in ('counting','submitted') and (
      b.id is null or b.stock_updated_at is distinct from l.expected_stock_updated_at or
      b.quantity_on_hand is distinct from l.expected_quantity or b.status = 'disposed'
    )), false)
  from public.inventory_stock_counts c
  join public.warehouses w on w.id=c.warehouse_id
  left join public.inventory_stock_count_lines l on l.stock_count_id=c.id
  left join public.inventory_batches b on b.id=l.batch_id
  group by c.id, w.name
  order by c.created_at desc
  limit 30;
end;
$$;
revoke all on function public.get_warehouse_inventory_stock_counts() from public,anon;
grant execute on function public.get_warehouse_inventory_stock_counts() to authenticated;

drop function if exists public.get_warehouse_inventory_stock_count_lines(uuid);

create function public.get_warehouse_inventory_stock_count_lines(p_stock_count_id uuid)
returns table(
  batch_id uuid,
  product_name text,
  sku text,
  batch_code text,
  bin_code text,
  expected_quantity numeric,
  counted_quantity numeric,
  unit text,
  count_notes text,
  line_counted_at timestamptz,
  variance_percent numeric,
  escalation_level text,
  review_finding text,
  review_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  current_quantity numeric,
  current_stock_status text,
  current_inspection_status text,
  is_stale boolean,
  stale_reasons text[]
)
language plpgsql stable security definer set search_path=public,auth as $$
begin
  if auth.uid() is null or not (
    public.has_app_role('warehouse_operator') or
    public.has_app_role('quality_reviewer') or
    public.has_app_role('admin') or
    public.has_app_role('super_admin')
  ) then
    raise exception 'Warehouse or quality role required';
  end if;
  if not exists(select 1 from public.inventory_stock_counts where id=p_stock_count_id) then
    raise exception 'Stock count not found';
  end if;

  return query
  select
    l.batch_id,
    coalesce(p.name, 'Unavailable product'),
    coalesce(p.sku, ''),
    coalesce(b.batch_code, 'Unavailable batch'),
    bin.bin_code,
    l.expected_quantity,
    l.counted_quantity,
    coalesce(b.unit, '—'),
    l.count_notes,
    l.counted_at,
    l.variance_percent,
    l.escalation_level,
    l.review_finding,
    l.review_note,
    l.reviewed_by,
    l.reviewed_at,
    b.quantity_on_hand,
    b.status,
    b.inspection_status,
    cardinality(stale.reasons) > 0,
    stale.reasons
  from public.inventory_stock_count_lines l
  join public.inventory_stock_counts c on c.id=l.stock_count_id
  left join public.inventory_batches b on b.id=l.batch_id
  left join public.products p on p.id=b.product_id
  left join public.warehouse_bins bin on bin.id=b.bin_id
  cross join lateral (
    select case when c.status in ('counting','submitted') then array_remove(array[
      case when b.id is null then 'batch_unavailable' end,
      case when b.id is not null and b.quantity_on_hand is distinct from l.expected_quantity then 'quantity_changed' end,
      case when b.id is not null and b.status = 'disposed' then 'batch_disposed' end,
      case when b.id is not null
        and b.stock_updated_at is distinct from l.expected_stock_updated_at
        and b.quantity_on_hand is not distinct from l.expected_quantity
        and b.status is distinct from 'disposed'
        then 'other_stock_attributes_changed' end
    ]::text[], null) else array[]::text[] end as reasons
  ) stale
  where l.stock_count_id=p_stock_count_id
  order by bin.bin_code nulls last, coalesce(p.name, 'Unavailable product'), coalesce(b.batch_code, 'Unavailable batch');
end;
$$;

revoke all on function public.get_warehouse_inventory_stock_count_lines(uuid) from public,anon;
grant execute on function public.get_warehouse_inventory_stock_count_lines(uuid) to authenticated;

comment on function public.get_warehouse_inventory_stock_count_lines(uuid) is
  'Protected read-only stock-count detail including current batch state and explicit stale reasons. It never refreshes snapshots or mutates inventory.';
