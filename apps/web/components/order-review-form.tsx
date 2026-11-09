'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { submitReviewAction } from '@/app/actions/session';

type Line = { productId: string; name: string };
type Mine = Record<string, { rating: number; comment: string }>;

/** After delivery: star rating and an optional comment for each food in the order. Can be edited later. */
export function OrderReviewForm({ lines, mine, onSaved }: { lines: Line[]; mine: Mine; onSaved: () => void }) {
  const { getToken } = useAuth();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');
  const seen = new Set<string>();
  const unique = lines.filter((line) => (seen.has(line.productId) ? false : (seen.add(line.productId), true)));
  async function save(productId: string, form: HTMLFormElement) {
    const data = new FormData(form);
    setBusy(productId); setMessage('');
    try {
      const result = await submitReviewAction(await getToken(), productId, { rating: Number(data.get('rating')), comment: String(data.get('comment') ?? '') });
      setMessage(result.ok ? 'Thank you! Your review is saved.' : result.error);
      if (result.ok) onSaved();
    } catch { setMessage('Something went wrong. Please try again.'); }
    setBusy('');
  }
  return <details className="customer-order-cancel order-review"><summary>Rate &amp; review this order</summary>
    {unique.map((line) => {
      const old = mine[line.productId];
      return <form key={`${line.productId}-${old?.rating ?? 0}-${old?.comment ?? ''}`} onSubmit={(event) => { event.preventDefault(); void save(line.productId, event.currentTarget); }}>
        <strong>{line.name.replace(/ \([^)]*\)$/, '')}</strong>
        <label>Your rating<select name="rating" required defaultValue={old ? String(old.rating) : ''}><option value="" disabled>Choose stars</option>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)}{'☆'.repeat(5 - n)} ({n})</option>)}</select></label>
        <label>Comment (optional)<textarea name="comment" maxLength={500} rows={3} defaultValue={old?.comment ?? ''} placeholder="How was the taste and packing?" /></label>
        <button className="btn secondary" type="submit" disabled={busy === line.productId}>{old ? 'Update review' : 'Submit review'}</button>
      </form>;
    })}
    {message && <p className="status" role="status">{message}</p>}
  </details>;
}
