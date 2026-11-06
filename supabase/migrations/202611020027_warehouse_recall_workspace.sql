-- Narrow quality-only product selector for the existing atomic recall workflow.
create or replace function public.get_warehouse_recall_products()
returns table(product_id uuid, product_name text, sku text, eligible_batch_count bigint)
language plpgsql
stable
security definer
set search_path=public,auth
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
  select p.id,p.name,p.sku,count(b.id)::bigint
  from public.products p
  join public.inventory_batches b on b.product_id=p.id
  where b.status not in ('recalled','disposed')
  group by p.id,p.name,p.sku
  order by p.name,p.sku
  limit 300;
end;
$$;
revoke all on function public.get_warehouse_recall_products() from public,anon;
grant execute on function public.get_warehouse_recall_products() to authenticated;
comment on function public.get_warehouse_recall_products() is
  'Returns only products with batches eligible for product-level recall to authenticated quality reviewers and admins.';
