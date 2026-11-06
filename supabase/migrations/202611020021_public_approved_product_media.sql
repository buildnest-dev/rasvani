-- Public catalogue delivery for approved product photography.
-- The bucket remains PRIVATE. Public access is granted only to objects whose
-- media review is approved and whose owning product is approved + published.

create or replace function public.can_public_read_catalogue_product_media(p_object_path text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
      from public.producer_product_media m
      join public.products p on p.id = m.product_id
     where m.object_path = p_object_path
       and m.review_status = 'approved'
       and p.approval_status = 'approved'
       and p.published_at is not null
  );
$$;
revoke all on function public.can_public_read_catalogue_product_media(text) from public, anon, authenticated;
grant execute on function public.can_public_read_catalogue_product_media(text) to anon, authenticated;

-- Supabase Storage checks storage.objects SELECT permission when minting a
-- signed URL. This policy exposes no pending/rejected/unpublished image.
drop policy if exists producer_product_media_public_approved_read on storage.objects;
create policy producer_product_media_public_approved_read on storage.objects
for select to anon, authenticated
using (
  bucket_id = 'producer-product-media'
  and public.can_public_read_catalogue_product_media(name)
);

-- Server-rendered catalogue pages use this bounded RPC to discover approved
-- image objects. The object paths are used server-side to mint short-lived URLs.
create or replace function public.get_public_catalogue_product_media(
  p_product_ids uuid[],
  p_limit_per_product integer default 4
)
returns table(
  product_id uuid,
  media_id uuid,
  object_path text,
  mime_type text,
  uploaded_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if p_product_ids is null or cardinality(p_product_ids) = 0
     or cardinality(p_product_ids) > 100 then
    raise exception 'Between 1 and 100 product identifiers are required';
  end if;
  if p_limit_per_product is null or p_limit_per_product < 1 or p_limit_per_product > 12 then
    raise exception 'Image limit per product must be between 1 and 12';
  end if;

  return query
  with ranked_media as (
    select m.product_id, m.id as media_row_id, m.object_path as media_object_path,
           m.mime_type as media_mime_type, m.uploaded_at as media_uploaded_at,
           row_number() over (
             partition by m.product_id
             order by m.uploaded_at desc, m.id
           ) as row_number_for_product
      from public.producer_product_media m
      join public.products p on p.id = m.product_id
     where p.id = any(p_product_ids)
       and p.approval_status = 'approved'
       and p.published_at is not null
       and m.review_status = 'approved'
  )
  select r.product_id, r.media_row_id, r.media_object_path,
         r.media_mime_type, r.media_uploaded_at
    from ranked_media r
   where r.row_number_for_product <= p_limit_per_product
   order by r.product_id, r.media_uploaded_at desc;
end;
$$;
revoke all on function public.get_public_catalogue_product_media(uuid[], integer) from public, anon, authenticated;
grant execute on function public.get_public_catalogue_product_media(uuid[], integer) to anon, authenticated;

comment on function public.can_public_read_catalogue_product_media(text) is
  'Allows public Storage reads only for quality-approved media attached to approved, published catalogue products.';
comment on function public.get_public_catalogue_product_media(uuid[], integer) is
  'Bounded public catalogue media lookup; returns only quality-approved photos for approved, published products.';
