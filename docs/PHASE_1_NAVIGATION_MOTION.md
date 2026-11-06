# Phase 1 — Navigation 3D motion and animation

## Scope

The primary site navigation, mobile navigation drawer items, header action links/buttons, and footer navigation links use one restrained motion language that matches the Rasvani heritage-meets-modern visual system.

## Interaction details

- Desktop pointer users receive a small, bounded local pointer-position tilt using CSS perspective and rotation. The same local position drives a subtle highlight that follows the pointer; both tilt and highlight reset when the pointer leaves. The pointer effect is limited to mouse input; touch interactions do not attempt to track a finger.
- Navigation items, the account action and the mobile menu trigger lift slightly on hover/focus, with layered shadows, a soft pointer-position highlight, and a short pressed state. Shop remains a primary navigation link and receives the same navigation motion.
- Desktop navigation links and header actions enter with a subtle staggered 3D reveal; opening the mobile navigation introduces its links with the same restrained entrance language.
- Footer links receive a smaller matching depth response.
- Navigation links remain ordinary anchors with their existing destinations. The menu trigger retains its accessible label and expanded state.

## Accessibility and performance guardrails

- `prefers-reduced-motion: reduce` disables transforms, transitions, and entrance animation.
- The mobile menu is keyboard-focusable and focus-visible styling remains present.
- The interactive tilt is limited to mouse pointer events. No animation dependency or canvas/WebGL layer is introduced.
- Effects use transform and opacity rather than layout-affecting animation properties. Entrance delays are short and decorative; they never delay interaction.
- Motion is decorative only; it does not delay navigation or hide menu content.

## QA boundary

`qa/phase1_navigation_motion_checks.py` validates source-level wiring, accessibility guards, responsiveness and reduced-motion behavior. It does not replace browser testing on physical touch devices, high-refresh displays, or assistive technology. Full framework build and browser tests remain separate validation tasks.
