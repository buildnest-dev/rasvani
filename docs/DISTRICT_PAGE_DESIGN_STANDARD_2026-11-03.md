# Rasvani District Page Design Standard — 2026-11-03

## Reference direction
The user-provided Siwan reference image is the visual direction for every district route: warm cream canvas, deep maroon headings and navigation, restrained gold accents, editorial serif typography, district navigation, category filters, rich food cards and a layered visual introduction.

## Route and content rule
Each district has its own route under `/explore-india/[region]/district/[district]`. The page template is shared, but all food, place, gallery, producer and story content must be district-specific. Never copy Siwan records, images, counts or place names into another district.

## Required sections on every district page
1. District hero and introduction.
2. Traditional food collection, with all researched and reviewed food names, category/search controls, dish-specific visual, ingredients, cultural context and evidence-backed district relationship.
3. Food stories and traditional preparation/festival context.
4. Famous places: verified landmarks, local markets, villages and food-making locations.
5. District-specific visual gallery.
6. About the district and its food heritage.
7. Local producers and approved Rasvani catalogue products when available.
8. Cart action only for an approved, in-stock sellable SKU linked to the relevant food record.

## Visual and motion rules
- AI-generated 3D editorial food artwork must depict the named dish accurately and be labelled as AI artwork where a visitor could mistake it for documentary photography.
- Every dish requires its own visual brief and asset; do not reuse one dish image for another dish.
- Famous-place visuals must be location-specific. AI artwork is editorial interpretation, not proof of a real site or documentary photography.
- Motion should be subtle, performant, responsive and disabled/reduced when `prefers-reduced-motion` is enabled.
- Keep cards readable, responsive and free of overlapping text.

## Editorial evidence rules
- Research the full district food repertoire across official district/tourism sources, gazetteers, credible local publications, academic/heritage sources and GI/ODOP records where relevant.
- ODOP or GI records are leads, not a complete district food inventory.
- Record whether a dish is a district speciality, town/block speciality, regional food, broadly shared state food, or still pending verification.
- Do not assert exclusive origin without evidence. Do not invent foods to fill a page.
- Do not publish unsupported producer counts, food counts, availability, ratings or prices.
- If a district's evidence or visuals are incomplete, show a clear curation status instead of fabricated content.

## Current implementation status
- Shared district route now includes a premium editorial hero composition, section navigation, and dedicated Food Stories, Famous Places, District Gallery and About sections.
- The shared route is used by the 38 Bihar district navigation entries; district-specific records still depend on reviewed source data and approved database records.
- Bihar research leads remain explicitly pending editorial review; they are not approved catalogue food records.
- This change does not create final AI dish images, final landmark images, video/3D assets, district-complete research, or functional cart integration.
- Browser verification and responsive QA remain pending because the development dependencies/browser session were unavailable in the build environment.
