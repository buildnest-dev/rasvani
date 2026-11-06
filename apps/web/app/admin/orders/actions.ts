'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAnyRole } from '@/lib/auth/authorization';
import { createClient } from '@/lib/supabase/server';

const statuses = ['confirmed', 'packed', 'dispatched', 'delivered', 'cancelled'];
const payments = ['', 'captured', 'failed', 'refunded'];

export async function setOrderStatus(formData: FormData) {
  await requireAnyRole(['admin', 'super_admin', 'warehouse_operator']);
  const orderId = String(formData.get('order_id') ?? '');
  const status = String(formData.get('status') ?? '');
  const payment = String(formData.get('payment') ?? '');
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(orderId) || !statuses.includes(status) || !payments.includes(payment)) redirect('/admin/orders?error=invalid');
  const supabase = await createClient();
  const { error } = await supabase.rpc('admin_set_order_status', { p_order_id: orderId, p_status: status, p_payment_status: payment || null });
  if (error) redirect('/admin/orders?error=failed');
  revalidatePath('/admin/orders');
  redirect('/admin/orders?updated=1');
}
