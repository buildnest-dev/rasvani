'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAnyRole } from '@/lib/auth/authorization';
import { createClient } from '@/lib/supabase/server';
export async function reviewBusinessAccount(data:FormData){
 await requireAnyRole(['admin','super_admin']);
 const id=String(data.get('business_id')??'').trim(); const decision=String(data.get('decision')??'').trim(); const reason=String(data.get('reason')??'').trim();
 if(!/^[0-9a-f-]{36}$/i.test(id)||!['approved','rejected'].includes(decision)||!reason) redirect('/admin?error=business-review-fields-required');
 const supabase=await createClient(); const {error}=await supabase.rpc('review_business_account',{p_business_id:id,p_decision:decision,p_reason:reason});
 if(error) redirect('/admin?error=business-review-failed');
 revalidatePath('/admin'); revalidatePath('/business-portal'); redirect('/admin?businessReviewed=1');
}
