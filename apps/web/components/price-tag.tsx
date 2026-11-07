import { formatPaise } from '@/lib/money';

/** Selling price, and (when set) the crossed-out MRP with the percentage saved. */
export function PriceTag({ pricePaise, mrpPaise }: { pricePaise: number; mrpPaise?: number | null }) {
  const off = mrpPaise && mrpPaise > pricePaise ? Math.round(((mrpPaise - pricePaise) / mrpPaise) * 100) : 0;
  return <span className="price-tag"><strong>{formatPaise(pricePaise)}</strong>{off > 0 && <><s>{formatPaise(mrpPaise as number)}</s><em>{off}% OFF</em></>}</span>;
}
