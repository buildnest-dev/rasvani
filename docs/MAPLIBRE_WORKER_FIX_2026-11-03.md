# India Map — MapLibre worker loading fix

## Observed browser error

`Worker failed to load. Check that the worker URL is correct.`

The India Map uses `maplibre-gl` `^6.16.0`. MapLibre GL JS v6 loads its renderer from a separate ES module worker (`maplibre-gl-worker.mjs`), which imports the sibling `maplibre-gl-shared.mjs`. In a Next.js bundle, the runtime-relative worker URL is not reliably inferred, so the map canvas remains blank.

## Source change

- Added `scripts/copy-maplibre-workers.mjs` to copy both v6 worker assets from the installed package into `public/vendor/maplibre/`.
- Added `predev`, `prebuild` and `prestart` npm lifecycle scripts so the assets are copied before running or building the app.
- `IndiaBoundaryMap` now calls `setWorkerUrl('/vendor/maplibre/maplibre-gl-worker.mjs')` before constructing a MapLibre map.

## Run on Windows

From `apps/web`:

```powershell
npm install
npm run dev
```

The predev hook copies the worker files automatically. Verify these URLs return JavaScript (HTTP 200) in the same browser origin:

- `/vendor/maplibre/maplibre-gl-worker.mjs`
- `/vendor/maplibre/maplibre-gl-shared.mjs`

Then reload `/india-map`. The map worker error should disappear if both assets are served successfully. This source-level repair has not been browser-verified in the development environment; mark the issue resolved only after checking the browser console and visible map.

## References

- MapLibre GL JS installation documentation: https://maplibre.org/maplibre-gl-js/docs/
- MapLibre v5-to-v6 migration guide: https://maplibre.org/maplibre-gl-js/docs/guides/v5-to-v6-migration-guide/
