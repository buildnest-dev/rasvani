-- Rasvani phases 3-10 domain foundation. Apply after 202611020001_phase2_identity_access_audit.sql.
-- Schema only: no commercial data, warehouse premises, payment provider or seller identity is assumed.
create extension if not exists pgcrypto;
create type public.record_status as enum ('draft','pending_review','approved','rejected','archived');
create type public.stock_status as enum ('sellable','quarantined','rejected','damaged','expired','recalled','disposed');
create type public.storage_condition as enum ('ambient','chilled','frozen','other');
create type public.order_status as enum ('draft','placed','confirmed','allocated','packed','dispatched','delivered','cancelled','refunded');

create table public.regions (
 id text primary key, name text not null unique, region_type text not null check(region_type in ('state','union_territory')),
 slug text not null unique, publication_status public.record_status not null default 'draft', created_at timestamptz not null default now()
);
create table public.producer_profiles (
 id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete set null,
 legal_name text not null, public_name text, home_region_id text references public.regions(id),
 application_status public.record_status not null default 'pending_review', contact_email text,
 verification_notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.producer_facilities (
 id uuid primary key default gen_random_uuid(), producer_id uuid not null references public.producer_profiles(id),
 name text not null, address jsonb not null default '{}'::jsonb, region_id text references public.regions(id),
 approval_status public.record_status not null default 'pending_review', approved_from date, approved_until date,
 created_at timestamptz not null default now()
);
create table public.categories (
 id uuid primary key default gen_random_uuid(), name text not null unique, slug text not null unique,
 description text, active boolean not null default false
);
create table public.products (
 id uuid primary key default gen_random_uuid(), producer_id uuid references public.producer_profiles(id),
 category_id uuid references public.categories(id), sku text not null unique, slug text not null unique,
 name text not null, description text, ingredients text[], allergen_statement text,
 storage_condition public.storage_condition not null default 'ambient',
 approval_status public.record_status not null default 'draft', published_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.product_claim_reviews (
 id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id),
 claim_type text not null, claim_text text not null, evidence_reference text,
 review_status public.record_status not null default 'pending_review', reviewer_id uuid references auth.users(id), reviewed_at timestamptz
);
create table public.product_prices (
 id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id),
 currency char(3) not null default 'INR', amount_paise bigint not null check(amount_paise >= 0),
 valid_from timestamptz not null default now(), valid_until timestamptz, approved_by uuid references auth.users(id),
 check(valid_until is null or valid_until > valid_from)
);
create table public.warehouses (
 id uuid primary key default gen_random_uuid(), code text not null unique, name text not null,
 location jsonb not null default '{}'::jsonb, active boolean not null default false
);
create table public.warehouse_bins (
 id uuid primary key default gen_random_uuid(), warehouse_id uuid not null references public.warehouses(id),
 code text not null, description text, active boolean not null default true, unique(warehouse_id,code)
);
create table public.receipts (
 id uuid primary key default gen_random_uuid(), warehouse_id uuid not null references public.warehouses(id),
 producer_id uuid references public.producer_profiles(id), delivery_reference text, received_at timestamptz not null default now(),
 received_by uuid references auth.users(id), status text not null default 'pending_inspection' check(status in ('pending_inspection','partially_accepted','accepted','rejected','closed')),
 notes text
);
create table public.inventory_batches (
 id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id),
 producer_id uuid references public.producer_profiles(id), receipt_id uuid references public.receipts(id),
 batch_code text not null, manufactured_on date, packed_on date, received_at timestamptz not null default now(),
 expiry_date date, best_before_date date, quantity_received numeric(14,3) not null check(quantity_received > 0),
 quantity_on_hand numeric(14,3) not null check(quantity_on_hand >= 0),
 unit text not null, status public.stock_status not null default 'quarantined',
 inspection_status text not null default 'pending' check(inspection_status in ('pending','accepted','rejected','quarantined')),
 warehouse_id uuid not null references public.warehouses(id), bin_id uuid references public.warehouse_bins(id),
 unique(product_id,batch_code), check(expiry_date is null or manufactured_on is null or expiry_date >= manufactured_on),
 check(best_before_date is null or manufactured_on is null or best_before_date >= manufactured_on)
);
create index inventory_batches_fefo_idx on public.inventory_batches(product_id, expiry_date, received_at) where status='sellable' and inspection_status='accepted';
create table public.receiving_inspections (
 id uuid primary key default gen_random_uuid(), receipt_id uuid not null references public.receipts(id),
 batch_id uuid references public.inventory_batches(id), checklist_key text not null, result text not null check(result in ('pass','fail','not_applicable')),
 notes text, photo_paths text[] not null default '{}', inspected_by uuid references auth.users(id), inspected_at timestamptz not null default now()
);
create table public.inventory_movements (
 id uuid primary key default gen_random_uuid(), batch_id uuid not null references public.inventory_batches(id),
 movement_type text not null check(movement_type in ('receive','reserve','release','pick','dispatch','return','adjustment','damage','quarantine','recall','dispose','transfer')),
 quantity_delta numeric(14,3) not null, from_bin_id uuid references public.warehouse_bins(id), to_bin_id uuid references public.warehouse_bins(id),
 reference_type text, reference_id uuid, reason text not null, actor_id uuid references auth.users(id), created_at timestamptz not null default now()
);
create table public.stock_reservations (
 id uuid primary key default gen_random_uuid(), batch_id uuid not null references public.inventory_batches(id),
 order_id uuid, quantity numeric(14,3) not null check(quantity > 0), status text not null default 'active' check(status in ('active','released','consumed','expired')),
 expires_at timestamptz not null, created_at timestamptz not null default now()
);
create table public.customer_orders (
 id uuid primary key default gen_random_uuid(), customer_id uuid references auth.users(id), order_number text not null unique,
 status public.order_status not null default 'placed', currency char(3) not null default 'INR',
 subtotal_paise bigint not null check(subtotal_paise >= 0), shipping_paise bigint not null default 0 check(shipping_paise >= 0),
 tax_paise bigint not null default 0 check(tax_paise >= 0), total_paise bigint not null check(total_paise >= 0),
 shipping_address jsonb not null, created_at timestamptz not null default now()
);
alter table public.stock_reservations add constraint stock_reservations_order_fk foreign key(order_id) references public.customer_orders(id);
create table public.customer_order_lines (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.customer_orders(id),
 product_id uuid not null references public.products(id), quantity numeric(14,3) not null check(quantity > 0),
 unit_price_paise bigint not null check(unit_price_paise >= 0), line_total_paise bigint not null check(line_total_paise >= 0)
);
create table public.producer_applications (
 id uuid primary key default gen_random_uuid(), applicant_user_id uuid references auth.users(id),
 legal_name text not null, contact_details jsonb not null default '{}'::jsonb, region_id text references public.regions(id),
 application_data jsonb not null default '{}'::jsonb, status public.record_status not null default 'pending_review',
 reviewer_id uuid references auth.users(id), reviewed_at timestamptz, created_at timestamptz not null default now()
);
create table public.business_accounts (
 id uuid primary key default gen_random_uuid(), owner_user_id uuid references auth.users(id),
 legal_name text not null, tax_details jsonb not null default '{}'::jsonb,
 verification_status public.record_status not null default 'pending_review', created_at timestamptz not null default now()
);
create table public.trade_enquiries (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.business_accounts(id),
 product_id uuid references public.products(id), requested_quantity numeric(14,3) check(requested_quantity is null or requested_quantity > 0),
 message text, status text not null default 'new' check(status in ('new','reviewing','quoted','accepted','declined','closed')),
 created_at timestamptz not null default now()
);
create table public.trade_quotes (
 id uuid primary key default gen_random_uuid(), enquiry_id uuid not null references public.trade_enquiries(id),
 currency char(3) not null default 'INR', total_paise bigint not null check(total_paise >= 0),
 valid_until timestamptz, terms text, status text not null default 'draft' check(status in ('draft','sent','accepted','declined','expired')),
 created_by uuid references auth.users(id), created_at timestamptz not null default now()
);
create table public.editorial_content (
 id uuid primary key default gen_random_uuid(), slug text not null unique, content_type text not null check(content_type in ('story','recipe','regional_guide','page')),
 title text not null, body jsonb not null default '{}'::jsonb, region_id text references public.regions(id),
 status public.record_status not null default 'draft', author_id uuid references auth.users(id), reviewer_id uuid references auth.users(id),
 published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.editorial_translations (
 id uuid primary key default gen_random_uuid(), content_id uuid not null references public.editorial_content(id) on delete cascade,
 locale text not null check(locale in ('en','hi','bn','ta','te','mr','gu','pa','kn','ml','or','as')),
 title text not null, body jsonb not null default '{}'::jsonb, review_status public.record_status not null default 'draft',
 reviewer_id uuid references auth.users(id), reviewed_at timestamptz, unique(content_id,locale)
);
create table public.consent_records (
 id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id), consent_key text not null,
 granted boolean not null, policy_version text not null, recorded_at timestamptz not null default now()
);
-- RLS is enabled on every domain table. Policies are intentionally conservative: no anonymous write paths.
do $$ declare t text; begin foreach t in array array[
'regions','producer_profiles','producer_facilities','categories','products','product_claim_reviews','product_prices','warehouses','warehouse_bins','receipts','inventory_batches','receiving_inspections','inventory_movements','stock_reservations','customer_orders','customer_order_lines','producer_applications','business_accounts','trade_enquiries','trade_quotes','editorial_content','editorial_translations','consent_records'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on table public.%I from anon, authenticated',t);
 execute format('grant all on table public.%I to service_role',t);
end loop; end $$;
-- Public read is restricted to explicitly published catalogue/editorial/region records.
grant select on public.regions, public.categories, public.products, public.product_prices, public.editorial_content, public.editorial_translations to anon, authenticated;
create policy published_regions_read on public.regions for select to anon,authenticated using(publication_status='approved');
create policy active_categories_read on public.categories for select to anon,authenticated using(active);
create policy approved_products_read on public.products for select to anon,authenticated using(approval_status='approved' and published_at is not null);
create policy approved_editorial_read on public.editorial_content for select to anon,authenticated using(status='approved' and published_at is not null);
create policy approved_translations_read on public.editorial_translations for select to anon,authenticated using(review_status='approved');
-- Sensitive commerce, producer, B2B and inventory tables have no direct client policies.
-- Implement access through narrowly scoped server actions/RPCs after threat-model review.
