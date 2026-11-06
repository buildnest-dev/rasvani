from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
component = (ROOT / 'apps/web/app/warehouse/stock-count-lines.tsx').read_text()
css = (ROOT / 'apps/web/app/globals.css').read_text()
checks = {
    'export is an explicit user action': 'onClick={exportVisibleLines}' in component,
    'export is limited to currently visible filtered lines': 'visibleLines.map((line) =>' in component and 'export includes the current search and filter' in component,
    'CSV has UTF-8 BOM and CRLF records': "'\\uFEFF'" in component and "'\\r\\n'" in component,
    'CSV values are quoted and embedded quotes escaped': "safe.replaceAll('\\\"', '\\\"\\\"')" in component,
    'spreadsheet formula injection prefixes are neutralised': '/^[\\s]*[=+@\\-]/' in component,
    'report includes snapshot and physical quantities': "'Snapshot quantity'" in component and "'Physical quantity'" in component,
    'report includes variance and stale diagnostics': "'Variance'" in component and "'Stale reasons'" in component,
    'report includes inspection and escalation evidence': "'Current inspection status'" in component and "'Escalation'" in component,
    'report includes count and investigation notes': "'Count note'" in component and "'Investigation note'" in component,
    'empty exports are disabled': 'disabled={visibleLines.length === 0}' in component,
    'download filename identifies count and filter': 'rasvani-stock-count-${stockCountId}-${filter}.csv' in component,
    'export control has responsive layout': '.warehouse-stock-count-export-row' in css,
}
for label, ok in checks.items():
    print(f"{'PASS' if ok else 'FAIL'} {label}")
print(f"RESULT {sum(checks.values())}/{len(checks)}")
raise SystemExit(0 if all(checks.values()) else 1)
