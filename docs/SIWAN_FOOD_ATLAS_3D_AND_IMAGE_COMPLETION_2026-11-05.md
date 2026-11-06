# Rasvani — Siwan food atlas, item imagery, 3D showcase and India map
Date: 5 November 2026

## Implemented in this checkpoint

### Siwan food collection
The Siwan district page now presents ten food entries with one matching image file for each:

| Food | Collection | Evidence label | Image asset |
|---|---|---|---|
| Litti Chokha | Meals & Savoury | Siwan district source | `siwan-litti-chokha.png` |
| Kadhi | Meals & Savoury | Siwan district source | `siwan-kadhi.png` |
| Jhal Muri | Snacks & Staples | Siwan district source | `siwan-jhal-muri.png` |
| Sattu | Snacks & Staples | Siwan district source | `siwan-sattu.png` |
| Khaja | Sweets | Local sweet-shop coverage; origin review pending | `khaja.jpg` |
| Balushahi | Sweets | Local sweet-shop coverage; origin review pending | `balushahi.jpg` |
| Kala Jamun | Sweets | Local sweet-shop coverage; origin review pending | `kala-jamun.jpg` |
| Mawa Barfi | Sweets | Local sweet-shop coverage; origin review pending | `siwan-khoya-barfi.png` |
| Peda | Sweets | Local sweet-shop coverage; origin review pending | `siwan-peda.png` |
| Milk Laddoo | Sweets | Local sweet-shop coverage; origin review pending | `siwan-doodh-laddoo.png` |

The official district page names Litti Chokha, Kadhi, Jhal Muri and Sattu as foods popular in Siwan. It does not establish that they are exclusive to Siwan. The other six entries are kept under a separate local sweet-shop coverage label; this is not proof of district origin.

### Six Bihar research-lead illustrations
New 512 × 512 WebP illustrations are supplied for the six official-source research leads already present in `lib/bihar-food-research.ts`: Maner Laddoo, Khoye-ki-Lai, Silao Khaja, Gaya Tilkut, Kheer-Makhana and Belgrami. These are visibly identified as illustrative artwork, not product photography. The underlying leads remain editorial-review-pending and cannot be promoted to approved district associations by virtue of having an image.

### Interactive 3D food display
`components/siwan-food-3d-stage.tsx` implements a local-asset CSS 3D carousel. Visitors can slowly auto-rotate the dishes, drag with mouse or touch, select a dish, use keyboard arrow keys, pause/resume rotation and navigate with previous/next controls. It honours `prefers-reduced-motion`; no external 3D library or network-loaded model is required.

### India map
The existing dedicated `/india-map` route remains the authoritative map journey and is linked from the Siwan hero. The map still uses the codebase's labelled 2024 LGD/Bharatlas snapshot with list fallbacks; it must not be described as a current, reconciled district boundary dataset. Current official district master and matching licensed boundary geometry are still P0 data gates.

## Operational and trust boundaries

- Editorial imagery does not verify the actual appearance of a producer's item, packaging, ingredients, district provenance, certificate or inspection.
- A traditional dish displayed for discovery is not automatically a sellable SKU or suitable for a dry, long-distance delivery journey. Shelf life requires recipe-, moisture-, pack- and storage-specific validation.
- Local sweet-shop coverage is not a district-origin claim. The six non-officially-named Siwan sweets remain locally covered entries and need corroboration before stronger claims.
- No Add to Cart, live price, stock, payment or shipping capability has been enabled by this visual update.

## Verification

Focused static checks verify the ten Siwan image mappings, six Bihar research-lead image mappings, 3D controls, reduced-motion handling, map route handoff, and evidence/commerce copy. These are static source checks only. Framework build, semantic typecheck, live browser, remote map loading, Supabase/RLS, payment/shipping, security, accessibility and device-performance tests remain outstanding until dependencies and development service configuration are available.
