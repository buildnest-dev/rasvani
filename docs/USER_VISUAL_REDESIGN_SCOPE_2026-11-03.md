# Rasvani — consolidated visual and interaction requirements

Status: implementation scope recorded; only navigation naming and contrast improvements are implemented in this checkpoint. The items below are not marked complete until run in the browser and accepted.

## Navigation and readability
- Brand-led labels: Home of Flavours, India, Unfolded, Flavour Trails, The Pantry, Food Stories, Meet the Makers.
- Large, bold, high-contrast labels with a clearly visible active/current-section state, hover/focus treatment, and a small “YOU ARE HERE” indicator.
- Responsive mobile navigation and keyboard-visible focus; reduced-motion support retained.

## Homepage and site-wide art direction
- Upgrade homepage hierarchy, typography, spacing, contrast, calls to action and editorial composition using Rasvani's cream, maroon, terracotta, gold and deep-green palette.
- Use distinct premium editorial visuals for each major section. Do not repeat one hero image across unrelated sections.
- Images must depict the relevant traditional vegetarian food/ingredients. Decorative AI editorial imagery must be labelled/treated as illustration, never as actual purchasable product photography.
- Keep actual product photos tied to approved catalogue records.

## India discovery experience
- Fix and browser-verify the MapLibre/PMTiles integration error before claiming the map works.
- Render all 28 States and 8 Union Territories, with current/licensed boundary data; do not describe the historical 2024/785-district layer as current or complete.
- State selection must lead to its district map/index; district selection must resolve to the correct district route.
- Current official district master and licensed complete pan-India geometry must be reconciled before claiming complete coverage.
- District pages should show only evidence-reviewed traditional vegetarian food associations, with ingredients, preparation, cultural context, and sources/review state.
- Generate matching AI editorial illustrations for verified food entries where approved; never invent a food/district association or imply AI art is a product photo.
- Product availability and purchase actions must only appear for approved, actually available products.

## Premium motion
- Re-study both supplied animation references and create an original Rasvani motion plan by section.
- Implement differentiated, cinematic food/ingredient choreography (hero, regional discovery, food stories, category cards, producer storytelling), not just generic hover/scroll reveals.
- Preserve performance, responsive behavior, keyboard usability and prefers-reduced-motion support.
- Test on desktop, tablet and mobile; do not claim visual parity with the references until reviewed in-browser.

## Verification gate
- Run the Next.js application and test the actual browser experience.
- Test navigation active state, map load, state/district interactions, district food content and image matching, all major animations, responsive layouts and console/network errors.
- If required dependencies, credentials, official geometry or verified food records are missing, document the blocker instead of fabricating a result.
- Do not mark the whole redesign complete based on static checks or code presence alone.
