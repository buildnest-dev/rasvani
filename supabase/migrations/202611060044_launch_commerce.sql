-- Rasvani launch commerce (Bihar first): public price read, admin catalogue publishing, admin order handling.
-- Prices are never invented here: they come only from rows an admin enters.

-- 1. Public, read-only current prices for PUBLISHED products only.
create or replace function public.get_public_product_prices(p_product_ids uuid[])
returns table(product_id uuid, amount_paise bigint, currency char(3))
language sql stable security definer set search_path=public as $$
  select distinct on (pp.product_id) pp.product_id, pp.amount_paise, pp.currency
  from public.product_prices pp
  join public.products p on p.id = pp.product_id
  where pp.product_id = any(coalesce(p_product_ids,'{}'::uuid[]))
    and array_length(p_product_ids,1) <= 200
    and p.approval_status = 'approved' and p.published_at is not null
    and pp.valid_from <= now() and (pp.valid_until is null or pp.valid_until > now())
  order by pp.product_id, pp.valid_from desc;
$$;
revoke all on function public.get_public_product_prices(uuid[]) from public;
grant execute on function public.get_public_product_prices(uuid[]) to anon, authenticated;

-- 2. Admin: publish a vegetarian product with a price. The admin attests the dietary evidence.
create or replace function public.admin_publish_product(
  p_sku text, p_name text, p_description text, p_category_id uuid,
  p_price_paise bigint, p_storage text, p_dietary_evidence text
) returns uuid
language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid := auth.uid(); v_id uuid := gen_random_uuid(); v_slug text;
begin
  if v_user is null or not (public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Admin role required';
  end if;
  if nullif(trim(p_sku),'') is null or length(trim(p_sku)) > 80 then raise exception 'Valid SKU is required'; end if;
  if nullif(trim(p_name),'') is null or length(trim(p_name)) > 180 then raise exception 'Product name is required'; end if;
  if p_price_paise is null or p_price_paise < 100 or p_price_paise > 10000000 then raise exception 'Price must be between 1 and 100000 rupees'; end if;
  if p_storage not in ('ambient','chilled','frozen','other') then raise exception 'Invalid storage condition'; end if;
  if nullif(trim(coalesce(p_dietary_evidence,'')),'') is null then raise exception 'Vegetarian evidence reference is required'; end if;
  if length(coalesce(p_description,'')) > 5000 then raise exception 'Description too long'; end if;
  v_slug := trim(both '-' from regexp_replace(lower(trim(p_name)), '[^a-z0-9]+', '-', 'g'));
  if v_slug = '' then v_slug := 'product'; end if;
  insert into public.products(id, category_id, sku, slug, name, description, storage_condition, approval_status, published_at,
    dietary_classification, dietary_review_status, dietary_evidence_reference, dietary_reviewed_by, dietary_reviewed_at)
  values(v_id, p_category_id, upper(trim(p_sku)), left(v_slug,100) || '-' || substr(replace(v_id::text,'-',''),1,6),
    trim(p_name), nullif(trim(p_description),''), p_storage::public.storage_condition, 'approved', now(),
    'vegetarian', 'approved', trim(p_dietary_evidence), v_user, now());
  insert into public.product_prices(product_id, currency, amount_paise, approved_by) values(v_id,'INR',p_price_paise,v_user);
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
  values(v_user,'catalogue.admin_product_published','product',v_id::text,jsonb_build_object('sku',upper(trim(p_sku)),'price_paise',p_price_paise));
  return v_id;
end; $$;
revoke all on function public.admin_publish_product(text,text,text,uuid,bigint,text,text) from public,anon;
grant execute on function public.admin_publish_product(text,text,text,uuid,bigint,text,text) to authenticated;

-- 3. Admin: change price (old price row is closed, history kept).
create or replace function public.admin_set_product_price(p_product_id uuid, p_price_paise bigint)
returns void language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null or not (public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Admin role required'; end if;
  if p_price_paise is null or p_price_paise < 100 or p_price_paise > 10000000 then raise exception 'Price must be between 1 and 100000 rupees'; end if;
  if not exists(select 1 from public.products where id = p_product_id) then raise exception 'Product not found'; end if;
  update public.product_prices set valid_until = now() where product_id = p_product_id and valid_until is null and valid_from < now();
  insert into public.product_prices(product_id, currency, amount_paise, approved_by) values(p_product_id,'INR',p_price_paise,v_user);
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
  values(v_user,'catalogue.admin_price_changed','product',p_product_id::text,jsonb_build_object('price_paise',p_price_paise));
end; $$;
revoke all on function public.admin_set_product_price(uuid,bigint) from public,anon;
grant execute on function public.admin_set_product_price(uuid,bigint) to authenticated;

-- 4. Admin: hide / show a product (stops it being sold without deleting history).
create or replace function public.admin_set_product_visibility(p_product_id uuid, p_visible boolean)
returns void language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null or not (public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Admin role required'; end if;
  update public.products
     set approval_status = case when p_visible then 'approved'::public.record_status else 'archived'::public.record_status end,
         published_at = case when p_visible then coalesce(published_at, now()) else null end
   where id = p_product_id;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
  values(v_user,'catalogue.admin_visibility_changed','product',p_product_id::text,jsonb_build_object('visible',p_visible));
end; $$;
revoke all on function public.admin_set_product_visibility(uuid,boolean) from public,anon;
grant execute on function public.admin_set_product_visibility(uuid,boolean) to authenticated;

-- 5. Admin catalogue list (all products with current price, any status).
create or replace function public.admin_list_products()
returns table(product_id uuid, sku text, name text, slug text, visible boolean, amount_paise bigint)
language sql stable security definer set search_path=public,auth as $$
  select p.id, p.sku, p.name, p.slug, (p.approval_status='approved' and p.published_at is not null),
    (select pp.amount_paise from public.product_prices pp where pp.product_id=p.id and pp.valid_from<=now() and (pp.valid_until is null or pp.valid_until>now()) order by pp.valid_from desc limit 1)
  from public.products p
  where public.has_app_role('admin') or public.has_app_role('super_admin')
  order by p.created_at desc limit 300;
$$;
revoke all on function public.admin_list_products() from public,anon;
grant execute on function public.admin_list_products() to authenticated;

-- 6. Admin / operations order queue with customer contact held in the order address.
create or replace function public.admin_list_orders(p_limit integer default 100)
returns jsonb language sql stable security definer set search_path=public,auth as $$
  select coalesce(jsonb_agg(row_to_json(t) order by t.created_at desc), '[]'::jsonb) from (
    select o.id as order_id, o.order_number, o.status::text as order_status, o.payment_status, o.total_paise,
      o.shipping_address, o.customer_notes, o.created_at, u.email as customer_email,
      (select coalesce(jsonb_agg(jsonb_build_object('name', p.name, 'quantity', l.quantity, 'unit_price_paise', l.unit_price_paise, 'line_total_paise', l.line_total_paise)), '[]'::jsonb)
         from public.customer_order_lines l join public.products p on p.id = l.product_id where l.order_id = o.id) as lines
    from public.customer_orders o left join auth.users u on u.id = o.customer_id
    where public.has_app_role('admin') or public.has_app_role('super_admin') or public.has_app_role('warehouse_operator')
    order by o.created_at desc limit least(greatest(coalesce(p_limit,100),1),300)
  ) t;
$$;
revoke all on function public.admin_list_orders(integer) from public,anon;
grant execute on function public.admin_list_orders(integer) to authenticated;

-- 7. Move an order through the fulfilment states. Cancelled/delivered/refunded orders are final.
create or replace function public.admin_set_order_status(p_order_id uuid, p_status text, p_payment_status text default null)
returns void language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid := auth.uid(); v_current public.order_status;
begin
  if v_user is null or not (public.has_app_role('admin') or public.has_app_role('super_admin') or public.has_app_role('warehouse_operator')) then
    raise exception 'Operations role required';
  end if;
  if p_status not in ('confirmed','packed','dispatched','delivered','cancelled') then raise exception 'Invalid status'; end if;
  if p_payment_status is not null and p_payment_status not in ('not_configured','captured','failed','refunded') then raise exception 'Invalid payment status'; end if;
  select status into v_current from public.customer_orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_current in ('cancelled','delivered','refunded') then raise exception 'Order is already final'; end if;
  update public.customer_orders set status = p_status::public.order_status,
         payment_status = coalesce(p_payment_status, payment_status) where id = p_order_id;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
  values(v_user,'commerce.order_status_changed','customer_order',p_order_id::text,jsonb_build_object('from',v_current::text,'to',p_status,'payment_status',p_payment_status));
end; $$;
revoke all on function public.admin_set_order_status(uuid,text,text) from public,anon;
grant execute on function public.admin_set_order_status(uuid,text,text) to authenticated;
