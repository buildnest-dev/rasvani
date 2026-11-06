-- Phase 10: lock variance investigation findings after first submission.
-- Corrections must be handled as a separately authorised workflow, not by overwriting evidence.
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
  if v_line.review_finding is not null then
    raise exception 'This variance already has an investigation finding; existing review evidence is immutable';
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

comment on function public.record_inventory_stock_count_variance_review(uuid,uuid,text,text) is
  'Records one immutable independent investigation finding per submitted stock-count variance. Existing findings cannot be overwritten; approval remains separately gated.';
