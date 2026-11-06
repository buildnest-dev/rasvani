# India district taxonomy and map-boundary audit — 3 November 2026

## Audit outcome

The current project has the canonical 36-region directory (28 States and 8 Union Territories), but it does **not** yet contain a complete, independently reviewable district-name index for every region, and it does not contain verified vegetarian-food content for every district.

The current map geometry is a 2024 Local Government Directory (LGD) snapshot distributed through Bharatlas PMTiles. The project code labels that archive as containing 785 district polygons. This is a historical boundary archive, not a current administrative register.

The Government of India's LGD portal was checked on 3 November 2026. Its public dashboard reports 36 States/UTs and 790 districts. The Ministry of Panchayati Raj describes LGD as the authoritative location directory for administrative units and says State/UT departments maintain the up-to-date records. The current portal total therefore differs from the project's 2024 geometry archive by five districts. Do not silently treat the 785-polygon archive as a current 790-district boundary dataset.

## Sources checked

1. Ministry of Panchayati Raj, Local Government Directory: https://lgdirectory.gov.in/ — public dashboard reported 36 States/UTs and 790 districts when checked on 3 November 2026.
2. Ministry of Panchayati Raj, LGD overview: https://panchayat.gov.in/en/lgd/ — describes the directory, unique LGD codes and State/UT department maintenance.
3. Open Government Data Platform India, LGD catalogue: https://www.data.gov.in/catalog/local-government-directory-lgd — catalogue last updated 2 November 2026 when checked.
4. Open Government Data Platform India, LGD Districts resource: https://data.gov.in/resource/local-government-directory-lgd-districts — district-code dataset, described as monthly; last updated 27 October 2026 when checked.
5. Bharatlas: https://bharatlas.com/ and https://bharatlas.com/docs — existing 2024 vector geometry archive and its published licence/metadata.

## Current codebase facts

- `apps/web/lib/regions.ts` contains 36 canonical region names in the required 28-State + 8-UT order.
- `apps/web/lib/bihar-districts.ts` contains 38 Bihar district navigation names. These are navigation records, not food-origin evidence.
- `apps/web/components/india-boundary-map.tsx` loads 2024 state and district PMTiles remotely. It currently reports the historical archive's 785 district polygons.
- `supabase/migrations/202611020022_regional_district_associations_search.sql` creates evidence-referenced district records and reviewed regional product associations. It intentionally seeds no district or food examples.
- Public district pages display only approved district records and approved associations linked to approved vegetarian/vegan products. Missing content remains a curation-pending state.

## Required next work — do not fabricate data

1. Obtain the latest downloadable district master from the official LGD / OGD source, preserving LGD state and district codes, official English names, parent-state mapping, effective/update date and source-file provenance.
2. Validate the 36 State/UT parent records and every district row. Reconcile the official district count with the downloadable file; do not assume a dashboard count alone supplies the complete district list.
3. Keep district administrative taxonomy separate from district food heritage. A district row does not imply that any food is traditionally associated with it.
4. For each proposed traditional vegetarian food, retain its source/evidence, language variants, relationship type, review status, reviewer and approval date. Publish only after the association and food classification pass their existing quality gates.
5. Obtain current, licensed geographic boundaries that correspond to the approved LGD district codes. Match every polygon to an LGD district code; do not rely on name-only matching where names repeat or differ.
6. Record source version, download date, licence, checksum, importer version, reconciliation report and owner for future updates.
7. Preserve prior district identifiers and audit history when a district is renamed, split, merged or otherwise reorganised. Do not delete historical associations without an approved migration plan.

## Acceptance criteria

- All 36 regions are present and correctly classified as State or Union Territory.
- Every active district in the approved official LGD snapshot appears exactly once under the correct parent region, with its LGD code and source provenance.
- The imported district total reconciles to the same dated official source snapshot; the total is not hardcoded as a timeless number.
- Every mapped district polygon matches an approved LGD district code, and the map visibly discloses the boundary dataset date and licence.
- A user can select a State/UT, select any district from the verified index or map, and reach its district food collection state.
- No district food, origin statement, producer, image or product is published without the required evidence and approval.
- The complete interactive map remains on `/india-map`; the homepage contains only a compact preview and links.

## Current status

**Administrative taxonomy: partial.** **Current district geometry: needs replacement/reconciliation.** **Verified district vegetarian-food content: not populated.** The existing review workflow is retained and should be used for future publication.
