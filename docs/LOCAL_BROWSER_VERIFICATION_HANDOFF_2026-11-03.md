# Rasvani — local Windows browser verification handoff

Date: 2026-11-03

## Why verification must move to the owner's Windows machine

The current execution container has Node.js 22.16.0 and npm 10.9.2, but cannot resolve `registry.npmjs.org` (`getent hosts` returns no address and `curl` fails with `Could not resolve host`). Its npm cache is only about 48 KB and contains no usable dependency tarballs. The project has no `package-lock.json` and no `node_modules`. A browser binary alone cannot run the Next.js app without the dependencies. No separate internet-enabled execution/browser computer is exposed to this session, so an offline dependency transfer cannot be assembled reliably here.

## Preserved project setup

- Existing workspace: root `package.json`, npm workspace `apps/web`.
- Runtime: Node.js >=20.9 per package metadata; use Node.js 20.19+ LTS for this install.
- Web app: Next.js 15, React 19, Supabase SSR/client, Zod, MapLibre GL 6, PMTiles 4, TypeScript and ESLint.
- Run npm from the repository root, not `apps/web`.
- New helper: `scripts/windows-install-and-run.ps1`. It checks Node/npm, installs dependencies, then runs the existing Next.js development server. It does not rebuild or replace the app.

## Owner-side run

1. Extract the existing Rasvani project archive to a local folder such as `C:\Projects\Rasvani\Rasvani_Project`.
2. Install Node.js 20.19+ LTS and reopen PowerShell.
3. Run:

   ```powershell
   Set-Location C:\Projects\Rasvani\Rasvani_Project
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   .\scripts\windows-install-and-run.ps1
   ```

4. When Next.js reports that it is ready, open `http://localhost:3000`.
5. To run checks in a second PowerShell window from the project root:

   ```powershell
   npm run typecheck
   npm run lint
   npm run build
   ```

6. If the public site loads but Supabase-backed records/auth are unavailable, configure `apps/web/.env.local` from `.env.example` using a development Supabase URL and public anon/publishable key. Do not use a service-role secret. Do not apply migrations to production.

## Evidence needed to continue browser verification

Please share the full terminal output from the install and server start, plus browser screenshots (or a screen recording) from the same local run. The minimum capture set is:

- `/india-map` at desktop width, showing map, state/UT selection and district outline/selection.
- A selected state page/list and a selected district page, including the food collection or the explicit empty-state message.
- `/explore-india` and a district food detail with the actual dish image visible.
- Homepage and relevant discovery/story sections while animations are active; include a reduced-motion check if possible.
- The same key pages at tablet and mobile viewport sizes, with navigation open/closed and no horizontal overflow.

If possible, use Chrome DevTools device toolbar at 768px and 390px widths. Include Console and Network errors if any, especially PMTiles/vector tile requests and Supabase requests. Do not send `.env.local`, API keys, cookies or other secrets.

## Current honest status

Dependency installation and Next.js server startup are **BLOCKED in this container**. The app has not been opened in a browser from this execution environment. All requested visual and interactive items remain **NOT VERIFIED** until browser evidence is available and the relevant interactions have been exercised. Static source checks are not substituted for those tests.
