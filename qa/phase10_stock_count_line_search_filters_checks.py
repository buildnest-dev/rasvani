from pathlib import Path
import json

root = Path(__file__).resolve().parents[1]
component = (root / 'apps/web/app/warehouse/stock-count-lines.tsx').read_text()
page = (root / 'apps/web/app/warehouse/page.tsx').read_text()
css = (root / 'apps/web/app/globals.css').read_text()
checks = {
    'client_component_is_explicit': "'use client'" in component,
    'search_input_is_accessibly_labelled': 'Find product, SKU, batch or bin' in component and 'type="search"' in component,
    'search_matches_product_name': 'line.product_name' in component,
    'search_matches_sku': 'line.sku' in component,
    'search_matches_batch_code': 'line.batch_code' in component,
    'search_matches_bin_code': 'line.bin_code' in component,
    'all_lines_filter_available': "{ value: 'all', label: 'All lines' }" in component,
    'uncounted_filter_available': "{ value: 'uncounted', label: 'Not counted' }" in component,
    'variance_filter_available': "{ value: 'variance', label: 'Variance' }" in component,
    'stale_filter_available': "{ value: 'stale', label: 'Stale snapshot' }" in component,
    'matched_filter_excludes_stale_lines': "line.counted_quantity === line.expected_quantity && !line.is_stale" in component,
    'filter_buttons_expose_pressed_state': 'aria-pressed={filter === item.value}' in component,
    'filter_group_has_accessible_name': 'aria-label="Filter stock-count lines"' in component,
    'result_count_is_announced': 'aria-live="polite"' in component,
    'empty_result_state_is_explained': 'No batch lines match this search and filter' in component,
    'filter_counts_are_derived_from_loaded_lines': 'counts[item.value]' in component and 'useMemo' in component,
    'count_entry_still_uses_server_action': 'action={recordPhysicalStockCountLine}' in component,
    'variance_investigation_still_uses_server_action': 'action={recordStockCountVarianceInvestigation}' in component,
    'stock_count_id_is_bound_to_each_action': 'name="stock_count_id" value={stockCountId}' in component,
    'stale_reasons_remain_visible': 'line.stale_reasons.map' in component,
    'server_page_uses_filtered_line_component': '<StockCountLines' in page and 'lines={stockCountLines}' in page,
    'inventory_approval_flow_remains_in_server_page': 'Approve &amp; apply variances' in page,
    'responsive_filter_styles_exist': '.warehouse-stock-count-filters' in css and '@media(max-width:520px)' in css,
    'keyboard_focus_style_exists': '.warehouse-stock-count-filter:focus-visible' in css,
}
passed = sum(checks.values())
result = {'suite': 'Stock-count line search and exception filters', 'passed': passed, 'total': len(checks), 'status': 'PASS' if passed == len(checks) else 'FAIL', 'checks': {key: {'passed': value} for key, value in checks.items()}}
(root / 'qa/phase10_stock_count_line_search_filters_static_results.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result, indent=2))
if passed != len(checks):
    raise SystemExit(1)
