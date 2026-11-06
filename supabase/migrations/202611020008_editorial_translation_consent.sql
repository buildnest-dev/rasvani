-- Rasvani Phase 8/9/11 editorial governance, translation review and consent history.
-- Apply after migrations 001-007. Draft and review transitions are explicit and audited.

create index if not exists editorial_content_review_queue_idx
  on public.editorial_content(status, updated_at desc);
create index if not exists editorial_translation_review_queue_idx
  on public.editorial_translations(review_status, locale, content_id);
create index if not exists consent_records_user_key_time_idx
  on public.consent_records(user_id, consent_key, recorded_at desc);

create or replace function public.save_editorial_draft(
  p_content_id uuid,
  p_slug text,
  p_content_type text,
  p_title text,
  p_body jsonb,
  p_region_id text default null
) returns uuid
language plpgsql security definer set search_path=public,auth as $$
declare
  v_user uuid:=auth.uid();
  v_id uuid:=coalesce(p_content_id,gen_random_uuid());
  v_author uuid;
begin
  if v_user is null or not (public.has_app_role('content_editor') or public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Content editor role required';
  end if;
  if nullif(trim(p_slug),'') is null or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then raise exception 'A valid lowercase slug is required'; end if;
  if p_content_type not in ('story','recipe','regional_guide','page') then raise exception 'Unsupported editorial content type'; end if;
  if nullif(trim(p_title),'') is null or p_body is null or jsonb_typeof(p_body)<>'object' then raise exception 'Title and structured body are required'; end if;
  if p_region_id is not null and not exists(select 1 from public.regions where id=p_region_id) then raise exception 'Unknown region'; end if;

  select author_id into v_author from public.editorial_content where id=v_id for update;
  if found then
    if v_author is distinct from v_user and not (public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Only the author or admin may edit this item'; end if;
    update public.editorial_content set slug=p_slug,content_type=p_content_type,title=trim(p_title),body=p_body,
      region_id=p_region_id,status='draft',reviewer_id=null,published_at=null,updated_at=now() where id=v_id;
  else
    insert into public.editorial_content(id,slug,content_type,title,body,region_id,status,author_id)
      values(v_id,p_slug,p_content_type,trim(p_title),p_body,p_region_id,'draft',v_user);
  end if;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
    values(v_user,'cms.draft_saved','editorial_content',v_id::text,jsonb_build_object('content_type',p_content_type,'slug',p_slug));
  return v_id;
end;
$$;
revoke all on function public.save_editorial_draft(uuid,text,text,text,jsonb,text) from public,anon;
grant execute on function public.save_editorial_draft(uuid,text,text,text,jsonb,text) to authenticated;

create or replace function public.submit_editorial_for_review(p_content_id uuid)
returns void language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid(); v_author uuid;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  select author_id into v_author from public.editorial_content where id=p_content_id and status='draft' for update;
  if not found then raise exception 'Draft not found'; end if;
  if v_author is distinct from v_user and not (public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Only the author or admin may submit this draft'; end if;
  update public.editorial_content set status='pending_review',updated_at=now() where id=p_content_id;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
    values(v_user,'cms.submitted','editorial_content',p_content_id::text,'{}'::jsonb);
end; $$;
revoke all on function public.submit_editorial_for_review(uuid) from public,anon;
grant execute on function public.submit_editorial_for_review(uuid) to authenticated;

create or replace function public.review_editorial_content(p_content_id uuid,p_decision text,p_reason text)
returns void language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid();
begin
  if v_user is null or not (public.has_app_role('content_editor') or public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Editorial reviewer role required'; end if;
  if p_decision not in ('approved','rejected') or nullif(trim(p_reason),'') is null then raise exception 'Decision and review reason are required'; end if;
  update public.editorial_content set status=p_decision::public.record_status,reviewer_id=v_user,updated_at=now(),published_at=null
    where id=p_content_id and status='pending_review';
  if not found then raise exception 'Item is not awaiting review'; end if;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
    values(v_user,'cms.reviewed','editorial_content',p_content_id::text,jsonb_build_object('decision',p_decision,'reason',trim(p_reason)));
end; $$;
revoke all on function public.review_editorial_content(uuid,text,text) from public,anon;
grant execute on function public.review_editorial_content(uuid,text,text) to authenticated;

create or replace function public.publish_editorial_content(p_content_id uuid)
returns void language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid();
begin
  if v_user is null or not (public.has_app_role('content_editor') or public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Content editor role required'; end if;
  update public.editorial_content set published_at=now(),updated_at=now()
    where id=p_content_id and status='approved' and published_at is null;
  if not found then raise exception 'Only approved unpublished content can be published'; end if;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
    values(v_user,'cms.published','editorial_content',p_content_id::text,'{}'::jsonb);
end; $$;
revoke all on function public.publish_editorial_content(uuid) from public,anon;
grant execute on function public.publish_editorial_content(uuid) to authenticated;

create or replace function public.archive_editorial_content(p_content_id uuid,p_reason text)
returns void language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid();
begin
  if v_user is null or not (public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Admin role required to archive content'; end if;
  if nullif(trim(p_reason),'') is null then raise exception 'Archive reason required'; end if;
  update public.editorial_content set status='archived',published_at=null,updated_at=now() where id=p_content_id and status<>'archived';
  if not found then raise exception 'Content not found or already archived'; end if;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
    values(v_user,'cms.archived','editorial_content',p_content_id::text,jsonb_build_object('reason',trim(p_reason)));
end; $$;
revoke all on function public.archive_editorial_content(uuid,text) from public,anon;
grant execute on function public.archive_editorial_content(uuid,text) to authenticated;

create or replace function public.save_translation_draft(p_content_id uuid,p_locale text,p_title text,p_body jsonb)
returns uuid language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid(); v_id uuid;
begin
  if v_user is null or not (public.has_app_role('content_editor') or public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Content editor role required'; end if;
  if p_locale not in ('en','hi','bn','ta','te','mr','gu','pa','kn','ml','or','as') then raise exception 'Unsupported locale'; end if;
  if nullif(trim(p_title),'') is null or p_body is null or jsonb_typeof(p_body)<>'object' then raise exception 'Translation title and structured body are required'; end if;
  if not exists(select 1 from public.editorial_content where id=p_content_id and status in ('approved','archived','pending_review','draft')) then raise exception 'Source content not found'; end if;
  insert into public.editorial_translations(content_id,locale,title,body,review_status,reviewer_id,reviewed_at)
    values(p_content_id,p_locale,trim(p_title),p_body,'draft',null,null)
  on conflict(content_id,locale) do update set title=excluded.title,body=excluded.body,review_status='draft',reviewer_id=null,reviewed_at=null
  returning id into v_id;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
    values(v_user,'cms.translation_saved','editorial_translation',v_id::text,jsonb_build_object('content_id',p_content_id,'locale',p_locale));
  return v_id;
end; $$;
revoke all on function public.save_translation_draft(uuid,text,text,jsonb) from public,anon;
grant execute on function public.save_translation_draft(uuid,text,text,jsonb) to authenticated;

create or replace function public.submit_translation_for_review(p_translation_id uuid)
returns void language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid();
begin
  if v_user is null or not (public.has_app_role('content_editor') or public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Content editor role required'; end if;
  update public.editorial_translations set review_status='pending_review',reviewer_id=null,reviewed_at=null
    where id=p_translation_id and review_status='draft';
  if not found then raise exception 'Translation draft not found'; end if;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
    values(v_user,'cms.translation_submitted','editorial_translation',p_translation_id::text,'{}'::jsonb);
end; $$;
revoke all on function public.submit_translation_for_review(uuid) from public,anon;
grant execute on function public.submit_translation_for_review(uuid) to authenticated;

create or replace function public.review_editorial_translation(p_translation_id uuid,p_decision text,p_reason text)
returns void language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid();
begin
  if v_user is null or not (public.has_app_role('quality_reviewer') or public.has_app_role('admin') or public.has_app_role('super_admin')) then raise exception 'Translation reviewer role required'; end if;
  if p_decision not in ('approved','rejected') or nullif(trim(p_reason),'') is null then raise exception 'Decision and review reason are required'; end if;
  update public.editorial_translations set review_status=p_decision::public.record_status,reviewer_id=v_user,reviewed_at=now()
    where id=p_translation_id and review_status='pending_review';
  if not found then raise exception 'Translation is not awaiting review'; end if;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
    values(v_user,'cms.translation_reviewed','editorial_translation',p_translation_id::text,jsonb_build_object('decision',p_decision,'reason',trim(p_reason)));
end; $$;
revoke all on function public.review_editorial_translation(uuid,text,text) from public,anon;
grant execute on function public.review_editorial_translation(uuid,text,text) to authenticated;

-- Consent is append-only: a new decision/version creates a new record; no client table writes.
create or replace function public.record_user_consent(p_consent_key text,p_granted boolean,p_policy_version text)
returns uuid language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid(); v_id uuid;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_consent_key !~ '^[a-z][a-z0-9_.:-]{1,80}$' then raise exception 'Invalid consent key'; end if;
  if nullif(trim(p_policy_version),'') is null or length(p_policy_version)>80 then raise exception 'Policy version is required'; end if;
  insert into public.consent_records(user_id,consent_key,granted,policy_version)
    values(v_user,p_consent_key,p_granted,trim(p_policy_version)) returning id into v_id;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
    values(v_user,'privacy.consent_recorded','consent_record',v_id::text,jsonb_build_object('consent_key',p_consent_key,'granted',p_granted,'policy_version',trim(p_policy_version)));
  return v_id;
end; $$;
revoke all on function public.record_user_consent(text,boolean,text) from public,anon;
grant execute on function public.record_user_consent(text,boolean,text) to authenticated;

-- No direct browser writes are added to CMS or consent tables; approved public read policies remain intact.

drop policy if exists approved_translations_read on public.editorial_translations;
create policy approved_translations_read on public.editorial_translations for select to anon,authenticated
  using (review_status='approved' and exists (
    select 1 from public.editorial_content c
    where c.id=editorial_translations.content_id and c.status='approved' and c.published_at is not null
  ));
