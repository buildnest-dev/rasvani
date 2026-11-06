-- Producer self-service product submission. Submission is never approval or publication.
create index if not exists products_producer_status_created_idx
  on public.products(producer_id, approval_status, created_at desc);

create or replace function public.submit_producer_product(
  p_sku text,
  p_name text,
  p_category_id uuid,
  p_description text,
  p_ingredients text[],
  p_allergen_statement text,
  p_storage_condition text,
  p_claim_type text default null,
  p_claim_text text default null,
  p_claim_evidence_reference text default null
) returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user uuid := auth.uid();
  v_producer uuid;
  v_product uuid := gen_random_uuid();
  v_slug text;
begin
  if v_user is null or not public.has_app_role('producer') then
    raise exception 'Approved producer account required';
  end if;
  select id into v_producer from public.producer_profiles
    where user_id = v_user and application_status = 'approved' for share;
  if v_producer is null then raise exception 'Producer profile is not approved'; end if;
  if nullif(trim(p_sku),'') is null or length(trim(p_sku)) > 80 then raise exception 'Valid SKU is required'; end if;
  if nullif(trim(p_name),'') is null or length(trim(p_name)) > 180 then raise exception 'Product name is required'; end if;
  if p_category_id is null or not exists(select 1 from public.categories where id=p_category_id and active) then
    raise exception 'Choose an active product category';
  end if;
  if length(coalesce(p_description,'')) > 5000 or length(coalesce(p_allergen_statement,'')) > 1500 then
    raise exception 'Product description or allergen statement is too long';
  end if;
  if coalesce(array_length(p_ingredients,1),0) > 80 then raise exception 'Too many ingredient entries'; end if;
  if p_storage_condition not in ('ambient','chilled','frozen','other') then raise exception 'Invalid storage condition'; end if;
  if (nullif(trim(coalesce(p_claim_type,'')),'') is null) <> (nullif(trim(coalesce(p_claim_text,'')),'') is null) then
    raise exception 'Claim type and claim text must be supplied together';
  end if;
  if length(coalesce(p_claim_type,'')) > 80 or length(coalesce(p_claim_text,'')) > 1000 or length(coalesce(p_claim_evidence_reference,'')) > 500 then
    raise exception 'Claim details exceed permitted length';
  end if;
  v_slug := trim(both '-' from regexp_replace(lower(trim(p_name)), '[^a-z0-9]+', '-', 'g'));
  if v_slug = '' then v_slug := 'product'; end if;
  insert into public.products(
    id, producer_id, category_id, sku, slug, name, description, ingredients,
    allergen_statement, storage_condition, approval_status
  ) values (
    v_product, v_producer, p_category_id, upper(trim(p_sku)),
    left(v_slug,120) || '-' || replace(v_product::text,'-',''),
    trim(p_name), nullif(trim(p_description),''), coalesce(p_ingredients,'{}'::text[]),
    nullif(trim(p_allergen_statement),''), p_storage_condition::public.storage_condition, 'pending_review'
  );
  if nullif(trim(coalesce(p_claim_text,'')),'') is not null then
    insert into public.product_claim_reviews(product_id,claim_type,claim_text,evidence_reference,review_status)
    values(v_product,trim(p_claim_type),trim(p_claim_text),nullif(trim(p_claim_evidence_reference),''),'pending_review');
  end if;
  insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
  values(v_user,'producer.product_submitted','product',v_product::text,
    jsonb_build_object('sku',upper(trim(p_sku)),'category_id',p_category_id,'claim_submitted',nullif(trim(coalesce(p_claim_text,'')),'') is not null));
  return v_product;
end;
$$;
revoke all on function public.submit_producer_product(text,text,uuid,text,text[],text,text,text,text,text,text) from public,anon;
grant execute on function public.submit_producer_product(text,text,uuid,text,text[],text,text,text,text,text,text) to authenticated;

create or replace function public.get_my_producer_products()
returns table(product_id uuid, sku text, name text, category_name text, approval_status public.record_status,
              published_at timestamptz, created_at timestamptz, pending_claims bigint)
language sql stable security definer set search_path=public,auth as $$
  select p.id,p.sku,p.name,c.name,p.approval_status,p.published_at,p.created_at,
    (select count(*) from public.product_claim_reviews cr where cr.product_id=p.id and cr.review_status='pending_review')
  from public.products p
  join public.producer_profiles pp on pp.id=p.producer_id
  left join public.categories c on c.id=p.category_id
  where pp.user_id=auth.uid() and public.has_app_role('producer')
  order by p.created_at desc limit 100;
$$;
revoke all on function public.get_my_producer_products() from public,anon;
grant execute on function public.get_my_producer_products() to authenticated;
comment on function public.submit_producer_product(text,text,uuid,text,text[],text,text,text,text,text,text) is
  'Submits a product for independent review for the authenticated approved producer. Does not approve or publish it.';
