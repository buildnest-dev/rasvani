-- Rasvani Phase 10: independent, auditable physical stock-count reconciliation.
-- Apply after migrations 001–029. A count snapshots each non-disposed batch;
-- any stock/location/status change after the snapshot makes the count stale.

alter table public.inventory_batches
  add column if not exists stock_updated_at timestamptz not null default clock_timestamp();

create or replace function public.touch_inventory_batch_stock_version()
returns trigger language plpgsql set search_path=public as $$
begin
  if (new.quantity_on_hand, new.warehouse_id, new.bin_id, new.status, new.inspection_status)
     is distinct from
     (old.quantity_on_hand, old.warehouse_id, old.bin_id, old.status, old.inspection_status) then
    new.stock_updated_at := clock_timestamp();
  end if;
  return new;
end;
$$;

drop trigger if exists inventory_batches_stock_version on public.inventory_batches;
create trigger inventory_batches_stock_version
before update on public.inventory_batches
for each row execute function public.touch_inventory_batch_stock_version();

create table public.inventory_stock_counts (
  id uuid primary key default gen_random_uuid(),
  warehouse_id uuid not null references public.warehouses(id),
  status text not null default 'counting' check(status in ('counting','submitted','approved','rejected')),
  notes text,
  review_reason text,
  created_by uuid not null references auth.users(id),
  submitted_by uuid references auth.users(id),
  reviewed_by uuid references auth.users(id),
  snapshot_at timestamptz not null default clock_timestamp(),
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  check(reviewed_by is null or reviewed_by <> created_by)
);

create table public.inventory_stock_count_lines (
  id uuid primary key default gen_random_uuid(),
  stock_count_id uuid not null references public.inventory_stock_counts(id) on delete cascade,
  batch_id uuid not null references public.inventory_batches(id),
  expected_quantity numeric(14,3) not null check(expected_quantity >= 0),
  expected_stock_updated_at timestamptz not null,
  counted_quantity numeric(14,3) check(counted_quantity >= 0),
  count_notes text,
  counted_by uuid references auth.users(id),
  counted_at timestamptz,
  unique(stock_count_id,batch_id)
);

create index inventory_stock_counts_warehouse_created_idx
  on public.inventory_stock_counts(warehouse_id,created_at desc);
create index inventory_stock_count_lines_count_idx
  on public.inventory_stock_count_lines(stock_count_id,batch_id);

alter table public.inventory_stock_counts enable row level security;
alter table public.inventory_stock_count_lines enable row level security;
revoke all on public.inventory_stock_counts,public.inventory_stock_count_lines from anon,authenticated;

create or replace function public.create_inventory_stock_count(p_warehouse_id uuid,p_notes text default null)
returns uuid language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid(); v_count uuid; v_rows integer;
begin
  if v_user is null or not (public.has_app_role('warehouse_operator') or public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Warehouse operator or admin role required';
  end if;
  if p_notes is not null and length(p_notes)>1000 then raise exception 'Count notes are too long'; end if;
  if not exists(select 1 from public.warehouses where id=p_warehouse_id and active) then raise exception 'Active warehouse required'; end if;
  insert into public.inventory_stock_counts(warehouse_id,notes,created_by)
    values(p_warehouse_id,nullif(trim(p_notes),''),v_user) returning id into v_count;
  insert into public.inventory_stock_count_lines(stock_count_id,batch_id,expected_quantity,expected_stock_updated_at)
    select v_count,b.id,b.quantity_on_hand,b.stock_updated_at
    from public.inventory_batches b
    where b.warehouse_id=p_warehouse_id and b.status<>'disposed'
    order by b.bin_id,b.id;
  get diagnostics v_rows=row_count;
  if v_rows=0 then raise exception 'No inventory batches are available to count at this warehouse'; end if;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
    values(v_user,'inventory.stock_count_created','inventory_stock_count',v_count::text,
      jsonb_build_object('warehouse_id',p_warehouse_id,'snapshot_at',(select snapshot_at from public.inventory_stock_counts where id=v_count),'batch_lines',v_rows));
  return v_count;
end;
$$;
revoke all on function public.create_inventory_stock_count(uuid,text) from public,anon;
grant execute on function public.create_inventory_stock_count(uuid,text) to authenticated;

create or replace function public.record_inventory_stock_count_line(
  p_stock_count_id uuid,p_batch_id uuid,p_counted_quantity numeric,p_notes text default null
) returns void language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid(); v_count public.inventory_stock_counts%rowtype;
begin
  if v_user is null or not (public.has_app_role('warehouse_operator') or public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Warehouse operator or admin role required';
  end if;
  if p_counted_quantity is null or p_counted_quantity<0 or p_counted_quantity>99999999999.999 then raise exception 'Counted quantity must be zero or greater'; end if;
  if p_notes is not null and length(p_notes)>500 then raise exception 'Count notes are too long'; end if;
  select * into v_count from public.inventory_stock_counts where id=p_stock_count_id for update;
  if not found or v_count.status<>'counting' or (v_count.created_by<>v_user and not (public.has_app_role('admin') or public.has_app_role('super_admin'))) then
    raise exception 'Stock count is unavailable for entry';
  end if;
  update public.inventory_stock_count_lines
    set counted_quantity=p_counted_quantity,count_notes=nullif(trim(p_notes),''),counted_by=v_user,counted_at=clock_timestamp()
    where stock_count_id=p_stock_count_id and batch_id=p_batch_id;
  if not found then raise exception 'Batch is not part of this stock count'; end if;
end;
$$;
revoke all on function public.record_inventory_stock_count_line(uuid,uuid,numeric,text) from public,anon;
grant execute on function public.record_inventory_stock_count_line(uuid,uuid,numeric,text) to authenticated;

create or replace function public.submit_inventory_stock_count(p_stock_count_id uuid)
returns void language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid(); v_count public.inventory_stock_counts%rowtype;
begin
  if v_user is null or not (public.has_app_role('warehouse_operator') or public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Warehouse operator or admin role required'; end if;
  select * into v_count from public.inventory_stock_counts where id=p_stock_count_id for update;
  if not found or v_count.status<>'counting' or (v_count.created_by<>v_user and not (public.has_app_role('admin') or public.has_app_role('super_admin'))) then raise exception 'Stock count is not open for submission'; end if;
  if exists(select 1 from public.inventory_stock_count_lines where stock_count_id=p_stock_count_id and counted_quantity is null) then raise exception 'Every batch line must be counted before submission'; end if;
  update public.inventory_stock_counts set status='submitted',submitted_by=v_user,submitted_at=clock_timestamp() where id=p_stock_count_id;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
    values(v_user,'inventory.stock_count_submitted','inventory_stock_count',p_stock_count_id::text,jsonb_build_object('batch_lines',(select count(*) from public.inventory_stock_count_lines where stock_count_id=p_stock_count_id)));
end;
$$;
revoke all on function public.submit_inventory_stock_count(uuid) from public,anon;
grant execute on function public.submit_inventory_stock_count(uuid) to authenticated;

create or replace function public.review_inventory_stock_count(p_stock_count_id uuid,p_decision text,p_reason text)
returns integer language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid(); v_count public.inventory_stock_counts%rowtype; v_line record; v_variances integer:=0; v_reserved numeric;
begin
  if v_user is null or not (public.has_app_role('quality_reviewer') or public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Independent quality reviewer or admin role required'; end if;
  if p_decision not in ('approve','reject') then raise exception 'Invalid review decision'; end if;
  if p_reason is null or length(trim(p_reason))<5 or length(p_reason)>1000 then raise exception 'A review reason of 5–1000 characters is required'; end if;
  select * into v_count from public.inventory_stock_counts where id=p_stock_count_id for update;
  if not found or v_count.status<>'submitted' then raise exception 'Submitted stock count not found'; end if;
  if v_count.created_by=v_user then raise exception 'The person who created the count cannot approve or reject it'; end if;
  if p_decision='reject' then
    update public.inventory_stock_counts set status='rejected',review_reason=trim(p_reason),reviewed_by=v_user,reviewed_at=clock_timestamp() where id=p_stock_count_id;
    insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
      values(v_user,'inventory.stock_count_rejected','inventory_stock_count',p_stock_count_id::text,jsonb_build_object('reason',p_reason));
    return 0;
  end if;
  -- Validate every snapshot before changing any quantity. A movement of stock,
  -- location change or status change after the snapshot requires a fresh count.
  if exists(
    select 1 from public.inventory_stock_count_lines l
    join public.inventory_batches b on b.id=l.batch_id
    where l.stock_count_id=p_stock_count_id
      and (b.stock_updated_at<>l.expected_stock_updated_at or b.quantity_on_hand<>l.expected_quantity or b.status='disposed')
  ) then raise exception 'Stock changed after count started; create a fresh count before approval'; end if;
  if exists(select 1 from public.inventory_stock_count_lines where stock_count_id=p_stock_count_id and counted_quantity is null) then raise exception 'Every batch line must be counted before approval'; end if;
  for v_line in
    select l.*,b.unit from public.inventory_stock_count_lines l
    join public.inventory_batches b on b.id=l.batch_id
    where l.stock_count_id=p_stock_count_id and l.counted_quantity<>l.expected_quantity
    order by l.batch_id
  loop
    select coalesce(sum(r.quantity),0) into v_reserved
    from public.stock_reservations r
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
      jsonb_build_object('reason',p_reason,'variance_lines_adjusted',v_variances));
  return v_variances;
end;
$$;
revoke all on function public.review_inventory_stock_count(uuid,text,text) from public,anon;
grant execute on function public.review_inventory_stock_count(uuid,text,text) to authenticated;

create or replace function public.get_warehouse_inventory_stock_counts()
returns table(stock_count_id uuid,warehouse_id uuid,warehouse_name text,status text,created_by uuid,started_at timestamptz,submitted_at timestamptz,reviewed_at timestamptz,batch_line_count bigint,counted_line_count bigint,variance_line_count bigint)
language plpgsql stable security definer set search_path=public,auth as $$
begin
  if auth.uid() is null or not (public.has_app_role('warehouse_operator') or public.has_app_role('quality_reviewer') or public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Warehouse or quality role required'; end if;
  return query select c.id,c.warehouse_id,w.name,c.status,c.created_by,c.created_at,c.submitted_at,c.reviewed_at,
    count(l.id),count(l.id) filter(where l.counted_quantity is not null),count(l.id) filter(where l.counted_quantity is not null and l.counted_quantity<>l.expected_quantity)
  from public.inventory_stock_counts c join public.warehouses w on w.id=c.warehouse_id
  left join public.inventory_stock_count_lines l on l.stock_count_id=c.id
  group by c.id,w.name order by c.created_at desc limit 30;
end;
$$;
revoke all on function public.get_warehouse_inventory_stock_counts() from public,anon;
grant execute on function public.get_warehouse_inventory_stock_counts() to authenticated;

create or replace function public.get_warehouse_inventory_stock_count_lines(p_stock_count_id uuid)
returns table(batch_id uuid,product_name text,sku text,batch_code text,bin_code text,expected_quantity numeric,counted_quantity numeric,unit text,count_notes text,line_counted_at timestamptz)
language plpgsql stable security definer set search_path=public,auth as $$
begin
  if auth.uid() is null or not (public.has_app_role('warehouse_operator') or public.has_app_role('quality_reviewer') or public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Warehouse or quality role required'; end if;
  if not exists(select 1 from public.inventory_stock_counts where id=p_stock_count_id) then raise exception 'Stock count not found'; end if;
  return query select l.batch_id,p.name,p.sku,b.batch_code,bin.bin_code,l.expected_quantity,l.counted_quantity,b.unit,l.count_notes,l.counted_at
  from public.inventory_stock_count_lines l
  join public.inventory_batches b on b.id=l.batch_id
  join public.products p on p.id=b.product_id
  left join public.warehouse_bins bin on bin.id=b.bin_id
  where l.stock_count_id=p_stock_count_id order by bin.bin_code nulls last,p.name,b.batch_code;
end;
$$;
revoke all on function public.get_warehouse_inventory_stock_count_lines(uuid) from public,anon;
grant execute on function public.get_warehouse_inventory_stock_count_lines(uuid) to authenticated;

comment on table public.inventory_stock_counts is 'Physical stock counts with immutable expected snapshot and independent reviewer approval.';
comment on table public.inventory_stock_count_lines is 'Batch-level physical counts. Counted quantities change inventory only after independent approval.';
