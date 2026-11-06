-- Configurable receiving checklists by product category and storage condition.
-- Existing global mandatory checks remain in force and are inherited by every product.
alter table public.receiving_checklist_templates
  add column if not exists applies_to_category_id uuid references public.categories(id) on delete restrict;

create index if not exists receiving_checklist_templates_scope_idx
  on public.receiving_checklist_templates(applies_to_category_id,applies_to_storage,active,required);

create or replace function public.get_warehouse_receiving_checklist_templates()
returns table(
  checklist_key text,title text,required boolean,
  applies_to_category_id uuid,applies_to_category_name text,
  applies_to_storage text,active boolean
)
language plpgsql stable security definer set search_path=public,auth as $$
begin
  if auth.uid() is null or not (public.has_app_role('warehouse_operator') or public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Warehouse operator role required';
  end if;
  return query
  select t.checklist_key,t.title,t.required,t.applies_to_category_id,c.name,t.applies_to_storage::text,t.active
  from public.receiving_checklist_templates t
  left join public.categories c on c.id=t.applies_to_category_id
  where t.active or public.has_app_role('admin') or public.has_app_role('super_admin')
  order by (t.applies_to_category_id is not null)::int,(t.applies_to_storage is not null)::int,t.title;
end;
$$;
revoke all on function public.get_warehouse_receiving_checklist_templates() from public,anon;
grant execute on function public.get_warehouse_receiving_checklist_templates() to authenticated;

create or replace function public.create_receiving_checklist_template(
  p_checklist_key text,p_title text,p_category_id uuid default null,
  p_storage_condition public.storage_condition default null,p_required boolean default true
) returns void language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid();
begin
  if v_user is null or not (public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Admin role required'; end if;
  if p_checklist_key !~ '^[a-z][a-z0-9_]{2,59}$' or p_title is null or length(trim(p_title))<3 or length(p_title)>150 then
    raise exception 'Checklist key or title is invalid';
  end if;
  if p_category_id is null and p_storage_condition is null then raise exception 'A category or storage-condition scope is required'; end if;
  if p_category_id is not null and not exists(select 1 from public.categories where id=p_category_id and active) then raise exception 'Active category required'; end if;
  insert into public.receiving_checklist_templates(checklist_key,title,applies_to_category_id,applies_to_storage,required)
    values(trim(p_checklist_key),trim(p_title),p_category_id,p_storage_condition,coalesce(p_required,true));
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
    values(v_user,'warehouse.receiving_checklist_template_created','receiving_checklist_template',p_checklist_key,
      jsonb_build_object('title',trim(p_title),'category_id',p_category_id,'storage_condition',p_storage_condition,'required',coalesce(p_required,true)));
end;
$$;
revoke all on function public.create_receiving_checklist_template(text,text,uuid,public.storage_condition,boolean) from public,anon;
grant execute on function public.create_receiving_checklist_template(text,text,uuid,public.storage_condition,boolean) to authenticated;

create or replace function public.deactivate_receiving_checklist_template(p_checklist_key text,p_reason text)
returns void language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid();
begin
  if v_user is null or not (public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Admin role required'; end if;
  if p_checklist_key is null or length(p_checklist_key)>60 or p_reason is null or length(trim(p_reason))<5 or length(p_reason)>500 then
    raise exception 'Template key and deactivation reason required';
  end if;
  update public.receiving_checklist_templates set active=false where checklist_key=p_checklist_key and active;
  if not found then raise exception 'Active checklist template not found'; end if;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
    values(v_user,'warehouse.receiving_checklist_template_deactivated','receiving_checklist_template',p_checklist_key,jsonb_build_object('reason',trim(p_reason)));
end;
$$;
revoke all on function public.deactivate_receiving_checklist_template(text,text) from public,anon;
grant execute on function public.deactivate_receiving_checklist_template(text,text) to authenticated;

-- Extend the existing atomic receiver: the same server-side category/storage scope is
-- checked again here; client-side filtering is only a usability aid, never authority.
create or replace function public.receive_inventory_batch(
  p_receipt_id uuid, p_product_id uuid, p_batch_code text, p_quantity numeric, p_unit text,
  p_manufactured_on date, p_packed_on date, p_expiry_date date, p_best_before_date date,
  p_bin_id uuid, p_checklist jsonb, p_notes text default null, p_photo_paths text[] default '{}'
) returns uuid language plpgsql security definer set search_path=public,auth as $$
declare
  v_user uuid := auth.uid(); v_receipt public.receipts%rowtype; v_product public.products%rowtype;
  v_batch uuid; v_required integer; v_supplied integer; v_failed integer; v_item jsonb;
  v_key text; v_result text; v_array_count integer;
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
  v_array_count:=jsonb_array_length(coalesce(p_checklist,'[]'::jsonb));
  select count(distinct x->>'key') into v_supplied from jsonb_array_elements(coalesce(p_checklist,'[]'::jsonb)) x;
  if v_supplied<>v_array_count then raise exception 'Duplicate or missing checklist keys'; end if;
  select count(*) into v_required from public.receiving_checklist_templates t
   where t.active and t.required
     and (t.applies_to_category_id is null or t.applies_to_category_id=v_product.category_id)
     and (t.applies_to_storage is null or t.applies_to_storage=v_product.storage_condition);
  select count(*) into v_failed from jsonb_array_elements(coalesce(p_checklist,'[]'::jsonb)) x
   where coalesce(x->>'result','') not in ('pass','fail') or x->>'key' is null;
  if v_failed>0 then raise exception 'Invalid checklist result'; end if;
  if exists(select 1 from jsonb_array_elements(coalesce(p_checklist,'[]'::jsonb)) x
    where x->>'result'='fail' and length(trim(coalesce(x->>'notes','')))<3) then
    raise exception 'Failed checklist items require a finding';
  end if;
  if exists(select 1 from public.receiving_checklist_templates t where t.active and t.required
    and (t.applies_to_category_id is null or t.applies_to_category_id=v_product.category_id)
    and (t.applies_to_storage is null or t.applies_to_storage=v_product.storage_condition)
    and not exists(select 1 from jsonb_array_elements(coalesce(p_checklist,'[]'::jsonb)) x
      where x->>'key'=t.checklist_key and x->>'result' in ('pass','fail'))) then
    raise exception 'All mandatory applicable receiving checklist items must be completed';
  end if;
  if exists(select 1 from jsonb_array_elements(coalesce(p_checklist,'[]'::jsonb)) x
    where not exists(select 1 from public.receiving_checklist_templates t where t.checklist_key=x->>'key' and t.active
      and (t.applies_to_category_id is null or t.applies_to_category_id=v_product.category_id)
      and (t.applies_to_storage is null or t.applies_to_storage=v_product.storage_condition))) then
    raise exception 'Unknown or inapplicable checklist key';
  end if;
  insert into public.inventory_batches(product_id,producer_id,receipt_id,batch_code,manufactured_on,packed_on,received_at,expiry_date,best_before_date,quantity_received,quantity_on_hand,unit,status,inspection_status,warehouse_id,bin_id)
  values(p_product_id,v_receipt.producer_id,p_receipt_id,trim(p_batch_code),p_manufactured_on,p_packed_on,now(),p_expiry_date,p_best_before_date,p_quantity,p_quantity,p_unit,'quarantined','pending',v_receipt.warehouse_id,p_bin_id)
  returning id into v_batch;
  for v_item in select * from jsonb_array_elements(coalesce(p_checklist,'[]'::jsonb)) loop
    v_key:=v_item->>'key'; v_result:=v_item->>'result';
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

comment on column public.receiving_checklist_templates.applies_to_category_id is 'When set, the checklist template applies only to products in this category; null means all categories.';
comment on table public.receiving_checklist_templates is 'Versioned-by-key receiving checklist configuration. Category and storage scopes are intersected; global templates apply to all products.';

create or replace function public.get_warehouse_workspace_options()
returns jsonb language plpgsql stable security definer set search_path=public,auth as $$
declare v_result jsonb;
begin
  if auth.uid() is null or not (public.has_app_role('warehouse_operator') or public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Warehouse operator role required';
  end if;
  select jsonb_build_object(
    'warehouses',coalesce((select jsonb_agg(jsonb_build_object('id',w.id,'name',w.name,'code',w.code) order by w.name) from public.warehouses w where w.active),'[]'::jsonb),
    'bins',coalesce((select jsonb_agg(jsonb_build_object('id',b.id,'warehouse_id',b.warehouse_id,'code',b.code) order by b.code) from public.warehouse_bins b where b.active),'[]'::jsonb),
    'products',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'sku',p.sku,'storage_condition',p.storage_condition::text,'category_id',p.category_id,'producer_id',p.producer_id) order by p.name) from public.products p where p.approval_status='approved' and p.published_at is not null),'[]'::jsonb),
    'categories',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'name',c.name) order by c.name) from public.categories c where c.active),'[]'::jsonb),
    'producers',coalesce((select jsonb_agg(jsonb_build_object('id',pp.id,'legal_name',pp.legal_name) order by pp.legal_name) from public.producer_profiles pp where pp.application_status='approved'),'[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;
revoke all on function public.get_warehouse_workspace_options() from public,anon;
grant execute on function public.get_warehouse_workspace_options() to authenticated;
