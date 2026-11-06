'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAnyRole } from '@/lib/auth/authorization';
import { createClient } from '@/lib/supabase/server';
function field(data: FormData, key: string) { return String(data.get(key) ?? '').trim(); }
export async function submitBusinessApplication(data: FormData) {
  await requireAnyRole(['customer','retailer','admin','super_admin']);
  const legalName=field(data,'legal_name');
  const gstin=field(data,'gstin');
  const registration=field(data,'registration_number');
  if(!legalName || legalName.length>200) redirect('/business-portal?error=legal-name-required');
  if(gstin && !/^[0-9A-Z]{15}$/.test(gstin)) redirect('/business-portal?error=invalid-gstin-format');
  const supabase=await createClient();
  const {error}=await supabase.rpc('submit_business_account',{p_legal_name:legalName,p_tax_details:{gstin:gstin||null,registration_number:registration||null}});
  if(error) redirect('/business-portal?error=application-failed');
  revalidatePath('/business-portal'); redirect('/business-portal?submitted=1');
}
export async function createTradeEnquiry(data: FormData) {
  await requireAnyRole(['customer','retailer','admin','super_admin']);
  const businessId=field(data,'business_id'); const productId=field(data,'product_id');
  const quantity=field(data,'quantity'); const message=field(data,'message');
  if(!/^[0-9a-f-]{36}$/i.test(businessId)) redirect('/business-portal?error=select-business');
  if(productId && !/^[0-9a-f-]{36}$/i.test(productId)) redirect('/business-portal?error=invalid-product');
  if(quantity && (!Number.isFinite(Number(quantity)) || Number(quantity)<=0)) redirect('/business-portal?error=invalid-quantity');
  const supabase=await createClient();
  const {error}=await supabase.rpc('create_trade_enquiry',{p_business_id:businessId,p_product_id:productId||null,p_quantity:quantity?Number(quantity):null,p_message:message||null});
  if(error) redirect('/business-portal?error=enquiry-failed');
  revalidatePath('/business-portal'); redirect('/business-portal?enquiry=created');
}
export async function respondToQuote(data: FormData) {
  await requireAnyRole(['customer','retailer','admin','super_admin']);
  const quoteId=field(data,'quote_id'); const decision=field(data,'decision'); const reason=field(data,'reason');
  if(!/^[0-9a-f-]{36}$/i.test(quoteId) || !['accepted','declined'].includes(decision)) redirect('/business-portal?error=invalid-quote-response');
  const supabase=await createClient();
  const {error}=await supabase.rpc('respond_to_trade_quote',{p_quote_id:quoteId,p_decision:decision,p_reason:reason||null});
  if(error) redirect('/business-portal?error=quote-response-failed');
  revalidatePath('/business-portal'); redirect('/business-portal?quote=responded');
}
