-- Phase 8/11: scoped editorial work queues for the protected application workspace.
-- Exposes only editorial metadata needed to triage work; no author/customer PII.
create or replace function public.get_editorial_work_queue()
returns table (
  content_id uuid,
  slug text,
  content_type text,
  title text,
  region_id text,
  status text,
  updated_at timestamptz,
  published_at timestamptz,
  translation_locale text,
  translation_status text
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
    raise exception 'Editorial workspace role required';
  end if;

  return query
  select c.id, c.slug, c.content_type, c.title, c.region_id,
         c.status::text, c.updated_at, c.published_at,
         t.locale, t.review_status::text
  from public.editorial_content c
  left join public.editorial_translations t on t.content_id = c.id
  where c.status <> 'archived'
  order by
    case when c.status = 'pending_review' then 0
         when c.status = 'approved' and c.published_at is null then 1
         else 2 end,
    c.updated_at desc
  limit 200;
end;
$$;
revoke all on function public.get_editorial_work_queue() from public, anon;
grant execute on function public.get_editorial_work_queue() to authenticated;
