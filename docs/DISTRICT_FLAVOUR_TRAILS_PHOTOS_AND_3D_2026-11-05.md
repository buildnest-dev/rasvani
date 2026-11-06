# Rasvani district Flavour Trails — food photos and 3D showcase

**Date:** 5 November 2026  
**Scope:** District food pages, original Rasvani navigation, item images and 3D food motion.

## What changed

- Added `BiharDistrictFoodTrails` as the item-focused food collection for Bihar district routes.
- Each dry-snack record from `biharDrySnackByDistrict` renders as an individual image card with its exact source-list name, item image, district-linked-candidate or Bihar-wide-fallback status, and a Food Stories & Vlogs link. The 32 displayed food-name variants resolve to 27 matching illustrative artwork files; exact repeats/closely related variants can reuse the same visual.
- The district cards use a two-column editorial layout on desktop and one column on narrow mobile screens. This follows the supplied Buxar district-page reference.
- Added the reusable interactive 3D food carousel to each Bihar district collection. It uses the same image/name records as the district cards, rotates automatically when motion is allowed, supports pointer/touch drag, keyboard arrows, previous/next and pause/resume controls, and honours `prefers-reduced-motion`.
- The district page `Traditional Foods` anchor now resolves to the item gallery.
- Siwan retains all ten original foods and adds its three PDF-listed dry-snack entries (Thekua, Sattu Ladoo and Chana Bhunja) to the 3D showcase and a separate research-list card row.
- The original top navigation remains: Home of Flavours, India, Unfolded, Flavour Trails, The Pantry, Food Stories and Meet the Makers.
- The homepage remains item-first; districts are shown as secondary associations on its food cards, rather than as the primary card grid.

## Food and image trust rules

The photos are illustrative artwork already included in the supplied Rasvani project assets. They help visitors identify the named food but are not actual producer or pack photographs. District-linked and Bihar-wide fallback labels remain visible. The interface does not claim that a candidate item is an approved sellable SKU, nor that it has a guaranteed seven-day shelf life. Batch/producer-specific shelf-life validation is still required before any such claim or product listing.

## Main implementation files

- `apps/web/components/bihar-district-food-trails.tsx`
- `apps/web/components/siwan-food-3d-stage.tsx`
- `apps/web/components/siwan-district-experience.tsx`
- `apps/web/app/explore-india/[region]/district/[district]/page.tsx`
- `apps/web/lib/bihar-dry-snacks.ts`
- `apps/web/app/globals.css`

## Validation

- District Flavour Trails static checks: **18/18 passed**.
- Siwan original food + 3D + map checks: **22/22 passed**.
- Sitewide motion checks: **15/15 passed**.
- Regional directory checks: **12/12 passed**.
- Runtime data check: **38 districts, 103 PDF entries, 32 distinct food names, 27 artwork files, 0 missing image files**. Buxar Batisa and Papdi resolve to separate image files.
- TypeScript/TSX parser transpilation: **70 files, 0 syntax errors**.

A full Next.js build and live browser render were not run in this environment because project dependencies are not installed. The files are syntax-checked and targeted static regression checks pass; the visual result still needs confirmation in the locally running app.
