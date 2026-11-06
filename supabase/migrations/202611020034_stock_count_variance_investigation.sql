-- Phase 10: independent line-by-line variance investigation before physical count approval.
-- Historical stock counts and count quantities remain unchanged; findings are additive audit metadata.
alter table public.inventory_stock_count_lines
  add column review_finding text check (review_finding in ('physical_recount','receiving_records_checked','movement_history_checked','other')),
  add column review_note text,
  add column reviewed_by uuid references auth.users(id),
  add column reviewed_at timestamptz,
  add constraint inventory_stock_count_line_review_consistency check (
    (review_finding is null and review_note is null and reviewed_by is null and reviewed_at is null)
    or
    (review_finding is not null and review_note is not null and length(trim(review_note)) between 5 and 1000 and reviewed_by is not null and reviewed_at is not null)
  );

create or replace function public.record_inventory_stock_count_variance_review(
  p_stock_count_id uuid,
  p_batch_id uuid,
  p_finding text,
  p_note text
) returns void
language plpgsql security definer set search_path=public,auth as $$
declare
  v_user uuid := auth.uid();
  v_count public.inventory_stock_counts%rowtype;
  v_line public.inventory_stock_count_lines%rowtype;
begin
  if v_user is null or not (public.has_app_role('quality_reviewer') or public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Independent quality reviewer or admin role required';
  end if;
  if p_finding is null or p_finding not in ('physical_recount','receiving_records_checked','movement_history_checked','other') then
    raise exception 'Select a valid variance investigation finding';
  end if;
  if p_note is null or length(trim(p_note)) < 5 or length(p_note) > 1000 then
    raise exception 'An investigation note of 5–1000 characters is required';
  end if;
  select * into v_count from public.inventory_stock_counts where id=p_stock_count_id for update;
  if not found or v_count.status <> 'submitted' then raise exception 'Only submitted stock counts can be investigated'; end if;
  if v_count.created_by = v_user then raise exception 'The count creator cannot investigate their own variance'; end if;
  select * into v_line from public.inventory_stock_count_lines
    where stock_count_id=p_stock_count_id and batch_id=p_batch_id for update;
  if not found or v_line.counted_quantity is null or v_line.counted_quantity = v_line.expected_quantity then
    raise exception 'Only a counted variance line can receive an investigation finding';
  end if;
  update public.inventory_stock_count_lines set
    review_finding=p_finding, review_note=trim(p_note), reviewed_by=v_user, reviewed_at=clock_timestamp()
    where id=v_line.id;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
  values(v_user,'inventory.stock_count_variance_investigated','inventory_stock_count_line',v_line.id::text,
    jsonb_build_object(
      'stock_count_id',p_stock_count_id,'batch_id',p_batch_id,
      'before',jsonb_build_object('finding',v_line.review_finding,'note',v_line.review_note,'reviewed_by',v_line.reviewed_by),
      'after',jsonb_build_object('finding',p_finding,'note',trim(p_note))
    ));
end;
$$;
revoke all on function public.record_inventory_stock_count_variance_review(uuid,uuid,text,text) from public,anon;
grant execute on function public.record_inventory_stock_count_variance_review(uuid,uuid,text,text) to authenticated;

create or replace function public.review_inventory_stock_count(p_stock_count_id uuid,p_decision text,p_reason text)
returns integer language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid(); v_count public.inventory_stock_counts%rowtype; v_line record; v_variances integer:=0; v_reserved numeric;
begin
  if v_user is null or not (public.has_app_role('quality_reviewer') or public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Independent quality reviewer or admin role required'; end if;
  if p_decision is null or p_decision not in ('approve','reject') then raise exception 'Invalid review decision'; end if;
  if p_reason is null or length(trim(p_reason))<5 or length(p_reason)>1000 then raise exception 'A review reason of 5–1000 characters is required'; end if;
  select * into v_count from public.inventory_stock_counts where id=p_stock_count_id for update;
  if not found or v_count.status<>'submitted' then raise exception 'Submitted stock count not found'; end if;
  if v_count.created_by=v_user then raise exception 'The person who created the count cannot approve or reject it'; end if;
  if p_decision='reject' then
    update public.inventory_stock_counts set status='rejected',review_reason=trim(p_reason),reviewed_by=v_user,reviewed_at=clock_timestamp() where id=p_stock_count_id;
    insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
      values(v_user,'inventory.stock_count_rejected','inventory_stock_count',p_stock_count_id::text,jsonb_build_object('reason',p_reason,'escalation_level',v_count.escalation_level,'investigated_variance_lines',(select count(*) from public.inventory_stock_count_lines where stock_count_id=p_stock_count_id and counted_quantity<>expected_quantity and review_finding is not null)));
    return 0;
  end if;
  if v_count.escalation_level='critical' and not (public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Critical variance requires administrator-level review';
  end if;
  if exists(select 1 from public.inventory_stock_count_lines l join public.inventory_batches b on b.id=l.batch_id
    where l.stock_count_id=p_stock_count_id and (b.stock_updated_at<>l.expected_stock_updated_at or b.quantity_on_hand<>l.expected_quantity or b.status='disposed')) then
    raise exception 'Stock changed after count started; create a fresh count before approval';
  end if;
  if exists(select 1 from public.inventory_stock_count_lines where stock_count_id=p_stock_count_id and counted_quantity is null) then raise exception 'Every batch line must be counted before approval'; end if;
  if exists(select 1 from public.inventory_stock_count_lines where stock_count_id=p_stock_count_id and counted_quantity<>expected_quantity and (review_finding is null or review_note is null or reviewed_by is null)) then
    raise exception 'Every variance line needs an independent investigation finding before approval';
  end if;
  for v_line in select l.*,b.unit from public.inventory_stock_count_lines l join public.inventory_batches b on b.id=l.batch_id
    where l.stock_count_id=p_stock_count_id and l.counted_quantity<>l.expected_quantity order by l.batch_id loop
    select coalesce(sum(r.quantity),0) into v_reserved from public.stock_reservations r
      where r.batch_id=v_line.batch_id and r.status='active' and r.expires_at>now();
    if v_line.counted_quantity<v_reserved then raise exception 'Counted stock cannot be lower than active reserved quantity for batch %',v_line.batch_id; end if;
    update public.inventory_batches set quantity_on_hand=v_line.counted_quantity where id=v_line.batch_id;
    insert into public.inventory_movements(batch_id,movement_type,quantity_delta,reference_type,reference_id,reason,actor_id)
      values(v_line.batch_id,'adjustment',v_line.counted_quantity-v_line.expected_quantity,'stock_count',p_stock_count_id,
        'Physical stock count approved: '||trim(p_reason)||case when v_line.count_notes is not null then ' | Count note: '||v_line.count_notes else '' end,v_user);
    v_variances:=v_variances+1;
  end loop;
  update public.inventory_stock_counts set status='approved',review_reason=trim(p_reason),reviewed_by=v_user,reviewed_at=clock_timestamp() where id=p_stock_count_id;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
    values(v_user,'inventory.stock_count_approved','inventory_stock_count',p_stock_count_id::text,
      jsonb_build_object('reason',p_reason,'variance_lines_adjusted',v_variances,'escalation_level',v_count.escalation_level));
  return v_variances;
end;
$$;
revoke all on function public.review_inventory_stock_count(uuid,text,text) from public,anon;
grant execute on function public.review_inventory_stock_count(uuid,text,text) to authenticated;

-- Extend the protected read model without exposing direct table access.
drop function if exists public.get_warehouse_inventory_stock_count_lines(uuid);
create function public.get_warehouse_inventory_stock_count_lines(p_stock_count_id uuid)
returns table(
  batch_id uuid,product_name text,sku text,batch_code text,bin_code text,
  expected_quantity numeric,counted_quantity numeric,unit text,count_notes text,line_counted_at timestamptz,
  variance_percent numeric,escalation_level text,review_finding text,review_note text,reviewed_by uuid,reviewed_at timestamptz
)
language plpgsql stable security definer set search_path=public,auth as $$
begin
  if auth.uid() is null or not (public.has_app_role('warehouse_operator') or public.has_app_role('quality_reviewer') or public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Warehouse or quality role required';
  end if;
  if not exists(select 1 from public.inventory_stock_counts where id=p_stock_count_id) then raise exception 'Stock count not found'; end if;
  return query
  select l.batch_id,p.name,p.sku,b.batch_code,bin.bin_code,l.expected_quantity,l.counted_quantity,b.unit,
    l.count_notes,l.counted_at,l.variance_percent,l.escalation_level,l.review_finding,l.review_note,l.reviewed_by,l.reviewed_at
  from public.inventory_stock_count_lines l
  join public.inventory_batches b on b.id=l.batch_id
  join public.products p on p.id=b.product_id
  left join public.warehouse_bins bin on bin.id=b.bin_id
  where l.stock_count_id=p_stock_count_id
  order by bin.bin_code nulls last,p.name,b.batch_code;
end;
$$;
revoke all on function public.get_warehouse_inventory_stock_count_lines(uuid) from public,anon;
grant execute on function public.get_warehouse_inventory_stock_count_lines(uuid) to authenticated;

comment on function public.record_inventory_stock_count_variance_review(uuid,uuid,text,text) is
  'Allows an independent quality reviewer or administrator to record an auditable investigation finding for a submitted stock-count variance. Approval is blocked until every variance line is investigated.';
