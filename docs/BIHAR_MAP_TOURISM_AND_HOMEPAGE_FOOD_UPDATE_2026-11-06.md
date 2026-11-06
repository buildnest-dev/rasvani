# Rasvani update — Bihar map, district places and homepage foods

Date: 6 November 2026

## Homepage food changes
- Added Perukia and Gujiya to the item-first homepage food collection with separate WebP image assets.
- Removed Kadhi and Litti Chokha from the homepage collection only. Existing Siwan/district source records remain untouched; this is not a deletion from district editorial history.
- The two generated food visuals are illustrative AI artwork, not producer or packaged-product photography. Their recipe/district association notes remain editorially qualified.

## Bihar regional page
- Added an embedded Bihar-focused district map using the same MapLibre + LGD 2024 district PMTiles source already used by the India map experience.
- Map selection navigates to the canonical district guide route. A 38-entry directory alongside the map provides a fully accessible direct link for every district, including small districts whose map labels may be suppressed by collision avoidance at the state-wide zoom.
- The map attribution explicitly identifies the 2024 snapshot and cautions that it is not a legal/survey boundary product.

## District tourism sections
- Added an editorial destination shortlist for all 38 canonical Bihar district routes, including the special Siwan route.
- Each record contains 2–4 place names, a category (heritage, religious/cultural, nature/wildlife), and a short contextual description.
- The Bihar Tourism destinations directory is linked as a statewide source. Some lesser-known district entries are editorial discovery leads and require local district-administration confirmation before being treated as fully verified tourism claims.
- No unrelated stock image or AI-generated photograph has been presented as a real monument. The existing project did not contain a verified, licensed destination-photo set for all 38 districts; destination photographs should be added only when source, location and reuse rights can be confirmed. Food artwork is not reused as destination photography.

## QA
- Focused update regression: 12/12 passed.
- Existing district-guide content checks: 17/17 passed.
- Existing sitewide locale/image/motion checks: 27/27 passed.
- Full Next.js typecheck/build was not completed because this extracted environment has no installed workspace dependencies (React/Next.js/Zod etc.).

## Sources used for the editorial shortlist
- Bihar Tourism — Districts: https://tourism.bihar.gov.in/en/districts
- Bihar Tourism — Destinations: https://tourism.bihar.gov.in/en/destinations
- Survey of India — Bihar State Map 2025: https://www.surveyofindia.gov.in/UserFiles/files/bihar-state-map-2025.pdf
- Government of Bihar — district directory: https://bvm.bihar.gov.in/district/

The names and descriptions are a discovery shortlist, not travel-operating advice. Confirm current access, opening status, local spelling, and district jurisdiction before publishing detailed visitor logistics.
