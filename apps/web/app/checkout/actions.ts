'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { biharDistricts } from '@/lib/bihar-districts';

export type CheckoutState = { error?: string };

const clean = (max: number) => z.string().trim().max(max);
const schema = z.object({
  method: z.enum(['delivery', 'pickup']),
  name: clean(80).min(2, 'Enter your name.'),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number.'),
  district: z.enum(biharDistricts, { message: 'Choose your district in Bihar.' }),
  pincode: z.string().trim(),
  address: clean(300),
  landmark: clean(120),
  notes: clean(400),
  payment: z.enum(['pay_on_receipt', 'pay_upi_after_call']),
  lat: z.string().trim(),
  lng: z.string().trim(),
  lines: z.string().max(8000),
});
const lineSchema = z.array(z.object({ productId: z.string().uuid(), qty: z.number().int().min(1).max(20) })).min(1).max(50);
const paymentLabels = { pay_on_receipt: 'Pay when I receive / collect', pay_upi_after_call: 'Pay by UPI after Rasvani confirms' } as const;
const fields = ['method', 'name', 'phone', 'district', 'pincode', 'address', 'landmark', 'notes', 'payment', 'lat', 'lng', 'lines'];

export async function placeOrderAction(_previous: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const parsed = schema.safeParse(Object.fromEntries(fields.map((key) => [key, formData.get(key) ?? ''])));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Please check the form and try again.' };
  const data = parsed.data;

  if (data.method === 'delivery') {
    if (!/^8[0-5]\d{4}$/.test(data.pincode)) return { error: 'Home delivery is only for Bihar. Enter a valid Bihar pincode (6 digits).' };
    if (data.address.length < 8) return { error: 'Enter your full delivery address.' };
  } else if (data.pincode && !/^\d{6}$/.test(data.pincode)) {
    return { error: 'Pincode must be 6 digits.' };
  }

  let rawLines: unknown;
  try { rawLines = JSON.parse(data.lines); } catch { return { error: 'Your cart could not be read. Please go back to the cart.' }; }
  const lines = lineSchema.safeParse(rawLines);
  if (!lines.success) return { error: 'Your cart is empty or invalid.' };
  if (new Set(lines.data.map((line) => line.productId)).size !== lines.data.length) return { error: 'Your cart has a duplicate item. Please refresh the cart.' };

  const lat = Number(data.lat);
  const lng = Number(data.lng);
  const hasLocation = data.lat !== '' && data.lng !== '' && Number.isFinite(lat) && Number.isFinite(lng) && lat >= 6 && lat <= 38 && lng >= 68 && lng <= 98;

  let supabase;
  try { supabase = await createClient(); } catch { return { error: 'Ordering is not available right now. Please try again shortly.' }; }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/account?next=/checkout');

  const address = {
    fulfilment: data.method,
    name: data.name,
    phone: data.phone,
    state: 'Bihar',
    district: data.district,
    pincode: data.pincode || null,
    address: data.address || null,
    landmark: data.landmark || null,
    location: hasLocation ? { lat: Number(lat.toFixed(5)), lng: Number(lng.toFixed(5)) } : null,
    payment_preference: paymentLabels[data.payment],
  };
  const { error } = await supabase.rpc('create_customer_order', {
    p_lines: lines.data.map((line) => ({ product_id: line.productId, quantity: line.qty })),
    p_shipping_address: address,
    p_customer_notes: data.notes || null,
  });
  if (error) {
    if (/no current approved price|unavailable/i.test(error.message)) return { error: 'One item in your cart is no longer available. Please remove it from the cart and try again.' };
    return { error: 'We could not place the order. Please try again, or contact rasvanifoods@gmail.com.' };
  }
  redirect('/account/orders?placed=1');
}
