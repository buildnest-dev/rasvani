export const ORDER_STATUSES = ['placed', 'confirmed', 'accepted', 'preparing', 'ready', 'dispatched', 'delivered', 'cancelled'] as const;
export const FINAL_STATUSES = ['delivered', 'cancelled'] as const;
export const PAYMENTS = ['pending', 'paid', 'failed', 'refunded'] as const;

export type OrderLine = { productId: string; name: string; qty: number; unitPaise: number; linePaise: number };
export type OrderDoc = {
  id: string; orderNumber: string; userId: string; customerEmail: string; status: string; paymentStatus: string;
  lines: OrderLine[]; totalPaise: number; bakerId: string | null; bakerName: string | null; notes: string | null; createdAt: string;
  address: {
    fulfilment: 'delivery' | 'pickup'; name: string; phone: string; district: string; pincode: string | null;
    address: string | null; landmark: string | null; location: { lat: number; lng: number } | null; paymentPreference: string;
  };
};
export const statusLabel = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
export const statusNote: Record<string, string> = {
  placed: 'We have your order. Rasvani will call you to confirm.',
  confirmed: 'Confirmed by Rasvani.',
  accepted: 'The baker has accepted your order.',
  preparing: 'Being prepared fresh.',
  ready: 'Ready for pickup or dispatch.',
  dispatched: 'On the way.',
  delivered: 'Delivered. Thank you!',
  cancelled: 'This order was cancelled.',
};
