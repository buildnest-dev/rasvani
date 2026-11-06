# Phase 10 — Physical stock-count CSV export

The selected stock-count detail provides a user-triggered CSV export of the lines currently visible after applying its product/SKU/batch/bin search and exception filter. The report includes the captured system quantity, entered physical quantity, signed variance, unit, count state, stale flag and reasons, latest read-only stock/inspection diagnostics, escalation level, count notes, investigation finding/note and count timestamp.

The export is generated in the browser from the same protected stock-count line read model already rendered on screen. It does not make a new database request, refresh a snapshot, alter inventory, approve a count or bypass role checks. An empty result cannot be exported. Fields are quoted, embedded quotes escaped, UTF-8 BOM and CRLF are used for spreadsheet compatibility, and formula-like cell prefixes are neutralised to reduce CSV formula-injection risk.

The filename identifies the stock count and active exception filter. The export contains only the lines visible under the current search and filter; clear the search and select “All lines” to export the complete returned snapshot.

No database migration is required. Static source checks are recorded in `qa/phase10_stock_count_csv_export_static_results.json` and consolidated in `qa/static_qa_summary.json`. Browser download behaviour, live database access, full framework build, semantic typecheck, lint and production deployment remain unverified in this environment.
