import type { Metadata } from 'next';
import { requireAnyRole } from '@/lib/auth/authorization';
import { createClient } from '@/lib/supabase/server';
import {
  createWarehouseReceipt,
  closeWarehouseReceipt,
  receiveWarehouseBatch,
  decideBatchInspection,
  decideReturnInspection,
  runExpirySweep,
  recallProductBatches,
  createPhysicalStockCount,
  cancelPhysicalStockCount,
  submitPhysicalStockCount,
  reviewPhysicalStockCount,
  createReceivingChecklistTemplate,
  updateReceivingChecklistTemplate,
  deactivateReceivingChecklistTemplate,
  setStockCountEscalationRules,
} from './actions';
import { ReceiveBatchForm } from './receive-batch-form';
import { StockCountLines } from './stock-count-lines';

export const metadata: Metadata = { title: 'Warehouse workspace' };
const workspaceRoles = ['warehouse_operator', 'quality_reviewer', 'admin', 'super_admin'] as const;

type ReceiptRow = {
  receipt_id: string; warehouse_name: string; warehouse_code: string; producer_name: string | null;
  delivery_reference: string | null; received_at: string; receipt_status: string; batch_count: number;
};
type BatchRow = {
  batch_id: string; product_name: string; sku: string; batch_code: string; quantity_on_hand: number;
  unit: string; stock_status: string; inspection_status: string; warehouse_name: string; bin_code: string | null;
  expiry_date: string | null; best_before_date: string | null; received_at: string;
};
type ReturnRow = {
  case_id: string; batch_id: string; product_name: string; batch_code: string; quantity: number;
  reason: string; case_status: string; opened_at: string; warehouse_name: string;
};
type RecallProductRow = { product_id: string; product_name: string; sku: string; eligible_batch_count: number };
type RecallTraceProductRow = { product_id: string; product_name: string; sku: string; linked_order_count: number; recalled_batch_count: number };
type RecallTraceRow = { order_id: string; order_number: string; order_status: string; order_created_at: string; batch_id: string; batch_code: string; batch_status: string; warehouse_name: string; reservation_status: string; reserved_quantity: number; ordered_quantity: number; reservation_first_created_at: string; reservation_expiry_at: string };
type EvidenceRow = { batch_id: string; inspection_id: string; checklist_key: string; checklist_title: string; result: string; notes: string | null; photo_paths: string[]; inspected_at: string };
type StockCountRow = { stock_count_id: string; warehouse_id: string; warehouse_name: string; status: string; created_by: string; started_at: string; submitted_at: string | null; reviewed_at: string | null; cancelled_by: string | null; cancelled_at: string | null; cancellation_reason: string | null; submitted_by: string | null; reviewed_by: string | null; review_reason: string | null; count_notes: string | null; batch_line_count: number; counted_line_count: number; variance_line_count: number; escalation_level: string; warning_line_count: number; critical_line_count: number; review_required_line_count: number; stale_line_count: number; is_stale: boolean };
type StockCountLineRow = { batch_id: string; product_name: string; sku: string; batch_code: string; bin_code: string | null; expected_quantity: number; counted_quantity: number | null; unit: string; count_notes: string | null; line_counted_at: string | null; variance_percent: number | null; escalation_level: string; review_finding: string | null; review_note: string | null; reviewed_by: string | null; reviewed_at: string | null; current_quantity: number | null; current_stock_status: string | null; current_inspection_status: string | null; is_stale: boolean; stale_reasons: string[] };
type MovementRow = { movement_id: string; movement_type: string; quantity_delta: number; product_name: string; sku: string; batch_code: string; warehouse_name: string; from_bin_code: string | null; to_bin_code: string | null; reference_type: string | null; reference_id: string | null; reason: string; moved_at: string };
type EvidenceView = { checklist_key: string; checklist_title: string; result: string; notes: string | null; inspected_at: string; photos: string[] };
type ExpiryRow = {
  batch_id: string; product_name: string; batch_code: string; quantity_on_hand: number; unit: string;
  warehouse_name: string; controlling_date: string; expiry_state: string;
};
type OptionRow = { id: string; name?: string; code?: string; warehouse_id?: string; legal_name?: string; sku?: string; producer_id?: string };
type EscalationRuleRow = { warehouse_id: string; warehouse_name: string; warning_variance_percent: number | null; critical_variance_percent: number | null; configured: boolean };
type ChecklistTemplateRow = { checklist_key: string; title: string; required: boolean; applies_to_category_id: string | null; applies_to_category_name: string | null; applies_to_storage: string | null; active: boolean };
type WorkspaceOptions = { warehouses: OptionRow[]; bins: OptionRow[]; products: OptionRow[]; categories: OptionRow[]; producers: OptionRow[] };

function rows<T>(input: unknown): T[] { return Array.isArray(input) ? input as T[] : []; }
function pretty(value: string | null | undefined): string { return (value ?? '—').replaceAll('_', ' '); }
function date(value: string | null | undefined): string { return value ? new Date(value).toLocaleDateString('en-IN') : 'Not recorded'; }
function dateTime(value: string | null | undefined): string { return value ? new Date(value).toLocaleString('en-IN') : 'Not recorded'; }
function reservationLabel(value: string): string { return ({ active: 'Reserved · not yet dispatched', consumed: 'Consumed for dispatch', recalled: 'Invalidated by recall', released: 'Released before dispatch', expired: 'Reservation expired' } as Record<string, string>)[value] ?? pretty(value); }
function errorMessage(code?: string) {
  const messages: Record<string, string> = {
    'receipt-fields': 'Choose a warehouse and approved producer; keep reference and notes within the stated limits.',
    'receipt-create-failed': 'The receipt could not be created. Check the active warehouse, approved producer and migration 013.',
    'receipt-close-fields': 'Select a valid open receipt.',
    'receipt-close-failed': 'The receipt could not be closed. It must contain at least one batch, and every batch must first be accepted or rejected.',
    'batch-fields': 'Complete the batch fields with valid quantities, IDs and dates.',
    'date-order': 'Expiry and best-before dates cannot precede the manufacture date.',
    'checklist-incomplete': 'Confirm every mandatory receiving check before submitting the batch.',
    'receiving-evidence-auth': 'Sign in again before uploading receiving photographs.',
    'receiving-evidence-upload': 'A receiving photo could not be uploaded. Use JPEG, PNG or WebP images up to 5 MB each and confirm migration 025 is applied.',
    'batch-receive-failed': 'The batch could not be received. Check the receipt, matching producer, warehouse bin and required checklist.',
    'inspection-fields': 'Choose a valid inspection decision and enter a reason of at least three characters.',
    'inspection-failed': 'The batch decision was not saved. Acceptance requires every mandatory receiving check to have passed.',
    'return-fields': 'Choose a valid return decision and provide inspection notes.',
    'return-inspection-failed': 'The return inspection could not be saved.',
    'expiry-sweep-failed': 'The expiry sweep could not be completed.',
    'recall-fields': 'Select a product and provide a recall reason of at least five characters.',
    'recall-failed': 'The product recall could not be completed. Please retry after checking the quality-review permissions.',
    'stock-count-fields': 'Choose a valid warehouse and keep the count notes within 1,000 characters.',
    'stock-count-create-failed': 'The physical stock count could not be started. Check active warehouse stock and migration 030.',
    'stock-count-cancel-fields': 'Provide a valid count and a cancellation reason of 5–500 characters.',
    'stock-count-cancel-failed': 'The count could not be cancelled. Only its creator or an administrator can cancel an open, unsubmitted count; check migration 036.',
    'stock-count-line-fields': 'Enter a valid non-negative physical quantity with no more than three decimal places.',
    'stock-count-line-failed': 'The physical count line could not be saved. Check that the count is still open and the batch belongs to it.',
    'stock-count-submit-failed': 'The count could not be submitted. Every batch must have a recorded physical quantity.',
    'stock-count-review-fields': 'Choose approve or reject and provide a review reason of at least five characters.',
    'stock-count-review-failed': 'The count could not be reviewed. It may be stale, incomplete, or awaiting a different reviewer.',
    'checklist-template-fields': 'Use a unique snake_case key, a 3–150 character title, and select a category, storage condition, or both.',
    'checklist-template-create-failed': 'The receiving checklist template could not be created. Check the unique key and active category.',
    'checklist-template-deactivate-failed': 'The receiving checklist template could not be deactivated. It may already be inactive.',
    'checklist-template-update-failed': 'The receiving checklist template could not be updated. Built-in controls cannot be edited.',
    'stock-count-threshold-fields': 'Enter a positive warning percentage and a higher critical percentage (up to 10,000%).',
    'stock-count-threshold-save-failed': 'Variance thresholds could not be saved. Check the active warehouse and administrator role.',
  };
  return code ? messages[code] ?? 'The request could not be completed.' : null;
}

function Stat({ label, value }: { label: string; value: number }) {
  return <article className="info-card warehouse-stat"><p>{label}</p><strong>{Number.isFinite(value) ? value.toLocaleString('en-IN') : '—'}</strong></article>;
}

export default async function WarehouseWorkspacePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const roles = await requireAnyRole(workspaceRoles);
  const roleSet = new Set(roles);
  const canReceive = roleSet.has('warehouse_operator') || roleSet.has('admin') || roleSet.has('super_admin');
  const canInspectReturns = roleSet.has('quality_reviewer') || roleSet.has('admin') || roleSet.has('super_admin');
  const canRecall = canInspectReturns;
  const canInspectBatches = canReceive || canInspectReturns;
  const supabase = await createClient();
  const params = await searchParams;
  const traceProductId = params.traceProductId && /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(params.traceProductId) ? params.traceProductId : '';
  const stockCountId = params.stockCountId && /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(params.stockCountId) ? params.stockCountId : '';
  const canReviewStockCounts = roleSet.has('quality_reviewer') || roleSet.has('admin') || roleSet.has('super_admin');
  const isAdmin = roleSet.has('admin') || roleSet.has('super_admin');
  const { data: { user: signedInUser } } = await supabase.auth.getUser();
  const currentUserId = signedInUser?.id ?? '';
  const [receiptResult, batchResult, expiryResult, returnResult, optionsResult, recallProductsResult, traceProductsResult, movementResult, checklistTemplatesResult, escalationRulesResult] = await Promise.all([
    supabase.rpc('get_warehouse_workspace_receipts'),
    supabase.rpc('get_warehouse_workspace_batches'),
    supabase.rpc('get_warehouse_expiry_watch'),
    canInspectReturns ? supabase.rpc('get_warehouse_workspace_returns') : Promise.resolve({ data: [], error: null }),
    canReceive ? supabase.rpc('get_warehouse_workspace_options') : Promise.resolve({ data: null, error: null }),
    canRecall ? supabase.rpc('get_warehouse_recall_products') : Promise.resolve({ data: [], error: null }),
    canRecall ? supabase.rpc('get_warehouse_recall_trace_products') : Promise.resolve({ data: [], error: null }),
    supabase.rpc('get_warehouse_inventory_movement_ledger'),
    canReceive ? supabase.rpc('get_warehouse_receiving_checklist_templates') : Promise.resolve({ data: [], error: null }),
    canReceive ? supabase.rpc('get_warehouse_stock_count_escalation_rules') : Promise.resolve({ data: [], error: null }),
  ]);
  const traceResult = canRecall && traceProductId ? await supabase.rpc('get_warehouse_recall_order_trace', { p_product_id: traceProductId }) : { data: [], error: null };
  const stockCountResult = await supabase.rpc('get_warehouse_inventory_stock_counts');
  const stockCountLinesResult = stockCountId ? await supabase.rpc('get_warehouse_inventory_stock_count_lines', { p_stock_count_id: stockCountId }) : { data: [], error: null };
  const receipts = rows<ReceiptRow>(receiptResult.data);
  const batches = rows<BatchRow>(batchResult.data);
  const expiring = rows<ExpiryRow>(expiryResult.data);
  const returns = rows<ReturnRow>(returnResult.data);
  const recallProducts = rows<RecallProductRow>(recallProductsResult.data);
  const traceProducts = rows<RecallTraceProductRow>(traceProductsResult.data);
  const traceRows = rows<RecallTraceRow>(traceResult.data);
  const movements = rows<MovementRow>(movementResult.data);
  const stockCounts = rows<StockCountRow>(stockCountResult.data);
  const stockCountLines = rows<StockCountLineRow>(stockCountLinesResult.data);
  const selectedStockCount = stockCounts.find((item) => item.stock_count_id === stockCountId);
  const selectedTraceProduct = traceProducts.find((item) => item.product_id === traceProductId);
  const optionData = optionsResult.data && typeof optionsResult.data === 'object' ? optionsResult.data as WorkspaceOptions : null;
  const warehouses = rows<OptionRow>(optionData?.warehouses);
  const bins = rows<OptionRow>(optionData?.bins);
  const products = rows<OptionRow>(optionData?.products);
  const producers = rows<OptionRow>(optionData?.producers);
  const categories = rows<OptionRow>(optionData?.categories);
  const checklistTemplates = rows<ChecklistTemplateRow>(checklistTemplatesResult.data);
  const escalationRules = rows<EscalationRuleRow>(escalationRulesResult.data);
  const pendingReceipts = receipts.filter((item) => ['pending_inspection', 'partially_accepted'].includes(item.receipt_status));
  const pendingBatches = batches.filter((item) => item.stock_status === 'quarantined' && ['pending', 'quarantined'].includes(item.inspection_status));
  const evidenceResult = pendingBatches.length ? await supabase.rpc('get_warehouse_batch_inspection_evidence', { p_batch_ids: pendingBatches.map((item) => item.batch_id) }) : { data: [], error: null };
  const evidenceRows = rows<EvidenceRow>(evidenceResult.data);
  const evidenceByBatch = new Map<string, EvidenceView[]>();
  const signedPhotoCache = new Map<string, string>();
  for (const item of evidenceRows) {
    const photos: string[] = [];
    for (const path of item.photo_paths ?? []) {
      if (!signedPhotoCache.has(path)) {
        const { data } = await supabase.storage.from('warehouse-receiving-evidence').createSignedUrl(path, 600);
        if (data?.signedUrl) signedPhotoCache.set(path, data.signedUrl);
      }
      const signed = signedPhotoCache.get(path);
      if (signed && !photos.includes(signed)) photos.push(signed);
    }
    const group = evidenceByBatch.get(item.batch_id) ?? [];
    group.push({ checklist_key: item.checklist_key, checklist_title: item.checklist_title, result: item.result, notes: item.notes, inspected_at: item.inspected_at, photos });
    evidenceByBatch.set(item.batch_id, group);
  }
  const errors = [receiptResult.error, batchResult.error, expiryResult.error, returnResult.error, optionsResult.error, evidenceResult.error, recallProductsResult.error, traceProductsResult.error, traceResult.error, movementResult.error, stockCountResult.error, stockCountLinesResult.error, checklistTemplatesResult.error, escalationRulesResult.error].filter(Boolean);
  const issue = errorMessage(params.error);

  return <section className="wrap warehouse-page">
    <div className="page-hero">
      <div className="eyebrow">Rasvani · Internal operations</div>
      <h1>Warehouse workspace</h1>
      <p className="section-intro">Receive goods into quarantine, record inspection decisions, review returns and monitor shelf-life risk. All actions are checked again by role-gated database functions.</p>
    </div>
    {issue && <p className="status" role="alert">{issue}</p>}
    {(params.receiptCreated || params.receiptClosed || params.batchReceived || params.inspectionUpdated || params.returnUpdated || params.expiryChecked || params.stockCountCreated || params.stockCountLineSaved || params.stockCountSubmitted || params.stockCountReviewed || params.stockCountInvestigationSaved || params.checklistTemplateCreated || params.checklistTemplateUpdated || params.checklistTemplateDeactivated || params.stockCountThresholdsSaved) &&
      <p className="status" role="status">The requested warehouse action was saved. The queues below have been refreshed.</p>}
    {params.recallUpdated && <p className="status" role="status">Product recall recorded. {Number.isFinite(Number(params.recalledCount)) ? Number(params.recalledCount).toLocaleString('en-IN') : 'The'} batch(es) were marked recalled and blocked from sale.</p>}
    {errors.length > 0 && <p className="status" role="status">Some warehouse data is unavailable. Confirm migration 013 is applied and your account has the required warehouse or quality role.</p>}

    <div className="warehouse-stats">
      <Stat label="Recent receipts" value={receipts.length}/>
      <Stat label="Batches awaiting inspection" value={pendingBatches.length}/>
      <Stat label="Quarantined returns" value={returns.length}/>
      <Stat label="Sellable batches near date" value={expiring.length}/>
    </div>

    {canReceive && <>
      <section className="warehouse-panel">
        <div className="eyebrow">Step 1 · Inbound delivery</div><h2>Create a receipt</h2>
        {warehouses.length === 0 || producers.length === 0 ? <p className="notice">Receipt creation is unavailable until an active warehouse and an approved producer are configured. No sample locations or producers are invented here.</p> :
          <form action={createWarehouseReceipt} className="warehouse-form">
            <label>Warehouse<select name="warehouse_id" required defaultValue=""><option value="" disabled>Select active warehouse</option>{warehouses.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.code}</option>)}</select></label>
            <label>Approved producer<select name="producer_id" required defaultValue=""><option value="" disabled>Select producer</option>{producers.map((item) => <option key={item.id} value={item.id}>{item.legal_name}</option>)}</select></label>
            <label>Delivery / purchase reference<input name="delivery_reference" maxLength={120} placeholder="Supplier delivery reference"/></label>
            <label>Receipt notes<input name="notes" maxLength={1000} placeholder="Optional handover notes"/></label>
            <button className="btn" type="submit">Create receipt</button>
          </form>}
      </section>

      {isAdmin && <section className="warehouse-panel">
        <div className="eyebrow">Checklist configuration</div><h2>Category &amp; storage-specific checks</h2>
        <p className="notice">Global mandatory checks remain in force. Add scoped checks for an active product category, a storage condition, or both. New templates are required by default; existing recorded inspections remain unchanged.</p>
        <form action={createReceivingChecklistTemplate} className="warehouse-checklist-config-form">
          <label>Unique key<input name="checklist_key" required minLength={3} maxLength={60} pattern="[a-z][a-z0-9_]{2,59}" placeholder="e.g. chilled_temp_range"/></label>
          <label>Checklist title<input name="title" required minLength={3} maxLength={150} placeholder="e.g. Chilled temperature within approved range"/></label>
          <label>Product category<select name="category_id" defaultValue=""><option value="">All categories</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>Storage condition<select name="storage_condition" defaultValue=""><option value="">All conditions</option><option value="ambient">Ambient</option><option value="chilled">Chilled</option><option value="frozen">Frozen</option><option value="other">Other</option></select></label>
          <label className="warehouse-config-required"><input type="checkbox" name="required" defaultChecked/> Mandatory for matching products</label>
          <button className="btn" type="submit">Add checklist template</button>
        </form>
        {checklistTemplates.length === 0 ? <p className="notice">No checklist configuration was returned.</p> : <div className="warehouse-template-list">{checklistTemplates.map((item) => { const editable = item.active && !['identity_match','batch_code','quantity_match','packaging_integrity','damage_leakage','labels_documents','date_codes','storage_condition'].includes(item.checklist_key); return <article key={item.checklist_key} className="warehouse-template-row"><div><strong>{item.title}</strong><small>{item.checklist_key} · {[item.applies_to_category_name, item.applies_to_storage].filter(Boolean).join(' · ') || 'All products'} · {item.required ? 'Mandatory' : 'Optional'} · {item.active ? 'Active' : 'Inactive'}</small></div>{editable && <div className="warehouse-template-actions"><details><summary className="btn secondary">Edit template</summary><form action={updateReceivingChecklistTemplate} className="warehouse-template-edit-form"><input type="hidden" name="checklist_key" value={item.checklist_key}/><label>Title<input name="title" required minLength={3} maxLength={150} defaultValue={item.title}/></label><label>Product category<select name="category_id" defaultValue={item.applies_to_category_id ?? ''}><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Storage condition<select name="storage_condition" defaultValue={item.applies_to_storage ?? ''}><option value="">All conditions</option><option value="ambient">Ambient</option><option value="chilled">Chilled</option><option value="frozen">Frozen</option><option value="other">Other</option></select></label><label className="warehouse-config-required"><input type="checkbox" name="required" defaultChecked={item.required}/> Mandatory for matching products</label><button className="btn" type="submit">Save template</button></form></details><form action={deactivateReceivingChecklistTemplate}><input type="hidden" name="checklist_key" value={item.checklist_key}/><input name="reason" required minLength={5} maxLength={500} placeholder="Deactivation reason" aria-label={`Reason for deactivating ${item.title}`}/><button className="btn secondary" type="submit">Deactivate</button></form></div>}</article>; })}</div>}
      </section>}

      <section className="warehouse-panel">
        <div className="eyebrow">Step 2 · Batch registration</div><h2>Receive a batch into quarantine</h2>
        {pendingReceipts.length === 0 || products.length === 0 || bins.length === 0 ? <p className="notice">A pending receipt, a published product and an active warehouse bin are required before a batch can be received.</p> :
          <ReceiveBatchForm action={receiveWarehouseBatch} receipts={pendingReceipts} products={products} bins={bins} templates={checklistTemplates.filter((item) => item.active)}/>
}
      </section>
    </>}

    <section className="warehouse-panel">
      <div className="eyebrow">Inbound queue</div><h2>Recent receipts</h2>
      {receipts.length === 0 ? <p className="notice">No receipts have been recorded yet.</p> : <div className="warehouse-table-scroll"><table className="admin-table warehouse-table"><thead><tr><th>Warehouse</th><th>Producer</th><th>Delivery reference</th><th>Received</th><th>Status</th><th>Batches</th></tr></thead><tbody>{receipts.map((item) => <tr key={item.receipt_id}><th>{item.warehouse_name} · {item.warehouse_code}</th><td>{item.producer_name ?? '—'}</td><td>{item.delivery_reference ?? '—'}</td><td>{date(item.received_at)}</td><td>{item.receipt_status === 'pending_inspection' ? 'Open intake' : pretty(item.receipt_status)}</td><td>{item.batch_count}{canReceive && ['pending_inspection','partially_accepted'].includes(item.receipt_status) && item.batch_count > 0 ? <form action={closeWarehouseReceipt} className="receipt-close-form"><input type="hidden" name="receipt_id" value={item.receipt_id}/><button className="btn secondary" type="submit">Close intake</button></form> : null}</td></tr>)}</tbody></table></div>}
    </section>

    <section className="warehouse-panel">
      <div className="eyebrow">Quality control</div><h2>Batches awaiting inspection</h2>
      {pendingBatches.length === 0 ? <p className="notice">No quarantined batches are currently waiting for an initial inspection.</p> : <div className="warehouse-list">{pendingBatches.map((item) => <article className="warehouse-list-item" key={item.batch_id}>
        <div><div className="eyebrow">{item.sku} · {item.warehouse_name}{item.bin_code ? ` · ${item.bin_code}` : ''}</div><h3>{item.product_name}</h3><p className="notice">Batch {item.batch_code} · {item.quantity_on_hand} {item.unit} · Received {date(item.received_at)}</p><p className="notice">Expiry: {date(item.expiry_date)} · Best before: {date(item.best_before_date)}</p>
          <div className="warehouse-evidence"><h4>Receiving checklist and evidence</h4>{(evidenceByBatch.get(item.batch_id) ?? []).length === 0 ? <p className="notice">No inspection evidence is available for this batch.</p> : (evidenceByBatch.get(item.batch_id) ?? []).map((entry) => <div className="warehouse-evidence-item" key={entry.checklist_key}><p><strong>{entry.checklist_title}</strong> · <span className={entry.result === 'pass' ? 'evidence-pass' : 'evidence-fail'}>{pretty(entry.result)}</span></p>{entry.notes && <p className="notice">{entry.notes}</p>}{entry.photos.length > 0 && <div className="warehouse-evidence-photos">{entry.photos.map((url, index) => <a href={url} target="_blank" rel="noreferrer" key={`${entry.checklist_key}-${index}`}><img src={url} alt={`Private receiving evidence for ${item.batch_code}, ${entry.checklist_title}`} loading="lazy"/></a>)}</div>}</div>)}</div>
        </div>
        {canInspectBatches && <div className="warehouse-actions"><form action={decideBatchInspection}><input type="hidden" name="batch_id" value={item.batch_id}/><input type="hidden" name="decision" value="accepted"/><input aria-label={`Acceptance reason for ${item.batch_code}`} name="reason" placeholder="Inspection notes / reason" required minLength={3} maxLength={500}/><button className="btn" type="submit">Accept batch</button></form><form action={decideBatchInspection}><input type="hidden" name="batch_id" value={item.batch_id}/><input type="hidden" name="decision" value="quarantined"/><input aria-label={`Quarantine reason for ${item.batch_code}`} name="reason" placeholder="Reason to keep quarantined" required minLength={3} maxLength={500}/><button className="btn secondary" type="submit">Keep quarantined</button></form><form action={decideBatchInspection}><input type="hidden" name="batch_id" value={item.batch_id}/><input type="hidden" name="decision" value="rejected"/><input aria-label={`Rejection reason for ${item.batch_code}`} name="reason" placeholder="Rejection reason" required minLength={3} maxLength={500}/><button className="btn secondary" type="submit">Reject</button></form></div>}
      </article>)}</div>}
    </section>

    {canInspectReturns && <section className="warehouse-panel">
      <div className="eyebrow">Customer returns</div><h2>Quarantined returns awaiting inspection</h2>
      {returns.length === 0 ? <p className="notice">No quarantined return cases are waiting for review.</p> : <div className="warehouse-list">{returns.map((item) => <article className="warehouse-list-item" key={item.case_id}>
        <div><div className="eyebrow">{item.warehouse_name} · Batch {item.batch_code}</div><h3>{item.product_name}</h3><p className="notice">Quantity {item.quantity} · Opened {date(item.opened_at)}</p><p>{item.reason}</p></div>
        <div className="warehouse-actions"><form action={decideReturnInspection}><input type="hidden" name="case_id" value={item.case_id}/><input type="hidden" name="decision" value="inspected_usable"/><input name="notes" placeholder="Inspection notes" aria-label="Usable return inspection notes" required minLength={3} maxLength={1000}/><button className="btn" type="submit">Inspection passed</button></form><form action={decideReturnInspection}><input type="hidden" name="case_id" value={item.case_id}/><input type="hidden" name="decision" value="rejected"/><input name="notes" placeholder="Rejection notes" aria-label="Return rejection notes" required minLength={3} maxLength={1000}/><button className="btn secondary" type="submit">Reject</button></form><form action={decideReturnInspection}><input type="hidden" name="case_id" value={item.case_id}/><input type="hidden" name="decision" value="disposed"/><input name="notes" placeholder="Disposal notes" aria-label="Return disposal notes" required minLength={3} maxLength={1000}/><button className="btn secondary" type="submit">Dispose</button></form></div>
      </article>)}</div>}
      <p className="notice">A passed return inspection does not automatically restore inventory to sellable stock. A separate, reviewed restock workflow is still required.</p>
    </section>}

    {canRecall && <section className="warehouse-panel warehouse-recall-panel">
      <div className="eyebrow">Quality control · Critical action</div><h2>Recall all active batches for a product</h2>
      <p className="notice">Use only for an authorised product-level recall. This action marks every non-disposed, not-already-recalled batch for the selected product as recalled and blocks it from sale. It is recorded in the inventory movement and audit history.</p>
      {recallProducts.length === 0 ? <p className="notice">No product currently has a batch eligible for recall.</p> : <form action={recallProductBatches} className="warehouse-recall-form">
        <label>Product<select name="product_id" required defaultValue=""><option value="" disabled>Select product to recall</option>{recallProducts.map((item) => <option key={item.product_id} value={item.product_id}>{item.product_name} · {item.sku} · {item.eligible_batch_count} eligible batches</option>)}</select></label>
        <label>Recall reason<input name="reason" required minLength={5} maxLength={500} placeholder="Document the authorised recall reason"/></label>
        <button className="btn danger" type="submit">Record product recall</button>
      </form>}
      <div className="warehouse-recall-trace">
        <div className="eyebrow">Batch-to-order traceability</div><h3>Review order links for a product</h3>
        <p className="notice">This view lists historical order-to-batch reservations, including consumed, active, recalled, released and expired reservations. Order status is shown separately; a reservation record alone does not confirm delivery to a customer. Customer names, addresses and contact details are not displayed.</p>
        {traceProducts.length === 0 ? <p className="notice">No product has historical order reservations yet.</p> : <form method="get" action="/warehouse" className="warehouse-trace-form">
          <label>Product<select name="traceProductId" required defaultValue={traceProductId}><option value="" disabled>Select product to trace</option>{traceProducts.map((item) => <option key={item.product_id} value={item.product_id}>{item.product_name} · {item.sku} · {item.linked_order_count} linked orders · {item.recalled_batch_count} recalled batches</option>)}</select></label>
          <button className="btn secondary" type="submit">View order trace</button>
        </form>}
        {traceProductId && selectedTraceProduct && <div className="warehouse-trace-results">
          <h4>{selectedTraceProduct.product_name} · {selectedTraceProduct.sku}</h4>
          {traceRows.length === 0 ? <p className="notice">No order reservation links were found for this product.</p> : <div className="warehouse-table-scroll"><table className="admin-table warehouse-table warehouse-trace-table"><thead><tr><th>Order</th><th>Order status</th><th>Order date</th><th>Batch</th><th>Warehouse</th><th>Batch status</th><th>Linked quantity</th><th>Reservation state</th></tr></thead><tbody>{traceRows.map((item) => <tr key={`${item.order_id}-${item.batch_id}-${item.reservation_status}`}><th>{item.order_number}<small>{item.ordered_quantity} ordered</small></th><td>{pretty(item.order_status)}</td><td>{dateTime(item.order_created_at)}</td><td>{item.batch_code}</td><td>{item.warehouse_name}</td><td>{pretty(item.batch_status)}</td><td>{item.reserved_quantity}</td><td>{reservationLabel(item.reservation_status)}</td></tr>)}</tbody></table></div>}
          <p className="notice">Showing at most 250 order/batch/reservation-state links, prioritising recalled, consumed and active reservations. Historic released or expired links are included for audit context.</p>
        </div>}
      </div>
    </section>}

    <section className="warehouse-panel">
      <div className="warehouse-section-head"><div><div className="eyebrow">Shelf-life monitoring</div><h2>Approaching expiry</h2></div>{canReceive && <form action={runExpirySweep}><button className="btn secondary" type="submit">Run expiry block check</button></form>}</div>
      {expiring.length === 0 ? <p className="notice">No accepted sellable batches are currently inside the 30-day expiry window.</p> : <div className="warehouse-table-scroll"><table className="admin-table warehouse-table"><thead><tr><th>Product</th><th>Batch</th><th>Warehouse</th><th>On hand</th><th>Controlling date</th><th>Status</th></tr></thead><tbody>{expiring.map((item) => <tr key={item.batch_id}><th>{item.product_name}</th><td>{item.batch_code}</td><td>{item.warehouse_name}</td><td>{item.quantity_on_hand} {item.unit}</td><td>{date(item.controlling_date)}</td><td>{pretty(item.expiry_state)}</td></tr>)}</tbody></table></div>}
    </section>

    <section className="warehouse-panel warehouse-stock-count-panel">
      <div className="eyebrow">Physical inventory control</div><h2>Stock counts &amp; reconciliation</h2>
      <p className="notice">Counts snapshot every non-disposed batch in one warehouse. Staff record physical quantities; only an independent quality reviewer or administrator can approve adjustments. A stock movement after the snapshot makes the count stale and requires a fresh count. Warning and critical thresholds are administrator-configured and snapshotted when each count starts.</p>
      {isAdmin && <div className="warehouse-escalation-config"><h3>Variance escalation thresholds</h3><p className="notice">Thresholds are relative to the system snapshot quantity. No defaults are assumed. Until thresholds are configured, every discrepancy is flagged for reviewer attention. A batch with a zero system quantity and a non-zero physical count is treated as critical.</p>{escalationRules.map((rule) => <form action={setStockCountEscalationRules} className="warehouse-escalation-rule" key={rule.warehouse_id}><strong>{rule.warehouse_name}</strong><input type="hidden" name="warehouse_id" value={rule.warehouse_id}/><label>Warning %<input name="warning_percent" type="number" min="0.001" max="9999.999" step="0.001" required defaultValue={rule.warning_variance_percent ?? ''}/></label><label>Critical %<input name="critical_percent" type="number" min="0.002" max="10000" step="0.001" required defaultValue={rule.critical_variance_percent ?? ''}/></label><button className="btn secondary" type="submit">{rule.configured ? 'Update thresholds' : 'Configure thresholds'}</button></form>)}</div>}
      {canReceive && warehouses.length > 0 && <form action={createPhysicalStockCount} className="warehouse-stock-count-create">
        <label>Warehouse<select name="warehouse_id" required defaultValue=""><option value="" disabled>Select active warehouse</option>{warehouses.map((item) => <option key={item.id} value={item.id}>{item.name ?? item.code ?? item.id}</option>)}</select></label>
        <label>Count notes<input name="notes" maxLength={1000} placeholder="Optional count scope or shift notes"/></label>
        <button className="btn" type="submit">Start physical count</button>
      </form>}
      {stockCounts.length === 0 ? <p className="notice">No physical stock counts have been started.</p> : <div className="warehouse-table-scroll"><table className="admin-table warehouse-table"><thead><tr><th>Started</th><th>Warehouse</th><th>Status</th><th>Counted / total</th><th>Variance lines / escalation</th><th>Snapshot</th><th>Review</th></tr></thead><tbody>{stockCounts.map((item) => <tr key={item.stock_count_id}><td>{dateTime(item.started_at)}<small>Created by {item.created_by.slice(0, 8)}</small>{item.submitted_at && <small>Submitted {dateTime(item.submitted_at)} · {item.submitted_by?.slice(0, 8) ?? 'unknown user'}</small>}</td><th>{item.warehouse_name}</th><td>{pretty(item.status)}{item.reviewed_at && <small>Reviewed {dateTime(item.reviewed_at)} · {item.reviewed_by?.slice(0, 8) ?? 'unknown user'}</small>}{item.review_reason && <small>Decision reason: {item.review_reason}</small>}{item.cancellation_reason && <small>Cancellation reason: {item.cancellation_reason}</small>}</td><td>{item.counted_line_count} / {item.batch_line_count}</td><td>{item.variance_line_count}<small>{pretty(item.escalation_level)} · {item.critical_line_count} critical · {item.warning_line_count} warning · {item.review_required_line_count} unconfigured</small></td><td>{item.is_stale ? <strong className="warehouse-variance warehouse-variance-critical">Stale · {item.stale_line_count} changed lines</strong> : <small>Snapshot current</small>}</td><td><a href={`/warehouse?stockCountId=${item.stock_count_id}`} className="warehouse-inline-link">Open count</a></td></tr>)}</tbody></table></div>}
      {stockCountId && selectedStockCount && <div className="warehouse-stock-count-detail">
        <h3>{selectedStockCount.warehouse_name} · Physical count</h3>
        {selectedStockCount.count_notes && <p className="notice">Count notes: {selectedStockCount.count_notes}</p>}
        {selectedStockCount.is_stale && <p className="notice">This count snapshot is stale: {selectedStockCount.stale_line_count} batch line(s) changed, were disposed or are no longer available after the snapshot. Approval is blocked by the database. Do not approve this count; cancel it with a reason and start a fresh count after resolving the warehouse activity.</p>}
        <p className="notice">Status: {pretty(selectedStockCount.status)} · {selectedStockCount.counted_line_count} of {selectedStockCount.batch_line_count} lines counted · {selectedStockCount.variance_line_count} variances · {selectedStockCount.is_stale ? `STALE SNAPSHOT (${selectedStockCount.stale_line_count} changed lines)` : 'snapshot current'} · escalation: {pretty(selectedStockCount.escalation_level)} ({selectedStockCount.critical_line_count} critical, {selectedStockCount.warning_line_count} warning, {selectedStockCount.review_required_line_count} awaiting thresholds)</p>
        {selectedStockCount.status === 'cancelled' && <p className="notice">Cancelled {dateTime(selectedStockCount.cancelled_at)} by {selectedStockCount.cancelled_by?.slice(0, 8) ?? 'unknown user'}. Reason: {selectedStockCount.cancellation_reason ?? 'No reason recorded'}. The count snapshot and entered quantities are retained; inventory was not changed.</p>}
        {(selectedStockCount.status === 'approved' || selectedStockCount.status === 'rejected') && <p className="notice">{selectedStockCount.status === 'approved' ? 'Approved' : 'Rejected'} {dateTime(selectedStockCount.reviewed_at)} by {selectedStockCount.reviewed_by?.slice(0, 8) ?? 'unknown user'}. Review decision: {selectedStockCount.review_reason ?? 'No reason recorded'}. {selectedStockCount.status === 'approved' ? 'Approved variances were applied as audited inventory adjustments.' : 'Rejected count did not change inventory quantities.'}</p>}
        {stockCountLines.length > 0 && <StockCountLines
          lines={stockCountLines}
          stockCountId={stockCountId}
          status={selectedStockCount.status}
          canReceive={canReceive}
          canReview={canReviewStockCounts}
        />}
        {selectedStockCount.status === 'counting' && canReceive && <div className="warehouse-stock-count-open-actions"><form action={submitPhysicalStockCount}><input type="hidden" name="stock_count_id" value={stockCountId}/><button className="btn" type="submit" disabled={selectedStockCount.counted_line_count !== selectedStockCount.batch_line_count}>Submit completed count</button></form>{(isAdmin || selectedStockCount.created_by === currentUserId) && <form action={cancelPhysicalStockCount} className="warehouse-stock-count-cancel"><input type="hidden" name="stock_count_id" value={stockCountId}/><label>Cancellation reason<input name="reason" minLength={5} maxLength={500} required placeholder="Why is this count being stopped?"/></label><button className="btn secondary" type="submit">Cancel open count</button><small>Cancellation is final. The count evidence stays in the audit history and inventory quantities are unchanged.</small></form>}</div>}
        {selectedStockCount.status === 'submitted' && canReviewStockCounts && <div className="warehouse-stock-count-review"><p className="notice">Review must be performed by a different user from the count creator. Every variance line must first have an independent investigation finding. Approval then applies all variances as audited stock adjustments. Critical counts require an administrator or super administrator; a quality reviewer may still reject the count.</p><form action={reviewPhysicalStockCount}><input type="hidden" name="stock_count_id" value={stockCountId}/><label>Review reason<input name="reason" required minLength={5} maxLength={1000} placeholder="Record the independent review decision"/></label><div className="warehouse-actions">{(selectedStockCount.escalation_level !== 'critical' || isAdmin) && <button className="btn" type="submit" name="decision" value="approve">Approve &amp; apply variances</button>}<button className="btn secondary" type="submit" name="decision" value="reject">Reject count</button></div></form></div>}
      </div>}
      <p className="notice">The count snapshot is immutable. Approved variance adjustments are written to the inventory movement ledger. Rejected and cancelled counts do not change quantities; cancellation preserves the snapshot and requires a reason.</p>
    </section>

    <section className="warehouse-panel">
      <div className="eyebrow">Inventory audit trail</div><h2>Recent stock movements</h2>
      <p className="notice">Read-only history of receiving, reservations, releases, dispatch, returns, adjustments, damage, quarantine, recall, disposal and transfers. The ledger shows operational references only; customer identity and contact details are not included.</p>
      {movements.length === 0 ? <p className="notice">No inventory movements have been recorded yet.</p> : <div className="warehouse-table-scroll"><table className="admin-table warehouse-table"><thead><tr><th>Date / time</th><th>Product / batch</th><th>Warehouse / bins</th><th>Movement</th><th>Quantity delta</th><th>Reference</th><th>Reason</th></tr></thead><tbody>{movements.map((item) => <tr key={item.movement_id}><td>{dateTime(item.moved_at)}</td><th>{item.product_name}<small>{item.sku} · {item.batch_code}</small></th><td>{item.warehouse_name}<small>{item.from_bin_code ? `From ${item.from_bin_code}` : ''}{item.from_bin_code && item.to_bin_code ? ' · ' : ''}{item.to_bin_code ? `To ${item.to_bin_code}` : ''}</small></td><td>{pretty(item.movement_type)}</td><td>{Number(item.quantity_delta).toLocaleString('en-IN')}</td><td>{item.reference_type ? `${pretty(item.reference_type)}${item.reference_id ? ` · ${item.reference_id.slice(0, 8)}` : ''}` : '—'}</td><td>{item.reason}</td></tr>)}</tbody></table></div>}
      <p className="notice">Showing at most 200 latest movement records. Physical count variances appear here only after independent approval.</p>
    </section>

    <section className="warehouse-panel"><div className="eyebrow">Batch register</div><h2>Recent inventory batches</h2>
      {batches.length === 0 ? <p className="notice">No inventory batches have been recorded.</p> : <div className="warehouse-table-scroll"><table className="admin-table warehouse-table"><thead><tr><th>Product</th><th>SKU</th><th>Batch</th><th>Quantity</th><th>Warehouse / bin</th><th>Stock status</th><th>Inspection</th></tr></thead><tbody>{batches.map((item) => <tr key={item.batch_id}><th>{item.product_name}</th><td>{item.sku}</td><td>{item.batch_code}</td><td>{item.quantity_on_hand} {item.unit}</td><td>{item.warehouse_name} · {item.bin_code ?? '—'}</td><td>{pretty(item.stock_status)}</td><td>{pretty(item.inspection_status)}</td></tr>)}</tbody></table></div>}
    </section>
    <p className="notice warehouse-footnote">This workspace depends on migrations 001–013 and 025–042 and configured active warehouses, bins, approved producers and published products. It does not process payments, generate carrier labels or automate expiry notifications. All final permissions are enforced in database functions; this screen is not a substitute for live integration testing.</p>
  </section>;
}
