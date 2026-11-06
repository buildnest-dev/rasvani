# Phase 4 — Catalogue review workspace

Migration `202611020017_catalogue_review_workspace.sql` adds two role-gated, bounded RPC queues for unpublished products and pending product claims. The protected `/catalogue-review` route separates claim review, product eligibility approval and final publication. Server actions validate IDs, decisions and review reasons, then invoke the existing audited transition functions from migration 006.

Product publication still rechecks approved producer, currently approved facility, active category and all submitted claims. No product, producer, certification, price or inventory data is fabricated. The admin dashboard links to the workspace.

Static checks are not database integration tests. Apply migration 017 after migrations 001–016 and validate the queue functions and role grants in a development Supabase project before operational use.
