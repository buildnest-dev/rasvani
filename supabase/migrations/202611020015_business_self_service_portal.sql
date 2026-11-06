-- Rasvani Phase 7: business self-service registration and private B2B workspace.
-- Verification and quote issuance remain staff-controlled; acceptance is not an order or payment.
create or replace function public.submit_business_account(p_legal_name text,p_tax_details jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid(); v_id uuid;
begin
 if v_user is null then raise exception 'Authentication required'; end if;
 if nullif(trim(p_legal_name),'') is null or length(trim(p_legal_name))>200 then raise exception 'Valid legal business name is required'; end if;
 if jsonb_typeof(p_tax_details)<>'object' then raise exception 'Tax details must be an object'; end if;
 if exists(select 1 from public.business_accounts where owner_user_id=v_user and verification_status='pending_review') then
   update public.business_accounts set legal_name=trim(p_legal_name),tax_details=p_tax_details
   where owner_user_id=v_user and verification_status='pending_review' returning id into v_id;
 else
   insert into public.business_accounts(owner_user_id,legal_name,tax_details,verification_status)
   values(v_user,trim(p_legal_name),p_tax_details,'pending_review') returning id into v_id;
 end if;
 insert into public.audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
 values(v_user,'b2b.business_application_submitted','business_account',v_id::text,jsonb_build_object('status','pending_review'));
 return v_id;
end; $$;
revoke all on function public.submit_business_account(text,jsonb) from public,anon;
grant execute on function public.submit_business_account(text,jsonb) to authenticated;

create or replace function public.get_my_business_workspace()
returns jsonb language plpgsql stable security definer set search_path=public,auth as $$
declare v_user uuid:=auth.uid(); v_result jsonb;
begin
 if v_user is null then raise exception 'Authentication required'; end if;
 select jsonb_build_object(
   'businesses',coalesce((select jsonb_agg(jsonb_build_object('id',b.id,'legal_name',b.legal_name,'verification_status',b.verification_status,'review_reason',b.review_reason,'created_at',b.created_at) order by b.created_at desc) from public.business_accounts b where b.owner_user_id=v_user),'[]'::jsonb),
   'enquiries',coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'business_id',e.business_id,'product_id',e.product_id,'requested_quantity',e.requested_quantity,'message',e.message,'status',e.status,'created_at',e.created_at) order by e.created_at desc) from public.trade_enquiries e join public.business_accounts b on b.id=e.business_id where b.owner_user_id=v_user),'[]'::jsonb),
   'quotes',coalesce((select jsonb_agg(jsonb_build_object('id',q.id,'enquiry_id',q.enquiry_id,'total_paise',q.total_paise,'currency',q.currency,'valid_until',q.valid_until,'terms',q.terms,'status',q.status,'sent_at',q.sent_at,'responded_at',q.responded_at) order by q.created_at desc) from public.trade_quotes q join public.trade_enquiries e on e.id=q.enquiry_id join public.business_accounts b on b.id=e.business_id where b.owner_user_id=v_user),'[]'::jsonb)
 ) into v_result;
 return v_result;
end; $$;
revoke all on function public.get_my_business_workspace() from public,anon;
grant execute on function public.get_my_business_workspace() to authenticated;
