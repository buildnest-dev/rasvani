-- Rasvani Phase 10: receiving, returns quarantine and expiry operations.
-- Apply after migrations 001–003. These functions are database workflows, not a live warehouse UI.

create table public.receiving_checklist_templates (
  id uuid primary key default gen_random_uuid(),
  checklist_key text not null unique,
  title text not null,
  applies_to_storage public.storage_condition,
  required boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.receipt_return_cases (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.inventory_batches(id),
  order_id uuid references public.customer_orders(id),
  quantity numeric(14,3) not null check(quantity > 0),
  reason text not null check(length(trim(reason)) >= 3),
  status text not null default 'quarantined' check(status in ('quarantined','inspected_usable','rejected','disposed')),
  opened_by uuid references auth.users(id),
  inspected_by uuid references auth.users(id),
  inspection_notes text,
  created_at timestamptz not null default now(),
  inspected_at timestamptz
);

create index if not exists inventory_batches_expiry_monitor_idx
  on public.inventory_batches(expiry_date, best_before_date)
  where status='sellable' and inspection_status='accepted';
create index if not exists receipt_return_cases_batch_idx
  on public.receipt_return_cases(batch_id, status, created_at desc);

alter table public.receiving_checklist_templates enable row level security;
alter table public.receipt_return_cases enable row level security;
revoke all on public.receiving_checklist_templates, public.receipt_return_cases from anon, authenticated;
grant select on public.receiving_checklist_templates to authenticated;
grant select on public.receipt_return_cases to authenticated;

-- Common checklist items are mandatory; storage-specific items can be added by an authorised admin.
insert into public.receiving_checklist_templates(checklist_key,title,required) values
 ('identity_match','Product, SKU and producer identity match',true),
 ('batch_code','Unique producer batch/lot code recorded',true),
 ('quantity_match','Expected and received quantity reconciled',true),
 ('packaging_integrity','Packaging and seal integrity checked',true),
 ('damage_leakage','Damage, leakage and contamination checked',true),
 ('labels_documents','Labels and accompanying documents checked',true),
 ('date_codes','Manufacture, packing and expiry/best-before dates checked',true),
 ('storage_condition','Required storage condition maintained in transit',true)
on conflict(checklist_key) do nothing;

-- Atomically receive a batch into quarantine. It cannot be sold until the full checklist passes
-- and an authorised reviewer explicitly accepts the batch.
create or replace function public.receive_inventory_batch(
  p_receipt_id uuid, p_product_id uuid, p_batch_code text, p_quantity numeric, p_unit text,
  p_manufactured_on date, p_packed_on date, p_expiry_date date, p_best_before_date date,
  p_bin_id uuid, p_checklist jsonb, p_notes text default null, p_photo_paths text[] default '{}'
) returns uuid language plpgsql security definer set search_path=public,auth as $$
declare
  v_user uuid := auth.uid(); v_receipt public.receipts%rowtype; v_product public.products%rowtype;
  v_batch uuid; v_required integer; v_supplied integer; v_failed integer; v_item jsonb;
  v_key text; v_result text;
begin
  if v_user is null or not (public.has_app_role('warehouse_operator') or public.has_app_role('quality_reviewer') or public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Warehouse role required';
  end if;
  if p_quantity is null or p_quantity <= 0 or nullif(trim(p_batch_code),'') is null or nullif(trim(p_unit),'') is null then
    raise exception 'Batch code, unit and positive quantity are required';
  end if;
  if p_expiry_date is not null and p_manufactured_on is not null and p_expiry_date < p_manufactured_on then raise exception 'Expiry precedes manufacture date'; end if;
  if p_best_before_date is not null and p_manufactured_on is not null and p_best_before_date < p_manufactured_on then raise exception 'Best-before precedes manufacture date'; end if;
  select * into v_receipt from public.receipts where id=p_receipt_id for update;
  if not found or v_receipt.status not in ('pending_inspection','partially_accepted') then raise exception 'Receipt is unavailable for receiving'; end if;
  select * into v_product from public.products where id=p_product_id;
  if not found then raise exception 'Product not found'; end if;
  if not exists(select 1 from public.warehouse_bins b where b.id=p_bin_id and b.warehouse_id=v_receipt.warehouse_id and b.active) then raise exception 'Bin must be active and belong to receipt warehouse'; end if;
  if jsonb_typeof(coalesce(p_checklist,'[]'::jsonb)) <> 'array' then raise exception 'Checklist must be an array'; end if;
  select count(*) into v_required from public.receiving_checklist_templates t
   where t.active and t.required and (t.applies_to_storage is null or t.applies_to_storage=v_product.storage_condition);
  select count(distinct x->>'key') into v_supplied from jsonb_array_elements(coalesce(p_checklist,'[]'::jsonb)) x;
  select count(*) into v_failed from jsonb_array_elements(coalesce(p_checklist,'[]'::jsonb)) x where x->>'result' not in ('pass','fail','not_applicable');
  if v_failed>0 then raise exception 'Invalid checklist result'; end if;
  if exists(select 1 from public.receiving_checklist_templates t where t.active and t.required
    and (t.applies_to_storage is null or t.applies_to_storage=v_product.storage_condition)
    and not exists(select 1 from jsonb_array_elements(coalesce(p_checklist,'[]'::jsonb)) x where x->>'key'=t.checklist_key and x->>'result' in ('pass','fail'))) then
    raise exception 'All mandatory receiving checklist items must be completed';
  end if;
  insert into public.inventory_batches(product_id,producer_id,receipt_id,batch_code,manufactured_on,packed_on,received_at,expiry_date,best_before_date,quantity_received,quantity_on_hand,unit,status,inspection_status,warehouse_id,bin_id)
  values(p_product_id,v_receipt.producer_id,p_receipt_id,trim(p_batch_code),p_manufactured_on,p_packed_on,now(),p_expiry_date,p_best_before_date,p_quantity,p_quantity,p_unit,'quarantined','pending',v_receipt.warehouse_id,p_bin_id)
  returning id into v_batch;
  for v_item in select * from jsonb_array_elements(coalesce(p_checklist,'[]'::jsonb)) loop
    v_key:=v_item->>'key'; v_result:=v_item->>'result';
    if not exists(select 1 from public.receiving_checklist_templates where checklist_key=v_key and active and (applies_to_storage is null or applies_to_storage=v_product.storage_condition)) then raise exception 'Unknown or inapplicable checklist key: %',v_key; end if;
    insert into public.receiving_inspections(receipt_id,batch_id,checklist_key,result,notes,photo_paths,inspected_by)
    values(p_receipt_id,v_batch,v_key,v_result,v_item->>'notes',coalesce(p_photo_paths,'{}'),v_user);
  end loop;
  insert into public.inventory_movements(batch_id,movement_type,quantity_delta,to_bin_id,reference_type,reference_id,reason,actor_id)
  values(v_batch,'receive',p_quantity,p_bin_id,'receipt',p_receipt_id,coalesce(p_notes,'Received into quarantine pending quality approval'),v_user);
  update public.receipts set status='pending_inspection', received_by=coalesce(received_by,v_user) where id=p_receipt_id;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
  values(v_user,'inventory.batch_received','inventory_batch',v_batch::text,jsonb_build_object('receipt_id',p_receipt_id,'quantity',p_quantity,'checklist_items',v_supplied));
  return v_batch;
end;
$$;
revoke all on function public.receive_inventory_batch(uuid,uuid,text,numeric,text,date,date,date,date,uuid,jsonb,text,text[]) from public,anon;
grant execute on function public.receive_inventory_batch(uuid,uuid,text,numeric,text,date,date,date,date,uuid,jsonb,text,text[]) to authenticated;

-- Returns always enter quarantine; this function does not add stock back to sellable inventory.
create or replace function public.open_return_quarantine(p_batch_id uuid,p_order_id uuid,p_quantity numeric,p_reason text)
returns uuid language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid(); v_batch public.inventory_batches%rowtype; v_case uuid;
begin
 if v_user is null or not (public.has_app_role('warehouse_operator') or public.has_app_role('quality_reviewer') or public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Warehouse role required'; end if;
 if p_quantity is null or p_quantity<=0 or nullif(trim(p_reason),'') is null then raise exception 'Positive quantity and return reason required'; end if;
 select * into v_batch from public.inventory_batches where id=p_batch_id for update;
 if not found then raise exception 'Batch not found'; end if;
 if p_order_id is not null and not exists(select 1 from public.customer_order_lines l where l.order_id=p_order_id and l.product_id=v_batch.product_id) then raise exception 'Order does not contain this product'; end if;
 insert into public.receipt_return_cases(batch_id,order_id,quantity,reason,opened_by) values(p_batch_id,p_order_id,p_quantity,trim(p_reason),v_user) returning id into v_case;
 insert into public.inventory_movements(batch_id,movement_type,quantity_delta,reference_type,reference_id,reason,actor_id)
 values(p_batch_id,'return',0,'return_case',v_case,'Returned goods quarantined pending inspection: '||trim(p_reason),v_user);
 insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
 values(v_user,'inventory.return_quarantined','return_case',v_case::text,jsonb_build_object('batch_id',p_batch_id,'quantity',p_quantity));
 return v_case;
end;
$$;
revoke all on function public.open_return_quarantine(uuid,uuid,numeric,text) from public,anon;
grant execute on function public.open_return_quarantine(uuid,uuid,numeric,text) to authenticated;

-- Inspection of a returned quantity is separate from the original batch inspection.
-- Usable returns still require a separate controlled stock adjustment after inspection.
create or replace function public.inspect_return_case(p_case_id uuid,p_decision text,p_notes text)
returns void language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid(); v_case public.receipt_return_cases%rowtype;
begin
 if v_user is null or not (public.has_app_role('quality_reviewer') or public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Quality reviewer role required'; end if;
 if p_decision not in ('inspected_usable','rejected','disposed') or nullif(trim(p_notes),'') is null then raise exception 'Valid decision and inspection notes required'; end if;
 select * into v_case from public.receipt_return_cases where id=p_case_id for update;
 if not found or v_case.status<>'quarantined' then raise exception 'Return case is not awaiting inspection'; end if;
 update public.receipt_return_cases set status=p_decision,inspected_by=v_user,inspection_notes=trim(p_notes),inspected_at=now() where id=p_case_id;
 insert into public.inventory_movements(batch_id,movement_type,quantity_delta,reference_type,reference_id,reason,actor_id)
 values(v_case.batch_id,case when p_decision='disposed' then 'dispose' when p_decision='rejected' then 'quarantine' else 'adjustment' end,0,'return_case',p_case_id,'Return inspection: '||p_decision||' — '||trim(p_notes),v_user);
 insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
 values(v_user,'inventory.return_inspected','return_case',p_case_id::text,jsonb_build_object('decision',p_decision));
end;
$$;
revoke all on function public.inspect_return_case(uuid,text,text) from public,anon;
grant execute on function public.inspect_return_case(uuid,text,text) to authenticated;

-- Expiry monitoring query source. Scheduler/notification delivery is intentionally external.
create or replace view public.inventory_expiry_watch as
select b.id as batch_id,b.product_id,b.batch_code,b.warehouse_id,b.bin_id,b.quantity_on_hand,
       b.expiry_date,b.best_before_date,
       case when b.expiry_date is not null then b.expiry_date else b.best_before_date end as controlling_date,
       case when coalesce(b.expiry_date,b.best_before_date)<current_date then 'expired'
            when coalesce(b.expiry_date,b.best_before_date)<=current_date+interval '30 days' then 'approaching_expiry'
            else 'in_date' end as expiry_state
from public.inventory_batches b
where b.status='sellable' and b.inspection_status='accepted'
  and coalesce(b.expiry_date,b.best_before_date) is not null;
revoke all on public.inventory_expiry_watch from anon,authenticated;

-- Expired batches are blocked immediately when the controlled function runs.
create or replace function public.mark_expired_inventory()
returns integer language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid(); v_count integer;
begin
 if v_user is not null and not (public.has_app_role('warehouse_operator') or public.has_app_role('quality_reviewer') or public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Warehouse role required'; end if;
 with expired as (
  update public.inventory_batches set status='expired'
  where status='sellable' and inspection_status='accepted'
    and coalesce(expiry_date,best_before_date)<current_date
  returning id
 ) insert into public.inventory_movements(batch_id,movement_type,quantity_delta,reason,actor_id)
   select id,'adjustment',0,'Automatically blocked after expiry/best-before date',v_user from expired;
 get diagnostics v_count=row_count;
 if v_count>0 then insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
  values(v_user,'inventory.expiry_block','inventory_batch_set',null,jsonb_build_object('batches_affected',v_count)); end if;
 return v_count;
end;
$$;
revoke all on function public.mark_expired_inventory() from public,anon;
grant execute on function public.mark_expired_inventory() to authenticated;
