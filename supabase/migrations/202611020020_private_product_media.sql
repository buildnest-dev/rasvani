-- Private product-image intake with explicit review before catalogue publication.
-- This migration intentionally does not enable identity, licence or bank-document uploads.

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'producer-product-media', 'producer-product-media', false, 5242880,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

create table public.producer_product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  producer_id uuid not null references public.producer_profiles(id),
  uploaded_by uuid not null references auth.users(id),
  bucket_id text not null default 'producer-product-media' check(bucket_id='producer-product-media'),
  object_path text not null unique,
  original_filename text not null,
  mime_type text not null check(mime_type in ('image/jpeg','image/png','image/webp')),
  byte_size integer not null check(byte_size between 1 and 5242880),
  review_status public.record_status not null default 'pending_review',
  reviewer_id uuid references auth.users(id),
  reviewed_at timestamptz,
  review_reason text,
  uploaded_at timestamptz not null default now()
);
create index producer_product_media_product_status_idx
  on public.producer_product_media(product_id, review_status, uploaded_at desc);
create index producer_product_media_producer_uploaded_idx
  on public.producer_product_media(producer_id, uploaded_at desc);
alter table public.producer_product_media enable row level security;
revoke all on table public.producer_product_media from anon, authenticated;
grant all on table public.producer_product_media to service_role;

-- Storage policies call SECURITY DEFINER helpers because producer tables deliberately
-- have no direct SELECT grants to authenticated users.
create or replace function public.can_upload_producer_product_media()
returns boolean language sql stable security definer set search_path=public,auth as $$
  select auth.uid() is not null
    and public.has_app_role('producer')
    and exists(select 1 from public.producer_profiles p where p.user_id=auth.uid() and p.application_status='approved');
$$;
revoke all on function public.can_upload_producer_product_media() from public,anon;
grant execute on function public.can_upload_producer_product_media() to authenticated;

create or replace function public.can_delete_unregistered_producer_product_media(p_object_path text)
returns boolean language sql stable security definer set search_path=public,auth as $$
  select auth.uid() is not null
    and public.has_app_role('producer')
    and split_part(coalesce(p_object_path,''),'/',1)=auth.uid()::text
    and exists(select 1 from public.producer_profiles p where p.user_id=auth.uid() and p.application_status='approved')
    and not exists(select 1 from public.producer_product_media m where m.object_path=p_object_path);
$$;
revoke all on function public.can_delete_unregistered_producer_product_media(text) from public,anon;
grant execute on function public.can_delete_unregistered_producer_product_media(text) to authenticated;

-- Storage object path convention: <auth-user-uuid>/<product-uuid>/<random-uuid>.<extension>
drop policy if exists producer_product_media_owner_upload on storage.objects;
create policy producer_product_media_owner_upload on storage.objects
for insert to authenticated
with check (
  bucket_id = 'producer-product-media'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.can_upload_producer_product_media()
);

drop policy if exists producer_product_media_private_read on storage.objects;
create policy producer_product_media_private_read on storage.objects
for select to authenticated
using (
  bucket_id = 'producer-product-media'
  and (
    ((storage.foldername(name))[1] = auth.uid()::text and public.has_app_role('producer'))
    or public.has_app_role('quality_reviewer')
    or public.has_app_role('admin')
    or public.has_app_role('super_admin')
  )
);

drop policy if exists producer_product_media_unregistered_cleanup on storage.objects;
create policy producer_product_media_unregistered_cleanup on storage.objects
for delete to authenticated
using (
  bucket_id = 'producer-product-media'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.can_delete_unregistered_producer_product_media(name)
);

create or replace function public.register_producer_product_media(
  p_product_id uuid,
  p_object_path text,
  p_original_filename text,
  p_mime_type text,
  p_byte_size integer
) returns uuid
language plpgsql security definer set search_path=public,auth,storage as $$
declare
  v_user uuid := auth.uid();
  v_producer uuid;
  v_media uuid;
  v_product_status public.record_status;
  v_existing_count integer;
begin
  if v_user is null or not public.has_app_role('producer') then raise exception 'Approved producer role required'; end if;
  select id into v_producer from public.producer_profiles
   where user_id=v_user and application_status='approved' for share;
  if v_producer is null then raise exception 'Approved producer profile required'; end if;
  select approval_status into v_product_status from public.products
   where id=p_product_id and producer_id=v_producer for update;
  if not found then raise exception 'Product was not found for this producer'; end if;
  if v_product_status not in ('draft','pending_review','rejected') then
    raise exception 'Images can only be attached before product catalogue approval';
  end if;
  select count(*) into v_existing_count from public.producer_product_media where product_id=p_product_id;
  if v_existing_count >= 12 then raise exception 'A product can have at most 12 submitted photos'; end if;
  if p_object_path is null or p_object_path !~ ('^'||v_user::text||'/'||p_product_id::text||'/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$') then
    raise exception 'Invalid private storage path';
  end if;
  if p_mime_type not in ('image/jpeg','image/png','image/webp') or p_byte_size is null or p_byte_size not between 1 and 5242880 then
    raise exception 'Only JPEG, PNG or WebP images up to 5 MB are accepted';
  end if;
  if length(coalesce(p_original_filename,'')) < 1 or length(p_original_filename) > 180 then
    raise exception 'Image filename is invalid';
  end if;
  if not exists(select 1 from storage.objects o where o.bucket_id='producer-product-media' and o.name=p_object_path) then
    raise exception 'Uploaded private image object was not found';
  end if;
  insert into public.producer_product_media(
    product_id,producer_id,uploaded_by,bucket_id,object_path,original_filename,mime_type,byte_size,review_status
  ) values (
    p_product_id,v_producer,v_user,'producer-product-media',p_object_path,
    regexp_replace(p_original_filename,'[^A-Za-z0-9._ -]','','g'),p_mime_type,p_byte_size,'pending_review'
  ) returning id into v_media;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
  values(v_user,'producer.product_media_submitted','product_media',v_media::text,
    jsonb_build_object('product_id',p_product_id,'mime_type',p_mime_type,'byte_size',p_byte_size));
  return v_media;
end;
$$;
revoke all on function public.register_producer_product_media(uuid,text,text,text,integer) from public,anon;
grant execute on function public.register_producer_product_media(uuid,text,text,text,integer) to authenticated;

create or replace function public.get_my_producer_product_media(p_product_id uuid)
returns table(media_id uuid,object_path text,original_filename text,mime_type text,byte_size integer,review_status public.record_status,uploaded_at timestamptz)
language sql stable security definer set search_path=public,auth as $$
  select m.id,m.object_path,m.original_filename,m.mime_type,m.byte_size,m.review_status,m.uploaded_at
    from public.producer_product_media m
    join public.producer_profiles p on p.id=m.producer_id
   where m.product_id=p_product_id and p.user_id=auth.uid() and public.has_app_role('producer')
   order by m.uploaded_at desc limit 12;
$$;
revoke all on function public.get_my_producer_product_media(uuid) from public,anon;
grant execute on function public.get_my_producer_product_media(uuid) to authenticated;

create or replace function public.get_catalogue_media_review_queue()
returns table(media_id uuid,product_id uuid,product_name text,sku text,producer_name text,object_path text,original_filename text,mime_type text,byte_size integer,uploaded_at timestamptz)
language plpgsql stable security definer set search_path=public,auth as $$
begin
  if auth.uid() is null or not (public.has_app_role('quality_reviewer') or public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Quality reviewer role required';
  end if;
  return query
  select m.id,p.id,p.name,p.sku,coalesce(pp.public_name,pp.legal_name),m.object_path,m.original_filename,m.mime_type,m.byte_size,m.uploaded_at
    from public.producer_product_media m
    join public.products p on p.id=m.product_id
    join public.producer_profiles pp on pp.id=m.producer_id
   where m.review_status='pending_review'
   order by m.uploaded_at asc limit 100;
end;
$$;
revoke all on function public.get_catalogue_media_review_queue() from public,anon;
grant execute on function public.get_catalogue_media_review_queue() to authenticated;

create or replace function public.review_producer_product_media(
  p_media_id uuid,p_decision text,p_reason text
) returns void
language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid(); v_product uuid;
begin
  if v_user is null or not (public.has_app_role('quality_reviewer') or public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Quality reviewer role required';
  end if;
  if p_decision not in ('approved','rejected') then raise exception 'Decision must be approved or rejected'; end if;
  if p_reason is null or length(trim(p_reason))<3 then raise exception 'A media review reason is required'; end if;
  update public.producer_product_media set review_status=p_decision::public.record_status,
    reviewer_id=v_user,reviewed_at=now(),review_reason=trim(p_reason)
   where id=p_media_id and review_status='pending_review'
   returning product_id into v_product;
  if not found then raise exception 'Pending product image not found'; end if;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
  values(v_user,'catalogue.product_media_review','product_media',p_media_id::text,
    jsonb_build_object('product_id',v_product,'decision',p_decision,'reason',trim(p_reason)));
end;
$$;
revoke all on function public.review_producer_product_media(uuid,text,text) from public,anon;
grant execute on function public.review_producer_product_media(uuid,text,text) to authenticated;

-- Publication is blocked while any submitted photo is still awaiting quality review.
create or replace function public.publish_catalogue_product(p_product_id uuid)
returns void language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid();
begin
  if v_user is null or not (public.has_app_role('content_editor') or public.has_app_role('admin') or public.has_app_role('super_admin')) then
    raise exception 'Content editor role required';
  end if;
  update public.products p set published_at=now(),updated_at=now()
   where p.id=p_product_id and p.approval_status='approved'
     and exists(select 1 from public.producer_profiles pp where pp.id=p.producer_id and pp.application_status='approved')
     and exists(select 1 from public.producer_facilities pf where pf.producer_id=p.producer_id and pf.approval_status='approved'
       and (pf.approved_from is null or pf.approved_from<=current_date) and (pf.approved_until is null or pf.approved_until>=current_date))
     and exists(select 1 from public.categories c where c.id=p.category_id and c.active)
     and not exists(select 1 from public.product_claim_reviews cr where cr.product_id=p.id and cr.review_status<>'approved')
     and not exists(select 1 from public.producer_product_media m where m.product_id=p.id and m.review_status='pending_review');
  if not found then raise exception 'Product is not eligible; check producer, facility, category, claim and image review states'; end if;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
  values(v_user,'catalogue.product_publish','product',p_product_id::text,'{}'::jsonb);
end;
$$;
revoke all on function public.publish_catalogue_product(uuid) from public,anon;
grant execute on function public.publish_catalogue_product(uuid) to authenticated;

comment on table public.producer_product_media is
  'Private product-image submissions; only approved producer uploads and quality-reviewed images can proceed to publication. Not a document repository.';
