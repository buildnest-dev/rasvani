'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAnyRole } from '@/lib/auth/authorization';
import { createClient } from '@/lib/supabase/server';

const warehouseRoles = ['warehouse_operator', 'admin', 'super_admin'] as const;
const inspectionRoles = ['warehouse_operator', 'quality_reviewer', 'admin', 'super_admin'] as const;
const qualityRoles = ['quality_reviewer', 'admin', 'super_admin'] as const;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i;

function value(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

function validDateOrNull(input: string): string | null | undefined {
  if (!input) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return undefined;
  const date = new Date(`${input}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== input ? undefined : input;
}

function fail(code: string): never {
  redirect(`/warehouse?error=${encodeURIComponent(code)}`);
}

export async function createWarehouseReceipt(formData: FormData) {
  await requireAnyRole(warehouseRoles);
  const warehouseId = value(formData, 'warehouse_id');
  const producerId = value(formData, 'producer_id');
  const deliveryReference = value(formData, 'delivery_reference');
  const notes = value(formData, 'notes');
  if (!uuidPattern.test(warehouseId) || !uuidPattern.test(producerId) || deliveryReference.length > 120 || notes.length > 1000) fail('receipt-fields');
  const supabase = await createClient();
  const { error } = await supabase.rpc('create_warehouse_receipt', {
    p_warehouse_id: warehouseId,
    p_delivery_reference: deliveryReference || null,
    p_producer_id: producerId,
    p_notes: notes || null,
  });
  if (error) fail('receipt-create-failed');
  revalidatePath('/warehouse');
  redirect('/warehouse?receiptCreated=1');
}


export async function closeWarehouseReceipt(formData: FormData) {
  await requireAnyRole(warehouseRoles);
  const receiptId = value(formData, 'receipt_id');
  const reason = value(formData, 'reason') || 'All received lots reviewed; intake closed';
  if (!uuidPattern.test(receiptId) || reason.length > 500) fail('receipt-close-fields');
  const supabase = await createClient();
  const { error } = await supabase.rpc('close_warehouse_receipt', { p_receipt_id: receiptId, p_reason: reason });
  if (error) fail('receipt-close-failed');
  revalidatePath('/warehouse');
  revalidatePath('/admin');
  redirect('/warehouse?receiptClosed=1');
}

export async function receiveWarehouseBatch(formData: FormData) {
  await requireAnyRole(warehouseRoles);
  const receiptId = value(formData, 'receipt_id');
  const productId = value(formData, 'product_id');
  const binId = value(formData, 'bin_id');
  const batchCode = value(formData, 'batch_code');
  const unit = value(formData, 'unit');
  const quantity = Number(value(formData, 'quantity'));
  const manufacturedOn = validDateOrNull(value(formData, 'manufactured_on'));
  const packedOn = validDateOrNull(value(formData, 'packed_on'));
  const expiryDate = validDateOrNull(value(formData, 'expiry_date'));
  const bestBeforeDate = validDateOrNull(value(formData, 'best_before_date'));
  const notes = value(formData, 'notes');
  const evidenceFiles = formData.getAll('evidence_photos').filter((item): item is File => item instanceof File && item.size > 0);

  if (![receiptId, productId, binId].every((id) => uuidPattern.test(id)) || !batchCode || batchCode.length > 120 ||
      !unit || unit.length > 20 || !Number.isFinite(quantity) || quantity <= 0 || quantity > 1_000_000 ||
      [manufacturedOn, packedOn, expiryDate, bestBeforeDate].some((date) => date === undefined) || notes.length > 1000 ||
      evidenceFiles.length > 4 || evidenceFiles.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)) {
    fail('batch-fields');
  }
  if (manufacturedOn && expiryDate && expiryDate < manufacturedOn) fail('date-order');
  if (manufacturedOn && bestBeforeDate && bestBeforeDate < manufacturedOn) fail('date-order');
  const checklistKeys = formData.getAll('checklist_key').map((item) => String(item).trim()).filter(Boolean);
  if (checklistKeys.length > 80 || new Set(checklistKeys).size !== checklistKeys.length || checklistKeys.some((key) => !/^[a-z][a-z0-9_]{2,59}$/.test(key))) {
    fail('checklist-incomplete');
  }
  const checklist = checklistKeys.map((key) => {
    const result = value(formData, `check_${key}`);
    const itemNotes = value(formData, `check_note_${key}`);
    if (!['pass', 'fail'].includes(result) || itemNotes.length > 500 || (result === 'fail' && itemNotes.length < 3)) {
      fail('checklist-incomplete');
    }
    return { key, result, notes: itemNotes || null };
  });

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) fail('receiving-evidence-auth');
  const extensionByMime: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  const uploadedPaths: string[] = [];
  for (const file of evidenceFiles) {
    const objectPath = `${user.id}/${receiptId}/${crypto.randomUUID()}.${extensionByMime[file.type]}`;
    const { error: uploadError } = await supabase.storage.from('warehouse-receiving-evidence').upload(objectPath, file, {
      cacheControl: '3600', upsert: false, contentType: file.type,
    });
    if (uploadError) {
      if (uploadedPaths.length) await supabase.storage.from('warehouse-receiving-evidence').remove(uploadedPaths);
      fail('receiving-evidence-upload');
    }
    uploadedPaths.push(objectPath);
  }
  const { error } = await supabase.rpc('receive_warehouse_batch_checked', {
    p_receipt_id: receiptId,
    p_product_id: productId,
    p_batch_code: batchCode,
    p_quantity: quantity,
    p_unit: unit,
    p_manufactured_on: manufacturedOn,
    p_packed_on: packedOn,
    p_expiry_date: expiryDate,
    p_best_before_date: bestBeforeDate,
    p_bin_id: binId,
    p_checklist: checklist,
    p_notes: notes || null,
    p_photo_paths: uploadedPaths,
  });
  if (error) {
    if (uploadedPaths.length) await supabase.storage.from('warehouse-receiving-evidence').remove(uploadedPaths);
    fail('batch-receive-failed');
  }
  revalidatePath('/warehouse');
  revalidatePath('/admin');
  redirect('/warehouse?batchReceived=1');
}

export async function decideBatchInspection(formData: FormData) {
  await requireAnyRole(inspectionRoles);
  const batchId = value(formData, 'batch_id');
  const decision = value(formData, 'decision');
  const reason = value(formData, 'reason');
  if (!uuidPattern.test(batchId) || !['accepted', 'quarantined', 'rejected'].includes(decision) || reason.length < 3 || reason.length > 500) {
    fail('inspection-fields');
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc('set_batch_inspection', {
    p_batch_id: batchId, p_decision: decision, p_reason: reason,
  });
  if (error) fail('inspection-failed');
  revalidatePath('/warehouse');
  revalidatePath('/admin');
  redirect('/warehouse?inspectionUpdated=1');
}

export async function decideReturnInspection(formData: FormData) {
  await requireAnyRole(qualityRoles);
  const caseId = value(formData, 'case_id');
  const decision = value(formData, 'decision');
  const notes = value(formData, 'notes');
  if (!uuidPattern.test(caseId) || !['inspected_usable', 'rejected', 'disposed'].includes(decision) || notes.length < 3 || notes.length > 1000) {
    fail('return-fields');
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc('inspect_return_case', {
    p_case_id: caseId, p_decision: decision, p_notes: notes,
  });
  if (error) fail('return-inspection-failed');
  revalidatePath('/warehouse');
  revalidatePath('/admin');
  redirect('/warehouse?returnUpdated=1');
}

export async function runExpirySweep() {
  await requireAnyRole(warehouseRoles);
  const supabase = await createClient();
  const { error } = await supabase.rpc('mark_expired_inventory');
  if (error) fail('expiry-sweep-failed');
  revalidatePath('/warehouse');
  revalidatePath('/admin');
  redirect('/warehouse?expiryChecked=1');
}


export async function recallProductBatches(formData: FormData) {
  await requireAnyRole(qualityRoles);
  const productId = value(formData, 'product_id');
  const reason = value(formData, 'reason');
  if (!uuidPattern.test(productId) || reason.length < 5 || reason.length > 500) fail('recall-fields');
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('recall_product_batches', { p_product_id: productId, p_reason: reason });
  if (error || data === null || !Number.isInteger(Number(data)) || Number(data) < 0) fail('recall-failed');
  revalidatePath('/warehouse');
  revalidatePath('/admin');
  redirect(`/warehouse?recallUpdated=1&recalledCount=${Number(data)}`);
}


export async function createPhysicalStockCount(formData: FormData) {
  await requireAnyRole(warehouseRoles);
  const warehouseId = value(formData, 'warehouse_id');
  const notes = value(formData, 'notes');
  if (!uuidPattern.test(warehouseId) || notes.length > 1000) fail('stock-count-fields');
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('create_inventory_stock_count', {
    p_warehouse_id: warehouseId, p_notes: notes || null,
  });
  if (error || typeof data !== 'string' || !uuidPattern.test(data)) fail('stock-count-create-failed');
  revalidatePath('/warehouse');
  redirect(`/warehouse?stockCountId=${data}&stockCountCreated=1`);
}

export async function cancelPhysicalStockCount(formData: FormData) {
  await requireAnyRole(warehouseRoles);
  const countId = value(formData, 'stock_count_id');
  const reason = value(formData, 'reason');
  if (!uuidPattern.test(countId) || reason.length < 5 || reason.length > 500) fail('stock-count-cancel-fields');
  const supabase = await createClient();
  const { error } = await supabase.rpc('cancel_inventory_stock_count', {
    p_stock_count_id: countId, p_reason: reason,
  });
  if (error) fail('stock-count-cancel-failed');
  revalidatePath('/warehouse');
  revalidatePath('/admin');
  redirect(`/warehouse?stockCountId=${countId}&stockCountCancelled=1`);
}

export async function recordPhysicalStockCountLine(formData: FormData) {
  await requireAnyRole(warehouseRoles);
  const countId = value(formData, 'stock_count_id');
  const batchId = value(formData, 'batch_id');
  const quantityText = value(formData, 'counted_quantity');
  const notes = value(formData, 'count_notes');
  const quantity = Number(quantityText);
  if (!uuidPattern.test(countId) || !uuidPattern.test(batchId) || !/^\d+(?:\.\d{1,3})?$/.test(quantityText) || !Number.isFinite(quantity) || quantity < 0 || quantity > 99999999999.999 || notes.length > 500) fail('stock-count-line-fields');
  const supabase = await createClient();
  const { error } = await supabase.rpc('record_inventory_stock_count_line', {
    p_stock_count_id: countId, p_batch_id: batchId, p_counted_quantity: quantity, p_notes: notes || null,
  });
  if (error) fail('stock-count-line-failed');
  revalidatePath('/warehouse');
  redirect(`/warehouse?stockCountId=${countId}&stockCountLineSaved=1`);
}

export async function submitPhysicalStockCount(formData: FormData) {
  await requireAnyRole(warehouseRoles);
  const countId = value(formData, 'stock_count_id');
  if (!uuidPattern.test(countId)) fail('stock-count-fields');
  const supabase = await createClient();
  const { error } = await supabase.rpc('submit_inventory_stock_count', { p_stock_count_id: countId });
  if (error) fail('stock-count-submit-failed');
  revalidatePath('/warehouse');
  revalidatePath('/admin');
  redirect(`/warehouse?stockCountId=${countId}&stockCountSubmitted=1`);
}

export async function recordStockCountVarianceInvestigation(formData: FormData) {
  await requireAnyRole(qualityRoles);
  const countId = value(formData, 'stock_count_id');
  const batchId = value(formData, 'batch_id');
  const finding = value(formData, 'finding');
  const note = value(formData, 'note');
  if (!uuidPattern.test(countId) || !uuidPattern.test(batchId) ||
      !['physical_recount', 'receiving_records_checked', 'movement_history_checked', 'other'].includes(finding) ||
      note.length < 5 || note.length > 1000) fail('stock-count-investigation-fields');
  const supabase = await createClient();
  const { error } = await supabase.rpc('record_inventory_stock_count_variance_review', {
    p_stock_count_id: countId, p_batch_id: batchId, p_finding: finding, p_note: note,
  });
  if (error) fail('stock-count-investigation-failed');
  revalidatePath('/warehouse');
  revalidatePath('/admin');
  redirect(`/warehouse?stockCountId=${countId}&stockCountInvestigationSaved=1`);
}

export async function reviewPhysicalStockCount(formData: FormData) {
  await requireAnyRole(qualityRoles);
  const countId = value(formData, 'stock_count_id');
  const decision = value(formData, 'decision');
  const reason = value(formData, 'reason');
  if (!uuidPattern.test(countId) || !['approve', 'reject'].includes(decision) || reason.length < 5 || reason.length > 1000) fail('stock-count-review-fields');
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('review_inventory_stock_count', {
    p_stock_count_id: countId, p_decision: decision, p_reason: reason,
  });
  if (error || !Number.isInteger(Number(data)) || Number(data) < 0) fail('stock-count-review-failed');
  revalidatePath('/warehouse');
  revalidatePath('/admin');
  redirect(`/warehouse?stockCountId=${countId}&stockCountReviewed=1&varianceLines=${Number(data)}`);
}


export async function createReceivingChecklistTemplate(formData: FormData) {
  await requireAnyRole(['admin', 'super_admin'] as const);
  const checklistKey = value(formData, 'checklist_key');
  const title = value(formData, 'title');
  const categoryId = value(formData, 'category_id');
  const storageCondition = value(formData, 'storage_condition');
  const required = value(formData, 'required') === 'on';
  if (!/^[a-z][a-z0-9_]{2,59}$/.test(checklistKey) || title.length < 3 || title.length > 150 ||
      (categoryId && !uuidPattern.test(categoryId)) ||
      !['', 'ambient', 'chilled', 'frozen', 'other'].includes(storageCondition) || (!categoryId && !storageCondition)) {
    fail('checklist-template-fields');
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc('create_receiving_checklist_template', {
    p_checklist_key: checklistKey, p_title: title, p_category_id: categoryId || null,
    p_storage_condition: storageCondition || null, p_required: required,
  });
  if (error) fail('checklist-template-create-failed');
  revalidatePath('/warehouse');
  redirect('/warehouse?checklistTemplateCreated=1');
}

export async function deactivateReceivingChecklistTemplate(formData: FormData) {
  await requireAnyRole(['admin', 'super_admin'] as const);
  const checklistKey = value(formData, 'checklist_key');
  const reason = value(formData, 'reason');
  if (!/^[a-z][a-z0-9_]{2,59}$/.test(checklistKey) || reason.length < 5 || reason.length > 500) fail('checklist-template-fields');
  const supabase = await createClient();
  const { error } = await supabase.rpc('deactivate_receiving_checklist_template', { p_checklist_key: checklistKey, p_reason: reason });
  if (error) fail('checklist-template-deactivate-failed');
  revalidatePath('/warehouse');
  redirect('/warehouse?checklistTemplateDeactivated=1');
}


export async function setStockCountEscalationRules(formData: FormData) {
  await requireAnyRole(['admin', 'super_admin'] as const);
  const warehouseId = value(formData, 'warehouse_id');
  const warningText = value(formData, 'warning_percent');
  const criticalText = value(formData, 'critical_percent');
  const warning = Number(warningText);
  const critical = Number(criticalText);
  if (!uuidPattern.test(warehouseId) || !/^\d+(?:\.\d{1,3})?$/.test(warningText) || !/^\d+(?:\.\d{1,3})?$/.test(criticalText) ||
      !Number.isFinite(warning) || !Number.isFinite(critical) || warning <= 0 || critical <= warning || critical > 10000) {
    fail('stock-count-threshold-fields');
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc('set_warehouse_stock_count_escalation_rules', {
    p_warehouse_id: warehouseId, p_warning_percent: warning, p_critical_percent: critical,
  });
  if (error) fail('stock-count-threshold-save-failed');
  revalidatePath('/warehouse');
  revalidatePath('/admin');
  redirect('/warehouse?stockCountThresholdsSaved=1');
}


export async function updateReceivingChecklistTemplate(formData: FormData) {
  await requireAnyRole(['admin', 'super_admin'] as const);
  const checklistKey = value(formData, 'checklist_key');
  const title = value(formData, 'title');
  const categoryId = value(formData, 'category_id');
  const storageCondition = value(formData, 'storage_condition');
  const required = value(formData, 'required') === 'on';
  if (!/^[a-z][a-z0-9_]{2,59}$/.test(checklistKey) || title.length < 3 || title.length > 150 ||
      (categoryId && !uuidPattern.test(categoryId)) ||
      !['', 'ambient', 'chilled', 'frozen', 'other'].includes(storageCondition) || (!categoryId && !storageCondition)) {
    fail('checklist-template-fields');
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc('update_receiving_checklist_template', {
    p_checklist_key: checklistKey, p_title: title, p_category_id: categoryId || null,
    p_storage_condition: storageCondition || null, p_required: required,
  });
  if (error) fail('checklist-template-update-failed');
  revalidatePath('/warehouse');
  redirect('/warehouse?checklistTemplateUpdated=1');
}
