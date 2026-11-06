import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { AuthForm } from '@/app/account/auth-form';
import { CheckoutForm } from './checkout-form';

export const metadata: Metadata = { title: 'Checkout' };

export default async function CheckoutPage() {
  let signedIn = false;
  let configured = true;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    signedIn = Boolean(data.user);
  } catch { configured = false; }
  return <section className="wrap cart-page">
    <div className="page-hero"><div className="eyebrow">Checkout</div><h1>Place your order</h1><p className="section-intro">Home delivery in selected areas of Bihar, or order online and collect from a Rasvani partner shop.</p></div>
    {!configured ? <p className="status" role="status">Ordering is being set up. Please check back shortly.</p> : signedIn ? <CheckoutForm /> : <><p className="status" role="status">Please sign in or create an account first, so you can track your order under My orders.</p><AuthForm next="/checkout" /></>}
  </section>;
}
