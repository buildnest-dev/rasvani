# Security review and hardening, 6 Nov 2026

Scope: the `Rasvani_Project_Bihar_Map_Tourist_Places_Home_Food_Update_2026-11-06` archive (Next.js 15 + Supabase, 424 files). This was a code and configuration review plus dependency audit. It was **not** a penetration test, and no live Supabase project was available, so database behaviour was read from the migrations, not executed.

## Fixed in this update

| # | Finding | Change |
|---|---|---|
| 1 | `npm audit`: **high** severity PostCSS issues (XSS in stringify, arbitrary `.map` file read) pulled in by Next.js 15.5 | Root `package.json` `overrides` pins `postcss` to `^8.5.32`. Audit high count is now 0. |
| 2 | No lockfile, so every install resolved fresh versions | `package-lock.json` added (generated from a clean install). |
| 3 | Security headers lacked CSP and HSTS | `apps/web/next.config.ts` now sends a Content-Security-Policy, Strict-Transport-Security, Cross-Origin-Opener-Policy and a wider Permissions-Policy, alongside the existing nosniff, referrer, and frame headers. Verified in a production build: the India map still loads (tiles, worker, glyphs) with zero CSP violations. |
| 4 | The project did not pass its own `typecheck`, `lint` or `build` (4 type errors, 5 lint errors, a duplicate `metadata`/`generateMetadata` export on `/shop/[slug]`) | Fixed with minimal edits. `tsc` and `eslint` report 0 errors and `next build` succeeds (60 pages). |
| 5 | `scripts/copy-maplibre-workers.mjs` looked for MapLibre only in `apps/web/node_modules`, which fails on a clean workspace install (dependencies are hoisted) and blocks the build | The script now resolves the package wherever it is installed. |
| 6 | Generated `tsconfig.tsbuildinfo` (783 KB) was committed | Removed and added to `.gitignore`, together with `next-env.d.ts`. |
| 7 | ESLint scanned build output | `eslint.config.mjs` now ignores `.next` and vendored workers. |

## Checked and found sound

- **Secrets:** no keys, tokens, passwords or `.env` files in the archive. `service_role` is never used in application code. Only `NEXT_PUBLIC_SUPABASE_URL` and the anon key are read.
- **Authorization:** every protected server action calls `requireAnyRole`, which reads roles from the database `user_roles` table, never from client input or editable metadata. Data access goes through `SECURITY DEFINER` RPCs that re-check `auth.uid()` and role.
- **Database:** all 37 tables have row level security enabled. All `SECURITY DEFINER` functions set `search_path` and have `revoke ... from public, anon` before granting execute to `authenticated`. Public read policies are limited to approved/published rows.
- **Uploads:** client checks plus server-side action checks, a database-side path pattern (`<user id>/<product id>/<uuid>.ext`), and a storage bucket limited to JPEG, PNG and WebP up to 5 MB.
- **Auth forms:** Zod validation, 10-character minimum password, generic error messages (no account enumeration).
- **XSS and injection:** no `dangerouslySetInnerHTML` in application code, no `eval`, no shell execution, no string-built SQL in the app.
- `scripts/windows-install-and-run.ps1` only checks the Node version, runs `npm install` and `npm run dev`.

## Open items, need the project owner

1. **Boundary map tiles come from a third-party public bucket** (`pub-0429b8e3b5a946e69ea007df844a6f1c.r2.dev`). It is not owner-controlled, `r2.dev` URLs are not meant for production traffic, and whoever controls it can change the map data. Copy the two PMTiles files to a bucket or CDN you control and update `MAP_TILES` in `next.config.ts` and the two URLs in `components/india-boundary-map.tsx`. The dataset is also not confirmed as Survey of India approved (project rule 2.8).
2. **Google Fonts is loaded by a CSS `@import`** in `globals.css`. Visitors' IP addresses go to Google, which matters for DPDP consent wording. Self-host the fonts with `next/font`, then remove the two Google origins from the CSP.
3. **CSP still allows `'unsafe-inline'` scripts**, because Next.js injects inline bootstrap scripts. A nonce-based CSP is the next step.
4. **No application-level rate limiting** on sign-in and sign-up. Confirm Supabase Auth rate limits are on, email confirmation is required, and enable CAPTCHA before launch. Password reset and MFA are not built yet.
5. **Live Supabase is untested.** Apply the migrations to a development project and test RLS with real users of each role (customer, producer, warehouse operator, admin) before any production data exists.
6. **Remaining `npm audit` items (6, moderate):** all are one `minimatch` denial-of-service advisory inside the ESLint/TypeScript tooling (development only, never shipped). Fixing it needs a `typescript-eslint` major bump. Production dependencies are clean.
7. Dependency versions use `^` ranges. The lockfile fixes them for now, but add Dependabot or a monthly `npm audit` check.
8. **Logo:** `public/images/rasvani-mark.png` and `rasvani-logo-lockup.webp` come from an AI-generated exploration. Check trademark availability for the name and mark before using the ® or ™ symbols. The chosen files contain neither symbol.
