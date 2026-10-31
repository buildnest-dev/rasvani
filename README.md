# Rasvani

Pan-India vegetarian marketplace for traditional regional foods. This repository is the landing page and the state Library.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind 4 · GSAP (ScrollTrigger, SplitText) · Lenis · Motion · Zustand · react-hook-form + Zod.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000. `npm run typecheck` and `npm run build` should both pass.

## What's here

- `/` landing page: thali hero with dish hotspots, pinned India tile-map journey, state rail, featured foods, festival collections, stories, forms (waitlist, maker application), PIN check.
- `/states` and `/states/[slug]`: all 28 states with their traditional vegetarian foods (142 entries from the founder's final list).
- English and Hindi (JSON catalogues, `ys-lang` cookie). Motion respects `prefers-reduced-motion` and an in-site toggle.

## Rules that shape the code

See `AGENTS.md` and `docs/`. In short: vegetarian only, no invented facts (`TODO(verify)` marks what still needs a source), delivery is never promised (the PIN check fails closed), and illustrative images are never presented as product photos.

## Not built yet

- Forms are validated on the server but not stored or sent anywhere.
- Serviceability, catalogue DB, payments, auth.
- Approved boundary map: the map uses a public GeoJSON (pre-2019, Ladakh inside J&K) chosen by the founder; it needs Survey of India sign-off (AGENTS §2.8) before launch.
- Real product photos. The images in this build are illustrative.
- Hindi strings need a native-speaker review.

## Credits

Design merges the original brand build with two Lovable explorations: *human-centered-web-studio* (editorial state pages, arch photography) and *pixel-perfect-replica* (thali hero, trust badges, festive motion).
