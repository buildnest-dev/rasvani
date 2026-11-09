'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type CartLine = { productId: string; sizeId?: string; sizeLabel?: string; slug: string; name: string; unitPaise: number; mrpPaise?: number; qty: number };
/** One cart line per product AND pack size (250 g and 500 g of the same food are separate lines). */
export const lineKey = (line: { productId: string; sizeId?: string }) => `${line.productId}:${line.sizeId ?? ''}`;
type CartValue = {
  lines: CartLine[];
  ready: boolean;
  count: number;
  subtotalPaise: number;
  add: (line: Omit<CartLine, 'qty'>, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const KEY = 'rasvani-cart-v1';
export const MAX_QTY = 20;
const CartContext = createContext<CartValue | null>(null);
const clampQty = (qty: number) => Math.max(1, Math.min(MAX_QTY, Math.floor(Number.isFinite(qty) ? qty : 1)));
const uuid = /^[A-Za-z0-9]{10,40}$/;
const sizeIdPattern = /^[a-z]{1,3}[0-9]{1,4}$/;

function sanitise(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  const out: CartLine[] = [];
  for (const item of raw.slice(0, 50)) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    if (typeof row.productId !== 'string' || !uuid.test(row.productId)) continue;
    const sizeId = typeof row.sizeId === 'string' && sizeIdPattern.test(row.sizeId) ? row.sizeId : undefined;
    if (out.some((line) => lineKey(line) === `${row.productId}:${sizeId ?? ''}`)) continue;
    out.push({
      productId: row.productId,
      ...(sizeId ? { sizeId, sizeLabel: typeof row.sizeLabel === 'string' ? row.sizeLabel.slice(0, 12) : '' } : {}),
      slug: typeof row.slug === 'string' ? row.slug.slice(0, 160) : '',
      name: typeof row.name === 'string' ? row.name.slice(0, 180) : 'Product',
      unitPaise: Number.isInteger(row.unitPaise) && (row.unitPaise as number) >= 0 ? (row.unitPaise as number) : 0,
      ...(Number.isInteger(row.mrpPaise) && (row.mrpPaise as number) > 0 ? { mrpPaise: row.mrpPaise as number } : {}),
      qty: clampQty(Number(row.qty)),
    });
  }
  return out;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { setLines(sanitise(JSON.parse(window.localStorage.getItem(KEY) ?? '[]'))); } catch { /* storage unavailable */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* storage unavailable */ }
  }, [lines, ready]);

  const add = useCallback((line: Omit<CartLine, 'qty'>, qty = 1) => {
    setLines((current) => {
      const existing = current.find((item) => lineKey(item) === lineKey(line));
      if (existing) return current.map((item) => lineKey(item) === lineKey(line) ? { ...item, ...line, qty: clampQty(item.qty + qty) } : item);
      return [...current, { ...line, qty: clampQty(qty) }].slice(0, 50);
    });
  }, []);
  const setQty = useCallback((key: string, qty: number) => setLines((current) => current.map((item) => lineKey(item) === key ? { ...item, qty: clampQty(qty) } : item)), []);
  const remove = useCallback((key: string) => setLines((current) => current.filter((item) => lineKey(item) !== key)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartValue>(() => ({
    lines, ready, add, setQty, remove, clear,
    count: lines.reduce((sum, line) => sum + line.qty, 0),
    subtotalPaise: lines.reduce((sum, line) => sum + line.qty * line.unitPaise, 0),
  }), [lines, ready, add, setQty, remove, clear]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside CartProvider');
  return value;
}
