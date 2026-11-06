import type { Metadata } from 'next';
import { requireAnyRole } from '@/lib/auth/authorization';
import { createClient } from '@/lib/supabase/server';
import { reviewProducerFacility } from './actions';

export const metadata: Metadata = { title: 'Producer facility review' };
type Facility = { facility_id:string; facility_name:string; producer_name:string; region_name:string|null; address:Record<string,unknown>; created_at:string };
export default async function FacilityReviewPage({ searchParams }: { searchParams: Promise<{error?:string;reviewed?:string}> }) {
  await requireAnyRole(['quality_reviewer','admin','super_admin']);
  const supabase = await createClient();
  const [{data,error},params] = await Promise.all([supabase.rpc('get_pending_producer_facilities'),searchParams]);
  const facilities = Array.isArray(data) ? data as Facility[] : [];
  return <section className="wrap admin-page"><div className="page-hero"><div className="eyebrow">Rasvani · Producer verification</div><h1>Facility review queue</h1><p className="section-intro">Review the declared facility details and record an approval decision. This screen does not replace an on-site inspection or legal/regulatory verification.</p></div>
    {params.error && <p className="status" role="alert">{params.error === 'invalid-fields' ? 'Enter a valid facility, review reason and approval date range.' : 'The facility review could not be saved. Confirm migration 019 and the review role.'}</p>}
    {params.reviewed && <p className="status" role="status">The facility decision has been recorded. Refresh the queue for current status.</p>}
    {error && <p className="status" role="status">The review queue is unavailable. Confirm migration 019 and the assigned database role.</p>}
    <div className="cta-row"><a className="btn secondary" href="/admin">Operations dashboard</a></div>
    <section className="admin-subsection"><div className="eyebrow">Pending facilities</div><h2>Facilities awaiting review</h2>
      {facilities.length ? facilities.map((facility) => <article className="facility-review-card" key={facility.facility_id}>
        <div><h3>{facility.facility_name}</h3><p><strong>Producer:</strong> {facility.producer_name}</p><p><strong>Location:</strong> {String(facility.address.address_line_1 ?? '')}{facility.address.address_line_2 ? `, ${String(facility.address.address_line_2)}` : ''}, {String(facility.address.city ?? '')}{facility.address.district ? `, ${String(facility.address.district)}` : ''}, {facility.region_name ?? 'Region unavailable'} — {String(facility.address.postal_code ?? '')}</p><p className="notice">Type: {String(facility.address.facility_type ?? 'Not specified')} · Storage capability: {Array.isArray(facility.address.storage_capabilities) ? (facility.address.storage_capabilities as string[]).join(', ') || 'Not specified' : 'Not specified'} · Submitted {new Date(facility.created_at).toLocaleDateString('en-IN')}</p></div>
        <form action={reviewProducerFacility} className="facility-review-form"><input type="hidden" name="facility_id" value={facility.facility_id}/><label>Review reason<textarea name="reason" required minLength={3} maxLength={1000} rows={2}/></label><div className="facility-date-fields"><label>Approval starts (optional)<input type="date" name="approved_from"/></label><label>Approval ends (optional)<input type="date" name="approved_until"/></label></div><p className="notice">An omitted start date defaults to today. An omitted end date has no system expiry; use only when the approval basis supports it.</p><div className="actions"><button className="btn" name="decision" value="approved">Approve facility</button><button className="btn secondary" name="decision" value="rejected">Reject facility</button></div></form>
      </article>) : <p className="notice">No pending facility records are currently available.</p>}
    </section>
    <p className="notice admin-footnote">Facility approval is independent of producer account approval and product catalogue approval. Decisions and reasons are recorded in the audit log. Approval in this portal is an internal Rasvani workflow state, not a government licence or compliance determination.</p>
  </section>;
}
