-- Rasvani Phase 10: protected warehouse workspace queries and receipt helpers.
-- Apply after migrations 001–012. No direct browser table access is introduced.

create or replace function public.create_warehouse_receipt(
  p_warehouse_id uuid,
  p_delivery_reference text default null,
  p_producer_id uuid default null,
  p_notes text default null
) returns uuid
language plpgsql security definer set search_path=public,auth as $$
declare
  v_user uuid:=auth.uid();
  v_receipt_id uuid;
begin
  if v_user is null or not (public.has_app_role('warehouse_operator') or public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Warehouse operator role required';
  end if;
  if not exists(select 1 from public.warehouses where id=p_warehouse_id and active) then
    raise exception 'Choose an active warehouse';
  end if;
  if p_producer_id is null or not exists(select 1 from public.producer_profiles where id=p_producer_id and application_status='approved') then
    raise exception 'Choose an approved producer';
  end if;
  if length(coalesce(p_delivery_reference,''))>120 or length(coalesce(p_notes,''))>1000 then
    raise exception 'Receipt reference or notes exceed the permitted length';
  end if;
  insert into public.receipts(warehouse_id,producer_id,delivery_reference,received_by,status,notes)
  values(p_warehouse_id,p_producer_id,nullif(trim(p_delivery_reference),''),v_user,'pending_inspection',nullif(trim(p_notes),''))
  returning id into v_receipt_id;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
  values(v_user,'warehouse.receipt_created','receipt',v_receipt_id::text,jsonb_build_object('warehouse_id',p_warehouse_id,'delivery_reference',p_delivery_reference));
  return v_receipt_id;
end;
$$;
revoke all on function public.create_warehouse_receipt(uuid,text,uuid,text) from public,anon;
grant execute on function public.create_warehouse_receipt(uuid,text,uuid,text) to authenticated;

create or replace function public.get_warehouse_workspace_receipts()
returns table(
  receipt_id uuid, warehouse_name text, warehouse_code text, producer_name text,
  delivery_reference text, received_at timestamptz, receipt_status text, batch_count bigint
)
language plpgsql stable security definer set search_path=public,auth as $$
begin
  if auth.uid() is null or not (public.has_app_role('warehouse_operator') or public.has_app_role('quality_reviewer') or public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Warehouse or quality role required';
  end if;
  return query
  select r.id,w.name,w.code,pp.legal_name,r.delivery_reference,r.received_at,r.status,
         count(b.id)::bigint
  from public.receipts r
  join public.warehouses w on w.id=r.warehouse_id
  left join public.producer_profiles pp on pp.id=r.producer_id
  left join public.inventory_batches b on b.receipt_id=r.id
  group by r.id,w.name,w.code,pp.legal_name,r.delivery_reference,r.received_at,r.status
  order by r.received_at desc limit 100;
end;
$$;
revoke all on function public.get_warehouse_workspace_receipts() from public,anon;
grant execute on function public.get_warehouse_workspace_receipts() to authenticated;

create or replace function public.get_warehouse_workspace_options()
returns jsonb
language plpgsql stable security definer set search_path=public,auth as $$
declare v_result jsonb;
begin
  if auth.uid() is null or not (public.has_app_role('warehouse_operator') or public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Warehouse operator role required';
  end if;
  select jsonb_build_object(
    'warehouses',coalesce((select jsonb_agg(jsonb_build_object('id',w.id,'name',w.name,'code',w.code) order by w.name) from public.warehouses w where w.active),'[]'::jsonb),
    'bins',coalesce((select jsonb_agg(jsonb_build_object('id',b.id,'warehouse_id',b.warehouse_id,'code',b.code) order by b.code) from public.warehouse_bins b where b.active),'[]'::jsonb),
    'products',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'sku',p.sku,'storage_condition',p.storage_condition::text,'producer_id',p.producer_id) order by p.name) from public.products p where p.approval_status='approved' and p.published_at is not null),'[]'::jsonb),
    'producers',coalesce((select jsonb_agg(jsonb_build_object('id',pp.id,'legal_name',pp.legal_name) order by pp.legal_name) from public.producer_profiles pp where pp.application_status='approved'),'[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;
revoke all on function public.get_warehouse_workspace_options() from public,anon;
grant execute on function public.get_warehouse_workspace_options() to authenticated;

create or replace function public.get_warehouse_workspace_batches()
returns table(
  batch_id uuid, product_name text, sku text, batch_code text, quantity_on_hand numeric,
  unit text, stock_status text, inspection_status text, warehouse_name text, bin_code text,
  expiry_date date, best_before_date date, received_at timestamptz
)
language plpgsql stable security definer set search_path=public,auth as $$
begin
  if auth.uid() is null or not (public.has_app_role('warehouse_operator') or public.has_app_role('quality_reviewer') or public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Warehouse or quality role required';
  end if;
  return query
  select b.id,p.name,p.sku,b.batch_code,b.quantity_on_hand,b.unit,b.status::text,b.inspection_status,
         w.name,wb.code,b.expiry_date,b.best_before_date,b.received_at
  from public.inventory_batches b
  join public.products p on p.id=b.product_id
  join public.warehouses w on w.id=b.warehouse_id
  left join public.warehouse_bins wb on wb.id=b.bin_id
  where b.status not in ('disposed')
  order by case when b.status='quarantined' then 0 when b.status='sellable' then 1 else 2 end,
           b.received_at desc
  limit 150;
end;
$$;
revoke all on function public.get_warehouse_workspace_batches() from public,anon;
grant execute on function public.get_warehouse_workspace_batches() to authenticated;

create or replace function public.get_warehouse_workspace_returns()
returns table(
  case_id uuid, batch_id uuid, product_name text, batch_code text, quantity numeric,
  reason text, case_status text, opened_at timestamptz, warehouse_name text
)
language plpgsql stable security definer set search_path=public,auth as $$
begin
  if auth.uid() is null or not (public.has_app_role('quality_reviewer') or public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Quality reviewer role required';
  end if;
  return query
  select rc.id,rc.batch_id,p.name,b.batch_code,rc.quantity,rc.reason,rc.status,rc.created_at,w.name
  from public.receipt_return_cases rc
  join public.inventory_batches b on b.id=rc.batch_id
  join public.products p on p.id=b.product_id
  join public.warehouses w on w.id=b.warehouse_id
  where rc.status='quarantined'
  order by rc.created_at asc limit 100;
end;
$$;
revoke all on function public.get_warehouse_workspace_returns() from public,anon;
grant execute on function public.get_warehouse_workspace_returns() to authenticated;

create or replace function public.get_warehouse_expiry_watch()
returns table(
  batch_id uuid, product_name text, batch_code text, quantity_on_hand numeric, unit text,
  warehouse_name text, controlling_date date, expiry_state text
)
language plpgsql stable security definer set search_path=public,auth as $$
begin
  if auth.uid() is null or not (public.has_app_role('warehouse_operator') or public.has_app_role('quality_reviewer') or public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Warehouse or quality role required';
  end if;
  return query
  select b.id,p.name,b.batch_code,b.quantity_on_hand,b.unit,w.name,
         coalesce(b.expiry_date,b.best_before_date),
         case when coalesce(b.expiry_date,b.best_before_date)<current_date then 'expired'
              when coalesce(b.expiry_date,b.best_before_date)<=current_date+30 then 'approaching_expiry'
              else 'in_date' end
  from public.inventory_batches b
  join public.products p on p.id=b.product_id
  join public.warehouses w on w.id=b.warehouse_id
  where b.status='sellable' and b.inspection_status='accepted'
    and coalesce(b.expiry_date,b.best_before_date) is not null
    and coalesce(b.expiry_date,b.best_before_date)<=current_date+30
  order by coalesce(b.expiry_date,b.best_before_date),p.name limit 150;
end;
$$;
revoke all on function public.get_warehouse_expiry_watch() from public,anon;
grant execute on function public.get_warehouse_expiry_watch() to authenticated;

-- Replace the batch decision function with a stronger gate: mandatory receiving checks
-- must all pass and any failed check blocks acceptance. Rejected batches are terminal here.
create or replace function public.set_batch_inspection(p_batch_id uuid,p_decision text,p_reason text)
returns void language plpgsql security definer set search_path=public,auth as $$
declare
  v_user uuid:=auth.uid();
  v_product_id uuid;
  v_storage public.storage_condition;
  v_receipt_id uuid;
begin
  if v_user is null or not (public.has_app_role('quality_reviewer') or public.has_app_role('warehouse_operator') or public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Quality or warehouse role required';
  end if;
  if p_decision not in ('accepted','quarantined','rejected') then raise exception 'Invalid inspection decision'; end if;
  if nullif(trim(p_reason),'') is null or length(trim(p_reason))<3 then raise exception 'Inspection reason is required'; end if;

  select b.product_id,b.receipt_id,p.storage_condition into v_product_id,v_receipt_id,v_storage
  from public.inventory_batches b join public.products p on p.id=b.product_id
  where b.id=p_batch_id and b.status='quarantined' and b.inspection_status in ('pending','quarantined')
  for update of b;
  if not found then raise exception 'Batch not found or not awaiting initial inspection'; end if;

  if p_decision='accepted' then
    if exists(
      select 1 from public.receiving_inspections i
      where i.batch_id=p_batch_id and i.result='fail'
    ) then raise exception 'A failed receiving checklist item blocks acceptance'; end if;
    if exists(
      select 1 from public.receiving_checklist_templates t
      where t.active and t.required and (t.applies_to_storage is null or t.applies_to_storage=v_storage)
        and not exists(select 1 from public.receiving_inspections i where i.batch_id=p_batch_id and i.checklist_key=t.checklist_key and i.result='pass')
    ) then raise exception 'All mandatory receiving checklist items must pass before acceptance'; end if;
  end if;

  update public.inventory_batches
  set inspection_status=p_decision,
      status=case p_decision when 'accepted' then 'sellable'::public.stock_status
                             when 'rejected' then 'rejected'::public.stock_status
                             else 'quarantined'::public.stock_status end
  where id=p_batch_id;

  insert into public.inventory_movements(batch_id,movement_type,quantity_delta,reason,actor_id)
  values(p_batch_id,case when p_decision='accepted' then 'adjustment' when p_decision='rejected' then 'quarantine' else 'quarantine' end,
         0,'Inspection decision: '||p_decision||' — '||trim(p_reason),v_user);
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
  values(v_user,'inventory.inspection_decision','inventory_batch',p_batch_id::text,jsonb_build_object('decision',p_decision,'reason',p_reason));

  -- Keep the receipt open for additional lots. Intake is closed explicitly only after every batch is inspected.
end;
$$;
revoke all on function public.set_batch_inspection(uuid,text,text) from public,anon;
grant execute on function public.set_batch_inspection(uuid,text,text) to authenticated;



create or replace function public.close_warehouse_receipt(p_receipt_id uuid,p_reason text default 'All received lots reviewed; intake closed')
returns void language plpgsql security definer set search_path=public,auth as $$
declare
  v_user uuid:=auth.uid();
  v_total integer;
  v_accepted integer;
  v_rejected integer;
  v_pending integer;
begin
  if v_user is null or not (public.has_app_role('warehouse_operator') or public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Warehouse operator role required';
  end if;
  if nullif(trim(p_reason),'') is null or length(trim(p_reason))>500 then raise exception 'Receipt close reason is required'; end if;
  perform 1 from public.receipts where id=p_receipt_id and status in ('pending_inspection','partially_accepted') for update;
  if not found then raise exception 'Receipt is not open'; end if;
  select count(*),
         count(*) filter(where status='sellable' and inspection_status='accepted'),
         count(*) filter(where status='rejected' and inspection_status='rejected'),
         count(*) filter(where status='quarantined' or inspection_status in ('pending','quarantined'))
    into v_total,v_accepted,v_rejected,v_pending
    from public.inventory_batches where receipt_id=p_receipt_id;
  if v_total=0 then raise exception 'A receipt must contain at least one batch before closure'; end if;
  if v_pending>0 then raise exception 'Every batch must be accepted or rejected before receipt closure'; end if;
  update public.receipts set status='closed' where id=p_receipt_id;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
  values(v_user,'warehouse.receipt_closed','receipt',p_receipt_id::text,
    jsonb_build_object('total_batches',v_total,'accepted_batches',v_accepted,'rejected_batches',v_rejected,'reason',trim(p_reason)));
end;
$$;
revoke all on function public.close_warehouse_receipt(uuid,text) from public,anon;
grant execute on function public.close_warehouse_receipt(uuid,text) to authenticated;

comment on function public.close_warehouse_receipt(uuid,text) is 'Closes a receipt only after it contains at least one batch and all batches have been accepted or rejected.';

comment on function public.get_warehouse_workspace_receipts() is 'Returns up to 100 recent receipt summaries to authenticated warehouse/quality staff.';
comment on function public.get_warehouse_workspace_batches() is 'Returns up to 150 recent inventory batch summaries to authenticated warehouse/quality staff.';
comment on function public.set_batch_inspection(uuid,text,text) is 'Initial batch inspection only; acceptance requires all mandatory receiving checklist items to have passed.';


-- Direct client execution of the lower-level receiver is revoked; staff use the checked wrapper below.
revoke all on function public.receive_inventory_batch(uuid,uuid,text,numeric,text,date,date,date,date,uuid,jsonb,text,text[]) from authenticated;

-- Wrapper adds cross-record producer traceability before invoking the established atomic receiver.
create or replace function public.receive_warehouse_batch_checked(
  p_receipt_id uuid, p_product_id uuid, p_batch_code text, p_quantity numeric, p_unit text,
  p_manufactured_on date, p_packed_on date, p_expiry_date date, p_best_before_date date,
  p_bin_id uuid, p_checklist jsonb, p_notes text default null, p_photo_paths text[] default '{}'
) returns uuid language plpgsql security definer set search_path=public,auth as $$
declare v_receipt_producer uuid; v_product_producer uuid;
begin
  if auth.uid() is null or not (public.has_app_role('warehouse_operator') or public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Warehouse operator role required';
  end if;
  select producer_id into v_receipt_producer from public.receipts where id=p_receipt_id;
  if not found then raise exception 'Receipt not found'; end if;
  select producer_id into v_product_producer from public.products where id=p_product_id;
  if not found then raise exception 'Product not found'; end if;
  if v_receipt_producer is null or v_product_producer is null or v_receipt_producer<>v_product_producer then
    raise exception 'The receipt producer must match the selected product producer';
  end if;
  return public.receive_inventory_batch(p_receipt_id,p_product_id,p_batch_code,p_quantity,p_unit,
    p_manufactured_on,p_packed_on,p_expiry_date,p_best_before_date,p_bin_id,p_checklist,p_notes,p_photo_paths);
end;
$$;
revoke all on function public.receive_warehouse_batch_checked(uuid,uuid,text,numeric,text,date,date,date,date,uuid,jsonb,text,text[]) from public,anon;
grant execute on function public.receive_warehouse_batch_checked(uuid,uuid,text,numeric,text,date,date,date,date,uuid,jsonb,text,text[]) to authenticated;

comment on function public.receive_warehouse_batch_checked(uuid,uuid,text,numeric,text,date,date,date,date,uuid,jsonb,text,text[]) is 'Receives a batch only when the producer recorded on the receipt matches the approved product producer.';
