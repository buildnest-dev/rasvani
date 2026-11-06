'use client';

import { useMemo, useState } from 'react';

type ProductOption = {
  id: string; name?: string; sku?: string; producer_id?: string;
  category_id?: string | null; storage_condition?: string;
};
type ReceiptOption = { receipt_id: string; warehouse_name: string; delivery_reference: string | null; receipt_status: string };
type BinOption = { id: string; code?: string; warehouse_id?: string };
type ChecklistTemplate = {
  checklist_key: string; title: string; required: boolean;
  applies_to_category_id: string | null; applies_to_category_name: string | null;
  applies_to_storage: string | null; active: boolean;
};
type ReceiveAction = (formData: FormData) => Promise<void>;

export function ReceiveBatchForm({
  action, receipts, products, bins, templates,
}: {
  action: ReceiveAction; receipts: ReceiptOption[]; products: ProductOption[];
  bins: BinOption[]; templates: ChecklistTemplate[];
}) {
  const [productId, setProductId] = useState('');
  const [results, setResults] = useState<Record<string, 'pass' | 'fail'>>({});
  const selectedProduct = products.find((item) => item.id === productId);
  const applicableTemplates = useMemo(() => templates.filter((item) => item.active &&
    (item.applies_to_category_id === null || item.applies_to_category_id === selectedProduct?.category_id) &&
    (item.applies_to_storage === null || item.applies_to_storage === selectedProduct?.storage_condition)
  ), [templates, selectedProduct]);

  function chooseProduct(nextId: string) {
    setProductId(nextId);
    setResults({});
  }

  return <form action={action} className="warehouse-form">
    <label>Receipt<select name="receipt_id" required defaultValue=""><option value="" disabled>Select pending receipt</option>{receipts.map((item) => <option key={item.receipt_id} value={item.receipt_id}>{item.warehouse_name} · {item.delivery_reference || item.receipt_id.slice(0, 8)} · {item.receipt_status.replaceAll('_', ' ')}</option>)}</select></label>
    <label>Published product<select name="product_id" required value={productId} onChange={(event) => chooseProduct(event.target.value)}><option value="" disabled>Select product</option>{products.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.sku}</option>)}</select></label>
    <label>Warehouse bin<select name="bin_id" required defaultValue=""><option value="" disabled>Select bin</option>{bins.map((item) => <option key={item.id} value={item.id}>{item.code} · warehouse {item.warehouse_id?.slice(0, 8)}</option>)}</select></label>
    <label>Batch / lot code<input name="batch_code" required maxLength={120}/></label>
    <label>Received quantity<input name="quantity" required type="number" min="0.001" step="0.001"/></label>
    <label>Unit<input name="unit" required maxLength={20} placeholder="kg, units, packs…"/></label>
    <label>Manufactured on<input name="manufactured_on" type="date"/></label>
    <label>Packed on<input name="packed_on" type="date"/></label>
    <label>Expiry date<input name="expiry_date" type="date"/></label>
    <label>Best-before date<input name="best_before_date" type="date"/></label>
    <label className="warehouse-wide">Receiving notes<input name="notes" maxLength={1000} placeholder="Condition, discrepancies or other observations"/></label>
    <fieldset className="warehouse-checklist warehouse-wide">
      <legend>Receiving checklist</legend>
      <p className="notice">The checklist updates to match the selected product’s category and storage condition. Global checks always apply. Category and storage-specific checks are added automatically. A failed item requires a finding and keeps the batch quarantined.</p>
      {!selectedProduct ? <p className="notice">Select a published product to load its applicable checklist.</p> : applicableTemplates.length === 0 ? <p className="notice">No active receiving checklist templates match this product. An administrator must configure an applicable checklist before intake can proceed.</p> : <>
        <p className="warehouse-checklist-scope">Applicable to <strong>{selectedProduct.name}</strong> · Category-specific and {selectedProduct.storage_condition ?? 'unspecified'} storage checks</p>
        {applicableTemplates.map((item) => <div className="warehouse-check-item" key={item.checklist_key}>
          <input type="hidden" name="checklist_key" value={results[item.checklist_key] ? item.checklist_key : ''}/>
          <strong>{item.title} {!item.required && <span className="warehouse-optional-label">Optional</span>}</strong>
          {item.applies_to_category_name || item.applies_to_storage ? <small className="warehouse-check-scope">Scope: {[item.applies_to_category_name, item.applies_to_storage].filter(Boolean).join(' · ')}</small> : null}
          <div className="warehouse-check-choice">
            <label><input type="radio" name={`check_${item.checklist_key}`} value="pass" required={item.required} checked={results[item.checklist_key] === 'pass'} onChange={() => setResults((current) => ({ ...current, [item.checklist_key]: 'pass' }))}/> Pass</label>
            <label><input type="radio" name={`check_${item.checklist_key}`} value="fail" required={item.required} checked={results[item.checklist_key] === 'fail'} onChange={() => setResults((current) => ({ ...current, [item.checklist_key]: 'fail' }))}/> Fail</label>
          </div>
          <label className="warehouse-check-note">Finding / corrective-action note (required when failed)<input name={`check_note_${item.checklist_key}`} maxLength={500} placeholder="Describe discrepancy, damage or corrective action"/></label>
        </div>)}
      </>}
    </fieldset>
    <label className="warehouse-wide">Receiving evidence photos (optional)<input name="evidence_photos" type="file" accept="image/jpeg,image/png,image/webp" multiple/><small>Up to 4 photos, JPEG, PNG or WebP, maximum 5 MB each. Stored privately for authorised warehouse and quality staff; photos are attached to this batch’s inspection record.</small></label>
    <p className="notice warehouse-wide">The batch is created in quarantine and cannot be sold until an authorised inspection passes. A receipt stays open for additional lots until staff explicitly close intake.</p>
    <button className="btn warehouse-wide" type="submit" disabled={!selectedProduct || applicableTemplates.length === 0}>Receive batch into quarantine</button>
  </form>;
}
