# Rasvani — Windows setup and deployment guide

This guide explains how to run the current source ZIP on a Windows 10/11 computer. The current project is a development scaffold, not a production-ready commerce deployment. Keep the first setup on a local machine and a separate Supabase development project.

## 1. Extract the ZIP

1. Download the latest Rasvani project package(s) from the ChatGPT conversation. If the complete archive download fails, use the smaller Core, Documentation/QA and Prototype archives and extract them into the same parent folder.
2. In File Explorer, right-click the ZIP and choose **Extract All…**.
3. Choose a simple path such as `C:\Projects\Rasvani` and extract it.
4. Open the extracted `Rasvani_Project` folder. It should contain `package.json`, `apps`, `supabase`, `docs`, `prototype-phase-1` and `qa`.

Do not run npm commands from inside `apps\web`; run them from the project root where the root `package.json` is located.

## 2. Install prerequisites

- Install **Node.js 20.19 or newer (LTS recommended)** from the official Node.js website. npm is included.
- Close and reopen PowerShell after installation.
- Verify the tools:

```powershell
node --version
npm --version
```

Use Node.js `v20.19.0` or newer. The current web dependencies include packages that warn on Node 20.18.x.

## 3. Install project dependencies

Open PowerShell and change to the extracted project root (adjust the path if you chose another folder):

```powershell
Set-Location C:\Projects\Rasvani\Rasvani_Project
npm install
```

The ZIP currently does not include a generated `package-lock.json`. The first `npm install` resolves the declared package versions and creates the lockfile. Keep that lockfile with the project thereafter; on later clean installs use `npm ci`.

If installation fails, check the internet connection, corporate proxy/firewall and Node/npm versions. Do not delete the lockfile once created just to bypass an install issue.

### One-command Windows setup (optional)

After extracting the project and installing Node.js 20.19+, open PowerShell in the `Rasvani_Project` folder and run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\windows-install-and-run.ps1
```

The script checks Node/npm, runs `npm install` from the repository root, then starts the existing Next.js workspace. Keep that PowerShell window open and visit `http://localhost:3000`. It does not create a new app or replace project files. If the install fails, save the complete error output and stop; do not repeatedly clear npm caches or remove lockfiles.

## 4. Configure Supabase (development project only)

1. Create a separate development project in Supabase.
2. In Supabase project settings, copy the Project URL and the publishable/anon public key.
3. In PowerShell, from the project root, create the local environment file:

```powershell
Copy-Item .\apps\web\.env.example .\apps\web\.env.local
notepad .\apps\web\.env.local
```

4. Fill in the values:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
NEXT_PUBLIC_ANALYTICS_ENABLED=false
```

Use the exact URL and public key from your own Supabase project. Do not paste a `service_role` or secret key into this file, any `NEXT_PUBLIC_` variable, browser code, screenshots or source control. Keep `.env.local` private; it should not be committed or included in a shared ZIP.

## 5. Apply database migrations in order

The SQL migrations are in `supabase\migrations`. For a first development setup, open the Supabase Dashboard **SQL Editor** for your development project and apply every file below in ascending filename order. The current project contains 43 migrations:

1. `202611020001_phase2_identity_access_audit.sql`
2. `202611020002_phases3_10_domain_foundation.sql`
3. `202611020003_inventory_workflows.sql`
4. `202611020004_receiving_returns_expiry.sql`
5. `202611020005_reservation_lifecycle.sql`
6. `202611020006_producer_catalogue_governance.sql`
7. `202611020007_customer_commerce_b2b.sql`
8. `202611020008_editorial_translation_consent.sql`
9. `202611020009_admin_reporting_operations.sql`
10. `202611020010_editorial_workspace_queue.sql`
11. `202611020011_translation_workspace_queue.sql`
12. `202611020012_producer_self_service_application.sql`
13. `202611020013_warehouse_workspace.sql`
14. `202611020014_customer_order_workspace.sql`
15. `202611020015_business_self_service_portal.sql`
16. `202611020016_business_verification_queue.sql`
17. `202611020017_catalogue_review_workspace.sql`
18. `202611020018_producer_product_submission.sql`
19. `202611020019_producer_facility_self_service.sql`
20. `202611020020_private_product_media.sql`
21. `202611020021_public_approved_product_media.sql`
22. `202611020022_regional_district_associations_search.sql`
23. `202611020023_district_guide_content.sql`
24. `202611020024_region_guide_content.sql`
25. `202611020025_private_receiving_evidence.sql`
26. `202611020026_private_receiving_evidence_review.sql`
27. `202611020027_warehouse_recall_workspace.sql`
28. `202611020028_recall_order_traceability.sql`
29. `202611020029_inventory_movement_ledger.sql`
30. `202611020030_inventory_stock_count_reconciliation.sql`
31. `202611020031_configurable_receiving_checklists.sql`
32. `202611020032_stock_count_variance_escalation.sql`
33. `202611020033_receiving_checklist_template_editing.sql`
34. `202611020034_stock_count_variance_investigation.sql`
35. `202611020035_immutable_stock_count_investigation.sql`
36. `202611030036_cancel_open_inventory_stock_counts.sql`
37. `202611030037_audit_stock_count_line_edits.sql`
38. `202611030038_stock_count_decision_audit_read_model.sql`
39. `202611030039_prevent_overlapping_warehouse_stock_counts.sql`
40. `202611030040_enforce_one_active_stock_count_per_warehouse.sql`
41. `202611030041_expose_stale_stock_count_snapshots.sql`
42. `202611030042_explain_stale_stock_count_lines.sql`
43. `202611030043_product_dietary_classification_review.sql`

Review each migration before running it and retain the execution result. Do not apply these to a production database yet. Some migrations contain functions, policies, enums and grants; if one fails, stop and resolve the SQL error before running later migrations. Do not blindly rerun a partially applied migration. Live Supabase/PostgreSQL execution has not yet been verified by this project build.

## 6. Start the website locally

The India Map uses MapLibre GL JS 6.x with the PMTiles 4.x protocol. Its map tiles are served from the attributed 2024 Local Government Directory boundary snapshot via Bharatlas. The map needs a network connection to load those external tiles. If tile access is blocked, the page retains the complete 36-region index and the Bihar district list as navigation fallbacks.

From the project root:

```powershell
npm run dev
```

Open `http://localhost:3000` in your browser. Keep the PowerShell window open while using the local site. Press `Ctrl+C` to stop the development server.

## 7. Run local checks before sharing a build

From the project root:

```powershell
npm run typecheck
npm run lint
npm run build
```

All three commands must complete successfully before treating the application build as validated. The registered static QA suites can also be run with Python 3 from the project root. In PowerShell:

```powershell
Get-ChildItem .\qa\phase*_checks.py | Sort-Object Name | ForEach-Object {
    python $_.FullName
    if ($LASTEXITCODE -ne 0) { throw "QA failed: $($_.Name)" }
}
python .\qa\build_static_qa_summary.py
```

Static checks do not replace SQL execution, RLS tests, browser end-to-end tests, accessibility review, penetration/security review or legal review.

## 8. Production hosting — only after launch gates are closed

A production deployment needs an owner-approved hosting account, domain, environment variables, Supabase production project, database backup/restore plan, monitoring, security review and operational/legal sign-off. Those are not configured in this ZIP.

For a Next.js host such as Vercel, the general deployment sequence is:

1. Put the reviewed source in a private Git repository; exclude `.env.local`, secrets, build output and `node_modules`.
2. Import the repository into the hosting provider.
3. Set the application root directory to `apps/web` (or configure the provider to build the npm workspace from the repository root using the root scripts).
4. Set the production environment variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the production Supabase project's public values.
5. Run the production build and verify sign-in, sign-out, redirects, error handling and public pages against the production configuration.
6. Apply reviewed migrations to production only after staging validation and backups.
7. Configure the approved domain, HTTPS, monitoring, backups, privacy/cookie notices, support and incident response.

Do not enable public checkout, payment collection, producer onboarding, B2B trading or warehouse dispatch merely because the website is hosted. Seller-of-record, tax, payment/funds flow, shipping coverage, returns, warehouse site/capability, legal compliance and operational staffing decisions remain open. Payment and carrier integrations are not configured.

## Troubleshooting

- **`node` or `npm` not recognised:** reinstall Node.js LTS, reopen PowerShell and recheck PATH.
- **Dependency install fails:** confirm internet/DNS/proxy access; run `npm install` from the repository root. The sandbox's earlier npm DNS failure does not imply your Windows computer has the same issue.
- **Port 3000 is busy:** stop the other process or run `npm run dev -- --port 3001` and open `http://localhost:3001`.
- **Supabase auth/config errors:** check the exact project URL/public key in `apps\web\.env.local`, then restart the dev server.
- **SQL migration error:** stop at the first failure and keep the full error output; do not skip ahead or claim the database is ready.

13. `202611020013_warehouse_workspace.sql`


## Warehouse stock-count navigation

The selected stock-count detail includes local search across product name, SKU, batch/lot and bin, along with filters for uncounted, variance, stale and matched lines. These controls operate on the rows returned for the selected count and do not change the database or require an additional migration. Continue to use the normal server-side count, investigation and independent review actions; the filters are a navigation aid, not an approval or inventory control.
