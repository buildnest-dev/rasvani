# Rasvani — Two-Reel Site-wide Motion Plan

Date: 3 November 2026  
Status: First implementation pass added to the existing codebase; live browser verification pending.

## Reference material reviewed

- Reel 1: `WhatsApp Video 2026-11-03 at 12.08.37 PM(5).mp4`, 29.18 seconds, 576×1280, 60 fps. Full timeline sampled at 0.25-second intervals (117 samples).
- Reel 2: `WhatsApp Video 2026-11-03 at 3.31.14 PM.mp4`, 31.39 seconds, 576×1280, 60 fps. Full timeline sampled at 0.25-second intervals (126 samples).
- The review concerns visual frames and screen recordings. It does not claim access to source animation project files, exact 3D meshes, camera curves, lighting rigs, or original easing parameters.

## Shared visual principles observed

1. Food is the centre of a directed scene, not merely an image inside a card.
2. Composition changes between dishes; the same motion is not repeated for every subject.
3. Food, ingredients, garnish, serving vessels, packaging and typography can occupy separate visual layers.
4. Apparent depth is created through scale, perspective, parallax, independent movement, rotation and camera-like zoom.
5. Sequences use staged entrances, holds, close-up moments and transitions between editorial compositions.
6. Packaging and gift compositions use opening/reveal choreography, not only hover animation.
7. The second Reel also shows a website/brand presentation sequence; its dark presentation aesthetic is reference material, not a direction to replace Rasvani's approved palette.

## Component-by-component motion direction

| Component | Motion treatment | Guardrail |
|---|---|---|
| Homepage hero | Layered food stage; separate orbiting editorial accents; slow camera-like drift and scroll depth | Do not distort dish identity or obscure hero text |
| Featured collections | Three distinct image breathing timings and focal origins; staggered entry | Keep the image crop and food recognizable |
| India map | Subtle depth on map frame and regional index; selected-state focus | Never transform map geometry/canvas in a way that harms pointer accuracy |
| State/district navigation | Staggered panels and selection transitions | Keep geography and administrative labels stable |
| Regional food cards | Reveal, subtle perspective and image-specific parallax | Only approved dish-to-product imagery; no generic substitute |
| Explore India | Editorial hero drift, staggered directory and food collections | Avoid excessive motion in long lists |
| Product detail | Gallery-focused zoom/transition, restrained perspective | Real approved product photos only; never use generated artwork as product evidence |
| Producer pages | Layered editorial still-life movement | Do not imply unverified producer identity or provenance |
| Stories/recipes | Slow image framing and editorial reveal | Text remains readable; consent and image rights remain required |
| Better Choices | Calm panel reveals and clear focus transitions | Accessibility and clarity take priority over spectacle |
| Navigation | Existing bounded pointer tilt, stagger and menu transitions | Keyboard/touch parity and no motion trap |
| Account/cart/operations | Restrained panel reveal and control feedback | Forms, data tables and warehouse controls must remain stable and usable |

## Implementation added in this pass

- `SiteMotionDirector` is mounted once in the root layout and progressively enhances existing route content.
- Intersection Observer reveals are registered for editorial, discovery, product, producer, map, account and operations components.
- Pointer tilt is limited to selected visual cards and only enabled for fine pointers.
- Scroll-linked image depth uses a passive scroll listener and one animation-frame update, limited to registered image stages near the viewport.
- Hero accents use independent movement timings; collection imagery uses distinct focal origins and breathing durations.
- Map frame depth is separated from the interactive map canvas.
- `prefers-reduced-motion` disables the motion choreography and reveals content without requiring animation.
- Motion is implemented with CSS and browser APIs already available; no new runtime dependency was added.

## Accuracy and asset policy

- Decorative editorial artwork may be AI-generated and must not be presented as actual product photography.
- Product images must be the approved, accurate photograph for that exact catalogue item.
- Do not generate or publish a dish image until the dish name and reference composition are sufficiently clear. Unknown district-food associations remain unpublished rather than guessed.
- Rasvani branding, approved colour palette and wordmark remain authoritative. Reel brands, logos and complete layouts are not copied.

## Verification status and remaining work

- Static source inspection: performed.
- TypeScript syntax transpilation and existing QA suites: to be rerun after this pass.
- Next.js production build/typecheck: blocked until project dependencies can be installed.
- Actual browser review on desktop/tablet/mobile: pending; must not be represented as passed.
- Visual match to reference Reels: not claimed until live implementation is reviewed and tuned in browser at representative viewport sizes.
- Future refinement should add true layered/isolated food assets or authored 3D renders where a flat photograph cannot physically produce independent food-part movement. CSS cannot invent hidden sides or separate objects absent from an image.

## First-pass verification results

- 15/15 dedicated static motion checks passed (`qa/sitewide_two_reel_motion_checks.py`).
- TypeScript/TSX syntax transpilation passed for 61 source files with 0 syntax diagnostics.
- Existing registered static QA summary remains 885/885 across 50 suites; all 53 existing Python check scripts passed before the dedicated motion checks were added.
- Attempted `npm run dev`: blocked because `next` is not installed (`sh: next: not found`). The previous dependency installation attempt timed out. Therefore no live browser test, visual tuning, frame-rate measurement, mobile-device test, or actual runtime validation has been completed.
