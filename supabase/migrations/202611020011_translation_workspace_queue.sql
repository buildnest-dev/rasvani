-- Phase 9: dedicated translation queue for editors and quality reviewers.
-- Returns only translation/content metadata, never translator/reviewer identity.
create or replace function public.get_translation_work_queue()
returns table (
  translation_id uuid,
  content_id uuid,
  source_title text,
  locale text,
  translation_title text,
  review_status text,
  reviewed_at timestamptz
)
language plpgsql
stable
security definer
set search_path=public,auth
as $$
begin
  if auth.uid() is null or not (
    public.has_app_role('content_editor') or
    public.has_app_role('quality_reviewer') or
    public.has_app_role('admin') or
    public.has_app_role('super_admin')
  ) then
    raise exception 'Translation workspace role required';
  end if;

  return query
  select t.id, c.id, c.title, t.locale, t.title, t.review_status::text, t.reviewed_at
  from public.editorial_translations t
  join public.editorial_content c on c.id=t.content_id
  where c.status <> 'archived'
  order by case when t.review_status='pending_review' then 0 else 1 end,
           t.locale, t.id
  limit 300;
end;
$$;
revoke all on function public.get_translation_work_queue() from public, anon;
grant execute on function public.get_translation_work_queue() to authenticated;
