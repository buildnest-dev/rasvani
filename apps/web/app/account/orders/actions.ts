'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function cancelMyOrder(formData: FormData) {
  const orderId = String(formData.get('order_id') ?? '').trim();
  const reason = String(formData.get('reason') ?? '').trim();
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(orderId) || reason.length < 3 || reason.length > 500) {
    redirect('/account/orders?error=invalid-cancellation');
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc('cancel_customer_order', {
    p_order_id: orderId,
    p_reason: reason,
  });
  if (error) redirect('/account/orders?error=cancellation-unavailable');
  revalidatePath('/account/orders');
  revalidatePath('/account');
  redirect('/account/orders?cancelled=1');
}
