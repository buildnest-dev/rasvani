-- Phase 10: make the one-active-count-per-warehouse rule a database invariant.
-- Migration 039 serializes the normal creation RPC. This partial unique index is
-- the final integrity backstop for any future privileged code path or status
-- transition that attempts to create a second counting/submitted count.
-- Existing conflicting rows are reported and never silently cancelled/deleted.

do $$
declare
  v_conflicts text;
begin
  select string_agg(
    format('%s (%s active counts)', warehouse_id, active_count),
    ', ' order by warehouse_id
  )
  into v_conflicts
  from (
    select warehouse_id, count(*) as active_count
    from public.inventory_stock_counts
    where status in ('counting', 'submitted')
    group by warehouse_id
    having count(*) > 1
  ) conflicts;

  if v_conflicts is not null then
    raise exception 'Cannot enforce one active stock count per warehouse; resolve existing duplicate active counts first: %', v_conflicts;
  end if;
end;
$$;

create unique index if not exists inventory_stock_counts_one_active_per_warehouse_uidx
  on public.inventory_stock_counts (warehouse_id)
  where status in ('counting', 'submitted');

comment on index public.inventory_stock_counts_one_active_per_warehouse_uidx is
  'Enforces at most one active physical stock count (counting or submitted) per warehouse. Finalised and cancelled count history is retained and does not participate.';
