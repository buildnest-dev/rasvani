/** Common pack sizes the admin can offer for one food. The customer picks one size; no second product is needed. */
export const COMMON_SIZES = [
  { id: 'g50', label: '50 g' }, { id: 'g100', label: '100 g' }, { id: 'g150', label: '150 g' }, { id: 'g200', label: '200 g' },
  { id: 'g250', label: '250 g' }, { id: 'g300', label: '300 g' }, { id: 'g400', label: '400 g' }, { id: 'g500', label: '500 g' },
  { id: 'g750', label: '750 g' }, { id: 'kg1', label: '1 kg' }, { id: 'kg2', label: '2 kg' }, { id: 'kg5', label: '5 kg' },
] as const;

export type SizeId = (typeof COMMON_SIZES)[number]['id'];
export type PackSize = { id: SizeId; label: string; pricePaise: number; mrpPaise: number | null };

const labelOf = new Map<string, string>(COMMON_SIZES.map((size) => [size.id, size.label]));
export const isSizeId = (value: unknown): value is SizeId => typeof value === 'string' && labelOf.has(value);
export const sizeLabel = (id: string) => labelOf.get(id) ?? '';

/** MRP only counts when it is higher than the selling price. */
export const validMrp = (pricePaise: number, mrpPaise?: number | null) => (mrpPaise && mrpPaise > pricePaise ? mrpPaise : null);
export const discountPercent = (pricePaise: number, mrpPaise?: number | null) => {
  const mrp = validMrp(pricePaise, mrpPaise);
  return mrp ? Math.round(((mrp - pricePaise) / mrp) * 100) : 0;
};

type Priced = { pricePaise: number; mrpPaise?: number | null; sizes?: PackSize[] | null };
/** The size a visitor sees first: the smallest pack. */
export const defaultSize = (product: Priced): PackSize | null => product.sizes?.[0] ?? null;
/** Price for an exact choice. Returns null when the size is not offered (the server uses this to reject tampered carts). */
export function priceFor(product: Priced, sizeId?: string | null): { pricePaise: number; mrpPaise: number | null; label: string } | null {
  if (product.sizes && product.sizes.length > 0) {
    const size = product.sizes.find((item) => item.id === sizeId);
    return size ? { pricePaise: size.pricePaise, mrpPaise: validMrp(size.pricePaise, size.mrpPaise), label: size.label } : null;
  }
  if (sizeId) return null;
  return { pricePaise: product.pricePaise, mrpPaise: validMrp(product.pricePaise, product.mrpPaise), label: '' };
}
