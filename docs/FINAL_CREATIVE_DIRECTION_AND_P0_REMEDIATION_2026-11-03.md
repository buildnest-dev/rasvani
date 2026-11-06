# Rasvani — final creative direction and P0 remediation plan
Date: 3 November 2026

## Approved brand and experience direction

Rasvani is a premium Indian regional vegetarian-food discovery and e-commerce experience. Its emotional proposition is helping people rediscover foods associated with home, hometowns, states and districts, and order approved products where delivery service is available.

Core line:
> India Is More Than a Place. It's a Thousand Flavours of Home.

Supporting line:
> From your hometown to wherever life takes you, let the taste of home travel with you.

The RASO reference is used only for the warm cream, deep maroon, gold, terracotta and green visual direction. Rasvani retains its own name, identity, logo and information architecture.

## Homepage content update in this checkpoint

- The English homepage headline now uses the approved emotional proposition.
- The English hero description explains regional food discovery, stories, and approved product ordering.
- The availability wording is qualified: ordering is presented as available only where service is supported; no blanket pan-India availability is claimed.
- The non-English hero headline translations are draft strings and require native-language review before production approval.
- The long English hero description is currently displayed only in English; other locales retain their existing localized shorter description. This avoids showing an untranslated long English block under a non-English locale.
- Existing homepage section order and separate `/india-map` and `/explore-india` routes are preserved.

## P0 — India administrative geography and discovery

### Current verified code facts

- `apps/web/lib/regions.ts` defines 36 navigation regions: 28 States and 8 Union Territories.
- `apps/web/components/india-boundary-map.tsx` currently loads PMTiles labelled as an LGD 2024 snapshot via Bharatlas and visibly states 785 district polygons.
- The district route is database-backed and publishes only approved district records and approved vegetarian/vegan associations.
- `apps/web/lib/bihar-districts.ts` contains a Bihar navigation fallback, not a complete official district master for India.
- No complete, independently reviewable current district-name index is present for every region.
- No verified vegetarian-food association dataset is present for every district.
- A district's administrative existence is not evidence that any particular food originates in or is exclusive to it.

### Current source research (3 November 2026)

- The OGD Platform India LGD Districts resource reports an update date of 27 October 2026 and says it contains LGD district codes, with monthly updates. It is the appropriate current administrative-code source to acquire and validate.
- The Ministry of Panchayati Raj explains that LGD assigns unique location codes and that State/UT departments update the directory.
- Survey of India publishes an Administrative Boundary Database and describes state/district/sub-district boundary products. Its 2025 vector-data catalogue describes harmonisation with ORGI, while the 2025–26 DST annual report says harmonised, discrepancy-free boundary data from 16 States/UTs had been published to the Survey of India portal. This does not, by itself, establish a complete, current, single-licence pan-India district boundary layer.
- Bharatlas currently describes its LGD 2024 layer as 785 districts and states CC0 / CC BY 4.0. That is a historical dataset and must not be labelled as a current district boundary snapshot.

Sources:
- OGD LGD Districts: https://data.gov.in/resource/local-government-directory-lgd-districts
- Ministry of Panchayati Raj LGD overview: https://panchayat.gov.in/en/lgd/
- Survey of India ABDB: https://surveyofindia.gov.in/pages/administrative-boundary-data-base-abdb-
- Survey of India vector data catalogue: https://www.surveyofindia.gov.in/UserFiles/files/Vector%20Data%20Catalog%202025%281%29.pdf
- DST Annual Report 2025–26: https://dst.gov.in/sites/default/files/DST%20AR%20%202025-26%20ENG_Web.pdf
- Bharatlas data and licence disclosure: https://bharatlas.com/

### P0 implementation sequence and gates

1. Acquire the latest official LGD States and Districts export/API response. Preserve original files, retrieval date, update date, schema, checksums and source attribution.
2. Validate parent-state relationships, unique LGD codes, duplicate names, renamed districts and effective dates. Produce a reconciliation report; do not hardcode a timeless district count.
3. Obtain current district/state polygon geometry with explicit reuse rights. Confirm licence and provenance before importing or redistributing. Reconcile every polygon to an LGD code; do not rely on names alone.
4. If a complete licensed boundary layer cannot be obtained, retain a clearly dated/labelled historical map preview or provide the verified region/district index as the authoritative route. Do not represent 2024 geometry as current.
5. Add a complete district index for all 36 regions only from the approved official LGD snapshot. Keep the district list independent from food claims.
6. Curate food associations separately. Every dish requires source evidence, food classification, relationship type, reviewer, approval status and review date. Keep `origin_claim`, `produced_in`, `traditionally_associated_with` and `popular_in` distinct.
7. Publish food cards only after review. Every visual must match the named dish. Use approved product photography for purchasable products; use commissioned/AI-generated editorial imagery only as illustrative content, without presenting it as a real product photograph.
8. Test map-to-state, state-to-district, district-to-food, keyboard/touch interaction, fallback index, loading/error states and route consistency.

### P0 acceptance criteria

- 36 regions correctly classified as 28 States + 8 Union Territories.
- All active districts in the dated official LGD snapshot imported exactly once under the correct parent, with LGD code and provenance.
- District geometry is current, licensed and joined by LGD code; visible map credits identify dataset date and licence.
- User can select a State/UT, then any verified district, then view only approved food associations.
- No unverified dish origin, exclusivity, producer, image, certification, product or availability claim is published.
- Map remains on `/india-map`; `/explore-india` remains a separate editorial/search experience; homepage contains only a preview/link.

## Premium 3D experience — after P0 approval

The two Reels are animation references only. Build original Rasvani motion choreography, not copied layouts or brand elements.

- Hero: layered scene, independent food elements, camera push and scroll depth.
- Food collections: dish-specific movement, focal-point-aware zoom and subtle perspective.
- State/district discovery: restrained transitions that never impair map accuracy or selection.
- Product detail: accurate product photography, stable gallery, gentle depth and controlled zoom.
- Stories/recipes: editorial camera movement and staggered text/image reveals.
- Producer/Better Choices/account/operations: restrained motion matched to task seriousness.
- Navigation/buttons: bounded tilt, clear focus, responsive menu transitions.
- Respect reduced motion, keyboard access, touch, low-power devices, image loading and performance budgets.

## Verification status

- Homepage copy update: implemented in source.
- 11 non-English headline strings: draft translations; native review pending.
- P0 current official district export: not yet acquired/validated in this working session.
- Current licensed complete district geometry: not yet confirmed.
- Complete verified district food associations: not populated.
- Live Next.js browser testing: pending dependency installation; prior attempts failed because `next` was not installed.
- Reel-matching quality: not claimed until browser implementation and review are complete.

## Approval boundary

This checkpoint updates the approved creative direction and homepage copy, and records the P0 source/data gates. It does not declare P0 complete, does not claim a live browser result, and does not advance to remaining major PDF implementation stages without the user's review and approval.
