# Rasvani — Logo Design Brief

Paste this whole file into Claude Design. It describes the brand, what the logo must do, what it must never do, and exactly which files to deliver.

## 1. The brand in one paragraph

**Rasvani** (Devanagari: **रसवाणी**) is a pan-India, **vegetarian-only** marketplace for traditional regional foods. A customer in any city can ask for the foods of home, or of another state, and we connect them with regional makers. We only promise delivery where we can actually do it, checked by PIN code. The product is currently a pilot with a waitlist.

- **Name meaning (for the designer):** *ras* = taste, essence, juice, and in Indian aesthetics the emotional flavour of an experience; *vani* = voice, speech. Together, roughly "the voice of taste" or "the taste that speaks". The idea: every dish carries a regional voice and a memory of home.
- **Tagline:** *The taste of home, wherever you are.*
- **Secondary line:** *One India. Many Traditions.*
- **Audience:** mostly mobile users in India, English and Hindi, many of them away from home (students, professionals, families who moved cities). Warm, nostalgic, trustworthy. Not trendy, not corporate.
- **Personality:** warm, rooted, premium but not luxurious, editorial, quietly proud of regional craft. Think a well-kept family recipe book, not a delivery app.

## 2. What to design

1. **Primary logo (horizontal lockup):** symbol + wordmark "Rasvani", with the Devanagari "रसवाणी" as a small secondary line or optional lockup.
2. **Symbol / mark on its own:** works as an app icon, favicon (16px) and social avatar.
3. **Wordmark only:** "RASVANI" for tight spaces.
4. **Stacked lockup:** symbol above wordmark, for the footer and print.
5. **Colour variants:** full colour on cream, full colour on maroon, one-colour dark, one-colour light.
6. A short **usage note**: clear space, minimum sizes, do and don't.

Offer **three distinct directions** first (see §5), recommend one, then refine only the one I pick.

## 3. Design requirements

- **Must feel Indian and regional without clichés.** No tricolour, no map outline, no Taj Mahal, no generic elephant or peacock, no Om or religious symbols, no deity imagery. The brand serves many communities and festivals, so it must not belong to one religion or one region.
- **Vegetarian-only must never be contradicted.** No fish, meat, egg, or anything that reads as non-veg. A leaf, grain, flower, lamp, pot or steam is safe.
- **Do not draw a map of India or its borders.** Boundary depiction is legally sensitive.
- **Ideas worth exploring** (pick and combine, do not use all):
  - A **sound-wave or voice motif** merged with a **steam curl** or **flame** (ras + vani).
  - A **brass katori / thali / diya** silhouette with a wave or rising steam.
  - A **marigold** (genda) or **lotus** formed from stacked petals that also read as a speech bubble or sound arcs.
  - A **devanagari "र" (ra)** as the hidden form inside the symbol. Keep it legible and correctly drawn.
  - A **block-print or rangoli-inspired** geometric rhythm, simplified to 3 or 4 shapes.
- **Scales down:** readable at 16px favicon and in a single colour. No fine hairlines, no gradients that are required for meaning, no tiny text inside the symbol.
- **Works on light and dark:** cream `#fff8ec` and deep maroon `#2b0a10`.
- **Devanagari quality:** if the Devanagari line is included, use a proper serif such as Noto Serif Devanagari, with correct conjuncts and matras, not a stretched or faux-bold version. Have the spelling reviewed by a native speaker: **रसवाणी**.
- **Originality:** no copying of existing food, grocery or delivery brands. Please check the final mark does not closely resemble known logos.

## 4. Existing brand system (use these, do not invent a new palette)

| Role | Name | Hex |
|---|---|---|
| Deep background | Maroon 950 | `#2b0a10` |
| Primary dark | Maroon 900 | `#4a0f17` |
| Accent maroon | Maroon 700 | `#7a1f2b` |
| Primary accent | Marigold gold | `#d9a441` |
| Light gold | Gold 300 | `#e8c56e` |
| Warm accent | Saffron | `#d97a2b` |
| Deep green | Leaf 800 | `#234a34` |
| Header green | Forest 900 | `#15301f` |
| Header accent | Coral | `#c4553a` |
| Page light | Cream 50 | `#fff8ec` |
| Page light, softer | Cream 100 | `#fbf0db` |
| Veg mark | Veg green | `#1e8e3e` |

Use at most **two colours plus a neutral** in the primary logo. Gold on maroon is the signature pairing; forest green with a coral accent is the light-header pairing.

**Type in the product:** Fraunces (display serif, has italics) for headings and the current wordmark, DM Sans for body, Noto Serif Devanagari for Hindi. The logo may use a custom or modified letterform, but should sit comfortably next to Fraunces.

**Current wordmark in the header** (for reference only, free to improve): "RAS*VANI*" in widely spaced Fraunces caps, forest green, with the second half in italic coral, and "रसवाणी" in small coral type underneath.

## 5. Three directions to propose

1. **Voice and steam.** A single continuous line that starts as steam from a katori and ends as sound arcs. Minimal, modern, one colour.
2. **Marigold bloom.** A marigold built from 8 to 12 simple petals, one petal subtly forming a speech curve. Warm, festive, gold on maroon.
3. **Devanagari-led.** A refined wordmark where the **र** is designed as a feature (for example its flag stroke becomes a rising steam curl). Typographic and editorial.

For each: a one-line rationale, the symbol on cream and on maroon, at large size and at 32px.

## 6. Deliverables

- Logo files as **SVG** (clean paths, no embedded raster, no live text: convert text to outlines) and **PNG** (transparent background; 1024px symbol, 2048px wide horizontal).
- File names:
  - `rasvani-logo-horizontal.svg`, `rasvani-logo-stacked.svg`, `rasvani-mark.svg`, `rasvani-wordmark.svg`
  - Colour variants suffixed `-color`, `-dark`, `-light`, `-on-maroon`.
- **Favicon set:** `favicon.svg` plus 32px and 180px PNG (apple touch) and a 512px app icon with safe padding.
- A one-page **usage sheet** (PNG or PDF): clear space (suggest the height of the "R" on all sides), minimum sizes (symbol 16px, horizontal logo 96px wide), backgrounds, misuse examples.
- Short **hex and font list** matching §4.

## 7. Where the files go in this repo

Replace these when the final logo is ready:

- `public/mark.svg` and `public/mark-simple.svg`: full and simplified symbol.
- `public/favicon.svg` and `public/app-icon.svg`: referenced from `src/app/layout.tsx`.
- `src/components/brand/sprite.tsx`: the inline `Logo` component and the SVG sprite symbols used by the intro, footer and hero.
- `src/components/features/header.tsx`: the header wordmark (currently live text styled with `.wordmark` in `src/app/globals.css`).

## 8. Things I need you to flag

- Anything in the final design that might read as non-vegetarian, religious, or political.
- Any conflict with an existing well-known brand.
- The Devanagari spelling needing native-speaker review.
- Whether the symbol still reads when printed in one colour on a brown paper bag or a steel tin lid (packaging use).
