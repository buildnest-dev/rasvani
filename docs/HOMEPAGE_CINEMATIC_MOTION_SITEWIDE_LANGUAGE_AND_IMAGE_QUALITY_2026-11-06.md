# Rasvani — Homepage Motion, Sitewide Language and Image-Quality Update

**Date:** 6 November 2026  
**Project baseline:** `Rasvani_Project_District_Flavour_Trails_Photos_3D_2026-11-05.zip`  
**Scope:** Homepage visual experience, shared language behaviour, existing food-image assets, and the related public-facing client experiences.

## 1. Food-image clarity

The food-image review found two recurring problems in the existing asset set:

- Several snack thumbnails originated from small preview crops and did not retain enough source detail for larger cards or high-density screens.
- A few preview-derived files contained remnants of interface controls, including heart or play icons.

The local snack and Bihar research illustration assets were processed to remove known preview-overlay areas where present, upscale them for responsive card use, apply restrained contrast/colour correction, and restore edge definition with an unsharp mask. The processing preserved each source image's crop except where a narrow right-side preview control had to be removed. The resulting snack/research image set contains **37 local assets**, with every file at least 1,000 pixels wide. A labelled contact sheet is retained at `docs/FOOD_IMAGE_CLARITY_PREVIEW_2026-11-06.jpg`.

The homepage and India-map food thumbnails no longer force local images through Next Image's `unoptimized` mode. The Buxar Batisa artwork now points to `snack-batisa.webp`, while Papdi remains on its separate `snack-batisa-papdi.webp` image.

These remain illustrative images, not actual photographs of a verified producer's saleable pack. Sharpening and upscaling do not create new photographic evidence; approved product/pack photographs must replace illustrations before a live product is sold.

## 2. Sitewide language behaviour

The active locale remains owned by the existing root `LocaleProvider`, which continues to support English, Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Punjabi, Kannada, Malayalam, Odia and Assamese. The choice is stored in local storage and the document's `lang` attribute updates when the active language changes.

A shared `LocalizedCopy` layer now translates curated interface phrases and common UI labels in nested page content, including supported accessibility labels, placeholders, titles and image alt strings. It is applied to the root page content and shared footer. It is also used inside the main client-rendered experiences whose internal text would otherwise sit beyond the server-page wrapper: homepage, India map, boundary map status/fallback, Explore India, region directory, Bihar district food trails, Siwan district experience, the 3D stage, district food discovery, regional search results, district switcher and account sign-in form.

The six original Rasvani navigation tabs use the active language:

- Home of Flavours
- India, Unfolded
- Flavour Trails
- The Pantry
- Food Stories
- Meet the Makers

Food names, district names, producer names and the brand name are deliberately preserved. This is important for search, regional identity and protected product naming. The shared UI glossary contains draft interface translations; long editorial copy, ingredients, allergens, nutrition, storage, legal declarations and regulated claims are not automatically treated as professionally reviewed. Those fields still require qualified language/compliance review before launch.

## 3. Cinematic homepage hero

The original Rasvani navigation and the item-first food catalogue remain in place. The hero's former circular image-disc composition has been upgraded to an interactive, cinematic CSS 3D food theatre using five existing item records:

- Thekua
- Silao Khaja
- Tilkut
- Sattu Ladoo
- Roasted Makhana

The hero stage adds a dark heritage-maroon presentation surface, gold-lit 3D card carousel, rotating halo/plinth, ambient light rings, floating decorative India silhouette, subtle moving particles and layered floor lighting. It reuses the same item image records shown in the catalogue and does not introduce additional foods or product claims.

The existing 3D stage continues to support automatic rotation, pointer/touch dragging, keyboard navigation, previous/next controls and pause/resume. The hero has mobile/tablet sizing and `prefers-reduced-motion` overrides so the decorative loops stop for users who request reduced motion.

## 4. Verification

Static tests and source checks completed:

- Sitewide locale, image quality and cinematic homepage checks: **27/27**.
- Navigation 3D-motion checks: **23/23**.
- Premium/editorial image wiring checks: **16/16**.
- Full visual redesign source checks: see `qa/phase1_visual_redesign_static_results.json`.
- Dedicated India map/homepage checks: **28/28**.
- Bihar exact dry-snack/map regression: passed.
- District Flavour Trails photo and 3D checks: **18/18**.
- Siwan food, image and 3D regression: **22/22**.
- TypeScript/TSX syntax transpilation: **70 files, zero syntax diagnostics**.

## 5. Remaining verification limits

The attempt to install the declared Next.js/React/Supabase dependencies timed out and did not produce a `node_modules` directory. Consequently, a full framework typecheck, production build and live browser review were not completed in this environment. The TypeScript check was a syntax transpilation scan, not a full semantic typecheck. The site should be run locally and reviewed on desktop and Android before approving the visual change.

The translations in this update address common interface copy and page labels across the main public-facing routes. They are not a substitute for the full professionally reviewed, multilingual content programme specified in the master build prompt.
