-- Phase 10: controlled cancellation for abandoned or mistakenly opened physical counts.
-- Cancellation is available only before submission; snapshots remain retained for audit.

alter table public.inventory_stock_counts
  drop constraint if exists inventory_stock_counts_status_check;

alter table public.inventory_stock_counts
  add constraint inventory_stock_counts_status_check
  check (status in ('counting','submitted','approved','rejected','cancelled'));

alter table public.inventory_stock_counts
  add column if not exists cancellation_reason text,
  add column if not exists cancelled_by uuid references auth.users(id),
  add column if not exists cancelled_at timestamptz;

alter table public.inventory_stock_counts
  drop constraint if exists inventory_stock_counts_cancellation_consistency;

alter table public.inventory_stock_counts
  add constraint inventory_stock_counts_cancellation_consistency check (
    (status = 'cancelled' and cancellation_reason is not null and cancelled_by is not null and cancelled_at is not null)
    or
    (status <> 'cancelled' and cancellation_reason is null and cancelled_by is null and cancelled_at is null)
  );

create or replace function public.cancel_inventory_stock_count(
  p_stock_count_id uuid,
  p_reason text
) returns void
language plpgsql security definer set search_path=public,auth as $$
declare
  v_user uuid := auth.uid();
  v_count public.inventory_stock_counts%rowtype;
  v_is_admin boolean;
  v_total_lines integer;
  v_counted_lines integer;
begin
  v_is_admin := public.has_app_role('admin') or public.has_app_role('super_admin');
  if v_user is null or not (v_is_admin or public.has_app_role('warehouse_operator')) then
    raise exception 'Warehouse operator or administrator role required';
  end if;
  if p_reason is null or length(trim(p_reason)) < 5 or length(p_reason) > 500 then
    raise exception 'A cancellation reason of 5–500 characters is required';
  end if;

  select * into v_count
  from public.inventory_stock_counts
  where id = p_stock_count_id
  for update;

  if not found or v_count.status <> 'counting' then
    raise exception 'Only an open, unsubmitted stock count can be cancelled';
  end if;
  if v_count.created_by <> v_user and not v_is_admin then
    raise exception 'Only the count creator or an administrator can cancel this count';
  end if;

  select count(*), count(*) filter (where counted_quantity is not null)
    into v_total_lines, v_counted_lines
  from public.inventory_stock_count_lines
  where stock_count_id = p_stock_count_id;

  update public.inventory_stock_counts
  set status = 'cancelled',
      cancellation_reason = trim(p_reason),
      cancelled_by = v_user,
      cancelled_at = clock_timestamp()
  where id = p_stock_count_id;

  insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, metadata)
  values (
    v_user,
    'inventory.stock_count_cancelled',
    'inventory_stock_count',
    p_stock_count_id::text,
    jsonb_build_object(
      'warehouse_id', v_count.warehouse_id,
      'reason', trim(p_reason),
      'batch_lines_retained', v_total_lines,
      'counted_lines_retained', v_counted_lines,
      'inventory_quantities_changed', false
    )
  );
end;
$$;

revoke all on function public.cancel_inventory_stock_count(uuid,text) from public,anon;
grant execute on function public.cancel_inventory_stock_count(uuid,text) to authenticated;

comment on function public.cancel_inventory_stock_count(uuid,text) is
  'Cancels only an unsubmitted physical stock count. The creator or an administrator must provide a reason; snapshot lines and entered quantities remain preserved, and inventory quantities are not changed.';

-- Extend the protected list read model so authorised warehouse staff can see why,
-- when and by whom a count was cancelled without receiving direct table access.
drop function if exists public.get_warehouse_inventory_stock_counts();
create function public.get_warehouse_inventory_stock_counts()
returns table(
  stock_count_id uuid,warehouse_id uuid,warehouse_name text,status text,created_by uuid,started_at timestamptz,
  submitted_at timestamptz,reviewed_at timestamptz,batch_line_count bigint,counted_line_count bigint,
  variance_line_count bigint,escalation_level text,warning_line_count bigint,critical_line_count bigint,
  review_required_line_count bigint,cancelled_by uuid,cancelled_at timestamptz,cancellation_reason text
)
language plpgsql stable security definer set search_path=public,auth as $$
begin
  if auth.uid() is null or not (public.has_app_role('warehouse_operator') or public.has_app_role('quality_reviewer') or public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Warehouse or quality role required';
  end if;
  return query
  select c.id,c.warehouse_id,w.name,c.status,c.created_by,c.created_at,c.submitted_at,c.reviewed_at,
    count(l.id),count(l.id) filter(where l.counted_quantity is not null),
    count(l.id) filter(where l.counted_quantity is not null and l.counted_quantity<>l.expected_quantity),
    c.escalation_level,count(l.id) filter(where l.escalation_level='warning'),
    count(l.id) filter(where l.escalation_level='critical'),
    count(l.id) filter(where l.escalation_level='review_required'),
    c.cancelled_by,c.cancelled_at,c.cancellation_reason
  from public.inventory_stock_counts c
  join public.warehouses w on w.id=c.warehouse_id
  left join public.inventory_stock_count_lines l on l.stock_count_id=c.id
  group by c.id,w.name
  order by c.created_at desc
  limit 30;
end;
$$;
revoke all on function public.get_warehouse_inventory_stock_counts() from public,anon;
grant execute on function public.get_warehouse_inventory_stock_counts() to authenticated;
