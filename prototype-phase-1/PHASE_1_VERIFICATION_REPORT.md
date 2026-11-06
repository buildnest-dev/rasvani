# Phase 1 verification report — 2 November 2026

## Result

**Browser QA passed for the tested prototype scope.** Tests were run with Chromium 144.0.7559.96 using Python Playwright. The page was loaded with its local assets served to the browser; the test harness did not rely on the previous print-engine screenshots.

## Viewport coverage

| Viewport | Result |
|---|---|
| Desktop 1440 × 1000 | Pass |
| Tablet 820 × 1000 | Pass |
| Mobile 390 × 844 | Pass |
| Narrow mobile 320px width | Pass — no horizontal overflow |
| Mobile 360px / 375px | Pass — no horizontal overflow |
| Tablet 768px / 1024px | Pass — no horizontal overflow |

## Browser interaction checks

- Page title and all main content sections render.
- All 10 local CSS image assets return HTTP 200 in the browser.
- Search panel opens; searching `Bihar` returns the region and sample product result; selecting the region opens the regional preview.
- All 36 state/UT entries appear and are selectable.
- Search, bag, account (including mobile menu), producer journey, retailer journey and admin wireframe panels open.
- Product detail opens and clearly labels the sample as non-live.
- Demo bag supports add, increment, decrement and clear; checkout/payment are explicitly not connected.
- Dialog closes with Escape and restores focus to the invoking control.
- Mobile navigation is available and includes account access.
- No horizontal overflow at tested viewport widths.
- Zero browser JavaScript/page errors and zero console errors during the scripted checks.

## Fix made during QA

At widths below 850px the header account button is hidden. The mobile menu previously omitted an account entry. Added an accessible menu label and a `My account` action in the mobile navigation; retested at tablet and mobile widths.

## Evidence

- `qa-desktop.png`, `qa-tablet.png`, `qa-mobile.png`
- `PHASE_1_BROWSER_QA_RESULTS.json`

## Limitations

- This is a design prototype, not the production website.
- Prototype interactions use local demo data only; no real auth, cart persistence, catalogue, payments, producer submission, CMS, inventory, warehouse or B2B transactions are connected.
- AI-generated food image crops remain illustrative and should be replaced with authentic, rights-cleared photographs before launch.
- This QA does not certify WCAG conformance, security, load/performance, SEO, data integrity or legal compliance.
- A browser build/test of the new Phase 2 Next.js app is separate and pending dependency installation.
