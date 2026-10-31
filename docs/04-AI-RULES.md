# AGENTS.md — Rules for AI Assistants Working on Rasvani

> Place this file at the repo root as `AGENTS.md` (and copy/symlink to `CLAUDE.md`, `.cursor/rules`, etc. for tools that need those names).
> Applies to every AI coding/design/content agent. **Humans must follow it too.**
> Version 0.1 · 30 Oct 2026 · Owner: Chinmay Anand

---

## 0. Read first, in this order
1. `docs/01-PRD.md` — what we build and why (requirement IDs `FR-*`)
2. `docs/02-TECH.md` — stack, architecture, data model, security
3. `docs/03-APP-FLOW.md` — flows, state machines, edge cases
4. `docs/05-DESIGN.md` — brand, UI, motion, accessibility
5. This file — how to behave

**Precedence if documents conflict:** Security & legal rules (§2, §3) > PRD > Tech > App Flow > Design > convenience. If still unclear, **ask the founder**; do not guess.

## 1. Project in 10 lines
- **Rasvani** = pan-India **vegetarian-only** marketplace for traditional regional foods; customers anywhere can order foods from other states.
- Core trust features: origin & maker verification, product transparency, **honest PIN-code delivery availability**.
- Customers: mostly mobile, India, English + Hindi (more languages later).
- Currency INR; time zone IST (store UTC).
- Marketplace model: sellers (makers) → sub-orders → shipments; we handle catalogue, payments, support.
- Stack: Next.js 16 (App Router) · React 19.2 · TypeScript strict · Tailwind 4 · shadcn/ui · GSAP + Lenis + Motion · Postgres + Drizzle · Razorpay · Shiprocket.
- Premium, creative, animated storefront — but **checkout and seller/admin are calm, fast, accessible**.
- Seed data: founder's 28-state food list (representative foods, not exclusive to a state).
- Pilot-first: small scope, correctness over breadth.
- When in doubt: **safe, simple, verifiable.**

## 2. Non-negotiable Business & Content Rules (never break)
1. **Vegetarian only.** Never add, suggest or generate non-vegetarian products, ingredients or recipes. If a dish may have non-veg variants (flagged in the seed list), it stays `NEEDS_CONFIRMATION` and **cannot be sold** until a seller confirms a meat/fish/egg-free recipe and Admin approves.
2. **Never promise nationwide delivery.** Delivery availability always comes from the serviceability engine (per product + PIN). If it fails or is unknown → show "can't confirm right now" and **block add-to-cart**; never default to "available".
3. **Perishables are local/regional only** (`FRESH` delivery class) unless an Admin-approved rule says otherwise.
4. **Do not invent facts.** No made-up FSSAI numbers, GI-tag claims, awards, maker names, testimonials, reviews, ratings, prices, shelf lives, nutrition values, or market statistics. Use `TODO(verify): …` placeholders and list them in the PR description.
5. **Authenticity claims** ("authentic", "traditional", "verified origin", "GI-tagged") may be rendered **only from verified data fields** (`origin_verified`, `gi_tag`, etc.), never hard-coded in copy.
6. **No health/medical claims** ("cures", "diabetic-friendly", "boosts immunity", etc.).
7. **Real photos for real products.** AI-generated or stock imagery is allowed only for decorative/editorial use, must be flagged `is_real_photo=false`, and must **never** represent an actual product on a PDP.
8. **India map**: use only an approved boundary dataset consistent with official Survey of India depiction. Never hand-draw or alter boundaries.
9. **Respect regional nuance.** Recipes vary by district/community; use wording like "traditionally associated with…", "varies by region". Don't declare a dish "belongs only to" one state.

## 3. Non-negotiable Security & Money Rules
1. **Secrets** never in code, logs, client bundles, screenshots, or commits. Only `NEXT_PUBLIC_*` for non-secret values. Validate env with Zod at boot.
2. **Money = integer paise.** Never floats. Compute totals, taxes, discounts, shipping **on the server**; ignore client-sent amounts.
3. **Payments:** never store card data. Order is confirmed **only** after a verified Razorpay **webhook** (signature over raw body, idempotent by event id). Client-side verification is UX only.
4. **Idempotency & concurrency:** webhooks, payment confirmation, stock reservation and refunds must be idempotent and transactional (`SELECT … FOR UPDATE` or equivalent).
5. **AuthZ on every server action/route:** check authentication, role and **ownership** (customer sees own orders; seller sees own products/orders; admin by sub-role). Never rely on hidden UI.
6. **Validate all input with Zod** on the server; sanitise rich text; limit upload type/size; strip EXIF; KYC docs only in private storage with signed URLs.
7. **Rate-limit** OTP, login, search, PIN-check, waitlist, and support-form endpoints.
8. **PII minimisation:** don't log phone numbers/addresses/OTP; mask in admin UI where not needed; follow DPDP consent/deletion flows.
9. **Admin actions are audit-logged** (who, what, when, before/after).
10. **Dependencies:** add only well-maintained packages; pin versions; run audit; no copy-pasted code with unclear licences; no obfuscated code.
11. **Do not disable security features** (CSP, auth checks, RLS, webhook verification) to "make it work".

## 4. Technology Rules
- **Three tiers** (see `02-TECH.md`): use Tier A (stable) for anything revenue-critical; Tier B (newest) only as feature-detected progressive enhancement; **never Tier C** (experimental/canary/alpha) in production code.
- **Versions:** pin exact versions in `package.json` + commit lockfile. Before adding or upgrading a major dependency, check its current stable version and release notes; record in an ADR.
- **TypeScript:** `strict: true`, no `any` (use `unknown` + narrowing), no `@ts-ignore` without a linked issue, no non-null `!` unless provably safe.
- **Next.js/React:** Server Components by default. Add `"use client"` only for interactivity (animation, forms, map, cart UI). Keep client islands small. Use Server Actions/Route Handlers for mutations. Don't fetch data in `useEffect` when RSC can do it. Don't hand-memoise unless profiling shows need (React Compiler is on).
- **Modules:** UI never imports DB or provider SDKs. Domain logic lives in `src/modules/*`. Server-only files start with `import 'server-only'`.
- **Database:** all changes via Drizzle migrations (reviewed, reversible where feasible). Never edit production data manually without a script + audit note. IDs UUIDv7/ULID; `timestamptz` UTC; soft-delete where audit matters.
- **Styling:** Tailwind v4 with tokens from `src/styles/globals.css` (`@theme`). No hard-coded hex colours or magic spacing in components — use tokens. Use `cn()` helper. No inline `style` except dynamic values (e.g., CSS variables).
- **Components:** extend shadcn/ui primitives; keep accessible semantics (labels, roles, focus).
- **State:** server is source of truth for cart/orders; Zustand only for ephemeral UI state; TanStack Query only where client fetching is justified.
- **i18n:** no hard-coded user-facing strings; use message catalogues (`en`, `hi`). Dish/product native names come from DB fields.
- **Dates/numbers:** use `Intl` with `en-IN`/`hi-IN`; currency INR (`₹`); IST display.
- **Errors:** typed error envelope `{ code, message, details? }`; user messages are friendly and actionable; log technical details server-side only.
- **Logging/observability:** structured logs with correlation IDs; no secrets/PII.

## 5. Motion & Animation Rules (our signature — and our biggest risk)
Full spec in `05-DESIGN.md`. Hard rules:
1. **Always honour `prefers-reduced-motion`** — disable Lenis, parallax, scrubbed pinning, cursor effects, auto-playing loops; keep only simple fades/state changes.
2. **One scroll driver:** Lenis + GSAP ScrollTrigger share a single `gsap.ticker` loop. No second smooth-scroll lib, no competing `requestAnimationFrame` loops.
3. **Lenis only on pointer-fine/desktop and tablets without touch smoothing**; touch devices use native scroll. Lenis is **off** on checkout, forms, seller and admin.
4. **Custom cursor only when** `(hover: hover) and (pointer: fine)` and not reduced motion. Never hide the system cursor over inputs, text areas or selects. Cursor must never be required to use anything.
5. **Animate only** `transform`, `opacity`, `clip-path` (and `filter` sparingly). No animating `width/height/top/left/margin`, no layout thrash. Don't animate large blurred layers.
6. **Use `useGSAP()`** (from `@gsap/react`) with a scope ref so ScrollTriggers/tweens are cleaned up; register plugins once; lazy-load heavy plugins per route.
7. **Content must be visible without JS/animation** (SSR HTML shows final state; animation enhances). No text that exists only after animation. No layout shift when animation initialises (reserve space).
8. **Accessibility of animated text:** SplitText must keep accessible text (`aria-label`/screen-reader copy); don't split long paragraphs.
9. **No flashing > 3 times/second**; no scroll-jacking that prevents leaving a section; always allow keyboard scroll and anchor jumps.
10. **Respect budgets** (`02-TECH.md §10`). If an effect costs > 8 ms/frame on a mid-range Android or breaks LCP/INP/CLS budgets, **simplify or remove it**.
11. **Pause/skip control** for any autoplaying motion longer than 5 seconds.
12. Motion is **calm at transaction time**: cart, checkout, payment, order tracking use minimal, fast (≤ 200 ms) transitions.

## 6. Accessibility & UX Rules
- WCAG 2.2 AA: contrast ≥ 4.5:1 body text (check gold-on-maroon and cream-on-gold combos), visible focus rings, touch targets ≥ 44×44 px, semantic headings, labelled inputs, error text linked via `aria-describedby`.
- Interactive India map must be **keyboard operable** with a text/list alternative; hover must have a tap/keyboard equivalent.
- Forms: inline validation, preserve input on error, correct `inputmode`/`autocomplete` (e.g., `inputmode="numeric"`, `autocomplete="postal-code"`, `one-time-code`).
- Don't rely on colour alone (veg mark has shape + label; statuses have icons/text).
- Write copy in warm, simple English/Hinglish-friendly tone; support Devanagari properly (fonts, line-height).
- Mobile-first layouts; test at 360 px width; no hover-only features.

## 7. Code Style & Conventions
- **Formatting/lint:** Biome (or ESLint+Prettier if the team switches); run before commit.
- **Naming:** files `kebab-case.ts(x)`; components `PascalCase`; hooks `useThing`; constants `SCREAMING_SNAKE`; DB columns `snake_case`; TS types `PascalCase`; Zod schemas `thingSchema`.
- **Structure:** small files (≈ < 250 lines), one component per file, colocate tests (`__tests__` or `*.test.ts`).
- **Comments:** explain *why*, not *what*. Reference requirement IDs (`// FR-SVC-03: fail closed`).
- **No dead code, no commented-out blocks, no `console.log`** in committed code.
- **Imports:** absolute via `@/…`; no deep relative chains; no circular dependencies between modules.
- **Feature flags** (PostHog/flags table) for risky or Tier-B features.

## 8. Git, PR & Review Rules
- Branches: `feat/…`, `fix/…`, `chore/…`, `docs/…`. Conventional Commits (`feat(cart): …`).
- **Small PRs** (< ~400 lines changed where possible), one concern each.
- PR template must include: summary, linked requirement IDs, screenshots/video (desktop + mobile), reduced-motion check, accessibility check, performance note (bundle size delta), migration notes, risks, `TODO(verify)` list.
- CI must pass: typecheck, lint, unit, build, e2e, Lighthouse budgets, axe.
- **Never** force-push to `main`, never commit `.env`, never merge your own PR without review for payments/auth/migrations.

## 9. Testing & Definition of Done
A task is **done** only when:
- [ ] Meets the linked `FR-*` acceptance criteria and App Flow edge cases.
- [ ] Types, lint, unit tests pass; new logic has tests (especially pricing, serviceability, status mapping, webhooks).
- [ ] E2E updated for user-facing flows; works on mobile viewport.
- [ ] Keyboard + screen-reader sanity check; reduced-motion mode verified.
- [ ] Performance budgets respected (note bundle delta and Lighthouse result).
- [ ] No secrets/PII in logs; authZ verified for every new endpoint.
- [ ] i18n strings added for EN + HI (HI may be flagged `TODO(translate)`).
- [ ] Docs/ADR updated if behaviour or architecture changed.
- [ ] Unknowns are listed explicitly (not silently assumed).

## 10. How AI agents should work
1. **Understand before coding.** Restate the task, list assumptions and relevant `FR-*` IDs. If requirements are ambiguous on money, delivery promises, veg status, security or legal → **stop and ask**.
2. **Plan small.** Propose a short plan; implement in small, testable increments.
3. **Prefer boring, proven solutions** (Tier A). Justify any Tier B usage with the fallback.
4. **Show your work:** summarise what changed, how to run/verify, what you did **not** do, and what needs human verification.
5. **Don't touch unrelated files**; don't refactor broadly without approval; don't rename public APIs silently.
6. **When generating content** (dish descriptions, maker stories, festival copy): keep it factual and hedged, mark unverified claims `TODO(verify)`, never fabricate quotes or people, never copy copyrighted text/recipes wholesale (write original summaries), respect cultural sensitivity.
7. **When generating images/design:** follow `05-DESIGN.md`; no copyrighted characters or brand logos; no real people's likeness without consent.
8. **Data seeding:** import the 28-state list as-is; keep the "recipes vary / confirm veg recipe" notes in `veg_notes`; do **not** "clean up" by merging dishes across states — use `dish_regions` many-to-many and `dish_aliases` instead.
9. **Ask-before-doing list** (require explicit founder approval): new paid service/vendor, changing commission/pricing logic, changing refund/return policy text, enabling COD, adding non-core data collection, changing legal pages, switching auth/payment/shipping providers, enabling any Tier B/experimental flag by default.
10. **Never do list:** bypass signature checks; hard-code credentials; return fake "available" delivery; ship placeholder legal text as final; scrape copyrighted images; auto-publish seller content without approval; run destructive DB commands on production; send real notifications/payments from non-production environments.

## 11. Prompt Templates (for humans to use with AI tools)

**Feature:**
> Implement `FR-XXX-NN` from `docs/01-PRD.md`. Follow `AGENTS.md`. First list assumptions and a plan. Touch only `src/modules/<module>` and `src/components/features/<feature>`. Add tests. Output: changed files, how to verify, risks.

**UI/animation:**
> Build the `<section>` per `docs/05-DESIGN.md` §<n>. Use Lenis + GSAP ScrollTrigger via existing providers, respect reduced motion and the cursor rules in `AGENTS.md §5`. Content must render without JS. Report bundle-size delta and Lighthouse numbers.

**Bug:**
> Reproduce first (write a failing test), then fix with the smallest change. Explain root cause. Don't change unrelated behaviour.

**Content:**
> Draft the story for dish `<name>` (state `<state>`). Hedged, original wording, 120–160 words, no unverifiable claims, include `TODO(verify)` markers, provide Hindi version flagged for human review.

## 12. Glossary (shared vocabulary)
**Dish** (Library entry) vs **Product** (seller's SKU) · **Delivery class**: `SHELF_STABLE | SHORT_LIFE | FRESH` · **Serviceability**: `AVAILABLE | AVAILABLE_LIMITED | UNAVAILABLE | UNKNOWN` · **Sub-order**: per-seller part of an order · **NDR/RTO**: failed delivery / return to origin · **Paise**: INR × 100.
