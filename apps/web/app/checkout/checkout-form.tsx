'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useCart } from '@/components/cart-provider';
import { placeOrderAction } from '@/app/actions/session';
import { biharDistricts } from '@/lib/bihar-districts';
import { formatPaise } from '@/lib/money';

export function CheckoutForm() {
  const { lines, ready, subtotalPaise } = useCart();
  const { getToken } = useAuth();
  const router = useRouter();
  const [state, setState] = useState<{ error?: string }>({});
  const [pending, setPending] = useState(false);

  async function submit(form: HTMLFormElement) {
    const data = new FormData(form);
    const text = (key: string) => String(data.get(key) ?? '');
    setPending(true); setState({});
    try {
      const result = await placeOrderAction(await getToken(), {
        method: text('method'), name: text('name'), phone: text('phone'), district: text('district'), pincode: text('pincode'),
        address: text('address'), landmark: text('landmark'), notes: text('notes'), payment: text('payment'),
        lat: coords ? Number(coords.lat) : null, lng: coords ? Number(coords.lng) : null,
        lines: lines.map((line) => ({ productId: line.productId, qty: line.qty })),
      });
      if (result.ok) router.push('/account/orders?placed=1'); else setState({ error: result.error });
    } catch { setState({ error: 'Something went wrong. Please try again.' }); }
    setPending(false);
  }
  const [method, setMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [coords, setCoords] = useState<{ lat: string; lng: string } | null>(null);
  const [locationMessage, setLocationMessage] = useState('');

  if (!ready) return <p className="status" role="status">Loading your cart…</p>;
  if (lines.length === 0) return <div className="shop-empty"><h2>Your cart is empty</h2><p>Add something from the shop first.</p><Link href="/shop" className="btn">Go to the shop</Link></div>;

  function shareLocation() {
    if (!navigator.geolocation) { setLocationMessage('Your browser cannot share location. Please type the address instead.'); return; }
    setLocationMessage('Finding your location…');
    navigator.geolocation.getCurrentPosition(
      (position) => { setCoords({ lat: String(position.coords.latitude), lng: String(position.coords.longitude) }); setLocationMessage('Location added to your order. Please still type your address.'); },
      () => setLocationMessage('Location was not shared. That is fine, just type your address.'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }

  return <div className="cart-layout">
    <form className="form-shell checkout-form" onSubmit={(event) => { event.preventDefault(); void submit(event.currentTarget); }}>
      <fieldset className="checkout-methods"><legend>How do you want your order?</legend>
        <label className={`method-card ${method === 'delivery' ? 'is-selected' : ''}`}><input type="radio" name="method" value="delivery" checked={method === 'delivery'} onChange={() => setMethod('delivery')} /><strong>Home delivery</strong><span>Bihar only, selected areas</span></label>
        <label className={`method-card ${method === 'pickup' ? 'is-selected' : ''}`}><input type="radio" name="method" value="pickup" checked={method === 'pickup'} onChange={() => setMethod('pickup')} /><strong>Order online, collect from shop</strong><span>We confirm the pickup point by phone</span></label>
      </fieldset>
      <label htmlFor="co-name">Your name</label>
      <input id="co-name" name="name" required minLength={2} maxLength={80} autoComplete="name" />
      <label htmlFor="co-phone">Mobile number (we will call to confirm)</label>
      <input id="co-phone" name="phone" type="tel" inputMode="numeric" required pattern="[6-9][0-9]{9}" maxLength={10} autoComplete="tel-national" placeholder="10-digit mobile number" />
      <label htmlFor="co-district">District (Bihar)</label>
      <select id="co-district" name="district" required defaultValue=""><option value="" disabled>Choose district</option>{biharDistricts.map((name) => <option key={name} value={name}>{name}</option>)}</select>
      <label htmlFor="co-pin">Pincode{method === 'pickup' ? ' (optional)' : ''}</label>
      <input id="co-pin" name="pincode" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required={method === 'delivery'} autoComplete="postal-code" />
      <label htmlFor="co-address">{method === 'delivery' ? 'Full delivery address' : 'Your area / preferred pickup area (optional)'}</label>
      <textarea id="co-address" name="address" rows={3} maxLength={300} required={method === 'delivery'} autoComplete="street-address" />
      <label htmlFor="co-landmark">Landmark (optional)</label>
      <input id="co-landmark" name="landmark" maxLength={120} />
      <div className="location-row">
        <button type="button" className="btn secondary" onClick={shareLocation}>Use my current location</button>
        <span className="notice" role="status">{locationMessage || 'Optional. Only used to find your address for this order.'}</span>
      </div>
      <label htmlFor="co-notes">Note for Rasvani (optional)</label>
      <textarea id="co-notes" name="notes" rows={2} maxLength={400} />
      <fieldset className="checkout-methods"><legend>Payment</legend>
        <label className="method-card"><input type="radio" name="payment" value="cod" defaultChecked /><strong>Cash on delivery / pay at collection</strong><span>Pay when the food reaches you or when you collect it</span></label>
        <label className="method-card"><input type="radio" name="payment" value="upi" /><strong>Pay by UPI QR</strong><span>After you order, a QR with your exact amount appears in My orders</span></label>
      </fieldset>
      {state.error && <p className="status" role="alert">{state.error}</p>}
      <button className="btn" type="submit" disabled={pending}>{pending ? 'Placing your order…' : 'Place order'}</button>
      <p className="notice">No payment is taken on this page. Rasvani calls you to confirm the order, any delivery charge, and delivery or pickup. Delivery charge, if any, is added by Rasvani before you pay.</p>
    </form>
    <aside className="cart-summary"><h2>Your order</h2>
      <ul className="cart-summary-lines">{lines.map((line) => <li key={line.productId}><span>{line.name} × {line.qty}</span><strong>{formatPaise(line.unitPaise * line.qty)}</strong></li>)}</ul>
      <div className="cart-summary-row"><span>Subtotal</span><strong>{formatPaise(subtotalPaise)}</strong></div>
      <p className="notice">Final prices are re-checked on the server when you place the order.</p>
      <Link href="/cart" className="text-link">← Edit cart</Link>
    </aside>
  </div>;
}
