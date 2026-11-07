export const ORDER_STATUSES = ['placed', 'confirmed', 'accepted', 'preparing', 'ready', 'dispatched', 'delivered', 'cancelled'] as const;
export const FINAL_STATUSES = ['delivered', 'cancelled'] as const;
export const PAYMENTS = ['pending', 'paid', 'failed', 'refunded'] as const;

export type OrderLine = { productId: string; name: string; qty: number; unitPaise: number; linePaise: number; makerName?: string | null };
export type OrderTicket = {
  type: 'cancel' | 'refund'; reason: string; details?: string | null; status: 'open' | 'approved' | 'rejected';
  requestedAt: string; resolvedAt?: string | null; adminNote?: string | null;
};
export const CANCEL_REASONS = ['I changed my mind', 'I ordered by mistake', 'Wrong item or quantity', 'Delivery is taking too long', 'Wrong address or phone number', 'Payment problem', 'Other'] as const;
export const REFUND_REASONS = ['Item damaged or spoiled', 'Wrong item received', 'Quality is not as expected', 'Order not received', 'Other'] as const;
/** Before dispatch an order can be cancelled (by request). From dispatch on, only a refund can be requested. */
export const ticketTypeFor = (status: string): 'cancel' | 'refund' | null =>
  ['placed', 'confirmed', 'accepted', 'preparing', 'ready'].includes(status) ? 'cancel' : ['dispatched', 'delivered'].includes(status) ? 'refund' : null;
export type OrderDoc = {
  id: string; orderNumber: string; userId: string; customerEmail: string; status: string; paymentStatus: string;
  lines: OrderLine[]; totalPaise: number; bakerId: string | null; bakerName: string | null; notes: string | null; createdAt: string;
  paymentMethod?: 'cod' | 'upi'; paymentRef?: string | null; deliveryFeePaise?: number | null;
  customerNote?: string | null; deliveryTime?: string | null; ticket?: OrderTicket | null; bakerProfileId?: string | null;
  address: {
    fulfilment: 'delivery' | 'pickup'; name: string; phone: string; district: string; pincode: string | null;
    address: string | null; landmark: string | null; location: { lat: number; lng: number } | null; paymentPreference: string;
  };
};
export type BakerProfile = {
  id: string; name: string; phone: string; address: string; district: string; mapsLink: string | null; notes: string | null; active: boolean;
};
export type PaymentSettings = { upiId: string; payeeName: string };

export const payablePaise = (order: Pick<OrderDoc, 'totalPaise' | 'deliveryFeePaise'>) => order.totalPaise + (order.deliveryFeePaise ?? 0);
export const statusLabel = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
export const statusNote: Record<string, string> = {
  placed: 'We have your order. Rasvani will call you to confirm.',
  confirmed: 'Confirmed by Rasvani.',
  accepted: 'Your order is confirmed with the kitchen.',
  preparing: 'Being prepared fresh.',
  ready: 'Ready for pickup or dispatch.',
  dispatched: 'On the way.',
  delivered: 'Delivered. Thank you!',
  cancelled: 'This order was cancelled.',
};

/** Customer-facing progress steps. Pickup orders skip the "on the way" step. */
export function progressSteps(fulfilment: 'delivery' | 'pickup'): { key: string; label: string; statuses: string[] }[] {
  return [
    { key: 'placed', label: 'Order placed', statuses: ['placed'] },
    { key: 'confirmed', label: 'Confirmed', statuses: ['confirmed', 'accepted'] },
    { key: 'preparing', label: 'Preparing', statuses: ['preparing'] },
    { key: 'ready', label: fulfilment === 'pickup' ? 'Ready to collect' : 'Ready', statuses: ['ready'] },
    ...(fulfilment === 'delivery' ? [{ key: 'dispatched', label: 'On the way', statuses: ['dispatched'] }] : []),
    { key: 'delivered', label: fulfilment === 'pickup' ? 'Collected' : 'Delivered', statuses: ['delivered'] },
  ];
}
export const upiLink = (settings: PaymentSettings, amountPaise: number, orderNumber: string) =>
  `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(settings.payeeName)}&am=${(amountPaise / 100).toFixed(2)}&cu=INR&tn=${encodeURIComponent(orderNumber)}`;
