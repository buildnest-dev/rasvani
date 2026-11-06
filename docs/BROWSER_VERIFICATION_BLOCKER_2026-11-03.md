# Rasvani browser verification — blocked by dependency installation

Date: 2026-11-03
Project: existing Rasvani workspace

## Requested work attempted

- Inspected the existing workspace and `apps/web/package.json`.
- Confirmed the web app is a Next.js 15 workspace with React 19, MapLibre GL 6 and PMTiles 4 dependencies.
- Attempted dependency installation from the project root using `npm install` and `npm install --no-audit --no-fund`.
- Retried with verbose logging, no install scripts, no audit, no fund and zero fetch retries.
- Attempted to start the existing development server with `npm run dev`.

## Actual blocker

The environment cannot resolve `registry.npmjs.org`. npm reports `EAI_AGAIN` for the required packages, including Next.js, React, MapLibre GL, PMTiles and Supabase. No `node_modules` directory was created. The subsequent dev-server attempt fails with `next: not found` (exit code 127).

This is an environment/network dependency-fetch blocker, not evidence that the website itself is broken or fixed.

## Verification status

| Requested verification | Status | Evidence / reason |
|---|---|---|
| Install all dependencies | Blocked | npm registry DNS failure (`EAI_AGAIN`) |
| Start Next.js dev server | Blocked | `next: not found` because dependencies are unavailable |
| Open actual website in browser | Not performed | No running Next.js server |
| India map rendering | Not verified | Requires running browser app and tile service |
| 28 states and 8 UTs | Not verified visually | Existing region metadata and rendered map not browser-tested |
| District boundaries | Not verified | Requires PMTiles fetch/render in browser |
| State → district → food navigation | Not verified end-to-end | Requires app and live data/configuration |
| District food records | Not verified live | Depends on configured Supabase data and approvals |
| Exact dish-image matching | Not verified | Requires approved food records and image review |
| Premium 3D animations | Not verified | Requires rendered page and visual comparison to references |
| Desktop/tablet/mobile behaviour | Not verified | Requires browser viewport testing |
| Screenshots / screen recording | Not available | No live page could be launched |

## MapLibre source review

The existing `india-boundary-map.tsx` resolves the MapLibre ESM namespace/default export and checks that `addProtocol` and `removeProtocol` exist before registering PMTiles. This is a source-level safeguard only; it does not prove that the installed runtime exports, PMTiles archive requests, vector source, or map rendering work.

The current map component still references a 2024 LGD snapshot for its state and district PMTiles. It must not be described as current until reconciled with the latest official LGD records and suitable current boundary geometry.

## Next action required

Provide working package-registry/network access or an environment with the project's dependencies already installed. Then run `npm install`, `npm run dev`, and browser automation against the actual local server. Capture desktop, tablet and mobile screenshots and complete the interaction checks before marking any feature verified.
