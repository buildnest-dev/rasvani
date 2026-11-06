# Phase 3 — Cross-region food search

**Date:** 2 November 2026  
**Status:** Source implementation complete; live database and browser validation not run.

## What changed

- Added a server-rendered search experience to `/explore-india` for published foods, approved district guides, matching states/Union Territories, and active categories.
- Search combines the canonical product name with evidence-reviewed product name variants, regional spellings, transliterations and synonyms.
- Reviewed search terms are searched across all 12 planned locales: English, Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Punjabi, Kannada, Malayalam, Odia and Assamese. No single locale must be selected before searching.
- Searching for an approved district or region can surface products connected through separately approved regional associations.
- The `/shop` search now also recognizes reviewed regional terms while retaining its active-category filter.
- User input is NFC-normalized, bounded to 80 characters, and stripped of PostgREST pattern metacharacters before being used in substring filters. Result sets are bounded.

## Publication and trust controls

- Only `product_search_terms.review_status='approved'` records are used.
- The public search-term RLS policy independently requires the related product to be approved and published.
- Products are queried only when approved and published; categories must be active; districts must be approved; regional associations must be approved and pass their own product/district RLS checks.
- Search terms require an evidence reference and locale in the database. Their draft, submission, reviewer and audit lifecycle is provided by migration `202611020022_regional_district_associations_search.sql`.
- Product-to-region labels retain the recorded relationship type. They are not transformed into exclusive-origin claims.
- No product, alias, district or food-origin sample data has been invented or seeded.

## Search behaviour and boundaries

Search uses Unicode NFC normalization and case-insensitive substring matching against canonical product names and the reviewed `normalized_term` field. It searches all supported locales in one request, so a user can enter a term in a supported script without changing a language selector.

This is not automatic translation, automatic transliteration, spelling correction, phonetic matching or fuzzy search. Those capabilities would require separately specified language/search infrastructure and validated test corpora. Regional alternatives appear only after a content editor supplies the term and evidence reference and a quality reviewer approves it.

A region or category search can show only products with approved relationships or active categories. Empty and unconfigured states are explicit. Search result counts are not presented as complete catalogue counts.

## Files

- `apps/web/app/explore-india/page.tsx`
- `apps/web/components/regional-search-results.tsx`
- `apps/web/app/shop/page.tsx`
- `apps/web/app/globals.css`
- `qa/phase3_regional_search_checks.py`
- `qa/phase3_regional_search_static_results.json`

## Verification

- Static search checks: 31/31 passed.
- Consolidated static QA: see `qa/static_qa_summary.json`.
- Not run: migration application, live Supabase/PostgreSQL RLS verification, Next.js build, authenticated browser tests, formal accessibility audit, performance tests and security penetration testing.
