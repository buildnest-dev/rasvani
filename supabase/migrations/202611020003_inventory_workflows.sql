-- Rasvani Phase 10 transactional inventory controls.
-- Apply after 001 and 002. Functions are narrow SECURITY DEFINER entry points;
-- client roles cannot write inventory tables directly.

-- Seed the complete region directory as unpublished records. Publication remains an editorial decision.
insert into public.regions(id,name,region_type,slug,publication_status) values
('andhra-pradesh','Andhra Pradesh','state','andhra-pradesh','draft'),
('arunachal-pradesh','Arunachal Pradesh','state','arunachal-pradesh','draft'),
('assam','Assam','state','assam','draft'),
('bihar','Bihar','state','bihar','draft'),
('chhattisgarh','Chhattisgarh','state','chhattisgarh','draft'),
('goa','Goa','state','goa','draft'),
('gujarat','Gujarat','state','gujarat','draft'),
('haryana','Haryana','state','haryana','draft'),
('himachal-pradesh','Himachal Pradesh','state','himachal-pradesh','draft'),
('jharkhand','Jharkhand','state','jharkhand','draft'),
('karnataka','Karnataka','state','karnataka','draft'),
('kerala','Kerala','state','kerala','draft'),
('madhya-pradesh','Madhya Pradesh','state','madhya-pradesh','draft'),
('maharashtra','Maharashtra','state','maharashtra','draft'),
('manipur','Manipur','state','manipur','draft'),
('meghalaya','Meghalaya','state','meghalaya','draft'),
('mizoram','Mizoram','state','mizoram','draft'),
('nagaland','Nagaland','state','nagaland','draft'),
('odisha','Odisha','state','odisha','draft'),
('punjab','Punjab','state','punjab','draft'),
('rajasthan','Rajasthan','state','rajasthan','draft'),
('sikkim','Sikkim','state','sikkim','draft'),
('tamil-nadu','Tamil Nadu','state','tamil-nadu','draft'),
('telangana','Telangana','state','telangana','draft'),
('tripura','Tripura','state','tripura','draft'),
('uttar-pradesh','Uttar Pradesh','state','uttar-pradesh','draft'),
('uttarakhand','Uttarakhand','state','uttarakhand','draft'),
('west-bengal','West Bengal','state','west-bengal','draft'),
('andaman-and-nicobar-islands','Andaman and Nicobar Islands','union_territory','andaman-and-nicobar-islands','draft'),
('chandigarh','Chandigarh','union_territory','chandigarh','draft'),
('dadra-and-nagar-haveli-and-daman-and-diu','Dadra and Nagar Haveli and Daman and Diu','union_territory','dadra-and-nagar-haveli-and-daman-and-diu','draft'),
('delhi','Delhi','union_territory','delhi','draft'),
('jammu-and-kashmir','Jammu and Kashmir','union_territory','jammu-and-kashmir','draft'),
('ladakh','Ladakh','union_territory','ladakh','draft'),
('lakshadweep','Lakshadweep','union_territory','lakshadweep','draft'),
('puducherry','Puducherry','union_territory','puducherry','draft')
on conflict(id) do update set name=excluded.name, region_type=excluded.region_type, slug=excluded.slug;

create index if not exists stock_reservations_active_batch_idx
 on public.stock_reservations(batch_id, expires_at) where status='active';
create index if not exists inventory_batches_product_expiry_idx
 on public.inventory_batches(product_id, expiry_date nulls last, received_at)
 where status='sellable' and inspection_status='accepted';

-- FEFO allocation across eligible batches. Row locks serialize competing allocations;
-- any shortfall raises and rolls back the whole transaction.
create or replace function public.reserve_order_stock(p_order_id uuid, p_product_id uuid, p_quantity numeric, p_ttl_minutes integer default 30)
returns table(batch_id uuid, reserved_quantity numeric, reservation_id uuid)
language plpgsql security definer set search_path = public, auth as $$
declare
  v_user uuid := auth.uid();
  v_order_customer uuid;
  v_order_status public.order_status;
  v_remaining numeric := p_quantity;
  v_available numeric;
  v_take numeric;
  v_batch record;
  v_reservation uuid;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'Quantity must be positive'; end if;
  if p_ttl_minutes is null or p_ttl_minutes < 1 or p_ttl_minutes > 120 then raise exception 'Reservation TTL must be 1–120 minutes'; end if;

  select customer_id,status into v_order_customer,v_order_status
    from public.customer_orders where id=p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order_customer <> v_user and not (public.has_app_role('warehouse_operator') or public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Not permitted to allocate this order';
  end if;
  if v_order_status not in ('placed','confirmed','allocated') then raise exception 'Order is not eligible for allocation'; end if;

  for v_batch in
    select b.* from public.inventory_batches b
    where b.product_id=p_product_id
      and b.status='sellable' and b.inspection_status='accepted'
      and (b.expiry_date is null or b.expiry_date >= current_date)
    order by b.expiry_date nulls last, b.received_at, b.id
    for update skip locked
  loop
    select greatest(0, v_batch.quantity_on_hand - coalesce(sum(r.quantity),0)) into v_available
      from public.stock_reservations r
      where r.batch_id=v_batch.id and r.status='active' and r.expires_at > now();
    if v_available > 0 then
      v_take := least(v_available,v_remaining);
      v_reservation := gen_random_uuid();
      insert into public.stock_reservations(id,batch_id,order_id,quantity,status,expires_at)
      values(v_reservation,v_batch.id,p_order_id,v_take,'active',now()+make_interval(mins=>p_ttl_minutes));
      insert into public.inventory_movements(batch_id,movement_type,quantity_delta,reference_type,reference_id,reason,actor_id)
      values(v_batch.id,'reserve',v_take,'customer_order',p_order_id,'FEFO order stock reservation',v_user);
      batch_id := v_batch.id; reserved_quantity := v_take; reservation_id := v_reservation;
      return next;
      v_remaining := v_remaining-v_take;
      exit when v_remaining=0;
    end if;
  end loop;

  if v_remaining > 0 then raise exception 'Insufficient eligible stock; allocation rolled back'; end if;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
  values(v_user,'inventory.reserve','customer_order',p_order_id::text,jsonb_build_object('product_id',p_product_id,'quantity',p_quantity));
end;
$$;
revoke all on function public.reserve_order_stock(uuid,uuid,numeric,integer) from public, anon;
grant execute on function public.reserve_order_stock(uuid,uuid,numeric,integer) to authenticated;

-- Quality/warehouse staff can accept or quarantine a received batch; rejected stock
-- can never be made sellable through this function.
create or replace function public.set_batch_inspection(p_batch_id uuid, p_decision text, p_reason text)
returns void language plpgsql security definer set search_path = public, auth as $$
declare v_user uuid := auth.uid(); v_status public.stock_status;
begin
  if v_user is null or not (public.has_app_role('quality_reviewer') or public.has_app_role('warehouse_operator') or public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Quality or warehouse role required';
  end if;
  if p_decision not in ('accepted','quarantined','rejected') then raise exception 'Invalid inspection decision'; end if;
  if p_reason is null or length(trim(p_reason)) < 3 then raise exception 'Inspection reason is required'; end if;
  v_status := case p_decision when 'accepted' then 'sellable'::public.stock_status when 'rejected' then 'rejected'::public.stock_status else 'quarantined'::public.stock_status end;
  update public.inventory_batches set inspection_status=p_decision,status=v_status
    where id=p_batch_id and status not in ('expired','recalled','disposed','damaged');
  if not found then raise exception 'Batch not found or cannot be reclassified'; end if;
  insert into public.inventory_movements(batch_id,movement_type,quantity_delta,reason,actor_id)
    values(p_batch_id,case p_decision when 'accepted' then 'adjustment' when 'rejected' then 'quarantine' else 'quarantine' end,0,'Inspection decision: '||p_decision||' — '||trim(p_reason),v_user);
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
    values(v_user,'inventory.inspection_decision','inventory_batch',p_batch_id::text,jsonb_build_object('decision',p_decision,'reason',p_reason));
end;
$$;
revoke all on function public.set_batch_inspection(uuid,text,text) from public, anon;
grant execute on function public.set_batch_inspection(uuid,text,text) to authenticated;

-- Recall blocks all affected batches immediately and records the action.
create or replace function public.recall_product_batches(p_product_id uuid, p_reason text)
returns integer language plpgsql security definer set search_path = public, auth as $$
declare v_user uuid := auth.uid(); v_count integer;
begin
  if v_user is null or not (public.has_app_role('quality_reviewer') or public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Quality reviewer or admin role required'; end if;
  if p_reason is null or length(trim(p_reason)) < 5 then raise exception 'Recall reason is required'; end if;
  with affected as (
    update public.inventory_batches set status='recalled'
    where product_id=p_product_id and status not in ('recalled','disposed') returning id,quantity_on_hand
  )
  insert into public.inventory_movements(batch_id,movement_type,quantity_delta,reason,actor_id)
    select id,'recall',0,trim(p_reason),v_user from affected;
  get diagnostics v_count = row_count;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
    values(v_user,'inventory.product_recall','product',p_product_id::text,jsonb_build_object('reason',p_reason,'batches_affected',v_count));
  return v_count;
end;
$$;
revoke all on function public.recall_product_batches(uuid,text) from public, anon;
grant execute on function public.recall_product_batches(uuid,text) to authenticated;

-- Never permit ordinary application roles to rewrite stock movement history.
revoke all on table public.inventory_movements, public.receiving_inspections, public.stock_reservations from anon, authenticated;
grant select on table public.inventory_movements, public.receiving_inspections, public.stock_reservations to authenticated;
