import type { Metadata } from 'next';
import { requireAnyRole } from '@/lib/auth/authorization';
import { createClient } from '@/lib/supabase/server';
import { regions } from '@/lib/regions';
import { submitProducerApplication } from './actions';

export const metadata: Metadata = { title: 'Producer application' };
const applicantRoles = ['customer', 'producer'] as const;
type ApplicationRow = {
  application_id: string; legal_name: string; region_id: string; status: string;
  submitted_at: string; reviewed_at: string | null; has_producer_profile: boolean;
};
const regionIds = [
  'andhra-pradesh','arunachal-pradesh','assam','bihar','chhattisgarh','goa','gujarat','haryana',
  'himachal-pradesh','jharkhand','karnataka','kerala','madhya-pradesh','maharashtra','manipur',
  'meghalaya','mizoram','nagaland','odisha','punjab','rajasthan','sikkim','tamil-nadu','telangana',
  'tripura','uttar-pradesh','uttarakhand','west-bengal','andaman-and-nicobar-islands','chandigarh',
  'dadra-and-nagar-haveli-and-daman-and-diu','delhi','jammu-and-kashmir','ladakh','lakshadweep','puducherry',
];
const statuses: Record<string, string> = {
  draft: 'Draft', pending_review: 'Under review', approved: 'Approved', rejected: 'Not approved', archived: 'Archived',
};
function noticeFor(code?: string) {
  const messages: Record<string, string> = {
    'complete-fields': 'Complete the required fields and choose a valid state or Union Territory.',
    'invalid-email': 'Enter a valid contact email address.',
    'field-length': 'One or more fields are too long. Please shorten them and try again.',
    'submission-failed': 'The application could not be submitted. Confirm that migration 012 is applied and try again.',
  };
  return code ? messages[code] ?? 'The request could not be completed.' : null;
}

export default async function ProducerPortalPage({ searchParams }: { searchParams: Promise<{ error?: string; submitted?: string }> }) {
  await requireAnyRole(applicantRoles);
  const supabase = await createClient();
  const [{ data, error }, params] = await Promise.all([supabase.rpc('get_my_producer_application'), searchParams]);
  const application = (Array.isArray(data) && data.length ? data[0] : null) as ApplicationRow | null;
  const issue = noticeFor(params.error);
  const regionsWithIds = regions.map((name, index) => ({ name, id: regionIds[index] }));

  return <section className="wrap producer-portal-page">
    <div className="page-hero"><div className="eyebrow">Rasvani · Producer partnerships</div><h1>Producer application</h1>
      <p className="section-intro">Tell us about your business and regional food work. Submitting an application does not verify a producer, facility, product, licence or claim, and does not guarantee onboarding.</p>
    </div>
    {issue && <p className="status" role="alert">{issue}</p>}
    {params.submitted && <p className="status" role="status">Your application has been submitted or updated. It remains pending until an authorised reviewer records a decision.</p>}
    {error && <p className="status" role="status">Application status is currently unavailable. Confirm that migration 012 is applied and your account is signed in.</p>}

    {application && <section className="producer-status-panel">
      <div className="eyebrow">Latest application</div><h2>{application.legal_name}</h2>
      <p><strong>Status:</strong> {statuses[application.status] ?? 'Status unavailable'}</p>
      <p><strong>Region:</strong> {regions.find((name, index) => regionIds[index] === application.region_id) ?? application.region_id}</p>
      <p className="notice">Submitted {new Date(application.submitted_at).toLocaleDateString('en-IN')}{application.reviewed_at ? ` · Reviewed ${new Date(application.reviewed_at).toLocaleDateString('en-IN')}` : ''}</p>
      {application.has_producer_profile && <><p className="status">Producer profile approved. Facility approval and product-by-product catalogue review are still separate requirements.</p><nav className="producer-portal-links" aria-label="Producer workspace"><a className="btn" href="/producer-portal/facilities">Manage facilities</a><a className="btn secondary" href="/producer-portal/products">Submit products</a></nav></>}
      {application.status === 'pending_review' && <p className="notice">You may update the details while this application is pending. Review decisions are made by authorised Rasvani staff.</p>}
      {application.status === 'approved' && <p className="notice">Your producer profile exists. Contact Rasvani through the agreed onboarding channel for facility and product setup; no products are published automatically.</p>}
    </section>}

    {(!application || application.status === 'pending_review' || application.status === 'rejected') && !application?.has_producer_profile && <section className="producer-form-panel">
      <div className="eyebrow">{application?.status === 'pending_review' ? 'Update pending application' : 'Apply to become a producer'}</div>
      <h2>Business and regional details</h2>
      <form action={submitProducerApplication} className="producer-form">
        <label>Legal business / producer name<input name="legal_name" required maxLength={180} defaultValue={application?.legal_name ?? ''}/></label>
        <label>Primary state or Union Territory<select name="region_id" required defaultValue={application?.region_id ?? 'bihar'}>{regionsWithIds.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}</select></label>
        <label>Contact person<input name="contact_name" maxLength={120} autoComplete="name"/></label>
        <label>Contact email<input name="contact_email" type="email" required maxLength={254} autoComplete="email"/></label>
        <label>Phone (optional)<input name="phone" type="tel" maxLength={30} autoComplete="tel"/></label>
        <label>Product categories<input name="product_categories" maxLength={600} placeholder="For example: pickles, snacks, sweets"/></label>
        <label className="producer-wide">Tell us about your producer business<textarea name="introduction" required rows={6} maxLength={3000} placeholder="Describe your business, regional food products and current operations. Do not include passwords or sensitive identity numbers."/></label>
        <p className="notice producer-wide">This first step does not request government ID numbers, bank details or licence uploads. Those requirements need an approved document-handling and privacy process before collection.</p>
        <button type="submit" className="btn producer-wide">{application?.status === 'pending_review' ? 'Update application' : 'Submit application'}</button>
      </form>
    </section>}

    <p className="notice producer-portal-footnote">Applications are reviewed separately from facility approval, product claim verification, catalogue approval and publication. Do not treat an application status as a regulatory certification or product endorsement.</p>
  </section>;
}
