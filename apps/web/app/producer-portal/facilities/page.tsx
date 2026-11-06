import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAnyRole } from '@/lib/auth/authorization';
import { createClient } from '@/lib/supabase/server';
import { regions } from '@/lib/regions';
import { submitProducerFacility } from './actions';

export const metadata: Metadata = { title: 'Producer facility registration' };
type Facility = {
  facility_id: string; facility_name: string; region_id: string; region_name: string | null;
  address: Record<string, unknown>; approval_status: string; approved_from: string | null;
  approved_until: string | null; created_at: string;
};
const statusLabels: Record<string, string> = {
  draft: 'Draft', pending_review: 'Pending facility review', approved: 'Approved', rejected: 'Rejected', archived: 'Archived',
};
const regionIds = [
  'andhra-pradesh','arunachal-pradesh','assam','bihar','chhattisgarh','goa','gujarat','haryana',
  'himachal-pradesh','jharkhand','karnataka','kerala','madhya-pradesh','maharashtra','manipur',
  'meghalaya','mizoram','nagaland','odisha','punjab','rajasthan','sikkim','tamil-nadu','telangana',
  'tripura','uttar-pradesh','uttarakhand','west-bengal','andaman-and-nicobar-islands','chandigarh',
  'dadra-and-nagar-haveli-and-daman-and-diu','delhi','jammu-and-kashmir','ladakh','lakshadweep','puducherry',
];

export default async function ProducerFacilitiesPage({ searchParams }: { searchParams: Promise<{ error?: string; submitted?: string }> }) {
  await requireAnyRole(['producer']);
  const supabase = await createClient();
  const [{ data, error }, params] = await Promise.all([supabase.rpc('get_my_producer_facilities'), searchParams]);
  const facilities = Array.isArray(data) ? data as Facility[] : [];
  const options = regions.map((name, index) => ({ id: regionIds[index], name }));
  return <section className="wrap producer-portal-page">
    <div className="page-hero"><div className="eyebrow">Rasvani · Producer workspace</div><h1>Facility registration</h1>
      <p className="section-intro">Register the places where your products are made, processed or stored. Each facility is reviewed separately. Submission is not a licence, inspection, certification or approval.</p>
      <p><Link className="text-link" href="/producer-portal">← Back to producer portal</Link> <span aria-hidden="true"> · </span><Link className="text-link" href="/producer-portal/products">Product submissions</Link></p>
    </div>
    {params.error && <p className="status" role="alert">{params.error === 'invalid-fields' ? 'Check the facility name, address, PIN code, state and facility type.' : 'Facility submission failed. Confirm that migration 019 is applied and your producer profile is approved.'}</p>}
    {params.submitted && <p className="status" role="status">Facility submitted or updated. It remains pending until an authorised reviewer records a decision.</p>}
    <section className="producer-form-panel"><div className="eyebrow">New facility submission</div><h2>Facility and location details</h2>
      <form action={submitProducerFacility} className="producer-form">
        <label>Facility name<input name="facility_name" required maxLength={180} placeholder="Name used by your business"/></label>
        <label>Facility type<select name="facility_type" required defaultValue="processing"><option value="processing">Processing</option><option value="manufacturing">Manufacturing</option><option value="storage">Storage</option><option value="farm">Farm / source premises</option><option value="other">Other</option></select></label>
        <label className="producer-wide">Address line 1<input name="address_line_1" required maxLength={180} autoComplete="address-line1"/></label>
        <label className="producer-wide">Address line 2 (optional)<input name="address_line_2" maxLength={180} autoComplete="address-line2"/></label>
        <label>City / town<input name="city" required maxLength={100} autoComplete="address-level2"/></label>
        <label>District (optional)<input name="district" maxLength={100}/></label>
        <label>State / Union Territory<select name="region_id" required defaultValue="bihar">{options.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}</select></label>
        <label>PIN code<input name="postal_code" required inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} autoComplete="postal-code"/></label>
        <fieldset className="producer-wide facility-capabilities"><legend>Storage capabilities at this location</legend>
          <p className="notice">Select only conditions this facility can actually maintain. This is operational information, not an audit result.</p>
          {(['ambient','chilled','frozen','other'] as const).map((item) => <label key={item}><input type="checkbox" name="storage_capabilities" value={item}/> {item[0].toUpperCase()+item.slice(1)}</label>)}
        </fieldset>
        <button type="submit" className="btn producer-wide">Submit facility for review</button>
      </form>
    </section>
    <section className="producer-status-panel"><div className="eyebrow">Facility register</div><h2>Your registered facilities</h2>
      {error ? <p className="notice">Facility status is unavailable. Confirm migration 019 and producer access.</p> : facilities.length === 0 ? <p className="notice">No facilities registered yet.</p> : <div className="facility-list">{facilities.map((facility) => <article className="facility-card" key={facility.facility_id}>
        <div><h3>{facility.facility_name}</h3><p>{String(facility.address.city ?? '')}{facility.address.district ? `, ${String(facility.address.district)}` : ''} · {facility.region_name ?? facility.region_id} · PIN {String(facility.address.postal_code ?? '—')}</p><p className="notice">{String(facility.address.facility_type ?? 'Facility').replaceAll('_',' ')} · Storage: {Array.isArray(facility.address.storage_capabilities) && facility.address.storage_capabilities.length ? (facility.address.storage_capabilities as string[]).join(', ') : 'Not specified'}</p></div>
        <div className="facility-status"><strong>{statusLabels[facility.approval_status] ?? 'Status unavailable'}</strong><span>Submitted {new Date(facility.created_at).toLocaleDateString('en-IN')}</span>{facility.approved_until && <span>Approval valid until {new Date(facility.approved_until).toLocaleDateString('en-IN')}</span>}</div>
      </article>)}</div>}
    </section>
    <p className="notice">Do not upload government identity documents, FSSAI certificates, bank details or sensitive records through this form. A separate secure document workflow will be used only after its access, retention and privacy rules are approved.</p>
  </section>;
}
