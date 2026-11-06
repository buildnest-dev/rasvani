# India map label-overlap repair — 5 November 2026

## Issue reproduced from the supplied screenshot

The India boundary polygons were rendering, but state/UT names were duplicated and piled over one another, most visibly in the Northeast, western India and around island territories. The regional index on the right remained usable, but the map labels were not readable.

## Root cause

The state-level `admin-labels` symbol layer explicitly set both MapLibre collision controls to `true`:

- `text-allow-overlap: true`
- `text-ignore-placement: true`

That told MapLibre to permit labels to draw over other labels and to ignore labels already placed. Since some state/UT boundaries are multipart or clipped across vector tiles, labels could be repeated for separate rendered pieces.

## Repair implemented

1. **One label point per State/UT:** State-level names now use a small GeoJSON `FeatureCollection` built from the existing 36 region camera anchors. Each State/UT contributes one label feature. The anchors are presentation aids only; they do not replace or modify official boundary geometry.
2. **Boundary selection is unchanged:** The existing LGD vector polygons remain the source for fill, outline, hover highlight and click selection. The label source is separate from the interactive boundary source.
3. **Collision handling restored:** Both `text-allow-overlap` and `text-ignore-placement` are explicitly `false` for State/UT and district labels.
4. **Adaptive label placement:** Labels use MapLibre's variable anchor positions, radial offset, label padding, constrained text width and zoom-dependent text size. This lets MapLibre choose a clear position and suppress a label when there is no room at the current zoom.
5. **Full directory retained:** The 36-State/UT searchable/selectable regional index remains unchanged. The map status now explains that users can zoom in to reveal smaller regions.
6. **District labels also protected:** The selected-state district layer uses the same collision-safe layout, so dense district maps do not deliberately stack names either.

## Acceptance checks

- `qa/phase1_homepage_live_map_checks.py`: 28/28 passed. Includes checks for collision settings, variable anchoring, zoom guidance, and exactly one label anchor for each of the 36 entries in `apps/web/lib/regions.ts`.
- `qa/homepage_bihar_exact_dry_snacks_and_full_map_checks.py`: 27/27 passed. Confirms the 38-district food data and map integration are preserved.
- Consolidated static QA: 939/939 across 52 suites after rebuilding `qa/static_qa_summary.json`.
- TypeScript/TSX syntax transpilation: 69 files, zero syntax diagnostics.

## Verification boundary

These results verify source structure, data consistency and TypeScript/TSX syntax. They do **not** claim that a live browser map was rendered after the patch. Installing dependencies with `npm install --ignore-scripts --no-package-lock --no-audit --no-fund` timed out in this environment, and no `node_modules` directory was created. Run `npm install`, `npm run typecheck`, `npm run build`, and inspect `/india-map` on desktop and mobile in a network-enabled development environment before production approval.

The boundary data remains the existing LGD 2024 snapshot via Bharatlas. This label fix does not update administrative boundaries or their source date.
