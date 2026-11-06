-- Phase 10: make stale physical-count snapshots visible before independent review.
-- Approval already rejects stock changed since the snapshot. This read model
-- surfaces that condition in the warehouse register so staff can act earlier.

drop function if exists public.get_warehouse_inventory_stock_counts();

create function public.get_warehouse_inventory_stock_counts()
returns table(
  stock_count_id uuid,
  warehouse_id uuid,
  warehouse_name text,
  status text,
  created_by uuid,
  started_at timestamptz,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  batch_line_count bigint,
  counted_line_count bigint,
  variance_line_count bigint,
  escalation_level text,
  warning_line_count bigint,
  critical_line_count bigint,
  review_required_line_count bigint,
  cancelled_by uuid,
  cancelled_at timestamptz,
  cancellation_reason text,
  submitted_by uuid,
  reviewed_by uuid,
  review_reason text,
  count_notes text,
  stale_line_count bigint,
  is_stale boolean
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
    c.id,
    c.warehouse_id,
    w.name,
    c.status,
    c.created_by,
    c.created_at,
    c.submitted_at,
    c.reviewed_at,
    count(l.id),
    count(l.id) filter (where l.counted_quantity is not null),
    count(l.id) filter (where l.counted_quantity is not null and l.counted_quantity <> l.expected_quantity),
    c.escalation_level,
    count(l.id) filter (where l.escalation_level = 'warning'),
    count(l.id) filter (where l.escalation_level = 'critical'),
    count(l.id) filter (where l.escalation_level = 'review_required'),
    c.cancelled_by,
    c.cancelled_at,
    c.cancellation_reason,
    c.submitted_by,
    c.reviewed_by,
    c.review_reason,
    c.notes,
    count(l.id) filter (where
      b.id is null or b.stock_updated_at <> l.expected_stock_updated_at or
      b.quantity_on_hand <> l.expected_quantity or b.status = 'disposed'
    ),
    coalesce(bool_or(
      b.id is null or b.stock_updated_at <> l.expected_stock_updated_at or
      b.quantity_on_hand <> l.expected_quantity or b.status = 'disposed'
    ), false)
  from public.inventory_stock_counts c
  join public.warehouses w on w.id = c.warehouse_id
  left join public.inventory_stock_count_lines l on l.stock_count_id = c.id
  left join public.inventory_batches b on b.id = l.batch_id
  group by c.id, w.name
  order by c.created_at desc
  limit 30;
end;
$$;

revoke all on function public.get_warehouse_inventory_stock_counts() from public,anon;
grant execute on function public.get_warehouse_inventory_stock_counts() to authenticated;

comment on function public.get_warehouse_inventory_stock_counts() is
  'Protected read-only stock-count register including decision audit fields and live stale-snapshot line count. Stale means a batch is missing, its stock version or quantity differs from the snapshot, or it is disposed.';
