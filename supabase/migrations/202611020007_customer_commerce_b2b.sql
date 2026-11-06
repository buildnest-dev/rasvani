-- Rasvani Phase 5/7: controlled customer order initiation and B2B enquiry/quote lifecycle.
-- Payment capture, seller-of-record, tax, shipping, settlement and trade terms remain external decisions.

alter table public.customer_orders
  add column if not exists payment_status text not null default 'not_configured'
    check(payment_status in ('not_configured','pending_provider','authorised','captured','failed','refunded')),
  add column if not exists payment_reference text,
  add column if not exists customer_notes text;

alter table public.business_accounts
  add column if not exists reviewed_by uuid references auth.users(id),
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_reason text;

alter table public.trade_quotes
  add column if not exists sent_at timestamptz,
  add column if not exists responded_at timestamptz,
  add column if not exists response_reason text;

create index if not exists customer_orders_customer_created_idx
  on public.customer_orders(customer_id, created_at desc);
create index if not exists trade_enquiries_business_created_idx
  on public.trade_enquiries(business_id, created_at desc);
create index if not exists trade_quotes_enquiry_status_idx
  on public.trade_quotes(enquiry_id, status);

-- Creates an order from current approved catalogue prices. This does not capture payment,
-- reserve stock, calculate tax/shipping, or assert that delivery is available to an address.
create or replace function public.create_customer_order(
  p_lines jsonb, p_shipping_address jsonb, p_customer_notes text default null
) returns uuid
language plpgsql security definer set search_path=public,auth as $$
declare
  v_user uuid := auth.uid();
  v_order uuid;
  v_order_number text;
  v_subtotal bigint := 0;
  v_line jsonb;
  v_product uuid;
  v_qty numeric(14,3);
  v_price bigint;
  v_currency char(3);
  v_line_total bigint;
  v_count integer := 0;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(p_lines)<>'array' or jsonb_array_length(p_lines)=0 or jsonb_array_length(p_lines)>50 then
    raise exception 'Order must contain between 1 and 50 lines';
  end if;
  if jsonb_typeof(p_shipping_address)<>'object' or p_shipping_address='{}'::jsonb then
    raise exception 'Shipping address is required';
  end if;
  v_order_number := 'RV-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
  insert into public.customer_orders(customer_id,order_number,status,currency,subtotal_paise,shipping_paise,tax_paise,total_paise,shipping_address,payment_status,customer_notes)
  values(v_user,v_order_number,'draft','INR',0,0,0,0,p_shipping_address,'not_configured',nullif(trim(p_customer_notes),''))
  returning id into v_order;

  for v_line in select value from jsonb_array_elements(p_lines) loop
    if not (v_line ? 'product_id') or not (v_line ? 'quantity') then raise exception 'Each order line needs product_id and quantity'; end if;
    v_product := (v_line->>'product_id')::uuid;
    v_qty := (v_line->>'quantity')::numeric;
    if v_qty<=0 or v_qty>10000 then raise exception 'Invalid order quantity'; end if;
    if exists(select 1 from public.customer_order_lines where order_id=v_order and product_id=v_product) then
      raise exception 'Duplicate product lines are not allowed';
    end if;
    select pp.amount_paise,pp.currency into v_price,v_currency
    from public.products p
    join public.product_prices pp on pp.product_id=p.id
    where p.id=v_product and p.approval_status='approved' and p.published_at is not null
      and pp.valid_from<=now() and (pp.valid_until is null or pp.valid_until>now())
    order by pp.valid_from desc limit 1;
    if not found then raise exception 'Product is unavailable or has no current approved price'; end if;
    if v_currency<>'INR' then raise exception 'Only INR catalogue prices are currently supported'; end if;
    v_line_total := round(v_price*v_qty)::bigint;
    if v_line_total<0 then raise exception 'Invalid line total'; end if;
    insert into public.customer_order_lines(order_id,product_id,quantity,unit_price_paise,line_total_paise)
      values(v_order,v_product,v_qty,v_price,v_line_total);
    v_subtotal := v_subtotal+v_line_total;
    v_count := v_count+1;
  end loop;
  update public.customer_orders set subtotal_paise=v_subtotal,total_paise=v_subtotal,status='placed' where id=v_order;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
  values(v_user,'commerce.order_placed','customer_order',v_order::text,
    jsonb_build_object('line_count',v_count,'subtotal_paise',v_subtotal,'payment_status','not_configured'));
  return v_order;
end;
$$;
revoke all on function public.create_customer_order(jsonb,jsonb,text) from public,anon;
grant execute on function public.create_customer_order(jsonb,jsonb,text) to authenticated;

-- Customer may cancel only before dispatch; active reservations are released atomically.
create or replace function public.cancel_customer_order(p_order_id uuid,p_reason text)
returns void language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid(); v_owner uuid; v_status public.order_status;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if nullif(trim(p_reason),'') is null then raise exception 'Cancellation reason required'; end if;
  select customer_id,status into v_owner,v_status from public.customer_orders where id=p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_owner<>v_user and not (public.has_app_role('admin') or public.has_app_role('super_admin') or public.has_app_role('warehouse_operator')) then raise exception 'Not permitted'; end if;
  if v_status not in ('draft','placed','confirmed','allocated') then raise exception 'Order can no longer be cancelled through this workflow'; end if;
  with released as (
    update public.stock_reservations set status='released' where order_id=p_order_id and status='active'
    returning batch_id,quantity
  )
  insert into public.inventory_movements(batch_id,movement_type,quantity_delta,reference_type,reference_id,reason,actor_id)
  select batch_id,'release',quantity,'customer_order',p_order_id,'Order cancelled: '||trim(p_reason),v_user from released;
  update public.customer_orders set status='cancelled' where id=p_order_id;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
  values(v_user,'commerce.order_cancelled','customer_order',p_order_id::text,jsonb_build_object('reason',trim(p_reason)));
end;
$$;
revoke all on function public.cancel_customer_order(uuid,text) from public,anon;
grant execute on function public.cancel_customer_order(uuid,text) to authenticated;

-- Business account approval is a separate trust decision; tax evidence is reviewed manually.
create or replace function public.review_business_account(p_business_id uuid,p_decision text,p_reason text)
returns void language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid();
begin
  if v_user is null or not (public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Admin role required'; end if;
  if p_decision not in ('approved','rejected') then raise exception 'Decision must be approved or rejected'; end if;
  if nullif(trim(p_reason),'') is null then raise exception 'Review reason required'; end if;
  update public.business_accounts set verification_status=p_decision::public.record_status,reviewed_by=v_user,reviewed_at=now(),review_reason=trim(p_reason)
    where id=p_business_id and verification_status='pending_review';
  if not found then raise exception 'Pending business account not found'; end if;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
  values(v_user,'b2b.business_review','business_account',p_business_id::text,jsonb_build_object('decision',p_decision,'reason',trim(p_reason)));
end;
$$;
revoke all on function public.review_business_account(uuid,text,text) from public,anon;
grant execute on function public.review_business_account(uuid,text,text) to authenticated;

create or replace function public.create_trade_enquiry(p_business_id uuid,p_product_id uuid,p_quantity numeric,p_message text)
returns uuid language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid(); v_enquiry uuid;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_quantity is not null and p_quantity<=0 then raise exception 'Requested quantity must be positive'; end if;
  if not exists(select 1 from public.business_accounts where id=p_business_id and owner_user_id=v_user and verification_status='approved') then
    raise exception 'An approved business account owned by the current user is required';
  end if;
  if p_product_id is not null and not exists(select 1 from public.products where id=p_product_id and approval_status='approved' and published_at is not null) then
    raise exception 'Product is not available for trade enquiry';
  end if;
  insert into public.trade_enquiries(business_id,product_id,requested_quantity,message)
    values(p_business_id,p_product_id,p_quantity,nullif(trim(p_message),'')) returning id into v_enquiry;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
    values(v_user,'b2b.enquiry_created','trade_enquiry',v_enquiry::text,jsonb_build_object('business_id',p_business_id,'product_id',p_product_id));
  return v_enquiry;
end;
$$;
revoke all on function public.create_trade_enquiry(uuid,uuid,numeric,text) from public,anon;
grant execute on function public.create_trade_enquiry(uuid,uuid,numeric,text) to authenticated;

create or replace function public.issue_trade_quote(p_enquiry_id uuid,p_total_paise bigint,p_valid_until timestamptz,p_terms text)
returns uuid language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid(); v_quote uuid;
begin
  if v_user is null or not (public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'B2B manager role required'; end if;
  if p_total_paise<0 then raise exception 'Quote total cannot be negative'; end if;
  if p_valid_until is not null and p_valid_until<=now() then raise exception 'Quote expiry must be in the future'; end if;
  if nullif(trim(p_terms),'') is null then raise exception 'Commercial terms are required'; end if;
  perform 1 from public.trade_enquiries where id=p_enquiry_id and status in ('new','reviewing') for update;
  if not found then raise exception 'Enquiry is not eligible for a quote'; end if;
  insert into public.trade_quotes(enquiry_id,total_paise,valid_until,terms,status,created_by,sent_at)
    values(p_enquiry_id,p_total_paise,p_valid_until,trim(p_terms),'sent',v_user,now()) returning id into v_quote;
  update public.trade_enquiries set status='quoted' where id=p_enquiry_id;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
    values(v_user,'b2b.quote_issued','trade_quote',v_quote::text,jsonb_build_object('enquiry_id',p_enquiry_id,'total_paise',p_total_paise,'valid_until',p_valid_until));
  return v_quote;
end;
$$;
revoke all on function public.issue_trade_quote(uuid,bigint,timestamptz,text) from public,anon;
grant execute on function public.issue_trade_quote(uuid,bigint,timestamptz,text) to authenticated;

create or replace function public.respond_to_trade_quote(p_quote_id uuid,p_decision text,p_reason text default null)
returns void language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid(); v_business uuid; v_status text;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_decision not in ('accepted','declined') then raise exception 'Decision must be accepted or declined'; end if;
  select e.business_id,q.status into v_business,v_status
  from public.trade_quotes q join public.trade_enquiries e on e.id=q.enquiry_id
  join public.business_accounts b on b.id=e.business_id
  where q.id=p_quote_id and b.owner_user_id=v_user and b.verification_status='approved'
  for update of q;
  if not found or v_status<>'sent' then raise exception 'Quote is not available to this business'; end if;
  if exists(select 1 from public.trade_quotes where id=p_quote_id and valid_until is not null and valid_until<=now()) then
    raise exception 'Quote has expired';
  end if;
  update public.trade_quotes set status=p_decision,responded_at=now(),response_reason=nullif(trim(p_reason),'') where id=p_quote_id;
  update public.trade_enquiries set status=case when p_decision='accepted' then 'accepted' else 'reviewing' end
    where id=(select enquiry_id from public.trade_quotes where id=p_quote_id);
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
    values(v_user,'b2b.quote_response','trade_quote',p_quote_id::text,jsonb_build_object('decision',p_decision,'reason',p_reason));
end;
$$;
revoke all on function public.respond_to_trade_quote(uuid,text,text) from public,anon;
grant execute on function public.respond_to_trade_quote(uuid,text,text) to authenticated;

-- No direct browser table access is granted. All workflows above use authenticated,
-- narrowly scoped SECURITY DEFINER functions with explicit ownership/role checks.
