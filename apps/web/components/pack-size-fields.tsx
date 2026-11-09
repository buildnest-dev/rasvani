'use client';

import { COMMON_SIZES, type PackSize } from '@/lib/pack-sizes';

/** Admin: leave a size blank to not offer it. Fill a price (and an optional MRP) for every pack size you sell. */
export function PackSizeFields({ sizes }: { sizes?: PackSize[] | null }) {
  return <fieldset className="size-fields"><legend>Pack sizes (optional). Fill the price for each size you sell; leave the others empty.</legend>
    <div className="size-fields-grid">{COMMON_SIZES.map((size) => {
      const current = sizes?.find((item) => item.id === size.id);
      return <div key={size.id} className="size-fields-row"><b>{size.label}</b>
        <label>Price ₹<input name={`sz_${size.id}_price`} type="number" step="0.01" min="1" max="100000" defaultValue={current ? current.pricePaise / 100 : ''} /></label>
        <label>MRP ₹<input name={`sz_${size.id}_mrp`} type="number" step="0.01" min="0" max="100000" defaultValue={current?.mrpPaise ? current.mrpPaise / 100 : ''} /></label></div>;
    })}</div></fieldset>;
}

/** Reads the filled rows from the form. */
export function readSizes(data: FormData): { id: string; priceRupees: number; mrpRupees?: number }[] {
  const rows: { id: string; priceRupees: number; mrpRupees?: number }[] = [];
  for (const size of COMMON_SIZES) {
    const price = Number(data.get(`sz_${size.id}_price`) || 0);
    if (!price) continue;
    const mrp = Number(data.get(`sz_${size.id}_mrp`) || 0);
    rows.push({ id: size.id, priceRupees: price, ...(mrp ? { mrpRupees: mrp } : {}) });
  }
  return rows;
}
