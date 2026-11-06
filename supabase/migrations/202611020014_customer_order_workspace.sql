-- Rasvani Phase 5: private customer order history and cancellation workspace.
-- This exposes only the authenticated customer's own order summaries and lines.

create or replace function public.get_my_customer_orders()
returns table (
  order_id uuid,
  order_number text,
  order_status text,
  payment_status text,
  currency text,
  subtotal_paise bigint,
  shipping_paise bigint,
  tax_paise bigint,
  total_paise bigint,
  shipping_address jsonb,
  customer_notes text,
  created_at timestamptz,
  lines jsonb
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  return query
  select o.id, o.order_number, o.status::text, o.payment_status, o.currency::text,
         o.subtotal_paise, o.shipping_paise, o.tax_paise, o.total_paise,
         o.shipping_address, o.customer_notes, o.created_at,
         coalesce((
           select jsonb_agg(jsonb_build_object(
             'product_id', l.product_id,
             'product_name', p.name,
             'sku', p.sku,
             'quantity', l.quantity,
             'unit_price_paise', l.unit_price_paise,
             'line_total_paise', l.line_total_paise
           ) order by p.name)
           from public.customer_order_lines l
           join public.products p on p.id = l.product_id
           where l.order_id = o.id
         ), '[]'::jsonb)
  from public.customer_orders o
  where o.customer_id = v_user
  order by o.created_at desc
  limit 100;
end;
$$;
revoke all on function public.get_my_customer_orders() from public, anon;
grant execute on function public.get_my_customer_orders() to authenticated;

-- Do not allow a customer to use the cancellation RPC to cancel another customer's order.
-- Staff roles remain able to cancel according to the existing business workflow.
comment on function public.get_my_customer_orders() is
  'Returns at most 100 order summaries and lines belonging to auth.uid(); no cross-customer access.';
