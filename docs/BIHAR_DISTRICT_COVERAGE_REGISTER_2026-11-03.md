# Bihar District Food Coverage Register

**Audit date:** 3 November 2026  
**Scope:** Source-code and local project-file audit only. The connected production Supabase database was not queried during this audit.  
**Purpose:** Prevent empty district pages, placeholder content, or unverified dish claims from being represented as completed research.

## Administrative district navigation

The project navigation baseline contains all **38 Bihar district names**. This is an administrative navigation count, not a claim that food research is complete.

| # | District | Verified food records in local source seed | Food research | Exact-dish image match |
|---:|---|---:|---|---|
| 1 | Araria | 0 | Pending | Pending |
| 2 | Arwal | 0 | Pending | Pending |
| 3 | Aurangabad | 0 | Pending | Pending |
| 4 | Banka | 0 | Pending | Pending |
| 5 | Begusarai | 0 | Pending | Pending |
| 6 | Bhagalpur | 0 | Pending | Pending |
| 7 | Bhojpur | 0 | Pending | Pending |
| 8 | Buxar | 0 | Pending | Pending |
| 9 | Darbhanga | 0 | Pending | Pending |
| 10 | East Champaran | 0 | Pending | Pending |
| 11 | Gaya | 0 | Pending | Pending |
| 12 | Gopalganj | 0 | Pending | Pending |
| 13 | Jamui | 0 | Pending | Pending |
| 14 | Jehanabad | 0 | Pending | Pending |
| 15 | Kaimur (Bhabua) | 0 | Pending | Pending |
| 16 | Katihar | 0 | Pending | Pending |
| 17 | Khagaria | 0 | Pending | Pending |
| 18 | Kishanganj | 0 | Pending | Pending |
| 19 | Lakhisarai | 0 | Pending | Pending |
| 20 | Madhepura | 0 | Pending | Pending |
| 21 | Madhubani | 0 | Pending | Pending |
| 22 | Munger | 0 | Pending | Pending |
| 23 | Muzaffarpur | 0 | Pending | Pending |
| 24 | Nalanda | 0 | Pending | Pending |
| 25 | Nawada | 0 | Pending | Pending |
| 26 | Patna | 0 | Pending | Pending |
| 27 | Purnia | 0 | Pending | Pending |
| 28 | Rohtas | 0 | Pending | Pending |
| 29 | Saharsa | 0 | Pending | Pending |
| 30 | Samastipur | 0 | Pending | Pending |
| 31 | Saran | 0 | Pending | Pending |
| 32 | Sheikhpura | 0 | Pending | Pending |
| 33 | Sheohar | 0 | Pending | Pending |
| 34 | Sitamarhi | 0 | Pending | Pending |
| 35 | Siwan | 0 | Pending | Pending |
| 36 | Supaul | 0 | Pending | Pending |
| 37 | Vaishali | 0 | Pending | Pending |
| 38 | West Champaran | 0 | Pending | Pending |

## Coverage summary

- Districts in navigation baseline: **38 / 38**.
- District-specific verified food records present as local source seed data: **0 identified**.
- Districts requiring food research and editorial approval: **38 / 38**.
- Exact-dish image matches available in local source seed data: **0 identified**.
- Exact-dish image approvals pending: **38 / 38**.

**Important limitation:** District pages read approved district and food-association records from Supabase at runtime. This source-only audit does not prove that the live database contains zero approved records. Query the connected database before publishing a live coverage total. Do not convert this source-code count into a live-database claim.

## Publication gate for every food record

A district-food record must remain pending until its dish name, vegetarian classification, district relationship, source/evidence, ingredients, description, cultural context, editorial reviewer and exact matching image have been checked. An origin claim requires stronger evidence than a local popularity or traditional-association claim. One dish may be associated with multiple districts; do not imply exclusivity without evidence.

## UI work in this update

All Bihar district routes now share a searchable 38-district navigation panel. Where no approved food records are available to the page, the page presents a transparent research status and explicitly states that no generic image is being substituted. This is a usability and disclosure improvement; it is **not** completion of the food database, image generation, commerce or browser QA.

## Research update — first official-source pass (3 November 2026)

A separate evidence register has been started at `docs/BIHAR_DISTRICT_FOOD_RESEARCH_REGISTER_2026-11-03.md`. It records six named-place food leads from official Bihar government/tourism material: Maner laddoo, Silao khaja, Gaya tilkut, Darbhanga-region kheer-makhana, Barh khoye-ki-lai and Udwantnagar belgrami. These are research leads, not approved live district-food records. Current district mapping, local corroboration, full recipe/cultural review, exact-dish imagery and sellable SKU/stock links remain pending. The first pass does not support claiming complete food coverage for any of Bihar's 38 districts.
