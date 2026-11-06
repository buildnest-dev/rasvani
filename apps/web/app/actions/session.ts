'use server';

import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, requireRole, verifySession, type Role } from '@/lib/firebase/admin';
import { biharDistricts } from '@/lib/bihar-districts';
import { FINAL_STATUSES, ORDER_STATUSES, PAYMENTS } from '@/lib/orders';

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });
const message = (error: unknown, fallback: string) => (error instanceof Error && /Not permitted|sign in/i.test(error.message) ? error.message : fallback);

const FINAL = new Set<string>(FINAL_STATUSES);

export async function syncRoleAction(idToken: string): Promise<Role> {
  try { return (await verifySession(idToken)).role; } catch { return 'customer'; }
}

/* ------------------------------ Customer ------------------------------ */
const clean = (max: number) => z.string().trim().max(max);
const orderSchema = z.object({
  method: z.enum(['delivery', 'pickup']),
  name: clean(80).min(2, 'Enter your name.'),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number.'),
  district: z.enum(biharDistricts, { message: 'Choose your district in Bihar.' }),
  pincode: clean(6), address: clean(300), landmark: clean(120), notes: clean(400),
  payment: z.enum(['pay_on_receipt', 'pay_upi_after_call']),
  lat: z.number().min(6).max(38).nullable(), lng: z.number().min(68).max(98).nullable(),
  lines: z.array(z.object({ productId: z.string().min(1).max(60), qty: z.number().int().min(1).max(20) })).min(1).max(50),
});
const paymentLabels = { pay_on_receipt: 'Pay when I receive / collect', pay_upi_after_call: 'Pay by UPI after Rasvani confirms' } as const;

export async function placeOrderAction(idToken: string, input: unknown): Promise<Result<{ orderNumber: string }>> {
  let session;
  try { session = await verifySession(idToken); } catch { return fail('Please sign in to place your order.'); }
  if (!session.emailVerified) return fail('Please verify your email first. Check your inbox for the verification link.');
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Please check the form.');
  const data = parsed.data;
  if (data.method === 'delivery') {
    if (!/^8[0-5]\d{4}$/.test(data.pincode)) return fail('Home delivery is only for Bihar. Enter a valid Bihar pincode.');
    if (data.address.length < 8) return fail('Enter your full delivery address.');
  } else if (data.pincode && !/^\d{6}$/.test(data.pincode)) return fail('Pincode must be 6 digits.');
  if (new Set(data.lines.map((line) => line.productId)).size !== data.lines.length) return fail('Your cart has a duplicate item.');

  try {
    const db = adminDb();
    const snaps = await Promise.all(data.lines.map((line) => db.collection('products').doc(line.productId).get()));
    const lines: { productId: string; name: string; qty: number; unitPaise: number; linePaise: number }[] = [];
    for (const [index, snap] of snaps.entries()) {
      const product = snap.data();
      if (!snap.exists || !product || product.visible !== true || !Number.isInteger(product.pricePaise)) return fail('An item in your cart is no longer available. Please remove it and try again.');
      const qty = data.lines[index].qty;
      lines.push({ productId: snap.id, name: String(product.name), qty, unitPaise: product.pricePaise, linePaise: product.pricePaise * qty });
    }
    const totalPaise = lines.reduce((sum, line) => sum + line.linePaise, 0);
    const orderNumber = `RV-${Math.random().toString(36).slice(2, 8).toUpperCase()}${Date.now().toString(36).slice(-4).toUpperCase()}`;
    await db.collection('orders').add({
      orderNumber, userId: session.uid, customerEmail: session.email, status: 'placed', paymentStatus: 'pending',
      lines, totalPaise, bakerId: null, bakerName: null, notes: data.notes || null, createdAt: new Date().toISOString(),
      address: {
        fulfilment: data.method, name: data.name, phone: data.phone, state: 'Bihar', district: data.district,
        pincode: data.pincode || null, address: data.address || null, landmark: data.landmark || null,
        location: data.lat !== null && data.lng !== null ? { lat: Number(data.lat.toFixed(5)), lng: Number(data.lng.toFixed(5)) } : null,
        paymentPreference: paymentLabels[data.payment],
      },
    });
    return { ok: true, orderNumber };
  } catch { return fail('We could not place the order. Please try again, or write to rasvanifoods@gmail.com.'); }
}

export async function cancelMyOrderAction(idToken: string, orderId: string, reason: string): Promise<Result> {
  try {
    const session = await verifySession(idToken);
    const ref = adminDb().collection('orders').doc(orderId);
    const snap = await ref.get();
    const order = snap.data();
    if (!order || order.userId !== session.uid) return fail('Order not found.');
    if (!['placed', 'confirmed'].includes(order.status)) return fail('This order can no longer be cancelled here. Please contact Rasvani.');
    if (reason.trim().length < 3) return fail('Please tell us why you are cancelling.');
    await ref.update({ status: 'cancelled', cancelReason: reason.trim().slice(0, 300), updatedAt: new Date().toISOString() });
    return { ok: true };
  } catch (error) { return fail(message(error, 'Could not cancel the order.')); }
}

/* -------------------------------- Admin -------------------------------- */
export async function setOrderStatusAction(idToken: string, orderId: string, status: string, payment: string): Promise<Result> {
  try {
    await requireRole(idToken, ['admin']);
    if (!(ORDER_STATUSES as readonly string[]).includes(status) || (payment && !(PAYMENTS as readonly string[]).includes(payment))) return fail('Invalid status.');
    const ref = adminDb().collection('orders').doc(orderId);
    const snap = await ref.get();
    if (!snap.exists) return fail('Order not found.');
    if (FINAL.has(snap.data()?.status)) return fail('This order is already final.');
    await ref.update({ status, ...(payment ? { paymentStatus: payment } : {}), updatedAt: new Date().toISOString() });
    return { ok: true };
  } catch (error) { return fail(message(error, 'Could not update the order.')); }
}

export async function assignBakerAction(idToken: string, orderId: string, bakerUid: string): Promise<Result> {
  try {
    await requireRole(idToken, ['admin']);
    const db = adminDb();
    const orderRef = db.collection('orders').doc(orderId);
    const order = await orderRef.get();
    if (!order.exists || FINAL.has(order.data()?.status)) return fail('Order cannot be changed.');
    if (!bakerUid) { await orderRef.update({ bakerId: null, bakerName: null, updatedAt: new Date().toISOString() }); return { ok: true }; }
    const baker = await db.collection('roles').doc(bakerUid).get();
    if (!baker.exists || baker.data()?.role !== 'baker') return fail('That baker is not active.');
    await orderRef.update({
      bakerId: bakerUid, bakerName: baker.data()?.name ?? baker.data()?.email ?? 'Baker',
      status: ['placed', 'confirmed'].includes(order.data()?.status) ? 'confirmed' : order.data()?.status,
      updatedAt: new Date().toISOString(),
    });
    return { ok: true };
  } catch (error) { return fail(message(error, 'Could not assign the baker.')); }
}

const productSchema = z.object({
  name: z.string().trim().min(2).max(180), sku: z.string().trim().min(2).max(80),
  description: z.string().trim().max(2000), makerName: z.string().trim().max(120),
  priceRupees: z.number().min(1).max(100000), storage: z.enum(['ambient', 'chilled', 'frozen', 'other']),
  vegetarianEvidence: z.string().trim().min(3, 'Write how you confirmed it is 100% vegetarian.').max(300),
});

export async function publishProductAction(idToken: string, input: unknown): Promise<Result<{ id: string }>> {
  try {
    await requireRole(idToken, ['admin']);
    const parsed = productSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Check the product fields.');
    const d = parsed.data;
    const ref = adminDb().collection('products').doc();
    const slugBase = d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'product';
    await ref.set({
      name: d.name, sku: d.sku.toUpperCase(), slug: `${slugBase}-${ref.id.slice(0, 5).toLowerCase()}`, description: d.description || null,
      makerName: d.makerName || null, pricePaise: Math.round(d.priceRupees * 100), storage: d.storage,
      vegetarianEvidence: d.vegetarianEvidence, visible: true, createdAt: new Date().toISOString(),
    });
    return { ok: true, id: ref.id };
  } catch (error) { return fail(message(error, 'Could not publish the product.')); }
}

export async function setProductPriceAction(idToken: string, productId: string, priceRupees: number): Promise<Result> {
  try {
    await requireRole(idToken, ['admin']);
    if (!Number.isFinite(priceRupees) || priceRupees < 1 || priceRupees > 100000) return fail('Price must be between ₹1 and ₹1,00,000.');
    await adminDb().collection('products').doc(productId).update({ pricePaise: Math.round(priceRupees * 100), updatedAt: new Date().toISOString() });
    return { ok: true };
  } catch (error) { return fail(message(error, 'Could not change the price.')); }
}

export async function setProductVisibilityAction(idToken: string, productId: string, visible: boolean): Promise<Result> {
  try {
    await requireRole(idToken, ['admin']);
    await adminDb().collection('products').doc(productId).update({ visible, updatedAt: new Date().toISOString() });
    return { ok: true };
  } catch (error) { return fail(message(error, 'Could not update the product.')); }
}

const inviteSchema = z.object({ email: z.string().trim().toLowerCase().email().max(254), name: z.string().trim().max(120) });
export async function inviteBakerAction(idToken: string, input: unknown): Promise<Result> {
  try {
    await requireRole(idToken, ['admin']);
    const parsed = inviteSchema.safeParse(input);
    if (!parsed.success) return fail('Enter a valid email address.');
    await adminDb().collection('bakerInvites').doc(parsed.data.email).set({ name: parsed.data.name || null, active: true, createdAt: new Date().toISOString() }, { merge: true });
    const existing = await adminDb().collection('roles').where('email', '==', parsed.data.email).limit(1).get();
    if (!existing.empty) await existing.docs[0].ref.update({ role: 'baker', name: parsed.data.name || null });
    return { ok: true };
  } catch (error) { return fail(message(error, 'Could not add the baker.')); }
}

export async function removeBakerAction(idToken: string, email: string): Promise<Result> {
  try {
    await requireRole(idToken, ['admin']);
    const key = email.trim().toLowerCase();
    await adminDb().collection('bakerInvites').doc(key).set({ active: false, updatedAt: new Date().toISOString() }, { merge: true });
    const existing = await adminDb().collection('roles').where('email', '==', key).limit(1).get();
    if (!existing.empty) await existing.docs[0].ref.update({ role: 'customer', updatedAt: FieldValue.serverTimestamp() });
    return { ok: true };
  } catch (error) { return fail(message(error, 'Could not remove the baker.')); }
}

/* -------------------------------- Baker -------------------------------- */
export async function bakerUpdateOrderAction(idToken: string, orderId: string, next: 'accepted' | 'preparing' | 'ready' | 'declined'): Promise<Result> {
  try {
    const session = await requireRole(idToken, ['baker']);
    const ref = adminDb().collection('orders').doc(orderId);
    const snap = await ref.get();
    const order = snap.data();
    if (!order || order.bakerId !== session.uid) return fail('This order is not assigned to you.');
    if (FINAL.has(order.status)) return fail('This order is already final.');
    if (!['accepted', 'preparing', 'ready', 'declined'].includes(next)) return fail('Invalid action.');
    if (next === 'declined') await ref.update({ status: 'confirmed', bakerId: null, bakerName: null, declinedBy: session.email, updatedAt: new Date().toISOString() });
    else await ref.update({ status: next, updatedAt: new Date().toISOString() });
    return { ok: true };
  } catch (error) { return fail(message(error, 'Could not update the order.')); }
}
