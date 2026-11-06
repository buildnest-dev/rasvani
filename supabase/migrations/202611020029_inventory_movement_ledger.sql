-- Rasvani Phase 10: read-only, role-gated inventory movement ledger.
-- Exposes operational movement history without customer identity or contact data.
create or replace function public.get_warehouse_inventory_movement_ledger()
returns table(
  movement_id uuid,
  movement_type text,
  quantity_delta numeric,
  product_name text,
  sku text,
  batch_code text,
  warehouse_name text,
  from_bin_code text,
  to_bin_code text,
  reference_type text,
  reference_id uuid,
  reason text,
  moved_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null or not (
    public.has_app_role('warehouse_operator')
    or public.has_app_role('quality_reviewer')
    or public.has_app_role('admin')
    or public.has_app_role('super_admin')
  ) then
    raise exception 'Warehouse or quality role required';
  end if;

  return query
  select m.id, m.movement_type, m.quantity_delta,
         p.name, p.sku, b.batch_code, w.name,
         fb.code, tb.code, m.reference_type, m.reference_id,
         m.reason, m.created_at
  from public.inventory_movements m
  join public.inventory_batches b on b.id = m.batch_id
  join public.products p on p.id = b.product_id
  join public.warehouses w on w.id = b.warehouse_id
  left join public.warehouse_bins fb on fb.id = m.from_bin_id
  left join public.warehouse_bins tb on tb.id = m.to_bin_id
  order by m.created_at desc, m.id desc
  limit 200;
end;
$$;
revoke all on function public.get_warehouse_inventory_movement_ledger() from public, anon;
grant execute on function public.get_warehouse_inventory_movement_ledger() to authenticated;
comment on function public.get_warehouse_inventory_movement_ledger() is
  'Returns up to 200 recent inventory movements to warehouse, quality and admin roles. Read-only; excludes customer identity and contact information.';
