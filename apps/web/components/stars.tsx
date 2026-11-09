/** Read-only star rating, e.g. 4.3 with the number of reviews. Renders nothing when there are no reviews yet. */
export function Stars({ sum, count, showCount = true }: { sum?: number | null; count?: number | null; showCount?: boolean }) {
  const n = Number(count) || 0;
  if (n <= 0) return null;
  const avg = Math.min(5, Math.max(0, (Number(sum) || 0) / n));
  const full = Math.round(avg);
  return <span className="stars" role="img" aria-label={`Rated ${avg.toFixed(1)} out of 5 by ${n} customer${n === 1 ? '' : 's'}`}>
    <span className="stars-row" aria-hidden="true">{[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= full ? 'on' : ''}>★</i>)}</span>
    <b>{avg.toFixed(1)}</b>{showCount && <small>({n})</small>}
  </span>;
}
