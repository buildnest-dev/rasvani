'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { supportedLocales, useLocale } from '@/components/locale-provider';
import { LocalizedCopy } from '@/components/localized-copy';
import { useCart } from '@/components/cart-provider';
import { useAuth } from '@/components/auth-provider';

type MenuItemTarget = HTMLElement;
function applyMenuTilt(event: ReactPointerEvent<MenuItemTarget>) {
  const element = event.currentTarget;
  if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const bounds = element.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
  const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
  element.style.setProperty('--menu-tilt-x', `${((0.5 - y) * 4).toFixed(2)}deg`);
  element.style.setProperty('--menu-tilt-y', `${((x - 0.5) * 5).toFixed(2)}deg`);
  element.style.setProperty('--menu-glow-x', `${(x * 100).toFixed(1)}%`);
  element.style.setProperty('--menu-glow-y', `${(y * 100).toFixed(1)}%`);
}
function resetMenuTilt(event: ReactPointerEvent<MenuItemTarget>) {
  event.currentTarget.style.removeProperty('--menu-tilt-x');
  event.currentTarget.style.removeProperty('--menu-tilt-y');
  event.currentTarget.style.removeProperty('--menu-glow-x');
  event.currentTarget.style.removeProperty('--menu-glow-y');
}
function menuItemStyle(index: number): CSSProperties { return { '--menu-index': index } as CSSProperties; }

const adminTabs = [['orders', 'Orders'], ['products', 'Foods & prices'], ['bakers', 'Bakers & restaurants'], ['payment', 'Payment QR']] as const;

/** A focused header for the admin / baker consoles: no shopping links, just the console and its sections. */
function StaffHeader({ kind }: { kind: 'admin' | 'baker' }) {
  const { user, signOut } = useAuth();
  const [state, setState] = useState<{ tab: string; newCount: number; requests: number }>({ tab: 'orders', newCount: 0, requests: 0 });
  useEffect(() => {
    document.body.classList.add('staff-mode');
    const onState = (event: Event) => setState((event as CustomEvent).detail);
    window.addEventListener('staff:state', onState);
    return () => { document.body.classList.remove('staff-mode'); window.removeEventListener('staff:state', onState); };
  }, []);
  const go = (tab: string) => window.dispatchEvent(new CustomEvent('staff:tab', { detail: tab }));
  const badge = (tab: string) => tab === 'orders' ? state.newCount + state.requests : 0;
  return <header className="header staff-header"><div className="wrap staff-row">
    <Link href="/" className="staff-brand" aria-label="Rasvani home"><Image className="brand-logo" src="/images/rasvani-mark.png" alt="" width={40} height={38} priority /><span>Rasvani</span></Link>
    <span className="staff-pill">{kind === 'admin' ? 'Admin console' : 'Baker console'}</span>
    {kind === 'admin' && <nav className="staff-nav" aria-label="Admin sections">{adminTabs.map(([key, label]) => <button key={key} type="button" className={state.tab === key ? 'is-on' : ''} aria-current={state.tab === key ? 'page' : undefined} onClick={() => go(key)}>{label}{badge(key) > 0 && <b>{badge(key)}</b>}</button>)}</nav>}
    <div className="staff-right">
      <Link className="staff-link" href="/shop">View shop ↗</Link>
      {user && <span className="staff-user" title={user.email ?? ''}>{(user.email ?? '?')[0]?.toUpperCase()}</span>}
      {user && <button className="staff-out" type="button" onClick={() => void signOut()}>Sign out</button>}
    </div>
  </div></header>;
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { locale, setLocale, t, translate } = useLocale();
  const { count: cartCount } = useCart();
  // Brand-led navigation names: readable across India's regional food audience.
  const links = [
    [translate('Home of Flavours'), '/'],
    ['Bihar', '/bihar'],
    [translate('India, Unfolded'), '/india-map'],
    [translate('Flavour Trails'), '/explore-india'],
    [translate('The Pantry'), '/shop'],
    [translate('Food Stories'), '/food-stories'],
    [translate('Meet the Makers'), '/for-producers'],
  ] as const;
  const staffKind = pathname === '/admin' || pathname.startsWith('/admin/') ? 'admin' : pathname === '/baker' || pathname.startsWith('/baker/') ? 'baker' : null;
  const isCurrent = (href: string) => href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
  const motionHandlers = { onPointerMove: applyMenuTilt, onPointerLeave: resetMenuTilt };
  if (staffKind) return <StaffHeader kind={staffKind} />;
  return <LocalizedCopy><header className="header header-premium">
    <div className="wrap headrow">
      <Link href="/" className="brand brand-premium" aria-label="Rasvani home">
        <Image className="brand-logo" src="/images/rasvani-mark.png" alt="" width={50} height={47} priority /><span>Rasvani<span className="tag">India, Served by Region.</span></span>
      </Link>
      <span className="veg-badge" role="img" aria-label="100% pure vegetarian"><i className="veg-mark" aria-hidden="true" /><b>100% Veg</b></span>
      <nav className="nav nav-premium" aria-label="Main navigation">
        {links.map(([label, href], index) => <Link key={href} href={href} aria-current={isCurrent(href) ? 'page' : undefined} aria-label={`${label}${isCurrent(href) ? ', current section' : ''}`} title={label} className={`menu-item-3d ${isCurrent(href) ? 'is-current' : ''}`} style={menuItemStyle(index)} {...motionHandlers}><span>{label}</span>{isCurrent(href) && <span className="nav-current-note" aria-hidden="true">YOU ARE HERE</span>}</Link>)}
      </nav>
      <div className="actions header-actions">
        <label className="hx-lang"><span className="sr-only">Choose language</span><svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.6 2.7 3.9 5.7 3.9 9s-1.3 6.3-3.9 9c-2.6-2.7-3.9-5.7-3.9-9S9.4 5.7 12 3z" /></svg><select aria-label="Choose language" value={locale} onChange={(event) => setLocale(event.target.value as typeof locale)}>{supportedLocales.map((item) => <option key={item.code} value={item.code}>{item.native}</option>)}</select></label>
        <Link className="hx-btn cart-link" href="/cart" aria-label={`Cart, ${cartCount} items`}><span className="hx-ico"><svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8h12l-1 12H7L6 8z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>{cartCount > 0 && <span className="hx-badge">{cartCount > 99 ? '99+' : cartCount}</span>}</span><span className="hx-label">Cart</span></Link>
        <Link className="hx-btn orders-link" href="/account/orders"><span className="hx-ico"><svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" /><path d="M9 8h6M9 12h6" /></svg></span><span className="hx-label">My orders</span></Link>
        <Link className="hx-btn hx-primary" href="/account"><span className="hx-ico"><svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.2 3.6-7 8-7s8 2.8 8 7" /></svg></span><span className="hx-label">{t('account')}</span></Link>
        <button className="iconbtn menu-button menu-item-3d" type="button" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} style={menuItemStyle(links.length + 1)} {...motionHandlers} onClick={() => setMenuOpen((value) => !value)}>☰</button>
      </div>
    </div>
    {menuOpen && <nav className="wrap mobile-nav-links" aria-label="Mobile navigation">
      {links.map(([label, href], index) => <Link key={href} href={href} aria-current={isCurrent(href) ? 'page' : undefined} className={`menu-item-3d ${isCurrent(href) ? 'is-current' : ''}`} style={menuItemStyle(index)} onClick={() => setMenuOpen(false)} {...motionHandlers}><span>{label}</span>{isCurrent(href) && <span className="nav-current-note">YOU ARE HERE</span>}</Link>)}
      <Link href="/cart" onClick={() => setMenuOpen(false)}>Cart{cartCount > 0 ? ` (${cartCount})` : ''}</Link>
      <Link href="/account/orders" onClick={() => setMenuOpen(false)}>My orders</Link>
      <Link href="/account" onClick={() => setMenuOpen(false)}>{t('account')}</Link>
    </nav>}
  </header></LocalizedCopy>;
}
