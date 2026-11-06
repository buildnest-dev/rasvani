-- Phase 10: retain a before/after audit trail whenever an open physical-count line is recorded or corrected.
-- This does not change inventory; stock adjustments still require independent approval.

create or replace function public.record_inventory_stock_count_line(
  p_stock_count_id uuid,p_batch_id uuid,p_counted_quantity numeric,p_notes text default null
) returns void language plpgsql security definer set search_path=public,auth as $$
declare
  v_user uuid:=auth.uid();
  v_count public.inventory_stock_counts%rowtype;
  v_line public.inventory_stock_count_lines%rowtype;
begin
  if v_user is null or not (public.has_app_role('warehouse_operator') or public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Warehouse operator or admin role required';
  end if;
  if p_counted_quantity is null or p_counted_quantity<0 or p_counted_quantity>99999999999.999 then
    raise exception 'Counted quantity must be zero or greater';
  end if;
  if p_notes is not null and length(p_notes)>500 then raise exception 'Count notes are too long'; end if;

  select * into v_count from public.inventory_stock_counts where id=p_stock_count_id for update;
  if not found or v_count.status<>'counting' or
     (v_count.created_by<>v_user and not (public.has_app_role('admin') or public.has_app_role('super_admin'))) then
    raise exception 'Stock count is unavailable for entry';
  end if;

  select * into v_line
  from public.inventory_stock_count_lines
  where stock_count_id=p_stock_count_id and batch_id=p_batch_id
  for update;
  if not found then raise exception 'Batch is not part of this stock count'; end if;

  update public.inventory_stock_count_lines
  set counted_quantity=p_counted_quantity,
      count_notes=nullif(trim(p_notes),''),
      counted_by=v_user,
      counted_at=clock_timestamp()
  where id=v_line.id;

  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
  values (
    v_user,
    case when v_line.counted_quantity is null then 'inventory.stock_count_line_recorded' else 'inventory.stock_count_line_corrected' end,
    'inventory_stock_count_line',
    v_line.id::text,
    jsonb_build_object(
      'stock_count_id',p_stock_count_id,
      'batch_id',p_batch_id,
      'previous_quantity',v_line.counted_quantity,
      'new_quantity',p_counted_quantity,
      'previous_notes',v_line.count_notes,
      'new_notes',nullif(trim(p_notes),''),
      'previous_counted_by',v_line.counted_by,
      'previous_counted_at',v_line.counted_at,
      'inventory_quantity_changed',false
    )
  );
end;
$$;
revoke all on function public.record_inventory_stock_count_line(uuid,uuid,numeric,text) from public,anon;
grant execute on function public.record_inventory_stock_count_line(uuid,uuid,numeric,text) to authenticated;

comment on function public.record_inventory_stock_count_line(uuid,uuid,numeric,text) is
  'Records or corrects an open stock-count line with a before/after audit event. It never changes inventory; approval remains independent.';
