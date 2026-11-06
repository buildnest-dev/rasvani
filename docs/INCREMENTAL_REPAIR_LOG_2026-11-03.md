# Rasvani incremental repair log — 3 November 2026

## Scope of this update

This is an incremental repair of the existing Rasvani project. No page, feature, business rule, or approved fulfilment decision has been removed or replaced.

## India Map module interop hardening

**File:** `apps/web/components/india-boundary-map.tsx`

The PMTiles initialisation previously assumed that the dynamic `maplibre-gl` import always exposed the protocol methods on the module namespace. ESM/CommonJS interop can expose the MapLibre namespace through the module's `default` export instead. The initialisation now resolves `default ?? module`, validates that `addProtocol` and `removeProtocol` are callable, and reports an actionable setup error if the expected API is absent. This is intended to prevent an opaque `addProtocol` undefined crash and make package/API mismatch diagnosable.

**Verification limitation:** dependencies are not installed in this working copy (`node_modules` is absent), and the prior install did not complete. Therefore the actual MapLibre browser initialisation, remote PMTiles requests, and map rendering are **not yet runtime-verified**. The source patch is not proof that the blank map is fully fixed. A browser run with the installed dependencies and access to the boundary/glyph hosts is still required.

## Newly supplied animation references reviewed

Two newly uploaded vertical screen-recording references were sampled visually:

- `WhatsApp Video 2026-11-03 at 3.31.14 PM(1).mp4` — approximately 31.4 seconds. The visible design direction uses a dark, editorial food presentation, large high-contrast typography, close-up plated-food visuals, dramatic lighting, and section-by-section food storytelling. Rasvani should adapt this direction to vegetarian traditional foods only.
- `WhatsApp Video 2026-11-03 at 12.08.37 PM(6).mp4` — approximately 29.2 seconds. The visible direction includes festive sweets presented as hero objects, floating/rotating arrangements, gold-toned lighting, and celebratory sparkle/particle accents. Rasvani can reinterpret this with verified traditional vegetarian sweets and original compositions.

These are visual references, not assets to copy. Do not reproduce their exact layout, text, branding, food scene, or choreography. The first reference visibly includes non-vegetarian imagery; that imagery must not be reproduced in Rasvani. Use vegetarian alternatives such as regional sweets, savouries, breads, grains, spices, and plated vegetarian dishes.

## Existing data and content safeguards retained

- The existing 2024 LGD/Bharatlas district geometry remains a historical snapshot and must not be represented as current or complete.
- District food associations remain evidence-gated. No food, origin claim, producer, product availability, licence, or certification has been invented in this update.
- AI editorial artwork must not be presented as a real product photograph.
- India Map and Explore India remain separate experiences.
- The Producer → Rasvani Warehouse/Collection Centre → Customer fulfilment model remains unchanged.

## Static verification run

- `qa/final_creative_direction_p0_checks.py`: 11/11 passed.
- `qa/phase3_district_discovery_checks.py`: 22/22 passed.
- `qa/phase3_regional_directory_checks.py`: 12/12 passed.

These are static checks only. They do not prove browser rendering, live Supabase behaviour, map tile availability, mobile layout quality, or visual parity with the supplied animation references.

## Next required verification

1. Install the project's declared dependencies reproducibly.
2. Run the Next.js application.
3. Confirm the MapLibre module shape and PMTiles protocol registration in the browser.
4. Confirm state and district polygons render and can be selected.
5. Check the remote tile and glyph requests, including CORS/range responses.
6. Test desktop and mobile map behaviour.
7. Implement and visually review the section-specific vegetarian motion choreography; do not label it complete until reviewed in-browser.

## 2026-11-03 — Food Stories hydration mismatch remediation

- Reported browser overlay: React hydration warning on `/food-stories`, pointing to the `.journal-hero-grid` element with client-added `data-motion-reveal` and inline `--motion-stagger` attributes.
- Root cause indicated by the source: `SiteMotionDirector` used `useEffect` to annotate React-rendered route elements. In the App Router, streamed child route content can still be hydrating when a parent client effect and its observers begin mutating those elements.
- Change made: defer motion observer setup until the browser `load` event and an additional 1.2-second settling period. Cleanup cancels the timer and disconnects observers/listeners. Motion remains progressive enhancement; static content is not hidden before setup.
- Scope: `apps/web/components/site-motion-director.tsx`.
- Verification status: source remediation applied; runtime/browser confirmation is still pending because dependencies and a working browser test environment have not yet been established. Re-test `/food-stories` with extensions disabled and confirm the hydration overlay is absent, then check other routes for hydration warnings.
