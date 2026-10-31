# Rasvani — Design Document (UI/UX + Motion System)

| | |
|---|---|
| **Version / Date** | v0.1 draft · 30 Oct 2026 |
| **Related** | `01-PRD.md`, `02-TECH.md` (motion stack & budgets), `03-APP-FLOW.md`, `04-AI-RULES.md` |
| **Colour/typography note** | Values below are **approximated from the pitch deck**. Confirm against the final brand kit (logo files, exact hex, licensed fonts). |

---

## 1. Design Intent

> **"An interactive journey through India's food culture"** — premium, warm, unmistakably Indian, never a generic shopping grid.

**Three design pillars**
1. **Place** — everything is anchored to geography: map, states, regions, makers' locations.
2. **Provenance** — origin, maker and verification are visually prominent and honest.
3. **Pleasure** — motion and photography create delight; but **the path to purchase is always fast, calm and clear**.

**Two "volumes" of experience**
| Volume | Where | Motion level |
|---|---|---|
| **Cinematic (loud)** | Home, state pages, collections, makers, stories | Smooth scroll, pinned scenes, text reveals, custom cursor, parallax |
| **Calm (quiet)** | Search results, PDP controls, cart, checkout, payment, tracking, account, seller & admin | Short fades/slides ≤ 200 ms, no scroll effects, no custom cursor effects that distract |

## 2. Brand Foundation

- **Name:** Rasvani · **Tagline:** *The taste of home, wherever you are.* · **Secondary line:** *One India. Many Traditions.*
- **Logo:** gold eight-petal flower mark + serif wordmark (from deck). Provide SVG; clear-space = flower height; minimum width 96 px.
- **Voice:** warm, nostalgic, respectful, simple. Light Hinglish touches in microcopy (e.g., "Ghar ka swad", "Aapke PIN par available hai"), never forced. Always accurate about delivery.
- **Cultural care:** use "traditionally associated with", respect regional spellings & native scripts, avoid stereotypes (no cliché turban/elephant clip-art).

## 3. Design Tokens (Tailwind v4 `@theme`)

```css
/* src/styles/globals.css */
@import "tailwindcss";

@theme {
  /* Colour — approximated from deck, confirm with brand kit */
  --color-maroon-950: #2b0a10;   /* deep backgrounds, hero overlay */
  --color-maroon-900: #4a0f17;   /* headings, nav bar, primary text on light */
  --color-maroon-700: #7a1f2b;   /* secondary accents, hover */
  --color-gold-500:   #d9a441;   /* primary accent, CTAs, highlights */
  --color-gold-300:   #e8c56e;   /* hover/glow */
  --color-saffron-500:#d97a2b;   /* section labels, festival accents */
  --color-leaf-800:   #234a34;   /* success/veg-adjacent, secondary accent */
  --color-cream-50:   #fff8ec;   /* page background */
  --color-cream-100:  #fbf0db;   /* cards, panels */
  --color-ink-600:    #6b5b52;   /* muted body text */
  --color-veg:        #1e8e3e;   /* veg mark */
  --color-danger:     #b3261e;

  /* Typography */
  --font-display: "Fraunces", "Playfair Display", Georgia, serif;
  --font-body: "Inter", "Noto Sans Devanagari", system-ui, sans-serif;
  --font-deva-display: "Noto Serif Devanagari", serif;

  /* Radius & shadow */
  --radius-card: 1.25rem;
  --radius-pill: 999px;
  --shadow-soft: 0 10px 30px -12px rgb(74 15 23 / 0.25);

  /* Motion */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out-quart: cubic-bezier(0.76, 0, 0.24, 1);
  --dur-instant: 120ms;
  --dur-fast: 200ms;
  --dur-base: 400ms;
  --dur-slow: 700ms;
  --dur-hero: 1200ms;
}

@media (prefers-reduced-motion: reduce) {
  :root { --dur-base: 1ms; --dur-slow: 1ms; --dur-hero: 1ms; }
}
```

**Contrast rules (must pass AA):** gold-500 on maroon-950/900 ✔; **text on gold buttons = maroon-900** (cream on gold fails); white/cream text on saffron-500 is **not** allowed for body-size text; muted ink-600 on cream ✔ for ≥ 14 px.

**Typography scale (fluid):** Display 56–96 px / 0.95 line-height / tracking −0.02em (uppercase allowed for hero only) · H1 40–64 · H2 32–44 · H3 22–28 · Body 16–18 (Hindi: +1–2 px and line-height 1.65) · Caption 12–13 uppercase tracking +0.08em (like deck labels).
Fonts: self-hosted via `next/font`; subsets Latin + Devanagari; ≤ 3 families.

**Spacing/grid:** 4-px base; 12-col grid desktop, 4-col mobile; max content width 1280 px; generous vertical rhythm (96–160 px between home sections desktop, 56–80 mobile).

## 4. Layout & Components Inventory

**Foundation:** Container, Section, Button (primary gold / secondary outline / ghost), Link, Badge (Verified, Origin Verified, FSSAI, GI, Veg, Jain, Festival), Chip/Filter, Input, OTP input, PIN input (numeric, auto-validates 6 digits), Select, Tabs, Accordion, Dialog/Sheet/Drawer (Radix), Toast, Skeleton, Tooltip, Breadcrumb, Pagination/Infinite rail, Rating, Quantity stepper, Price block, Veg mark.

**Domain:** `IndiaMap`, `StateCard`, `StateSheet` (mobile preview), `DishCard`, `ProductCard`, `MakerCard`, `MakerHero`, `PinCheck` (with result states), `DeliveryEstimate`, `OriginBadgeGroup`, `IngredientsPanel`, `ShelfLifeNotice`, `CollectionHero` (festival, with order-by countdown), `BoxCard`, `CartDrawer`, `CartLineItem`, `CheckoutSteps`, `OrderTimeline`, `AddressCard`, `NotifyMeForm`, `ReviewCard`, `SellerStatusPill`.

**Motion primitives (`components/motion/`):** `SmoothScroll`, `Cursor`, `Reveal`, `SplitHeading`, `ParallaxImage`, `Magnetic`, `Marquee`, `PinnedScene`, `HorizontalRail`, `DrawLine`, `CountUp`, `ImageMaskReveal`, `PageTransition`, `ScrollProgress`.

## 5. Page Blueprints

### 5.1 Home — "The Journey" (storyboard)
| # | Scene | What the user sees | Motion (desktop) | Mobile |
|---|---|---|---|---|
| 0 | **Entry** | Maroon screen, gold flower blooms, wordmark; **max 900 ms, first visit per session only**, overlaps real loading (never delays LCP) | Flower petals scale/rotate in, clip-path wipe reveals hero | Same, shorter (600 ms) |
| 1 | **Hero** | "THE TASTE OF HOME, WHEREVER YOU ARE." over real food photography; gold "YOU ARE."; CTA "Explore by state" + search + PIN | Line-mask text reveal (SplitText), slow image push-in (scale 1.08→1), subtle mouse parallax on food layers, magnetic CTA, floating spice/leaf particles (CSS only, ≤ 12 elements) | No mouse parallax; text reveal + gentle scroll parallax |
| 2 | **Marquee** | Endless strip of dish names in Latin + native script (Litti Chokha · লুচি · ढोकला · சாம்பார்…) | Infinite CSS/GSAP marquee, speed reacts to scroll velocity | Static slow marquee |
| 3 | **India Journey (signature)** | Large India map. As user scrolls, it **lights up state-by-state along a curated route** (e.g., Bihar → Delhi → Kolkata → Mumbai…) while dish cards swap beside it ("Thekua · Bihar") | Pinned scene with scrubbed timeline (ScrollTrigger), state fills animate, route line draws (DrawSVG), counter of "states explored". At scene end → **free-explore mode**: hover/click states | **Not pinned**: map shown, tap state → bottom sheet; short scroll-reveal of sample dishes |
| 4 | **Explore by state rail** | Horizontal rail of state cards: photo, name (EN + native), "7 foods · 3 makers" | Pinned horizontal scroll (scrubbed) with card parallax + tilt on hover | Native swipe carousel with snap |
| 5 | **Festival spotlight** | Collection hero (e.g., Chhath Puja / Diwali) with "Order by <date> for festival delivery" | Background colour morph maroon→saffron on scroll, floating diya/marigold SVG, staggered product card entrance | Simple stagger |
| 6 | **Meet the Makers** | Portrait cards with location chips, 1-line story, play-video affordance | Clip-path image reveals, slow parallax, cursor label "Read story" | Static reveal |
| 7 | **How it works** | Discover → Verify → Check PIN → Order | Connecting path draws as you scroll (DrawSVG), icons pop in | Vertical stepper reveal |
| 8 | **Trust band** | Real verified numbers (makers, states, pincodes served) | CountUp when visible. **Hide until numbers are real.** | Same |
| 9 | **Notify / newsletter + Footer** | "Missing a taste from home? Tell us." + giant wordmark footer | Wordmark letters rise (SplitText) | Static |

### 5.2 State page
Hero with state silhouette morphing in from the map click (viewBox tween / Flip) → short story (3–4 lines) → **regions** chips → dish grid (filter: available/all, category, veg type) → makers from the state → festival tags → "Not here yet? Notify me" tile. Cursor: `data-cursor="view"` on dish cards.

### 5.3 Search & Listing (calm)
Sticky search bar + PIN chip, filter drawer on mobile, results grid with **"Delivers to you" badge**, skeleton loaders. No scroll effects. Card hover = subtle lift (translateY −4 px, 200 ms).

### 5.4 Product Detail (calm, trust-first)
- **Left:** gallery (real photos; swipe on mobile; zoom on hover desktop). **Right/top:** title (+ native name), price, variants, qty.
- **Right below price — `PinCheck` module** (high visibility): input → result chip (green "Delivers by 4–6 Nov", amber "Limited: Mon/Thu dispatch", red "Not available at 800001 · See similar", grey "Can't confirm right now · Retry").
- **Origin card:** map pin mini-map, "Made by <Maker> in <City>, <State>", badges, "Read their story".
- Accordions: Ingredients & allergens · Shelf life & storage · How to enjoy · Shipping & returns.
- Sticky bottom bar on mobile (price + Add to cart). Add-to-cart "fly to cart" micro-animation (≤ 600 ms) then cart count bump.
- Reviews (verified purchase), related foods from same region.

### 5.5 Cart & Checkout (quiet)
Cart drawer + full cart page; grouped by seller with per-shipment ETA; progress steps (Contact → Address → Delivery → Pay). Sticky summary desktop; collapsible mobile. **No Lenis, no cursor effects, no parallax.** Motion limited to field validation, step changes (≤ 200 ms fade/slide) and a success "check draws itself" on confirmation.

### 5.6 Order Tracking
Vertical timeline: Confirmed → Prepared → Packed → Dispatched → (Out for delivery) → Delivered. Completed steps filled gold with timestamps; current step has a gentle pulse (disabled for reduced motion); connecting line draws to the current step on load (500 ms). Courier AWB + link; delay banners are amber with clear next steps.

### 5.7 Seller & Admin
Utility-first, dense but friendly; shadcn tables, filters, bulk actions; Hindi/English toggle; large touch targets for seller on mobile; zero decorative motion (only skeletons and toasts).

## 6. Motion System (the "newest but stable" layer)

### 6.1 Stack & roles
| Library | Role |
|---|---|
| **Lenis** | Smooth/inertial scroll (desktop pointer-fine, motion allowed) |
| **GSAP 3.13+ (ScrollTrigger, SplitText, Flip, DrawSVG, MorphSVG)** | Scroll-linked scenes, text reveals, SVG, layout-state transitions. All plugins free to use commercially |
| **Motion (`motion/react`)** | React-friendly UI micro-interactions: drawers, presence/exit, springs, layout animations |
| **CSS** (`@property`, `scroll-timeline`/scroll-driven animations where supported, `clip-path`, `view-transition`) | **Tier B** enhancements; fallback to simple states |
| **Native View Transitions** | Route transitions + shared product-image → PDP morph; fallback = instant |

Rule of thumb: **GSAP = choreography on the page; Motion = components; CSS = simple states.** Don't use two libraries to animate the same element.

### 6.2 Easing & timing language
| Name | Value | Use |
|---|---|---|
| `reveal` | `expo.out`, 0.9–1.2 s, stagger 0.06–0.1 | Headlines, images entering |
| `ui` | `power3.out`, 0.2–0.4 s | Hovers, drawers, chips |
| `scrub` | `none` (linear) | Scroll-scrubbed timelines |
| `settle` | spring (stiffness ~300, damping ~30) | Cart drawer, toasts |
| `exit` | `power2.in`, 0.15–0.25 s | Dismissals |

Principles: **ease-out entering, ease-in leaving; stagger small; never > 1.2 s for anything the user waits on; motion explains hierarchy, not just decorates.**

### 6.3 Signature interactions
1. **Line-mask text reveal** on all major headings (SplitText lines + mask).
2. **India Journey** pinned/scrubbed scene (§5.1-3) — the hero feature.
3. **Map hover:** hovered state fills gold, lifts (scale 1.03 from centroid, moved to top of SVG z-order), neighbours dim to 60 %, a floating label shows state name + "7 foods"; click zooms the viewBox into the state, then routes to its page.
4. **Magnetic buttons & links** (pull toward pointer ≤ 12 px) — pointer-fine only.
5. **Image mask reveals** (clip-path inset → 0) with slight scale-down for depth.
6. **Horizontal rail** with velocity-aware skew (≤ 3°) on cards (desktop only).
7. **Colour-morph sections** for festivals (background tween on scroll).
8. **Flip transitions** for filters/sort (cards glide to new positions rather than jump).
9. **Shared-element transition** product card → PDP hero (View Transitions API, Tier B).
10. **PIN-check "stamp"**: result chip scales from 1.15→1 with a soft haptic-like bounce, icon draws (SVG stroke).
11. **Add-to-cart fly** + cart badge bump.
12. **Scroll progress** thin gold line under header (home/state/collection only).

### 6.4 Custom Cursor Spec
Visible only when `(hover: hover) and (pointer: fine)` **and** motion is allowed. System cursor stays on inputs, selects, textareas, content-editable, and inside payment iframes.

| State (`data-cursor`) | Visual | Where |
|---|---|---|
| default | 8 px gold dot + 36 px thin gold ring following with lag | Everywhere |
| `link` | ring scales 1.6, fills gold 20 % | Links/buttons |
| `view` | ring grows to 72 px, label "View" | Dish/product cards |
| `read` | label "Read" | Maker/story cards |
| `state` | ring becomes pill with state name | Map states |
| `drag` | label "Drag", ring with arrows | Rails/carousels |
| `play` | label "Play" | Video thumbnails |
| `text` | ring shrinks to a 2 px dot | Over body text (optional) |
| `disabled` | ring dims, no growth | Disabled controls |

Implementation notes: cursor elements are `position: fixed; pointer-events: none; z-index` above content; moved with **`gsap.quickTo`** (no React re-renders); state via event delegation on `pointerover` reading `data-cursor` / `data-cursor-label`; hidden on `pointerleave` of the document; **never** blocks clicks; removed completely on touch.

### 6.5 Reference snippets (production-oriented starting points)

**Smooth scroll provider (Lenis + GSAP on one ticker)**
```tsx
// components/motion/smooth-scroll.tsx
'use client';
import { ReactLenis, type LenisRef } from 'lenis/react';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const QUERY = '(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)';

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const sync = () => setEnabled(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const lenis = lenisRef.current?.lenis;
    lenis?.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenisRef.current?.lenis?.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      lenis?.off('scroll', ScrollTrigger.update);
      gsap.ticker.remove(tick);
    };
  }, [enabled]);

  if (!enabled) return <>{children}</>;
  return (
    <ReactLenis root ref={lenisRef} options={{ autoRaf: false, lerp: 0.1, smoothWheel: true, syncTouch: false }}>
      {children}
    </ReactLenis>
  );
}
```
Mount in the **storefront layout only** (not checkout/seller/admin groups).

**Custom cursor**
```tsx
// components/motion/cursor.tsx
'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    if (!mq.matches || !dot.current || !ring.current) return;

    const root = document.documentElement;
    root.classList.add('has-custom-cursor');
    gsap.set([dot.current, ring.current], { xPercent: -50, yPercent: -50, autoAlpha: 0 });

    const dotX = gsap.quickTo(dot.current, 'x', { duration: 0.08, ease: 'power3' });
    const dotY = gsap.quickTo(dot.current, 'y', { duration: 0.08, ease: 'power3' });
    const ringX = gsap.quickTo(ring.current, 'x', { duration: 0.4, ease: 'power3' });
    const ringY = gsap.quickTo(ring.current, 'y', { duration: 0.4, ease: 'power3' });

    const onMove = (e: PointerEvent) => {
      gsap.to([dot.current, ring.current], { autoAlpha: 1, duration: 0.2, overwrite: 'auto' });
      dotX(e.clientX); dotY(e.clientY); ringX(e.clientX); ringY(e.clientY);
    };
    const onOver = (e: PointerEvent) => {
      const el = (e.target as Element).closest<HTMLElement>('[data-cursor]');
      ring.current!.dataset.state = el?.dataset.cursor ?? 'default';
      if (label.current) label.current.textContent = el?.dataset.cursorLabel ?? '';
    };
    const onLeave = () => gsap.to([dot.current, ring.current], { autoAlpha: 0, duration: 0.2 });

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      root.classList.remove('has-custom-cursor');
    };
  }, []);

  return (
    <div aria-hidden="true">
      <div ref={dot} className="cursor-dot" />
      <div ref={ring} className="cursor-ring" data-state="default">
        <div className="cursor-ring__inner"><span ref={label} /></div>
      </div>
    </div>
  );
}
```
```css
.cursor-dot, .cursor-ring { position: fixed; top: 0; left: 0; z-index: 9999; pointer-events: none; }
.cursor-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--color-gold-500); }
.cursor-ring__inner { width: 36px; height: 36px; border: 1px solid var(--color-gold-500); border-radius: 999px;
  display: grid; place-items: center; transition: transform var(--dur-fast) var(--ease-out-expo), background var(--dur-fast); }
.cursor-ring[data-state="link"] .cursor-ring__inner { transform: scale(1.6); background: rgb(217 164 65 / .2); }
.cursor-ring[data-state="view"] .cursor-ring__inner,
.cursor-ring[data-state="read"] .cursor-ring__inner { transform: scale(2); background: var(--color-gold-500); color: var(--color-maroon-900); font: 600 6px/1 var(--font-body); }
.has-custom-cursor, .has-custom-cursor a, .has-custom-cursor button, .has-custom-cursor [data-cursor] { cursor: none; }
.has-custom-cursor input, .has-custom-cursor textarea, .has-custom-cursor select, .has-custom-cursor [contenteditable] { cursor: auto; }
```

**Split heading reveal (progressive enhancement)**
```tsx
// components/motion/split-heading.tsx
'use client';
import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

export function SplitHeading({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      SplitText.create(ref.current!, {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,                 // re-splits on resize / font load
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.08,
            scrollTrigger: { trigger: ref.current, start: 'top 85%', once: true },
          }),
      });
      gsap.set(ref.current, { visibility: 'visible' });
    });
    return () => mm.revert();
  }, { scope: ref });

  return <h2 ref={ref} data-split className={className}>{children}</h2>;
}
```
```css
/* Hide only when motion is allowed AND JS marked the page; failsafe reveals after 2.5 s even if JS fails */
html.motion-ready [data-split] { visibility: hidden; animation: show-fallback 0s 2.5s forwards; }
@keyframes show-fallback { to { visibility: visible; } }
```
(`motion-ready` class is added by a tiny inline script only if `prefers-reduced-motion: no-preference`.)

### 6.6 Performance & safety rules (summary — full list in `04-AI-RULES.md §5`)
- Animate `transform`/`opacity`/`clip-path` only; no layout properties.
- Lazy-load GSAP plugins per route; heavy scenes via `dynamic()` after LCP.
- Pin/scrub scenes limited to 2–3 on the home page; none on PDP/checkout.
- Test on a **mid-range Android (e.g., ~₹10–15k class device) over throttled 4G**; target 60 fps for scroll scenes, otherwise fall back to the simple version.
- Provide **"Reduce motion" toggle** in footer/settings (in addition to OS setting), stored in cookie.
- Videos: muted, `playsinline`, poster, lazy; disable on Save-Data.
- No scroll-jacking that traps the user; anchors, keyboard scroll and browser back always work.

## 7. India Map — Design & Behaviour
- Source: licensed/official boundary data converted at build time to optimised SVG paths (one `<path>` per state, `id=state-code`). **Boundary depiction must follow official Indian norms.**
- Visual style: cream-100 land with fine maroon-700 borders; states fill gold on hover/selected; subtle paper-grain texture; small food glyphs (e.g., a tiny thekua) can pop above hovered states (≤ 8 SVG icons, reused symbols).
- States with available products get a small gold dot; states with only Library entries are lighter.
- Accessibility: each state is a focusable link (`<a>` inside SVG), `aria-label="Bihar — 7 traditional foods, 3 makers"`; arrow keys move between neighbouring states (optional enhancement); a visible alphabetical list sits below the map.
- Mobile: map scrolls into view un-pinned; tap → bottom sheet (state name, 3 sample dishes, "Explore state").
- Small states/UTs (Goa, Sikkim, Tripura, Delhi, etc.) need enlarged hit-areas / callout chips.

## 8. Imagery, Illustration & Content Style
- **Real photography** for products (consistent background, natural light, packaging shot, size reference). Editorial/hero imagery can be art-directed; **AI-generated imagery must not depict actual products** (the pitch-deck visuals are illustrative).
- Maker portraits & process shots (with consent), location context.
- Illustration language: block-print / alpana / rangoli-inspired line patterns in gold on maroon, used sparingly as dividers and backgrounds; state-specific motifs later (Madhubani for Bihar, Warli for Maharashtra, Pattachitra for Odisha…) — **commission or license properly**; do not copy existing artworks.
- Native-script names displayed beside English (e.g., "Thekua · ठेकुआ").
- Microcopy examples: "Delivers to 560001 by 4–6 Nov" · "Not available at your PIN yet — tell us, we'll try." · "Made by Sunita Devi, Gaya (Origin Verified)" *(example only — never ship invented people)*.

## 9. Responsive Strategy
| Breakpoint | Behaviour |
|---|---|
| ≤ 480 (primary) | Single column, bottom sheets, sticky CTAs, swipe rails, no pinned scenes, no cursor/Lenis |
| 481–1023 | Two columns, simplified scenes, native scroll |
| ≥ 1024 | Full cinematic experience, Lenis, cursor, pinned scenes |
| ≥ 1536 | Max-width containers, larger display type; images scale, not stretch |

Test widths: 360, 390, 768, 1024, 1440, 1920.

## 10. Accessibility Checklist (design-level)
- Contrast AA (see §3); focus ring = 2 px gold + 2 px maroon offset visible on both light/dark sections.
- Targets ≥ 44 px; spacing between targets ≥ 8 px.
- Keyboard: map, rails, drawers, dialogs fully operable; focus trapped in modals; skip-to-content link.
- Screen reader: meaningful `alt` (describe the food), decorative visuals `aria-hidden`, live region for PIN-check results & cart updates.
- Motion: reduced-motion OS setting + in-site toggle; no parallax/pins/cursor/scrub when reduced; no flashing.
- Language: `lang` attributes switch per locale; Devanagari line-height ≥ 1.6.

## 11. Design QA & Handoff
- **Figma** file structure: Foundations (tokens) → Components → Patterns → Pages → Motion specs (frames + notes with durations/easings) → Prototypes for the India Journey scene.
- **Motion specs** exported as a table (trigger, property, from→to, duration, ease, stagger, reduced-motion behaviour) per scene.
- **Definition of design-done:** states designed (default/hover/focus/active/disabled/loading/error/empty), EN + HI text lengths checked, AA contrast verified, reduced-motion variant specified, performance impact noted.
- **QA devices:** one low/mid Android, one recent iPhone, desktop Chrome/Safari/Firefox, low-bandwidth profile.

## 12. Open Design Decisions
1. Final font licences (Fraunces/Noto = open source; confirm if a custom display face is wanted).
2. Which states appear on the signature **India Journey** route and in what order (suggest: pilot states first, then a curated "grand tour").
3. Light-only vs. dark theme (suggest light-only for MVP; hero sections dark).
4. Illustration commissioning (state-wise motifs) and photographer/videographer for makers.
5. Sound design (recommend none for MVP).
6. WebGL/3D hero (defer until Phase 2 and only if budgets allow).
