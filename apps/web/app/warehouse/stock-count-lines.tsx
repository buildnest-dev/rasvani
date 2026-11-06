'use client';

import { useMemo, useState } from 'react';
import {
  recordPhysicalStockCountLine,
  recordStockCountVarianceInvestigation,
} from './actions';

type StockCountLineRow = {
  batch_id: string;
  product_name: string;
  sku: string;
  batch_code: string;
  bin_code: string | null;
  expected_quantity: number;
  counted_quantity: number | null;
  unit: string;
  count_notes: string | null;
  line_counted_at: string | null;
  variance_percent: number | null;
  escalation_level: string;
  review_finding: string | null;
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  current_quantity: number | null;
  current_stock_status: string | null;
  current_inspection_status: string | null;
  is_stale: boolean;
  stale_reasons: string[];
};

type LineFilter = 'all' | 'uncounted' | 'variance' | 'stale' | 'matched';

function csvCell(value: string | number | null | undefined): string {
  const raw = value === null || value === undefined ? '' : String(value);
  const safe = /^[\s]*[=+@\-]/.test(raw) ? `'${raw}` : raw;
  return `\"${safe.replaceAll('\"', '\"\"')}\"`;
}

const filters: { value: LineFilter; label: string }[] = [
  { value: 'all', label: 'All lines' },
  { value: 'uncounted', label: 'Not counted' },
  { value: 'variance', label: 'Variance' },
  { value: 'stale', label: 'Stale snapshot' },
  { value: 'matched', label: 'Matched' },
];

function pretty(value: string | null | undefined): string {
  return (value ?? '—').replaceAll('_', ' ');
}

function dateTime(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString('en-IN') : 'Not recorded';
}

const staleReasonLabels: Record<string, string> = {
  batch_unavailable: 'batch no longer available',
  quantity_changed: 'on-hand quantity changed',
  batch_disposed: 'batch disposed',
  other_stock_attributes_changed: 'other stock attributes changed',
};

export function StockCountLines({
  lines,
  stockCountId,
  status,
  canReceive,
  canReview,
}: {
  lines: StockCountLineRow[];
  stockCountId: string;
  status: string;
  canReceive: boolean;
  canReview: boolean;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<LineFilter>('all');
  const counts = useMemo(() => ({
    all: lines.length,
    uncounted: lines.filter((line) => line.counted_quantity === null).length,
    variance: lines.filter((line) => line.counted_quantity !== null && line.counted_quantity !== line.expected_quantity).length,
    stale: lines.filter((line) => line.is_stale).length,
    matched: lines.filter((line) => line.counted_quantity !== null && line.counted_quantity === line.expected_quantity && !line.is_stale).length,
  }), [lines]);
  const visibleLines = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return lines.filter((line) => {
      const matchesSearch = !needle || [line.product_name, line.sku, line.batch_code, line.bin_code ?? '']
        .some((value) => value.toLocaleLowerCase().includes(needle));
      const matchesFilter = filter === 'all' ||
        (filter === 'uncounted' && line.counted_quantity === null) ||
        (filter === 'variance' && line.counted_quantity !== null && line.counted_quantity !== line.expected_quantity) ||
        (filter === 'stale' && line.is_stale) ||
        (filter === 'matched' && line.counted_quantity !== null && line.counted_quantity === line.expected_quantity && !line.is_stale);
      return matchesSearch && matchesFilter;
    });
  }, [filter, lines, query]);

  function exportVisibleLines() {
    const headers = ['Product', 'SKU', 'Batch', 'Bin', 'Snapshot quantity', 'Physical quantity', 'Variance', 'Unit', 'Count status', 'Stale', 'Stale reasons', 'Current quantity', 'Current stock status', 'Current inspection status', 'Escalation', 'Count note', 'Investigation finding', 'Investigation note', 'Counted at'];
    const records = visibleLines.map((line) => [
      line.product_name, line.sku, line.batch_code, line.bin_code, line.expected_quantity,
      line.counted_quantity, line.counted_quantity === null ? null : Number((line.counted_quantity - line.expected_quantity).toFixed(3)),
      line.unit, line.counted_quantity === null ? 'not_counted' : 'counted', line.is_stale ? 'yes' : 'no',
      line.stale_reasons.join('; '), line.current_quantity, line.current_stock_status,
      line.current_inspection_status, line.escalation_level, line.count_notes,
      line.review_finding, line.review_note, line.line_counted_at,
    ]);
    const csv = '\uFEFF' + [headers, ...records].map((record) => record.map(csvCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `rasvani-stock-count-${stockCountId}-${filter}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return <>
    <div className="warehouse-stock-count-tools">
      <label className="warehouse-stock-count-search">Find product, SKU, batch or bin
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this count…" />
      </label>
      <div className="warehouse-stock-count-filters" role="group" aria-label="Filter stock-count lines">
        {filters.map((item) => <button
          type="button"
          key={item.value}
          className={`warehouse-stock-count-filter${filter === item.value ? ' is-active' : ''}`}
          aria-pressed={filter === item.value}
          onClick={() => setFilter(item.value)}
        >{item.label}<span>{counts[item.value]}</span></button>)}
      </div>
      <div className="warehouse-stock-count-export-row"><p className="warehouse-stock-count-result" aria-live="polite">Showing {visibleLines.length} of {lines.length} batch lines · export includes the current search and filter</p><button type="button" className="btn secondary" onClick={exportVisibleLines} disabled={visibleLines.length === 0}>Export visible lines (CSV)</button></div>
    </div>
    {visibleLines.length === 0 ? <p className="notice">No batch lines match this search and filter. Choose another filter or clear the search.</p> : <div className="warehouse-stock-count-lines">{visibleLines.map((line) => <article className="warehouse-stock-count-line" key={line.batch_id}>
      <div>
        <strong>{line.product_name}</strong>
        <small>{line.sku} · {line.batch_code} · Bin {line.bin_code ?? '—'}</small>
        <small>System snapshot: {line.expected_quantity} {line.unit}{line.counted_quantity !== null ? ` · Physical: ${line.counted_quantity} ${line.unit}` : ' · Not counted'}</small>
        {line.is_stale && <small className="warehouse-variance warehouse-variance-critical">Snapshot changed: {line.stale_reasons.map((reason) => staleReasonLabels[reason] ?? pretty(reason)).join('; ')}. Current quantity: {line.current_quantity ?? 'unavailable'} {line.unit}; stock status: {pretty(line.current_stock_status)}; inspection: {pretty(line.current_inspection_status)}.</small>}
        {line.counted_quantity !== null && line.counted_quantity !== line.expected_quantity && <small className={`warehouse-variance warehouse-variance-${line.escalation_level}`}>Variance {line.variance_percent === null ? 'not ratio-scored (zero snapshot)' : `${line.variance_percent}%`} · {pretty(line.escalation_level)}</small>}
        {line.count_notes && <small>Count note: {line.count_notes}</small>}
      </div>
      {status === 'counting' && canReceive && <form action={recordPhysicalStockCountLine} className="warehouse-stock-count-entry">
        <input type="hidden" name="stock_count_id" value={stockCountId}/>
        <input type="hidden" name="batch_id" value={line.batch_id}/>
        <label>Physical quantity<input name="counted_quantity" type="number" min="0" max="99999999999.999" step="0.001" required defaultValue={line.counted_quantity ?? ''}/></label>
        <label>Count note<input name="count_notes" maxLength={500} defaultValue={line.count_notes ?? ''} placeholder="Optional discrepancy note"/></label>
        <button className="btn secondary" type="submit">Save count</button>
      </form>}
      {status === 'submitted' && canReview && line.counted_quantity !== null && line.counted_quantity !== line.expected_quantity && <div className="warehouse-stock-count-investigation">
        {line.review_finding ? <p className="notice">Investigation: {pretty(line.review_finding)} · {line.review_note} {line.reviewed_at ? `· ${dateTime(line.reviewed_at)}` : ''}</p> : <form action={recordStockCountVarianceInvestigation} className="warehouse-stock-count-entry">
          <input type="hidden" name="stock_count_id" value={stockCountId}/>
          <input type="hidden" name="batch_id" value={line.batch_id}/>
          <label>Investigation finding<select name="finding" required defaultValue=""><option value="" disabled>Select finding</option><option value="physical_recount">Physical recount completed</option><option value="receiving_records_checked">Receiving records checked</option><option value="movement_history_checked">Movement history checked</option><option value="other">Other investigation</option></select></label>
          <label>Investigation note<textarea name="note" minLength={5} maxLength={1000} required placeholder="Record what was checked and the outcome"/></label>
          <button className="btn secondary" type="submit">Save investigation</button>
        </form>}
      </div>}
    </article>)}</div>}
  </>;
}
