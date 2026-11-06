import type { Metadata } from 'next';
import { requireAnyRole } from '@/lib/auth/authorization';
import { createClient } from '@/lib/supabase/server';
import { reviewBusinessAccount } from './actions';

export const metadata: Metadata = { title: 'Operations dashboard' };

const adminRoles = ['admin', 'super_admin'] as const;
const warehouseRoles = ['warehouse_operator', 'quality_reviewer', 'admin', 'super_admin'] as const;
const editorialRoles = ['content_editor', 'quality_reviewer', 'admin', 'super_admin'] as const;

type CountItem = { label: string; key: string };
const queues: CountItem[] = [
  { label: 'Producer applications', key: 'producer_applications_pending' },
  { label: 'Facility reviews', key: 'facilities_pending' },
  { label: 'Product approvals', key: 'products_pending' },
  { label: 'Product-claim reviews', key: 'claims_pending' },
  { label: 'Business verifications', key: 'business_accounts_pending' },
  { label: 'Editorial reviews', key: 'editorial_pending' },
  { label: 'Translation reviews', key: 'translations_pending' },
  { label: 'Receipts awaiting inspection', key: 'receipts_pending' },
  { label: 'Quarantined batches', key: 'batches_quarantined' },
  { label: 'Batches expiring within 30 days', key: 'batches_expiring_30d' },
  { label: 'Quarantined returns', key: 'returns_quarantined' },
  { label: 'Open trade enquiries', key: 'trade_enquiries_open' },
  { label: 'Open customer orders', key: 'orders_open' },
];

function count(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) return new Intl.NumberFormat('en-IN').format(value);
  if (typeof value === 'string' && /^\d+$/.test(value)) return new Intl.NumberFormat('en-IN').format(Number(value));
  return '—';
}

function DashboardCard({ label, value }: { label: string; value: unknown }) {
  return <article className="info-card admin-metric"><p>{label}</p><strong>{count(value)}</strong></article>;
}

export default async function AdminDashboardPage() {
  await requireAnyRole(adminRoles);
  const supabase = await createClient();
  const [summaryResult, warehouseAccess, editorialAccess] = await Promise.all([
    supabase.rpc('get_admin_operations_summary'),
    requireAnyRole(warehouseRoles).then(() => true).catch(() => false),
    requireAnyRole(editorialRoles).then(() => true).catch(() => false),
  ]);
  const summary = summaryResult.data && typeof summaryResult.data === 'object'
    ? summaryResult.data as Record<string, unknown>
    : null;
  const [warehouseResult, localeResult] = await Promise.all([
    warehouseAccess ? supabase.rpc('get_warehouse_stock_summary') : Promise.resolve({ data: null, error: null }),
    editorialAccess ? supabase.rpc('get_editorial_locale_coverage') : Promise.resolve({ data: null, error: null }),
  ]);
  const [businessQueueResult] = await Promise.all([supabase.rpc('get_pending_business_accounts')]);
  const businessQueue = Array.isArray(businessQueueResult.data) ? businessQueueResult.data as Array<{id:string;legal_name:string;created_at:string}> : [];
  const errors = [summaryResult.error, warehouseResult.error, localeResult.error, businessQueueResult.error].filter(Boolean);

  return <section className="wrap admin-page">
    <div className="page-hero">
      <div className="eyebrow">Rasvani · Internal workspace</div>
      <h1>Operations dashboard</h1>
      <p className="section-intro">Aggregate review queues and operational status. This page does not expose customer or producer personal details.</p>
    </div>
    {errors.length > 0 && <div className="status" role="status">Some reporting data is unavailable. Confirm that the latest Supabase migrations have been applied and that your account has the required database role.</div>}
    <div className="cta-row" aria-label="Internal workspaces"><a className="btn secondary" href="/catalogue-review">Open catalogue review</a><a className="btn secondary" href="/facility-review">Review producer facilities</a>{editorialAccess && <a className="btn secondary" href="/regional-review">Regional discovery review</a>}{warehouseAccess && <a className="btn secondary" href="/warehouse">Open warehouse workspace</a>}{editorialAccess && <a className="btn secondary" href="/editorial">Open editorial workspace</a>}</div>
    {!summary && <div className="status" role="status">The admin summary is not available yet. Configure Supabase, apply migrations 001–017 and sign in with an admin-assigned account.</div>}
    <div className="section-head"><div><div className="eyebrow">Review queues</div><h2>Items needing attention</h2></div></div>
    <div className="admin-grid">{queues.map((item) => <DashboardCard key={item.key} label={item.label} value={summary?.[item.key]} />)}</div>
    <section className="admin-subsection"><div className="eyebrow">Business verification</div><h2>Pending business accounts</h2>{businessQueue.length ? businessQueue.map((business) => <form key={business.id} action={reviewBusinessAccount} className="form-shell" style={{marginTop:16}}><input type="hidden" name="business_id" value={business.id}/><p><strong>{business.legal_name}</strong></p><p className="notice">Submitted {new Date(business.created_at).toLocaleDateString('en-IN')}. Review supporting evidence through the approved secure process; tax identifiers are not shown in this queue.</p><label>Review reason<textarea name="reason" required rows={2} maxLength={1000}/></label><div className="actions"><button className="btn" name="decision" value="approved">Approve</button><button className="btn secondary" name="decision" value="rejected">Reject</button></div></form>) : <p className="notice">No pending business accounts are currently available.</p>}</section>

    {warehouseAccess && <section className="admin-subsection">
      <div className="eyebrow">Warehouse operations</div><h2>Stock status by warehouse</h2>
      {Array.isArray(warehouseResult.data) && warehouseResult.data.length > 0 ? <div className="table-scroll"><table className="admin-table"><thead><tr><th>Warehouse</th><th>Sellable</th><th>Quarantined</th><th>Rejected / damaged</th><th>Expired / recalled</th></tr></thead><tbody>{warehouseResult.data.map((row: Record<string, unknown>) => <tr key={String(row.warehouse_id)}><th>{String(row.warehouse_name ?? row.warehouse_code ?? 'Warehouse')}</th><td>{count(row.sellable_batches)}</td><td>{count(row.quarantined_batches)}</td><td>{count(row.rejected_or_damaged_batches)}</td><td>{count(row.expired_or_recalled_batches)}</td></tr>)}</tbody></table></div> : <p className="notice">No warehouse summary is available. This may mean no active warehouse is configured yet.</p>}
    </section>}

    {editorialAccess && <section className="admin-subsection">
      <div className="eyebrow">Multilingual publishing</div><h2>Translation review coverage</h2>
      {Array.isArray(localeResult.data) && localeResult.data.length > 0 ? <div className="table-scroll"><table className="admin-table"><thead><tr><th>Locale</th><th>Approved</th><th>Pending review</th><th>Draft / rejected</th></tr></thead><tbody>{localeResult.data.map((row: Record<string, unknown>) => <tr key={String(row.locale)}><th>{String(row.locale).toUpperCase()}</th><td>{count(row.approved_translations)}</td><td>{count(row.pending_review)}</td><td>{count(row.draft_or_rejected)}</td></tr>)}</tbody></table></div> : <p className="notice">Translation coverage is not available yet.</p>}
    </section>}
    <p className="notice admin-footnote">Counts are read-only aggregates returned by role-gated database functions. They are not targets, forecasts or proof of completed review. Refresh the page to request current values.</p>
  </section>;
}
