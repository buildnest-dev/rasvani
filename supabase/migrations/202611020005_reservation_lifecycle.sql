-- Rasvani Phase 5/10: reservation quantity guard and controlled release/dispatch.
-- Apply after migration 004. Payment capture and carrier dispatch remain separate integrations.

-- Serialize reservations for an order and prevent cumulative active/consumed reservations
-- from exceeding the ordered product quantity.
create or replace function public.guard_order_reservation_quantity()
returns trigger language plpgsql security definer set search_path=public,auth as $$
declare v_product uuid; v_ordered numeric; v_reserved numeric;
begin
 if new.status not in ('active','consumed') then return new; end if;
 select l.product_id,sum(l.quantity) into v_product,v_ordered
 from public.customer_order_lines l
 where l.order_id=new.order_id and l.product_id=(select b.product_id from public.inventory_batches b where b.id=new.batch_id)
 group by l.product_id;
 if not found then raise exception 'Reservation product is not present on order'; end if;
 perform 1 from public.customer_orders where id=new.order_id for update;
 select coalesce(sum(r.quantity),0) into v_reserved
 from public.stock_reservations r
 join public.inventory_batches b on b.id=r.batch_id
 where r.order_id=new.order_id and b.product_id=v_product
   and r.status in ('active','consumed')
   and (tg_op='INSERT' or r.id<>new.id);
 if v_reserved+new.quantity>v_ordered then raise exception 'Reservations exceed ordered quantity'; end if;
 return new;
end;
$$;
create trigger stock_reservations_order_quantity_guard
before insert or update of quantity,status,order_id,batch_id on public.stock_reservations
for each row execute function public.guard_order_reservation_quantity();
revoke all on function public.guard_order_reservation_quantity() from public,anon,authenticated;

create or replace function public.release_order_stock(p_order_id uuid,p_reason text default 'Order reservation released')
returns integer language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid(); v_owner uuid; v_count integer;
begin
 if v_user is null then raise exception 'Authentication required'; end if;
 select customer_id into v_owner from public.customer_orders where id=p_order_id for update;
 if not found then raise exception 'Order not found'; end if;
 if v_owner<>v_user and not (public.has_app_role('warehouse_operator') or public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Not permitted to release this order'; end if;
 if nullif(trim(p_reason),'') is null then raise exception 'Release reason required'; end if;
 with released as (
  update public.stock_reservations set status='released'
  where order_id=p_order_id and status='active' returning id,batch_id,quantity
 ) insert into public.inventory_movements(batch_id,movement_type,quantity_delta,reference_type,reference_id,reason,actor_id)
   select batch_id,'release',quantity,'customer_order',p_order_id,trim(p_reason),v_user from released;
 get diagnostics v_count=row_count;
 insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
 values(v_user,'inventory.reservation_release','customer_order',p_order_id::text,jsonb_build_object('reservations_released',v_count,'reason',p_reason));
 return v_count;
end;
$$;
revoke all on function public.release_order_stock(uuid,text) from public,anon;
grant execute on function public.release_order_stock(uuid,text) to authenticated;

-- Expired reservations are released by an authorised scheduled caller. This function
-- intentionally does not require auth.uid() so a trusted server scheduler can call it;
-- execution is not granted to browser roles.
create or replace function public.release_expired_stock_reservations()
returns integer language plpgsql security definer set search_path=public,auth as $$
declare v_count integer;
begin
 with released as (
  update public.stock_reservations set status='expired'
  where status='active' and expires_at<=now() returning id,batch_id,order_id,quantity
 ) insert into public.inventory_movements(batch_id,movement_type,quantity_delta,reference_type,reference_id,reason,actor_id)
   select batch_id,'release',quantity,'customer_order',order_id,'Reservation TTL elapsed',null from released;
 get diagnostics v_count=row_count;
 return v_count;
end;
$$;
revoke all on function public.release_expired_stock_reservations() from public,anon,authenticated;

-- Consume only a complete, active reservation set for the order. Stock decrement and
-- movement ledger writes occur in one transaction; external dispatch must follow success.
create or replace function public.consume_order_stock(p_order_id uuid)
returns integer language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid(); v_owner uuid; v_status public.order_status; v_count integer;
begin
 if v_user is null or not (public.has_app_role('warehouse_operator') or public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Warehouse role required'; end if;
 select customer_id,status into v_owner,v_status from public.customer_orders where id=p_order_id for update;
 if not found then raise exception 'Order not found'; end if;
 if v_status not in ('placed','confirmed','allocated','packed') then raise exception 'Order is not eligible for stock consumption'; end if;
 if exists(select 1 from public.stock_reservations where order_id=p_order_id and status='active' and expires_at<=now()) then raise exception 'Order has expired reservations'; end if;
 if not exists(select 1 from public.stock_reservations where order_id=p_order_id and status='active') then raise exception 'No active reservations'; end if;
 if exists(
  select 1 from public.stock_reservations r join public.inventory_batches b on b.id=r.batch_id
  where r.order_id=p_order_id and r.status='active'
    and (b.status<>'sellable' or b.inspection_status<>'accepted' or (coalesce(b.expiry_date,b.best_before_date) is not null and coalesce(b.expiry_date,b.best_before_date)<current_date) or b.quantity_on_hand<r.quantity)
 ) then raise exception 'Reserved batch is no longer eligible or has insufficient physical stock'; end if;
 with consumed as (
  update public.stock_reservations set status='consumed'
  where order_id=p_order_id and status='active' returning batch_id,quantity
 ), totals as (
  select batch_id,sum(quantity) quantity from consumed group by batch_id
 ), decremented as (
  update public.inventory_batches b set quantity_on_hand=b.quantity_on_hand-t.quantity
  from totals t where b.id=t.batch_id returning b.id,t.quantity
 )
 insert into public.inventory_movements(batch_id,movement_type,quantity_delta,reference_type,reference_id,reason,actor_id)
 select id,'dispatch',-quantity,'customer_order',p_order_id,'Reserved stock consumed for order dispatch',v_user from decremented;
 get diagnostics v_count=row_count;
 update public.customer_orders set status='dispatched' where id=p_order_id;
 insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
 values(v_user,'inventory.order_stock_consumed','customer_order',p_order_id::text,jsonb_build_object('batch_movements',v_count));
 return v_count;
end;
$$;
revoke all on function public.consume_order_stock(uuid) from public,anon;
grant execute on function public.consume_order_stock(uuid) to authenticated;
