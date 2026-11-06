'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type CartLine = { productId: string; slug: string; name: string; unitPaise: number; qty: number };
type CartValue = {
  lines: CartLine[];
  ready: boolean;
  count: number;
  subtotalPaise: number;
  add: (line: Omit<CartLine, 'qty'>, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const KEY = 'rasvani-cart-v1';
export const MAX_QTY = 20;
const CartContext = createContext<CartValue | null>(null);
const clampQty = (qty: number) => Math.max(1, Math.min(MAX_QTY, Math.floor(Number.isFinite(qty) ? qty : 1)));
const uuid = /^[A-Za-z0-9]{10,40}$/;

function sanitise(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  const out: CartLine[] = [];
  for (const item of raw.slice(0, 50)) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    if (typeof row.productId !== 'string' || !uuid.test(row.productId)) continue;
    if (out.some((line) => line.productId === row.productId)) continue;
    out.push({
      productId: row.productId,
      slug: typeof row.slug === 'string' ? row.slug.slice(0, 160) : '',
      name: typeof row.name === 'string' ? row.name.slice(0, 180) : 'Product',
      unitPaise: Number.isInteger(row.unitPaise) && (row.unitPaise as number) >= 0 ? (row.unitPaise as number) : 0,
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
      const existing = current.find((item) => item.productId === line.productId);
      if (existing) return current.map((item) => item.productId === line.productId ? { ...item, ...line, qty: clampQty(item.qty + qty) } : item);
      return [...current, { ...line, qty: clampQty(qty) }].slice(0, 50);
    });
  }, []);
  const setQty = useCallback((productId: string, qty: number) => setLines((current) => current.map((item) => item.productId === productId ? { ...item, qty: clampQty(qty) } : item)), []);
  const remove = useCallback((productId: string) => setLines((current) => current.filter((item) => item.productId !== productId)), []);
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
