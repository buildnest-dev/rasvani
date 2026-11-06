-- Role-gated access to receiving checklist results and private evidence paths.
-- The application signs object paths server-side; this function never makes the bucket public.
create or replace function public.get_warehouse_batch_inspection_evidence(p_batch_ids uuid[])
returns table(
  batch_id uuid,
  inspection_id uuid,
  checklist_key text,
  checklist_title text,
  result text,
  notes text,
  photo_paths text[],
  inspected_at timestamptz
)
language plpgsql
stable
security definer
set search_path=public,auth
as $$
begin
  if auth.uid() is null or not (
    public.has_app_role('warehouse_operator')
    or public.has_app_role('quality_reviewer')
    or public.has_app_role('admin')
    or public.has_app_role('super_admin')
  ) then
    raise exception 'Warehouse or quality role required';
  end if;
  if p_batch_ids is null or cardinality(p_batch_ids)=0 or cardinality(p_batch_ids)>150 then
    raise exception 'Provide between one and 150 batch IDs';
  end if;

  return query
  select ri.batch_id,ri.id,ri.checklist_key,coalesce(t.title,replace(ri.checklist_key,'_',' ')),
         ri.result,ri.notes,ri.photo_paths,ri.inspected_at
  from public.receiving_inspections ri
  left join public.receiving_checklist_templates t on t.checklist_key=ri.checklist_key
  where ri.batch_id=any(p_batch_ids)
  order by ri.inspected_at asc,ri.checklist_key asc;
end;
$$;
revoke all on function public.get_warehouse_batch_inspection_evidence(uuid[]) from public,anon;
grant execute on function public.get_warehouse_batch_inspection_evidence(uuid[]) to authenticated;
comment on function public.get_warehouse_batch_inspection_evidence(uuid[]) is
  'Returns receiving checklist outcomes and private object paths to authenticated warehouse and quality staff for server-side signing.';
