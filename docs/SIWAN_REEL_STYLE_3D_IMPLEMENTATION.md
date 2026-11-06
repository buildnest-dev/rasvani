# Siwan Reel-Style 3D Homepage Update

## Scope
This update is limited to the Bihar → Siwan district route. It upgrades the Siwan homepage hero and the All Foods category selector.

## Actual interactive 3D scene
- Added `apps/web/components/siwan-3d-stage.tsx`.
- The scene is rendered with WebGL 2 directly; it does not depend on a flat image transform or a third-party 3D package.
- The scene contains generated 3D mesh geometry for a stylised temple composition, architectural columns and spire, a serving platter, litti forms, a bowl and garnish elements.
- The scene continuously animates with subtle orbit, floating food details and lighting.
- Pointer/touch drag rotates the scene; mouse wheel zooms; Reset 3D View restores the starting camera.
- A fallback label is shown if WebGL 2 is unavailable.

## Reel-style presentation
- Mehandar hero artwork has a slow cinematic camera drift.
- The live 3D model sits above the hero artwork to create layered depth.
- Food editorial images use separate slow camera motion, depth layering, sheen and hover lift.
- Reduced-motion preferences are respected.

## All Foods category logos
- All Foods, Meals, Snacks, Meals & Drinks and Festival Sweets each have a bespoke inline SVG category mark.
- The category selector uses icons and text only; it does not use category photographs.
- Category buttons filter the food cards.

## Visible copy rules
- Food names and interface copy are written in simple English.
- The former `Doodh ke Laddoo` label is now `Milk Laddoo`.
- No visible AI attribution or AI-generated label is rendered on the Siwan page.
- Image filenames may retain existing internal asset names; filenames are not displayed to visitors.

## Verification status
- TypeScript/TSX transpile syntax check passed for both modified components.
- Required local image asset paths were checked against the project asset directory.
- A full Next.js build and live browser interaction test remain pending because dependency installation timed out in the preparation environment. Do not describe this update as runtime-certified until `npm install`, `npm run build`, and browser checks complete successfully.

## Run locally
From `Rasvani_Project/apps/web`:

```bash
npm install
npm run dev
```

Open `/explore-india/bihar/district/siwan` on the local development server. Drag the hero model to rotate, scroll over it to zoom, and use Reset 3D View to restore the camera.
