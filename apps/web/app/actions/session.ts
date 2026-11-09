'use server';

import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, requireRole, verifySession, type Role } from '@/lib/firebase/admin';
import { verifyCaptcha } from '@/lib/captcha';
import { UPLOAD_PREFIX, isLibraryImage, uploadedImageId } from '@/lib/food-images';
import { biharDistricts } from '@/lib/bihar-districts';
import { COMMON_SIZES, isSizeId, priceFor, sizeLabel, validMrp, type PackSize } from '@/lib/pack-sizes';
import { CANCEL_REASONS, FINAL_STATUSES, ORDER_STATUSES, PAYMENTS, REFUND_REASONS, ticketTypeFor } from '@/lib/orders';

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });
const message = (error: unknown, fallback: string) => (error instanceof Error && /Not permitted|sign in/i.test(error.message) ? error.message : fallback);

const FINAL = new Set<string>(FINAL_STATUSES);

/** Firestore ids come from the browser: allow only plain ids so a value like 'a/b/c' can never address another path. */
function safeId(id: unknown): string {
  if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(id)) throw new Error('Not permitted: invalid id');
  return id;
}
function safeEmailKey(email: unknown): string {
  if (typeof email !== 'string' || email.length === 0 || email.length > 254 || email.includes('/') || /\s/.test(email)) throw new Error('Not permitted: invalid email');
  return email;
}

/** Accepts only https links whose host is exactly a Google Maps host (blocks look-alikes such as maps.app.goo.gl.evil.com). */
function isMapsLink(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return false;
    const host = url.hostname.toLowerCase();
    if (host === 'maps.app.goo.gl' || host === 'maps.google.com') return true;
    if (host === 'goo.gl') return url.pathname.startsWith('/maps');
    return (host === 'google.com' || host === 'www.google.com') && url.pathname.startsWith('/maps');
  } catch { return false; }
}

export async function syncRoleAction(idToken: string): Promise<{ role: Role; error?: string }> {
  try { return { role: (await verifySession(idToken)).role }; } catch (caught) {
    // Details go to the server log only (Vercel Logs). The browser gets a generic message so no internals leak.
    const err = caught as { code?: string | number; message?: string };
    console.error('syncRoleAction failed:', err.code ?? '', String(err.message ?? '').replace(/-----BEGIN[\s\S]*?END[^-]*-----/g, '[key]').slice(0, 300));
    return { role: 'customer', error: 'Could not check your account on the server. Please sign out and sign in again.' };
  }
}

/* ------------------------------ Customer ------------------------------ */
const clean = (max: number) => z.string().trim().max(max);
const orderSchema = z.object({
  method: z.enum(['delivery', 'pickup']),
  name: clean(80).min(2, 'Enter your name.'),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number.'),
  district: z.enum(biharDistricts, { message: 'Choose your district in Bihar.' }),
  pincode: clean(6), address: clean(300), landmark: clean(120), notes: clean(400),
  payment: z.enum(['cod', 'upi']),
  lat: z.number().min(6).max(38).nullable(), lng: z.number().min(68).max(98).nullable(),
  lines: z.array(z.object({ productId: z.string().min(1).max(60), sizeId: z.string().max(10).optional(), qty: z.number().int().min(1).max(20) })).min(1).max(50),
});
const paymentLabels = { cod: 'Cash on delivery / pay at collection', upi: 'Pay by UPI QR to Rasvani' } as const;

/** Verifies the "I am not a robot" token on the server. Used by the sign-in screen before it calls Firebase. */
export async function verifyCaptchaAction(token: string): Promise<{ ok: boolean; error?: string }> {
  const result = await verifyCaptcha(token);
  return result.ok ? { ok: true } : { ok: false, error: result.message };
}

export async function placeOrderAction(idToken: string, input: unknown, captchaToken?: string): Promise<Result<{ orderNumber: string }>> {
  let session;
  try { session = await verifySession(idToken); } catch { return fail('Please sign in to place your order.'); }
  // Bot checks first: hidden honeypot field (humans never fill it), then the server-verified CAPTCHA token.
  if (input && typeof input === 'object' && String((input as { website?: unknown }).website ?? '').length > 0) return fail('Please try again.');
  const human = await verifyCaptcha(captchaToken);
  if (!human.ok) return fail(human.message);
  if (!session.emailVerified) return fail('Please verify your email first. Check your inbox for the verification link.');
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Please check the form.');
  const data = parsed.data;
  if (data.method === 'delivery') {
    if (!/^8[0-5]\d{4}$/.test(data.pincode)) return fail('Home delivery is only for Bihar. Enter a valid Bihar pincode.');
    if (data.address.length < 8) return fail('Enter your full delivery address.');
  } else if (data.pincode && !/^\d{6}$/.test(data.pincode)) return fail('Pincode must be 6 digits.');
  if (new Set(data.lines.map((line) => `${line.productId}:${line.sizeId ?? ''}`)).size !== data.lines.length) return fail('Your cart has a duplicate item.');

  try {
    const db = adminDb();
    // Abuse guard: at most 8 orders per hour and 5 still-open orders per customer.
    const mine = await db.collection('orders').where('userId', '==', session.uid).limit(200).get();
    const hourAgo = new Date(Date.now() - 3600_000).toISOString();
    const recent = mine.docs.filter((d) => String(d.data().createdAt ?? '') >= hourAgo).length;
    const open = mine.docs.filter((d) => !FINAL.has(d.data().status)).length;
    if (recent >= 8 || open >= 5) return fail('You have several orders in progress. Please wait for Rasvani to confirm them, or write to rasvanifoods@gmail.com.');
    const snaps = await Promise.all(data.lines.map((line) => db.collection('products').doc(safeId(line.productId)).get()));
    const lines: { productId: string; name: string; sizeId?: string; sizeLabel?: string; qty: number; unitPaise: number; mrpPaise?: number; linePaise: number; makerName: string | null }[] = [];
    for (const [index, snap] of snaps.entries()) {
      const product = snap.data();
      if (!snap.exists || !product || product.visible !== true || !Number.isInteger(product.pricePaise)) return fail('An item in your cart is no longer available. Please remove it and try again.');
      const qty = data.lines[index].qty;
      // The price is ALWAYS read from the product on the server for the chosen pack size; the browser's price is never trusted.
      const sizes = Array.isArray(product.sizes) ? (product.sizes as PackSize[]) : null;
      const choice = priceFor({ pricePaise: product.pricePaise, mrpPaise: product.mrpPaise ?? null, sizes }, data.lines[index].sizeId);
      if (!choice || !Number.isInteger(choice.pricePaise) || choice.pricePaise < 100) return fail('The pack size of an item in your cart is no longer available. Please remove it and add it again.');
      lines.push({
        productId: snap.id, name: choice.label ? `${String(product.name)} (${choice.label})` : String(product.name), ...(choice.label ? { sizeId: data.lines[index].sizeId, sizeLabel: choice.label } : {}),
        qty, unitPaise: choice.pricePaise, ...(choice.mrpPaise ? { mrpPaise: choice.mrpPaise } : {}), linePaise: choice.pricePaise * qty, makerName: product.makerName ?? null,
      });
    }
    const totalPaise = lines.reduce((sum, line) => sum + line.linePaise, 0);
    if (data.payment === 'upi') {
      const pay = await db.collection('settings').doc('payment').get();
      if (!pay.exists || !pay.data()?.upiId) return fail('UPI payment is not switched on yet. Please choose cash on delivery / pay at collection.');
    }
    const orderNumber = `RV-${randomBytes(4).toString('hex').toUpperCase()}${Date.now().toString(36).slice(-3).toUpperCase()}`;
    await db.collection('orders').add({
      orderNumber, userId: session.uid, customerEmail: session.email, status: 'placed', paymentStatus: 'pending',
      lines, totalPaise, bakerId: null, bakerName: null, bakerProfileId: null, deliveryFeePaise: null, customerNote: null,
      paymentMethod: data.payment, paymentRef: null, notes: data.notes || null, createdAt: new Date().toISOString(),
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

/** The customer never cancels directly: this files a request (ticket) that the admin resolves. */
const ticketInput = z.object({ reason: z.string().trim().min(3).max(80), details: z.string().trim().max(300).optional() });
export async function requestOrderTicketAction(idToken: string, orderId: string, input: unknown): Promise<Result> {
  try {
    const session = await verifySession(idToken);
    const parsed = ticketInput.safeParse(input);
    if (!parsed.success) return fail('Please choose a reason.');
    const type = parsed.data.reason === 'Other' && (parsed.data.details ?? '').length < 3 ? null : 'ok';
    if (!type) return fail('Please write a few words about the reason.');
    const ref = adminDb().collection('orders').doc(safeId(orderId));
    const order = (await ref.get()).data();
    if (!order || order.userId !== session.uid) return fail('Order not found.');
    const kind = ticketTypeFor(String(order.status));
    if (!kind) return fail('This order is already closed, so no request can be made.');
    const allowed: readonly string[] = kind === 'cancel' ? CANCEL_REASONS : REFUND_REASONS;
    if (!allowed.includes(parsed.data.reason)) return fail('Please choose a reason from the list.');
    if (order.ticket?.status === 'open') return fail('You already have an open request for this order. Rasvani will reply soon.');
    const now = new Date().toISOString();
    await ref.update({ ticket: { type: kind, reason: parsed.data.reason, details: parsed.data.details || null, status: 'open', requestedAt: now, resolvedAt: null, adminNote: null }, updatedAt: now });
    return { ok: true };
  } catch (error) { return fail(message(error, 'Could not send your request.')); }
}

/** Admin resolves the ticket. Approving a cancel request cancels the order; approving a refund request marks the payment refunded. */
export async function resolveOrderTicketAction(idToken: string, orderId: string, decision: 'approve' | 'reject', note: string): Promise<Result> {
  try {
    await requireRole(idToken, ['admin']);
    if (decision !== 'approve' && decision !== 'reject') return fail('Choose approve or reject.');
    const ref = adminDb().collection('orders').doc(safeId(orderId));
    const order = (await ref.get()).data();
    const ticket = order?.ticket;
    if (!order || !ticket || ticket.status !== 'open') return fail('There is no open request on this order.');
    const cleanNote = note.trim().slice(0, 300);
    if (decision === 'reject' && cleanNote.length < 3) return fail('Write a short reason for the customer when you reject.');
    const now = new Date().toISOString();
    const update: Record<string, unknown> = { ticket: { ...ticket, status: decision === 'approve' ? 'approved' : 'rejected', resolvedAt: now, adminNote: cleanNote || null }, updatedAt: now };
    if (decision === 'approve') {
      if (ticket.type === 'cancel') {
        if (FINAL.has(String(order.status))) return fail('This order is already final.');
        update.status = 'cancelled'; update.cancelReason = String(ticket.reason).slice(0, 300);
      } else update.paymentStatus = 'refunded';
    }
    await ref.update(update);
    return { ok: true };
  } catch (error) { return fail(message(error, 'Could not resolve the request.')); }
}

/* -------------------------------- Admin -------------------------------- */
export async function setOrderStatusAction(idToken: string, orderId: string, status: string, payment: string): Promise<Result> {
  try {
    await requireRole(idToken, ['admin']);
    if (!(ORDER_STATUSES as readonly string[]).includes(status) || (payment && !(PAYMENTS as readonly string[]).includes(payment))) return fail('Invalid status.');
    const ref = adminDb().collection('orders').doc(safeId(orderId));
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
    const orderRef = db.collection('orders').doc(safeId(orderId));
    const order = await orderRef.get();
    if (!order.exists || FINAL.has(order.data()?.status)) return fail('Order cannot be changed.');
    if (!bakerUid) { await orderRef.update({ bakerId: null, bakerName: null, updatedAt: new Date().toISOString() }); return { ok: true }; }
    const baker = await db.collection('roles').doc(safeId(bakerUid)).get();
    if (!baker.exists || baker.data()?.role !== 'baker') return fail('That baker is not active.');
    await orderRef.update({
      bakerId: bakerUid, bakerName: baker.data()?.name ?? baker.data()?.email ?? 'Baker',
      status: ['placed', 'confirmed'].includes(order.data()?.status) ? 'confirmed' : order.data()?.status,
      updatedAt: new Date().toISOString(),
    });
    return { ok: true };
  } catch (error) { return fail(message(error, 'Could not assign the baker.')); }
}

const sizesInput = z.array(z.object({ id: z.string().max(10), priceRupees: z.number().min(1).max(100000), mrpRupees: z.number().min(0).max(100000).optional() })).max(COMMON_SIZES.length);
/** Turns the admin's size rows into stored pack sizes: known ids only, no repeats, in the standard order, MRP only when higher. */
function buildSizes(rows: z.infer<typeof sizesInput> | undefined): PackSize[] | string {
  const out: PackSize[] = [];
  for (const row of rows ?? []) {
    if (!isSizeId(row.id)) return 'Choose pack sizes from the list.';
    if (out.some((item) => item.id === row.id)) return 'Each pack size can be added only once.';
    const pricePaise = Math.round(row.priceRupees * 100);
    out.push({ id: row.id, label: sizeLabel(row.id), pricePaise, mrpPaise: validMrp(pricePaise, row.mrpRupees ? Math.round(row.mrpRupees * 100) : null) });
  }
  const order = new Map<string, number>(COMMON_SIZES.map((size, index) => [size.id, index]));
  return out.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

const productSchema = z.object({
  name: z.string().trim().min(2).max(180), sku: z.string().trim().min(2).max(80),
  description: z.string().trim().max(2000), makerName: z.string().trim().max(120), makerId: z.string().trim().max(60).optional(),
  image: z.string().trim().max(120).optional(),
  priceRupees: z.number().min(1).max(100000).optional(), mrpRupees: z.number().min(0).max(100000).optional(), sizes: sizesInput.optional(), storage: z.enum(['ambient', 'chilled', 'frozen', 'other']),
  vegetarianEvidence: z.string().trim().min(3, 'Write how you confirmed it is 100% vegetarian.').max(300),
});

export async function publishProductAction(idToken: string, input: unknown): Promise<Result<{ id: string }>> {
  try {
    await requireRole(idToken, ['admin']);
    const parsed = productSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Check the product fields.');
    const d = parsed.data;
    const sizes = buildSizes(d.sizes);
    if (typeof sizes === 'string') return fail(sizes);
    if (sizes.length === 0 && !d.priceRupees) return fail('Enter a price, or add at least one pack size with its price.');
    const basePaise = sizes.length > 0 ? sizes[0].pricePaise : Math.round((d.priceRupees ?? 0) * 100);
    const baseMrp = sizes.length > 0 ? sizes[0].mrpPaise : validMrp(basePaise, d.mrpRupees ? Math.round(d.mrpRupees * 100) : null);
    if (d.image && !(await imageOk(d.image))) return fail('Choose a picture from the list or upload one.');
    let makerName = d.makerName; let makerDistrict: string | null = null; let makerId: string | null = null;
    if (d.makerId) {
      const profile = await adminDb().collection('bakerProfiles').doc(safeId(d.makerId)).get();
      if (!profile.exists) return fail('That baker or restaurant was not found. Add it under Bakers first.');
      makerId = profile.id; makerName = String(profile.data()?.name ?? makerName); makerDistrict = profile.data()?.district ?? null;
    }
    const ref = adminDb().collection('products').doc();
    const slugBase = d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'product';
    await ref.set({
      name: d.name, sku: d.sku.toUpperCase(), slug: `${slugBase}-${ref.id.slice(0, 5).toLowerCase()}`, description: d.description || null,
      image: d.image || null, makerName: makerName || null, makerId, makerDistrict, pricePaise: basePaise, mrpPaise: baseMrp, sizes: sizes.length > 0 ? sizes : null, storage: d.storage,
      vegetarianEvidence: d.vegetarianEvidence, visible: true, ratingCount: 0, ratingSum: 0, createdAt: new Date().toISOString(),
    });
    return { ok: true, id: ref.id };
  } catch (error) { return fail(message(error, 'Could not publish the product.')); }
}

const pricingInput = z.object({ priceRupees: z.number().min(1).max(100000).optional(), mrpRupees: z.number().min(0).max(100000).optional(), sizes: sizesInput.optional() });
/** Admin changes the selling price / MRP, or the pack sizes with a price for each. */
export async function setProductPricingAction(idToken: string, productId: string, input: unknown): Promise<Result> {
  try {
    await requireRole(idToken, ['admin']);
    const parsed = pricingInput.safeParse(input);
    if (!parsed.success) return fail('Prices must be between ₹1 and ₹1,00,000.');
    const sizes = buildSizes(parsed.data.sizes);
    if (typeof sizes === 'string') return fail(sizes);
    if (sizes.length === 0 && !parsed.data.priceRupees) return fail('Enter a price, or add at least one pack size with its price.');
    const basePaise = sizes.length > 0 ? sizes[0].pricePaise : Math.round((parsed.data.priceRupees ?? 0) * 100);
    const baseMrp = sizes.length > 0 ? sizes[0].mrpPaise : validMrp(basePaise, parsed.data.mrpRupees ? Math.round(parsed.data.mrpRupees * 100) : null);
    await adminDb().collection('products').doc(safeId(productId)).update({ pricePaise: basePaise, mrpPaise: baseMrp, sizes: sizes.length > 0 ? sizes : null, updatedAt: new Date().toISOString() });
    return { ok: true };
  } catch (error) { return fail(message(error, 'Could not change the price.')); }
}

/** A picture is valid if it is in the built-in library, or it is an uploaded picture that really exists. */
async function imageOk(path: string): Promise<boolean> {
  if (isLibraryImage(path)) return true;
  const id = uploadedImageId(path);
  return id ? (await adminDb().collection('foodImages').doc(id).get()).exists : false;
}

/** Checks the first bytes of the file so only real JPEG, PNG or WebP pictures are stored (never SVG or HTML). */
function sniffImage(bytes: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length > 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (bytes.length > 12 && bytes.subarray(0, 4).toString('latin1') === 'RIFF' && bytes.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp';
  return null;
}

export async function uploadFoodImageAction(idToken: string, dataUrl: string): Promise<Result<{ path: string }>> {
  try {
    await requireRole(idToken, ['admin']);
    const match = /^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(typeof dataUrl === 'string' && dataUrl.length < 520_000 ? dataUrl : '');
    if (!match) return fail('Choose a JPG, PNG or WebP picture.');
    const bytes = Buffer.from(match[1], 'base64');
    if (bytes.length < 200 || bytes.length > 380_000) return fail('The picture is too large or too small. Try another one.');
    const type = sniffImage(bytes);
    if (!type) return fail('That file is not a valid picture.');
    const ref = adminDb().collection('foodImages').doc();
    await ref.set({ bytes, type, size: bytes.length, createdAt: new Date().toISOString() });
    return { ok: true, path: `${UPLOAD_PREFIX}${ref.id}` };
  } catch (error) { return fail(message(error, 'Could not upload the picture.')); }
}

export async function setProductImageAction(idToken: string, productId: string, image: string): Promise<Result> {
  try {
    await requireRole(idToken, ['admin']);
    if (image && !(await imageOk(image))) return fail('Choose a picture from the list or upload one.');
    await adminDb().collection('products').doc(safeId(productId)).update({ image: image || null, updatedAt: new Date().toISOString() });
    return { ok: true };
  } catch (error) { return fail(message(error, 'Could not change the picture.')); }
}

export async function setProductVisibilityAction(idToken: string, productId: string, visible: boolean): Promise<Result> {
  try {
    await requireRole(idToken, ['admin']);
    await adminDb().collection('products').doc(safeId(productId)).update({ visible, updatedAt: new Date().toISOString() });
    return { ok: true };
  } catch (error) { return fail(message(error, 'Could not update the product.')); }
}

const inviteSchema = z.object({ email: z.string().trim().toLowerCase().email().max(254), name: z.string().trim().max(120) });
export async function inviteBakerAction(idToken: string, input: unknown): Promise<Result> {
  try {
    await requireRole(idToken, ['admin']);
    const parsed = inviteSchema.safeParse(input);
    if (!parsed.success) return fail('Enter a valid email address.');
    await adminDb().collection('bakerInvites').doc(safeEmailKey(parsed.data.email)).set({ name: parsed.data.name || null, active: true, createdAt: new Date().toISOString() }, { merge: true });
    const existing = await adminDb().collection('roles').where('email', '==', parsed.data.email).limit(1).get();
    if (!existing.empty) await existing.docs[0].ref.update({ role: 'baker', name: parsed.data.name || null });
    return { ok: true };
  } catch (error) { return fail(message(error, 'Could not add the baker.')); }
}

export async function removeBakerAction(idToken: string, email: string): Promise<Result> {
  try {
    await requireRole(idToken, ['admin']);
    const key = email.trim().toLowerCase();
    await adminDb().collection('bakerInvites').doc(safeEmailKey(key)).set({ active: false, updatedAt: new Date().toISOString() }, { merge: true });
    const existing = await adminDb().collection('roles').where('email', '==', key).limit(1).get();
    if (!existing.empty) await existing.docs[0].ref.update({ role: 'customer', updatedAt: FieldValue.serverTimestamp() });
    return { ok: true };
  } catch (error) { return fail(message(error, 'Could not remove the baker.')); }
}

/* ---------------- Admin: baker directory, payment settings, order handling ---------------- */
const profileSchema = z.object({
  id: z.string().trim().max(60).optional(),
  name: z.string().trim().min(2, 'Enter the baker or restaurant name.').max(120),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number.'),
  address: z.string().trim().min(5, 'Enter the address or area.').max(300),
  district: z.enum(biharDistricts, { message: 'Choose the district in Bihar.' }),
  mapsLink: z.string().trim().max(500).refine(isMapsLink, 'Use a Google Maps link, or leave it empty.'),
  notes: z.string().trim().max(500),
});

export async function saveBakerProfileAction(idToken: string, input: unknown): Promise<Result<{ id: string }>> {
  try {
    await requireRole(idToken, ['admin']);
    const parsed = profileSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Check the baker details.');
    const { id, mapsLink, notes, ...rest } = parsed.data;
    const col = adminDb().collection('bakerProfiles');
    const ref = id ? col.doc(safeId(id)) : col.doc();
    if (id && !(await ref.get()).exists) return fail('Baker not found.');
    await ref.set({ ...rest, mapsLink: mapsLink || null, notes: notes || null, active: true, ...(id ? { updatedAt: new Date().toISOString() } : { createdAt: new Date().toISOString() }) }, { merge: true });
    return { ok: true, id: ref.id };
  } catch (error) { return fail(message(error, 'Could not save the baker.')); }
}

export async function deleteBakerProfileAction(idToken: string, id: string): Promise<Result> {
  try {
    await requireRole(idToken, ['admin']);
    const used = await adminDb().collection('products').where('makerId', '==', id).limit(1).get();
    if (!used.empty) return fail('Some products use this baker. Hide or change those products first.');
    await adminDb().collection('bakerProfiles').doc(safeId(id)).delete();
    return { ok: true };
  } catch (error) { return fail(message(error, 'Could not remove the baker.')); }
}

const paymentSettingsSchema = z.object({
  upiId: z.string().trim().regex(/^[a-zA-Z0-9._-]{2,64}@[a-zA-Z0-9]{2,32}$/, 'Enter a valid UPI ID, like name@bank.'),
  payeeName: z.string().trim().min(2, 'Enter the name shown on the UPI account.').max(60),
});
export async function savePaymentSettingsAction(idToken: string, input: unknown): Promise<Result> {
  try {
    await requireRole(idToken, ['admin']);
    const parsed = paymentSettingsSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Check the UPI details.');
    await adminDb().collection('settings').doc('payment').set({ ...parsed.data, updatedAt: new Date().toISOString() });
    return { ok: true };
  } catch (error) { return fail(message(error, 'Could not save the payment details.')); }
}

const handlingSchema = z.object({
  bakerProfileId: z.string().trim().max(60),
  deliveryFeeRupees: z.number().min(0).max(5000),
  customerNote: z.string().trim().max(300),
  deliveryTime: z.string().trim().max(80).optional(),
});
export async function setOrderHandlingAction(idToken: string, orderId: string, input: unknown): Promise<Result> {
  try {
    await requireRole(idToken, ['admin']);
    const parsed = handlingSchema.safeParse(input);
    if (!parsed.success) return fail('Check the delivery charge and note.');
    const db = adminDb();
    const ref = db.collection('orders').doc(safeId(orderId));
    const order = await ref.get();
    if (!order.exists || FINAL.has(order.data()?.status)) return fail('Order cannot be changed.');
    let bakerName: string | null = null;
    if (parsed.data.bakerProfileId) {
      const profile = await db.collection('bakerProfiles').doc(safeId(parsed.data.bakerProfileId)).get();
      if (!profile.exists) return fail('That baker was not found.');
      bakerName = String(profile.data()?.name ?? 'Baker');
    }
    await ref.update({
      bakerProfileId: parsed.data.bakerProfileId || null, bakerName,
      deliveryFeePaise: Math.round(parsed.data.deliveryFeeRupees * 100) || null,
      customerNote: parsed.data.customerNote || null, deliveryTime: parsed.data.deliveryTime || null, updatedAt: new Date().toISOString(),
    });
    return { ok: true };
  } catch (error) { return fail(message(error, 'Could not save the order details.')); }
}

/* Customer tells Rasvani they paid by UPI (admin still verifies and marks it received). */
export async function submitPaymentRefAction(idToken: string, orderId: string, reference: string): Promise<Result> {
  try {
    const session = await verifySession(idToken);
    const ref = adminDb().collection('orders').doc(safeId(orderId));
    const order = (await ref.get()).data();
    if (!order || order.userId !== session.uid) return fail('Order not found.');
    if (order.paymentMethod !== 'upi' || order.paymentStatus === 'paid') return fail('Payment is not pending for this order.');
    if (order.status === 'cancelled') return fail('This order was cancelled.');
    const cleaned = reference.trim();
    if (!/^[A-Za-z0-9]{6,30}$/.test(cleaned)) return fail('Enter the UPI transaction ID (6 to 30 letters or digits).');
    await ref.update({ paymentRef: cleaned, paymentRefAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    return { ok: true };
  } catch (error) { return fail(message(error, 'Could not save your payment reference.')); }
}

/* -------------------------------- Baker -------------------------------- */
export async function bakerUpdateOrderAction(idToken: string, orderId: string, next: 'accepted' | 'preparing' | 'ready' | 'declined'): Promise<Result> {
  try {
    const session = await requireRole(idToken, ['baker']);
    const ref = adminDb().collection('orders').doc(safeId(orderId));
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

/** Permanently removes a food. Past orders keep their own copy of the name and price, so they are not affected. */
export async function deleteProductAction(idToken: string, productId: string): Promise<Result> {
  try {
    await requireRole(idToken, ['admin']);
    const ref = adminDb().collection('products').doc(safeId(productId));
    const snap = await ref.get();
    if (!snap.exists) return fail('This food was already removed.');
    const image = String(snap.data()?.image ?? '');
    await ref.delete();
    const orphans = await adminDb().collection('reviews').where('productId', '==', ref.id).limit(100).get();
    await Promise.all(orphans.docs.map((d) => d.ref.delete()));
    const pic = uploadedImageId(image);
    if (pic) {
      const stillUsed = await adminDb().collection('products').where('image', '==', image).limit(1).get();
      if (stillUsed.empty) await adminDb().collection('foodImages').doc(safeId(pic)).delete().catch(() => undefined);
    }
    return { ok: true };
  } catch (error) { return fail(message(error, 'Could not remove the food.')); }
}

/* -------------------------------- Reviews -------------------------------- */
const reviewInput = z.object({ rating: z.number().int().min(1).max(5), comment: z.string().trim().max(500) });
/** One review per customer per food. The id is a hash so the public list never exposes a user id. */
const reviewId = (productId: string, uid: string) => createHash('sha256').update(`${safeId(productId)}:${safeId(uid)}`).digest('hex').slice(0, 40);
export type PublicReview = { id: string; name: string; rating: number; comment: string; createdAt: string };

/** Only a customer whose order containing this product was DELIVERED may review it, once per product (they can edit it). */
export async function submitReviewAction(idToken: string, productId: string, input: unknown): Promise<Result> {
  try {
    const session = await verifySession(idToken);
    if (!session.emailVerified) return fail('Please verify your email first.');
    const parsed = reviewInput.safeParse(input);
    if (!parsed.success) return fail('Choose a star rating from 1 to 5 (comment up to 500 characters).');
    const db = adminDb();
    const productRef = db.collection('products').doc(safeId(productId));
    const orders = await db.collection('orders').where('userId', '==', session.uid).limit(200).get();
    const delivered = orders.docs.filter((d) => d.data().status === 'delivered' && Array.isArray(d.data().lines) && d.data().lines.some((l: { productId?: string }) => l.productId === productRef.id));
    if (delivered.length === 0) return fail('You can review a food after your order with it is delivered.');
    const first = String(delivered[0].data().address?.name ?? 'Customer').trim().split(/\s+/)[0].slice(0, 20) || 'Customer';
    const ref = db.collection('reviews').doc(reviewId(productRef.id, session.uid));
    const now = new Date().toISOString();
    await db.runTransaction(async (tx) => {
      const [product, old] = await Promise.all([tx.get(productRef), tx.get(ref)]);
      if (!product.exists) throw new Error('This food is no longer available.');
      const oldRating = old.exists ? Number(old.data()?.rating ?? 0) : 0;
      tx.set(ref, { productId: productRef.id, userId: session.uid, name: first, rating: parsed.data.rating, comment: parsed.data.comment, createdAt: old.exists ? String(old.data()?.createdAt ?? now) : now, updatedAt: now });
      tx.update(productRef, {
        ratingCount: Number(product.data()?.ratingCount ?? 0) + (old.exists ? 0 : 1),
        ratingSum: Math.max(0, Number(product.data()?.ratingSum ?? 0) + parsed.data.rating - oldRating),
      });
    });
    return { ok: true };
  } catch (error) { return fail(message(error, 'Could not save your review.')); }
}

/** Reviews of one food for the public page. Read on the server so no user id or email ever reaches the browser. */
export async function loadReviews(productId: string): Promise<PublicReview[]> {
  try {
    const snap = await adminDb().collection('reviews').where('productId', '==', safeId(productId)).limit(100).get();
    return snap.docs.map((d) => ({ id: d.id, name: String(d.data().name ?? 'Customer'), rating: Number(d.data().rating) || 0, comment: String(d.data().comment ?? ''), createdAt: String(d.data().createdAt ?? '') }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch { return []; }
}

/** The signed-in customer's own reviews, so the order page can show "Edit your review". */
export async function myReviewsAction(idToken: string): Promise<Result<{ reviews: Record<string, { rating: number; comment: string }> }>> {
  try {
    const session = await verifySession(idToken);
    const snap = await adminDb().collection('reviews').where('userId', '==', session.uid).limit(200).get();
    const reviews: Record<string, { rating: number; comment: string }> = {};
    for (const d of snap.docs) reviews[String(d.data().productId)] = { rating: Number(d.data().rating) || 0, comment: String(d.data().comment ?? '') };
    return { ok: true, reviews };
  } catch (error) { return fail(message(error, 'Could not load your reviews.')); }
}

/** Admin removes an inappropriate review and the product's rating is recalculated. */
export async function deleteReviewAction(idToken: string, id: string): Promise<Result> {
  try {
    await requireRole(idToken, ['admin']);
    const db = adminDb();
    const ref = db.collection('reviews').doc(safeId(id));
    await db.runTransaction(async (tx) => {
      const review = await tx.get(ref);
      if (!review.exists) return;
      const productRef = db.collection('products').doc(safeId(String(review.data()?.productId)));
      const product = await tx.get(productRef);
      tx.delete(ref);
      if (product.exists) tx.update(productRef, { ratingCount: Math.max(0, Number(product.data()?.ratingCount ?? 0) - 1), ratingSum: Math.max(0, Number(product.data()?.ratingSum ?? 0) - Number(review.data()?.rating ?? 0)) });
    });
    return { ok: true };
  } catch (error) { return fail(message(error, 'Could not remove the review.')); }
}
