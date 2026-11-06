-- Allow administrators to revise custom receiving checklist templates.
-- Built-in mandatory controls are immutable; existing inspection rows are historical snapshots.
create or replace function public.update_receiving_checklist_template(
  p_checklist_key text,
  p_title text,
  p_category_id uuid,
  p_storage_condition public.storage_condition,
  p_required boolean
) returns void
language plpgsql security definer set search_path=public,auth as $$
declare
  v_user uuid := auth.uid();
  v_old public.receiving_checklist_templates%rowtype;
begin
  if v_user is null or not (public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Admin role required';
  end if;
  if p_checklist_key is null or p_checklist_key !~ '^[a-z][a-z0-9_]{2,59}$'
     or p_title is null or length(trim(p_title)) < 3 or length(trim(p_title)) > 150
     or p_required is null then
    raise exception 'Checklist template fields are invalid';
  end if;
  if p_category_id is null and p_storage_condition is null then
    raise exception 'A category or storage-condition scope is required';
  end if;
  if p_category_id is not null and not exists (
    select 1 from public.categories where id=p_category_id and active
  ) then
    raise exception 'Active category required';
  end if;
  select * into v_old from public.receiving_checklist_templates
   where checklist_key=p_checklist_key and active for update;
  if not found then raise exception 'Active checklist template not found'; end if;
  if p_checklist_key in (
    'identity_match','batch_code','quantity_match','packaging_integrity',
    'damage_leakage','labels_documents','date_codes','storage_condition'
  ) then
    raise exception 'Built-in receiving controls cannot be edited';
  end if;
  update public.receiving_checklist_templates
     set title=trim(p_title), applies_to_category_id=p_category_id,
         applies_to_storage=p_storage_condition, required=p_required
   where checklist_key=p_checklist_key;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
  values(v_user,'warehouse.receiving_checklist_template_updated','receiving_checklist_template',p_checklist_key,
    jsonb_build_object(
      'before',jsonb_build_object('title',v_old.title,'category_id',v_old.applies_to_category_id,
        'storage_condition',v_old.applies_to_storage,'required',v_old.required),
      'after',jsonb_build_object('title',trim(p_title),'category_id',p_category_id,
        'storage_condition',p_storage_condition,'required',p_required)
    ));
end;
$$;
revoke all on function public.update_receiving_checklist_template(text,text,uuid,public.storage_condition,boolean) from public,anon;
grant execute on function public.update_receiving_checklist_template(text,text,uuid,public.storage_condition,boolean) to authenticated;
comment on function public.update_receiving_checklist_template(text,text,uuid,public.storage_condition,boolean) is
  'Admin-only edit of active custom receiving checklist templates. Built-in controls are immutable; each edit is audited and existing inspection rows remain unchanged.';
