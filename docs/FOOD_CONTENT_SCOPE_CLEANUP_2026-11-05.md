# Food content scope cleanup — 5 November 2026

## Active source boundary

Only two source sets are active for the district food experiences:

1. Food entries and food/research content already present in the user's original `Rasvani_Project_With_Three_Food_Images (1).zip`.
2. The exact district rows and snack names in the user's updated `DOC-20261105-WA0005.pdf` (38 districts, 103 district-row snack entries, 32 unique display-name variants).

## Removed

- The separate `bihar-odop.ts` 38-district programme dataset.
- The `BiharOdopSpotlight` component and its insertion on district guide pages.
- The ODOP gallery/spotlight CSS and ODOP-only crop illustrations that were not used by the supplied PDF snack image mapping.

## Preserved from the original ZIP

- The pre-existing Siwan food-page entries and the original food context/media already in that ZIP.
- The six pending Bihar research leads in `bihar-food-research.ts`: Maner Laddoo, Khoye-ki-Lai, Silao Khaja, Gaya Tilkut, Kheer-Makhana and Belgrami. These remain research leads, not approved products.

## Preserved from the updated PDF

- All 38 district rows and 103 snack entries, including the source's distinction between district-linked candidates and Bihar-wide fallback snacks.
- The source's excluded-food list and the batch/pack-specific shelf-life warning.
- The PDF's `district-linked food / speciality` wording as contextual research data; it is not used as a separate purchasable ODOP catalogue.

## Map

The India map label-collision repair remains in place. The selected Bihar district panel uses the exact PDF snack rows. It does not show the removed ODOP spotlight.

## Verification boundary

Static QA validates source transcription, image-path resolution, the allowed source scope and map wiring. It does not constitute live browser rendering, producer verification, recipe verification or shelf-life validation.

## Preserved item names checked against original ZIP

- Siwan page/content and matching assets already present in the original ZIP: Litti Chokha, Kadhi, Jhal Muri, Sattu, Khaja, Balushahi, Kala Jamun, Mawa Barfi, Peda and Doodh Laddoo. The three non-dry dishes remain part of the original Siwan context only; they are not added to the supplied PDF's dry-snack research list.
- Existing pending Bihar food research leads in the original ZIP: Maner Laddoo, Khoye-ki-Lai, Silao Khaja, Gaya Tilkut, Kheer-Makhana and Belgrami.
- Exact PDF snack list remains the homepage/map district snack catalogue; it is not mixed with the separate ODOP programme table.
