-- Configurable per-warehouse variance thresholds and approval escalation.
-- No percentage thresholds are invented: unconfigured warehouses escalate every variance to review.
create table public.inventory_stock_count_escalation_rules (
  id uuid primary key default gen_random_uuid(),
  warehouse_id uuid not null unique references public.warehouses(id) on delete cascade,
  warning_variance_percent numeric(9,3) not null check(warning_variance_percent>0 and warning_variance_percent<=10000),
  critical_variance_percent numeric(9,3) not null check(critical_variance_percent>warning_variance_percent and critical_variance_percent<=10000),
  active boolean not null default true,
  updated_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table public.inventory_stock_counts
  add column if not exists warning_threshold_percent numeric(9,3),
  add column if not exists critical_threshold_percent numeric(9,3),
  add column if not exists escalation_level text not null default 'review_required'
    check(escalation_level in ('none','low','review_required','warning','critical'));

alter table public.inventory_stock_count_lines
  add column if not exists variance_percent numeric(12,3),
  add column if not exists escalation_level text not null default 'review_required'
    check(escalation_level in ('none','low','review_required','warning','critical'));

alter table public.inventory_stock_counts alter column escalation_level set default 'none';
alter table public.inventory_stock_count_lines alter column escalation_level set default 'none';

-- Backfill pre-existing counts without inventing thresholds. Unreviewed submitted variances
-- are explicitly flagged for reviewer attention; already finalised records remain historical.
update public.inventory_stock_count_lines l set
  variance_percent=case when l.counted_quantity is null then null when l.counted_quantity=l.expected_quantity then 0
    when l.expected_quantity=0 then null else round(abs(l.counted_quantity-l.expected_quantity)/l.expected_quantity*100,3) end,
  escalation_level=case when l.counted_quantity is null or l.counted_quantity=l.expected_quantity then 'none'
    when l.expected_quantity=0 then 'critical' else 'review_required' end;
update public.inventory_stock_counts c set escalation_level=case
  when c.status='submitted' and exists(select 1 from public.inventory_stock_count_lines l where l.stock_count_id=c.id and l.escalation_level='critical') then 'critical'
  when c.status='submitted' and exists(select 1 from public.inventory_stock_count_lines l where l.stock_count_id=c.id and l.counted_quantity is not null and l.counted_quantity<>l.expected_quantity) then 'review_required'
  else 'none' end;

alter table public.inventory_stock_count_escalation_rules enable row level security;
revoke all on public.inventory_stock_count_escalation_rules from anon,authenticated;

create or replace function public.get_warehouse_stock_count_escalation_rules()
returns table(warehouse_id uuid,warehouse_name text,warning_variance_percent numeric,critical_variance_percent numeric,configured boolean)
language plpgsql stable security definer set search_path=public,auth as $$
begin
  if auth.uid() is null or not (public.has_app_role('warehouse_operator') or public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Warehouse operator role required';
  end if;
  return query select w.id,w.name,r.warning_variance_percent,r.critical_variance_percent,coalesce(r.active,false)
  from public.warehouses w left join public.inventory_stock_count_escalation_rules r on r.warehouse_id=w.id
  where w.active order by w.name;
end;
$$;
revoke all on function public.get_warehouse_stock_count_escalation_rules() from public,anon;
grant execute on function public.get_warehouse_stock_count_escalation_rules() to authenticated;

create or replace function public.set_warehouse_stock_count_escalation_rules(
  p_warehouse_id uuid,p_warning_percent numeric,p_critical_percent numeric
) returns void language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid();
begin
  if v_user is null or not (public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Admin role required'; end if;
  if p_warning_percent is null or p_critical_percent is null or p_warning_percent<=0 or p_critical_percent<=p_warning_percent or p_critical_percent>10000 then
    raise exception 'Critical threshold must be greater than a positive warning threshold';
  end if;
  if not exists(select 1 from public.warehouses where id=p_warehouse_id and active) then raise exception 'Active warehouse required'; end if;
  insert into public.inventory_stock_count_escalation_rules(warehouse_id,warning_variance_percent,critical_variance_percent,updated_by)
  values(p_warehouse_id,p_warning_percent,p_critical_percent,v_user)
  on conflict(warehouse_id) do update set warning_variance_percent=excluded.warning_variance_percent,
    critical_variance_percent=excluded.critical_variance_percent,active=true,updated_by=v_user,updated_at=now();
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
  values(v_user,'inventory.stock_count_escalation_rules_updated','warehouse',p_warehouse_id::text,
    jsonb_build_object('warning_variance_percent',p_warning_percent,'critical_variance_percent',p_critical_percent));
end;
$$;
revoke all on function public.set_warehouse_stock_count_escalation_rules(uuid,numeric,numeric) from public,anon;
grant execute on function public.set_warehouse_stock_count_escalation_rules(uuid,numeric,numeric) to authenticated;

-- Snapshot the active thresholds at count creation. Later policy changes do not rewrite an in-progress count.
create or replace function public.create_inventory_stock_count(p_warehouse_id uuid,p_notes text default null)
returns uuid language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid(); v_count uuid; v_rows integer; v_warning numeric; v_critical numeric;
begin
  if v_user is null or not (public.has_app_role('warehouse_operator') or public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Warehouse operator or admin role required';
  end if;
  if p_notes is not null and length(p_notes)>1000 then raise exception 'Count notes are too long'; end if;
  if not exists(select 1 from public.warehouses where id=p_warehouse_id and active) then raise exception 'Active warehouse required'; end if;
  select r.warning_variance_percent,r.critical_variance_percent into v_warning,v_critical
    from public.inventory_stock_count_escalation_rules r where r.warehouse_id=p_warehouse_id and r.active;
  insert into public.inventory_stock_counts(warehouse_id,notes,created_by,warning_threshold_percent,critical_threshold_percent)
    values(p_warehouse_id,nullif(trim(p_notes),''),v_user,v_warning,v_critical) returning id into v_count;
  insert into public.inventory_stock_count_lines(stock_count_id,batch_id,expected_quantity,expected_stock_updated_at)
    select v_count,b.id,b.quantity_on_hand,b.stock_updated_at from public.inventory_batches b
    where b.warehouse_id=p_warehouse_id and b.status<>'disposed' order by b.bin_id,b.id;
  get diagnostics v_rows=row_count;
  if v_rows=0 then raise exception 'No inventory batches are available to count at this warehouse'; end if;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
    values(v_user,'inventory.stock_count_created','inventory_stock_count',v_count::text,
      jsonb_build_object('warehouse_id',p_warehouse_id,'snapshot_at',(select snapshot_at from public.inventory_stock_counts where id=v_count),
        'batch_lines',v_rows,'warning_threshold_percent',v_warning,'critical_threshold_percent',v_critical));
  return v_count;
end;
$$;
revoke all on function public.create_inventory_stock_count(uuid,text) from public,anon;
grant execute on function public.create_inventory_stock_count(uuid,text) to authenticated;

-- Classify each submitted variance using the immutable threshold snapshot.
create or replace function public.submit_inventory_stock_count(p_stock_count_id uuid)
returns void language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid(); v_count public.inventory_stock_counts%rowtype;
begin
  if v_user is null or not (public.has_app_role('warehouse_operator') or public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Warehouse operator role required'; end if;
  select * into v_count from public.inventory_stock_counts where id=p_stock_count_id for update;
  if not found or v_count.status<>'counting' or (v_count.created_by<>v_user and not (public.has_app_role('admin') or public.has_app_role('super_admin'))) then raise exception 'Stock count is not open for submission'; end if;
  if exists(select 1 from public.inventory_stock_count_lines where stock_count_id=p_stock_count_id and counted_quantity is null) then raise exception 'Every batch line must be counted before submission'; end if;
  update public.inventory_stock_count_lines l set
    variance_percent=case when l.counted_quantity=l.expected_quantity then 0
      when l.expected_quantity=0 then null
      else round(abs(l.counted_quantity-l.expected_quantity)/l.expected_quantity*100,3) end,
    escalation_level=case
      when l.counted_quantity=l.expected_quantity then 'none'
      when l.expected_quantity=0 then 'critical'
      when v_count.warning_threshold_percent is null or v_count.critical_threshold_percent is null then 'review_required'
      when abs(l.counted_quantity-l.expected_quantity)/l.expected_quantity*100>=v_count.critical_threshold_percent then 'critical'
      when abs(l.counted_quantity-l.expected_quantity)/l.expected_quantity*100>=v_count.warning_threshold_percent then 'warning'
      else 'low' end
  where l.stock_count_id=p_stock_count_id;
  update public.inventory_stock_counts c set
    escalation_level=case
      when exists(select 1 from public.inventory_stock_count_lines l where l.stock_count_id=c.id and l.escalation_level='critical') then 'critical'
      when exists(select 1 from public.inventory_stock_count_lines l where l.stock_count_id=c.id and l.escalation_level='warning') then 'warning'
      when exists(select 1 from public.inventory_stock_count_lines l where l.stock_count_id=c.id and l.escalation_level='review_required') then 'review_required'
      when exists(select 1 from public.inventory_stock_count_lines l where l.stock_count_id=c.id and l.escalation_level='low') then 'low'
      else 'none' end,
    status='submitted',submitted_by=v_user,submitted_at=clock_timestamp()
  where c.id=p_stock_count_id;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
    values(v_user,'inventory.stock_count_submitted','inventory_stock_count',p_stock_count_id::text,
      jsonb_build_object('batch_lines',(select count(*) from public.inventory_stock_count_lines where stock_count_id=p_stock_count_id),
        'escalation_level',(select escalation_level from public.inventory_stock_counts where id=p_stock_count_id),
        'warning_lines',(select count(*) from public.inventory_stock_count_lines where stock_count_id=p_stock_count_id and escalation_level='warning'),
        'critical_lines',(select count(*) from public.inventory_stock_count_lines where stock_count_id=p_stock_count_id and escalation_level='critical'),
        'thresholds_configured',v_count.warning_threshold_percent is not null and v_count.critical_threshold_percent is not null));
end;
$$;
revoke all on function public.submit_inventory_stock_count(uuid) from public,anon;
grant execute on function public.submit_inventory_stock_count(uuid) to authenticated;

-- Critical variances are reserved for administrator-level approval; all other variances continue to require independent quality review.
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
      values(v_user,'inventory.stock_count_rejected','inventory_stock_count',p_stock_count_id::text,jsonb_build_object('reason',p_reason,'escalation_level',v_count.escalation_level));
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

drop function if exists public.get_warehouse_inventory_stock_counts();
create function public.get_warehouse_inventory_stock_counts()
returns table(
  stock_count_id uuid,warehouse_id uuid,warehouse_name text,status text,created_by uuid,started_at timestamptz,
  submitted_at timestamptz,reviewed_at timestamptz,batch_line_count bigint,counted_line_count bigint,
  variance_line_count bigint,escalation_level text,warning_line_count bigint,critical_line_count bigint,review_required_line_count bigint
)
language plpgsql stable security definer set search_path=public,auth as $$
begin
  if auth.uid() is null or not (public.has_app_role('warehouse_operator') or public.has_app_role('quality_reviewer') or public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Warehouse or quality role required'; end if;
  return query select c.id,c.warehouse_id,w.name,c.status,c.created_by,c.created_at,c.submitted_at,c.reviewed_at,
    count(l.id),count(l.id) filter(where l.counted_quantity is not null),count(l.id) filter(where l.counted_quantity is not null and l.counted_quantity<>l.expected_quantity),
    c.escalation_level,count(l.id) filter(where l.escalation_level='warning'),count(l.id) filter(where l.escalation_level='critical'),count(l.id) filter(where l.escalation_level='review_required')
  from public.inventory_stock_counts c join public.warehouses w on w.id=c.warehouse_id
  left join public.inventory_stock_count_lines l on l.stock_count_id=c.id
  group by c.id,w.name order by c.created_at desc limit 30;
end;
$$;
revoke all on function public.get_warehouse_inventory_stock_counts() from public,anon;
grant execute on function public.get_warehouse_inventory_stock_counts() to authenticated;

drop function if exists public.get_warehouse_inventory_stock_count_lines(uuid);
create function public.get_warehouse_inventory_stock_count_lines(p_stock_count_id uuid)
returns table(batch_id uuid,product_name text,sku text,batch_code text,bin_code text,expected_quantity numeric,counted_quantity numeric,unit text,count_notes text,line_counted_at timestamptz,variance_percent numeric,escalation_level text)
language plpgsql stable security definer set search_path=public,auth as $$
begin
  if auth.uid() is null or not (public.has_app_role('warehouse_operator') or public.has_app_role('quality_reviewer') or public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Warehouse or quality role required'; end if;
  if not exists(select 1 from public.inventory_stock_counts where id=p_stock_count_id) then raise exception 'Stock count not found'; end if;
  return query select l.batch_id,p.name,p.sku,b.batch_code,bin.bin_code,l.expected_quantity,l.counted_quantity,b.unit,l.count_notes,l.counted_at,l.variance_percent,l.escalation_level
  from public.inventory_stock_count_lines l join public.inventory_batches b on b.id=l.batch_id join public.products p on p.id=b.product_id
  left join public.warehouse_bins bin on bin.id=b.bin_id where l.stock_count_id=p_stock_count_id order by bin.bin_code nulls last,p.name,b.batch_code;
end;
$$;
revoke all on function public.get_warehouse_inventory_stock_count_lines(uuid) from public,anon;
grant execute on function public.get_warehouse_inventory_stock_count_lines(uuid) to authenticated;

comment on table public.inventory_stock_count_escalation_rules is 'Admin-configured, per-warehouse percentage thresholds. A count snapshots them at creation; no defaults are assumed.';
comment on column public.inventory_stock_counts.escalation_level is 'Severity is calculated at submission from the count’s immutable threshold snapshot. Unconfigured variances require human review.';
