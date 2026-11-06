# Phase 3 — Evidence-reviewed state and Union Territory overviews

## Delivered

- Added a dedicated `region_guides` record for state / Union Territory editorial copy, separate from the underlying 36-region taxonomy.
- Content editors can prepare a short regional introduction (up to 500 characters) and a food-heritage note (up to 2,000 characters), each tied to an evidence reference.
- Saving or revising a region guide returns it to draft status. Content editors cannot approve their own work; a quality reviewer or administrator must review and record a reason.
- The protected `/regional-review` queue now includes state / UT guides alongside district guides, food associations and regional search terms. Authoring and review transitions invalidate the state and district route patterns so approved changes are reflected on customer-facing pages.
- Public state / UT overview pages display only approved guide copy, approved district guides and approved region-level product associations. District-specific food associations remain on district pages.
- Region-level food cards preserve the relationship labels (`origin_claim`, `produced_in`, `traditionally_associated_with`, `popular_in`) and avoid implying exclusive origin.
- The page provides explicit empty, unconfigured and query-error states; no regional facts, foods or producer claims are seeded.

## Database and governance

Migration `202611020024_region_guide_content.sql` adds the evidence-backed content table, approved-only public RLS, a role-gated draft-save RPC, and extends the regional review queue, submission and decision RPCs to support `region_guide`. Region taxonomy records are not made public by a guide approval, and a guide does not imply stock, seller approval or delivery coverage.

## Not verified

The migration and its RPCs have not been executed against live PostgreSQL / Supabase in this environment. Next.js production build, full typecheck, authenticated browser workflows, security penetration tests, formal accessibility audit and performance tests remain not run. Apply migrations through `024` in order in a dedicated development Supabase project before live use.
