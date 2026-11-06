# Rasvani — Phase 2 technical foundation

**Status:** scaffold and initial security foundation created; dependency installation and live Supabase verification pending.

## Governing requirements

This implementation follows the owner-approved Rasvani Phase 0 Master Specification v3.0 and the original 29-page master PDF. The approved direction is Next.js + React + TypeScript, Supabase Postgres/Auth/Storage, server-side authorization, database Row-Level Security, least privilege, private storage and secret management. Bihar is the first content focus; taxonomy is prepared for 28 states and 8 Union Territories. No real producers, prices, stock, certifications, warehouse site, seller-of-record or delivery claims are invented.

## Repository structure

- `apps/web`: Next.js App Router application and shared responsive shell.
- `supabase/migrations`: versioned SQL migrations for identity, configurable roles/permissions and audit foundation.
- `prototype-phase-1`: retained Phase 1 clickable prototype, assets and QA evidence.
- `docs`: source PDF, Phase 0 Master Specification v3.0 and project/QA notes.

## Implemented in this first Phase 2 increment

- Next.js App Router + React + TypeScript project configuration.
- Responsive shared header, navigation, skip link, brand styles and footer.
- Initial routes: home, Explore India, Shop, Food Stories, For Producers, For Retailers and Account.
- Canonical 36-region taxonomy data (28 states + 8 UTs).
- Supabase SSR/browser client helpers and session-refresh middleware; middleware does not replace server authorization or RLS.
- Supabase migration for profiles, role assignments, configurable role permissions, audit logs, default customer role on signup, and RLS policies.
- Basic security response headers; no service-role secret in browser code.
- Analytics explicitly disabled by default; no tracking provider selected or activated.

## Security design notes

- New auth users receive only the `customer` role by database trigger. User-editable metadata cannot grant elevated roles.
- Role assignment has no client-side insert/update/delete policy. Privileged provisioning must be implemented server-side with audit records and maker-checker controls.
- Profiles are self-readable/self-updatable; admin read is role-gated. Do not store unnecessary sensitive personal data in the profile row.
- Role permission management is super-admin-only. Audit logs are client read-only for admin; client insert/update/delete policies are intentionally absent.
- Every business table added in later phases must enable RLS and receive tested role-specific policies before data access is enabled.
- Supabase service-role keys must remain server-side only and must never be prefixed `NEXT_PUBLIC_`.
- MFA for staff/admin, storage bucket privacy, upload validation, backups/restore, rate limits, session policy and formal threat review remain to be completed before privileged/live workflows.

## Unresolved decisions retained

Legal seller, stock title/risk, warehouse premises, launch SKU/volume/capacity/staffing, purchase vs consignment, inbound freight, initial product/storage categories, shelf-life thresholds, delivery/carriers, returns/refunds, payment/funds flow, producer settlements, pricing/tax, service geography, customer support, CMS operating choice, map provider, launch languages, brand assets/story, domain/email, hosting/budget, named role assignments, privacy/retention, analytics/marketing consent, B2B activation, UGC/reviews and timeline/resources remain open or deferred in the decision register. The code must not assume answers.

## Environment setup

1. Install Node.js 20.9+ and npm.
2. From repository root, run `npm install`.
3. Copy `apps/web/.env.example` to `apps/web/.env.local`.
4. Add the Supabase project URL and public anon/publishable key after the owner creates/approves the Supabase project. Do not add a service-role key to client env.
5. Apply the SQL migration to a development Supabase project only after review.
6. Run `npm run dev`; verify `/`, `/explore-india`, `/shop`, `/food-stories`, `/for-producers`, `/for-retailers` and `/account`.

## Current environment limitation

At the time of this build, npm registry DNS resolution failed (`EAI_AGAIN registry.npmjs.org`). Therefore dependencies could not be installed in this sandbox, and a Next.js build or live Supabase migration could not yet be run. The scaffold and SQL are source artifacts, not a claim of a running production application. Retry installation in a network-enabled development environment before calling Phase 2 complete.

## Phase 2 verification status (initial increment)

- TypeScript/TSX syntax transpilation: passed for 14 source files using the sandbox TypeScript compiler.
- Phase 1 browser regression suite: passed at desktop/tablet/mobile sizes; mobile account navigation regression fixed.
- Full Next.js typecheck/build: **not run** because the Next.js and Supabase npm dependencies are not installed.
- Supabase SQL migration: reviewed and statically inspected; **not applied or integration-tested** because no approved Supabase project credentials/connection are available.
- Security review is preliminary, not a penetration test or legal/compliance approval.
