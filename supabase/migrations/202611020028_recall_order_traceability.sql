-- Rasvani Phase 10: recall-to-order traceability and reservation invalidation.
-- Exposes operational order/batch links to quality reviewers and admins only.
-- Customer identity and shipping/contact details are intentionally excluded.

-- Preserve a distinct historical state when an active reservation is invalidated
-- because its source batch has been recalled.
alter table public.stock_reservations
  drop constraint if exists stock_reservations_status_check;
alter table public.stock_reservations
  add constraint stock_reservations_status_check
  check (status in ('active','released','consumed','expired','recalled'));

create index if not exists stock_reservations_batch_order_trace_idx
  on public.stock_reservations(batch_id, order_id, status);
create index if not exists customer_order_lines_order_product_trace_idx
  on public.customer_order_lines(order_id, product_id);

-- Replace the original recall function with a serialized operation. Lock order rows
-- before batch rows, matching reservation/dispatch lock order to reduce deadlocks.
-- Active reservations are marked 'recalled' (not ordinary 'released') and a matching
-- release movement is appended. Consumed reservations remain as shipment history.
create or replace function public.recall_product_batches(p_product_id uuid, p_reason text)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user uuid := auth.uid();
  v_batch_ids uuid[] := '{}'::uuid[];
  v_batch_count integer := 0;
  v_invalidated_count integer := 0;
begin
  if v_user is null or not (
    public.has_app_role('quality_reviewer')
    or public.has_app_role('admin')
    or public.has_app_role('super_admin')
  ) then
    raise exception 'Quality reviewer or admin role required';
  end if;
  if p_product_id is null then raise exception 'Product is required'; end if;
  if nullif(trim(p_reason), '') is null or length(trim(p_reason)) < 5 or length(trim(p_reason)) > 500 then
    raise exception 'Recall reason must contain 5 to 500 characters';
  end if;

  -- Lock orders first because reserve/consume workflows lock orders before batches.
  perform 1
  from public.customer_orders o
  where exists (
    select 1
    from public.stock_reservations sr
    join public.inventory_batches b on b.id = sr.batch_id
    where sr.order_id = o.id
      and sr.status = 'active'
      and b.product_id = p_product_id
  )
  order by o.id
  for update;

  perform 1
  from public.inventory_batches b
  where b.product_id = p_product_id
    and b.status not in ('recalled','disposed')
  order by b.id
  for update;

  with affected as (
    update public.inventory_batches
       set status = 'recalled'
     where product_id = p_product_id
       and status not in ('recalled','disposed')
    returning id
  )
  select coalesce(array_agg(id), '{}'::uuid[]), count(*)::integer
    into v_batch_ids, v_batch_count
  from affected;

  if coalesce(array_length(v_batch_ids, 1), 0) > 0 then
    with invalidated as (
      update public.stock_reservations
         set status = 'recalled'
       where batch_id = any(v_batch_ids)
         and status = 'active'
      returning batch_id, order_id, quantity
    )
    insert into public.inventory_movements(
      batch_id, movement_type, quantity_delta, reference_type, reference_id, reason, actor_id
    )
    select batch_id, 'release', quantity, 'customer_order', order_id,
           'Active reservation invalidated by product recall: ' || trim(p_reason), v_user
    from invalidated;
    get diagnostics v_invalidated_count = row_count;

    insert into public.inventory_movements(batch_id,movement_type,quantity_delta,reason,actor_id)
    select affected.batch_id,'recall',0,trim(p_reason),v_user
    from unnest(v_batch_ids) as affected(batch_id);
  end if;

  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
  values(
    v_user,
    'inventory.product_recall',
    'product',
    p_product_id::text,
    jsonb_build_object(
      'reason', trim(p_reason),
      'batches_affected', v_batch_count,
      'active_reservations_invalidated', v_invalidated_count
    )
  );
  return v_batch_count;
end;
$$;
revoke all on function public.recall_product_batches(uuid,text) from public,anon;
grant execute on function public.recall_product_batches(uuid,text) to authenticated;
comment on function public.recall_product_batches(uuid,text) is
  'Quality/admin-only product recall. Serializes against order allocation/dispatch, marks all eligible batches recalled, invalidates active reservations with a distinct recalled status, preserves consumed reservation history, and audits the action.';

-- Product selector for the historical order trace. It is separate from the recall
-- selector because a fully recalled product must remain discoverable for investigation.
create or replace function public.get_warehouse_recall_trace_products()
returns table(
  product_id uuid,
  product_name text,
  sku text,
  linked_order_count bigint,
  recalled_batch_count bigint
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null or not (
    public.has_app_role('quality_reviewer')
    or public.has_app_role('admin')
    or public.has_app_role('super_admin')
  ) then
    raise exception 'Quality reviewer or admin role required';
  end if;

  return query
  select p.id, p.name, p.sku,
         count(distinct r.order_id)::bigint,
         count(distinct b.id) filter (where b.status = 'recalled')::bigint
  from public.products p
  join public.inventory_batches b on b.product_id = p.id
  join public.stock_reservations r on r.batch_id = b.id
  where r.order_id is not null
  group by p.id, p.name, p.sku
  order by p.name, p.sku
  limit 300;
end;
$$;
revoke all on function public.get_warehouse_recall_trace_products() from public,anon;
grant execute on function public.get_warehouse_recall_trace_products() to authenticated;
comment on function public.get_warehouse_recall_trace_products() is
  'Returns products with historical order reservations for quality/admin recall investigation, including products whose batches are already recalled.';

-- One row per order/batch/reservation-state. A row is a trace link, not proof that
-- product reached a consumer: order status and reservation status are returned separately.
create or replace function public.get_warehouse_recall_order_trace(p_product_id uuid)
returns table(
  order_id uuid,
  order_number text,
  order_status text,
  order_created_at timestamptz,
  batch_id uuid,
  batch_code text,
  batch_status text,
  warehouse_name text,
  reservation_status text,
  reserved_quantity numeric,
  ordered_quantity numeric,
  reservation_first_created_at timestamptz,
  reservation_expiry_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null or not (
    public.has_app_role('quality_reviewer')
    or public.has_app_role('admin')
    or public.has_app_role('super_admin')
  ) then
    raise exception 'Quality reviewer or admin role required';
  end if;
  if p_product_id is null then raise exception 'Product is required'; end if;

  return query
  select o.id, o.order_number, o.status::text, o.created_at,
         b.id, b.batch_code, b.status::text, w.name,
         r.status, sum(r.quantity)::numeric,
         coalesce(ordered.quantity,0)::numeric,
         min(r.created_at), max(r.expires_at)
  from public.stock_reservations r
  join public.inventory_batches b on b.id = r.batch_id
  join public.customer_orders o on o.id = r.order_id
  join public.warehouses w on w.id = b.warehouse_id
  left join lateral (
    select sum(l.quantity) as quantity
    from public.customer_order_lines l
    where l.order_id = o.id and l.product_id = b.product_id
  ) ordered on true
  where b.product_id = p_product_id
  group by o.id, o.order_number, o.status, o.created_at,
           b.id, b.batch_code, b.status, w.name, r.status, ordered.quantity
  order by case r.status
             when 'recalled' then 0
             when 'consumed' then 1
             when 'active' then 2
             when 'released' then 3
             else 4
           end,
           o.created_at desc, b.batch_code
  limit 250;
end;
$$;
revoke all on function public.get_warehouse_recall_order_trace(uuid) from public,anon;
grant execute on function public.get_warehouse_recall_order_trace(uuid) to authenticated;
comment on function public.get_warehouse_recall_order_trace(uuid) is
  'Returns up to 250 quality/admin-only product order/batch reservation links. Customer identity and shipping/contact data are deliberately omitted.';
