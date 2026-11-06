# Phase 3 — Regional discovery review workspace

**Date:** 2 November 2026  
**Route:** `/regional-review`  
**Database dependency:** migration `202611020022_regional_district_associations_search.sql`

## Implemented

The protected regional discovery desk connects evidence-backed regional content preparation and independent approval for three record types:

1. **District guides:** editors provide the canonical state/UT, district name, URL slug and evidence reference.
2. **Food-to-region associations:** editors choose an already published product, relationship type, optional approved district, explanatory note and evidence reference. Relationship types remain distinct: origin claim, produced in, traditionally associated with and popular in. Multiple region links are allowed; the interface explicitly warns against unsupported exclusivity.
3. **Localized product search terms:** editors choose a published product, one of the 12 planned locales, term, term type and evidence reference. Machine-generated translation is not labelled as reviewed.

Each form can save a draft or save and submit it to the review queue. A successful save followed by a failed submission leaves the item as a draft and shows that distinction. The pending review queue is returned by the bounded `get_regional_discovery_review_queue` database function.

Quality reviewers, admins and super admins can approve or reject pending items with a required reason. Content editors can author and submit but cannot make approval decisions. The database RPCs recheck role and record state, set reviewer identity/time/reason and append audit entries. Public RLS still requires approved district/association/term records and published/approved parent products where relevant.

The admin dashboard now links to the workspace. Actions revalidate regional discovery and shop routes after transitions.

## Guardrails and limits

- No district or food examples are seeded or fabricated.
- Product selectors expose only approved and published products.
- District selectors expose only approved district taxonomy entries.
- Region selection uses the canonical 36-region list and the database verifies the submitted region ID exists.
- A selected district carries its own region ID into the association RPC; the database trigger independently checks region/district consistency.
- Evidence references are captured as references only; this interface does not fetch or validate the source itself. The human reviewer must inspect it.
- Approval does not certify food safety, origin or legal compliance; it records the internal editorial/quality decision.
- No bulk approvals, direct table writes or public draft visibility are introduced.

## Verification

`qa/phase3_regional_review_checks.py` provides static source checks for the route, role guards, forms, RPC wiring, validation, audit integration, publication guardrails, admin link and responsive styling. Static checks do not prove live RLS or database behavior.

Live Supabase migration execution, authenticated browser testing, full Next.js build/typecheck, security penetration, formal accessibility and performance audits remain **NOT RUN** in this environment. Apply migrations in numerical order through `022` to a dedicated development Supabase project before operational use.
