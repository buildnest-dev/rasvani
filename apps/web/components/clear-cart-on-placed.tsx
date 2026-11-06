'use client';

import { useEffect } from 'react';
import { useCart } from '@/components/cart-provider';

export function ClearCartOnPlaced() {
  const { clear, ready } = useCart();
  useEffect(() => { if (ready) clear(); }, [ready, clear]);
  return null;
}
