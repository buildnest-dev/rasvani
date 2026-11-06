-- Phase 10: prevent overlapping full-warehouse physical counts.
-- The snapshot currently includes every non-disposed batch in the selected warehouse.
-- A second open/submitted count would duplicate the same inventory scope and create
-- competing snapshots. A per-warehouse transaction advisory lock makes the check
-- and creation atomic without changing the existing full-warehouse count model.

create or replace function public.create_inventory_stock_count(p_warehouse_id uuid,p_notes text default null)
returns uuid language plpgsql security definer set search_path=public,auth as $$
declare
  v_user uuid:=auth.uid();
  v_count uuid;
  v_rows integer;
begin
  if v_user is null or not (public.has_app_role('warehouse_operator') or public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Warehouse operator or admin role required';
  end if;
  if p_notes is not null and length(p_notes)>1000 then raise exception 'Count notes are too long'; end if;
  if not exists(select 1 from public.warehouses where id=p_warehouse_id and active) then
    raise exception 'Active warehouse required';
  end if;

  -- Serialize count creation for this warehouse, including simultaneous requests.
  perform pg_advisory_xact_lock(hashtextextended(p_warehouse_id::text,0));
  if exists(
    select 1 from public.inventory_stock_counts
    where warehouse_id=p_warehouse_id and status in ('counting','submitted')
  ) then
    raise exception 'An open or awaiting-review stock count already exists for this warehouse';
  end if;

  insert into public.inventory_stock_counts(warehouse_id,notes,created_by)
    values(p_warehouse_id,nullif(trim(p_notes),''),v_user) returning id into v_count;
  insert into public.inventory_stock_count_lines(stock_count_id,batch_id,expected_quantity,expected_stock_updated_at)
    select v_count,b.id,b.quantity_on_hand,b.stock_updated_at
    from public.inventory_batches b
    where b.warehouse_id=p_warehouse_id and b.status<>'disposed'
    order by b.bin_id,b.id;
  get diagnostics v_rows=row_count;
  if v_rows=0 then raise exception 'No inventory batches are available to count at this warehouse'; end if;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
    values(v_user,'inventory.stock_count_created','inventory_stock_count',v_count::text,
      jsonb_build_object('warehouse_id',p_warehouse_id,'snapshot_at',(select snapshot_at from public.inventory_stock_counts where id=v_count),'batch_lines',v_rows,'scope','full_warehouse'));
  return v_count;
end;
$$;
revoke all on function public.create_inventory_stock_count(uuid,text) from public,anon;
grant execute on function public.create_inventory_stock_count(uuid,text) to authenticated;

comment on function public.create_inventory_stock_count(uuid,text) is
  'Creates one full-warehouse physical count at a time. A transaction advisory lock serializes creation; another count cannot start while an earlier count is counting or awaiting review. Inventory is unchanged until independent approval.';
