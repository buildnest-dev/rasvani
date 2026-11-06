from pathlib import Path
import json

root = Path(__file__).resolve().parents[1]
header = (root / 'apps/web/components/site-header.tsx').read_text()
css = (root / 'apps/web/app/globals.css').read_text()
docs = (root / 'docs/PHASE_1_NAVIGATION_MOTION.md').read_text()

checks = {
    'header_uses_client_interaction_for_pointer_tilt': "'use client'" in header and 'applyMenuTilt' in header,
    'tilt_is_limited_to_mouse_pointer': "event.pointerType !== 'mouse'" in header,
    'reduced_motion_is_checked_before_pointer_animation': "matchMedia('(prefers-reduced-motion: reduce)')" in header,
    'tilt_uses_local_pointer_position': 'getBoundingClientRect()' in header and 'event.clientX' in header and 'event.clientY' in header,
    'tilt_values_are_bounded_by_local_coordinates': 'Math.max(0, Math.min(1,' in header and '(x - 0.5) * 5' in header and '(0.5 - y) * 4' in header,
    'pointer_state_is_reset_on_leave': 'onPointerLeave: resetMenuTilt' in header and 'removeProperty' in header and "removeProperty('--menu-glow-x')" in header and "removeProperty('--menu-glow-y')" in header,
    'all_six_primary_menu_links_receive_motion_class': 'links.map(([label, href], index)' in header and 'className={`menu-item-3d ${isCurrent(href)' in header,
    'primary_navigation_remains_accessibly_labelled': 'aria-label="Main navigation"' in header,
    'mobile_menu_links_receive_motion_and_stagger_index': 'aria-label="Mobile navigation"' in header and 'style={menuItemStyle(index)}' in header,
    'menu_trigger_keeps_expanded_state_and_motion': 'aria-expanded={menuOpen}' in header and 'menu-button menu-item-3d' in header,
    'account_and_menu_actions_receive_motion': 'account-link menu-item-3d' in header and 'iconbtn menu-button menu-item-3d' in header and "translate('The Pantry')" in header and 'style={menuItemStyle(links.length)}' in header and 'style={menuItemStyle(links.length + 1)}' in header and '...motionHandlers' in header,
    'navigation_uses_perspective_and_3d_transforms': '.menu-item-3d{' in css and 'perspective(850px)' in css and 'rotateX(var(--menu-tilt-x))' in css,
    'navigation_has_layered_hover_shadows': '.nav .menu-item-3d:hover' in css and 'box-shadow:' in css,
    'pointer_follow_glow_is_subtle_and_layered': 'radial-gradient(circle at var(--menu-glow-x) var(--menu-glow-y)' in css and "setProperty('--menu-glow-x'" in header and "setProperty('--menu-glow-y'" in header,
    'mobile_items_have_staggered_entrance_animation': '@keyframes menu-item-enter' in css and 'animation-delay:calc(var(--menu-index,0) * 42ms)' in css,
    'desktop_menu_items_have_staggered_entrance_animation': '.nav .menu-item-3d{animation:menu-item-enter' in css and 'animation-delay:calc(var(--menu-index,0) * 48ms)' in css,
    'header_actions_have_staggered_entrance_animation': '.actions .menu-item-3d{animation:menu-item-enter' in css and '+ 90ms)' in css,
    'mobile_menu_is_responsive_and_keyboard_focusable': '@media(max-width:900px){.mobile-nav-links{display:grid}' in css and '.mobile-nav-links .menu-item-3d:focus-visible' in css,
    'active_state_has_press_feedback': '.menu-item-3d:active' in css and 'scale(.975)' in css,
    'footer_navigation_has_matching_3d_hover': '.footer-row a:hover' in css and 'translateZ(5px)' in css,
    'reduced_motion_disables_menu_motion': '@media(prefers-reduced-motion:reduce){.menu-item-3d' in css and 'animation:none!important' in css and '.nav .menu-item-3d,.actions .menu-item-3d{animation:none!important}' in css,
    'touch_devices_are_not_forced_into_pointer_tilt': '@media(hover:hover) and (pointer:fine)' in css,
    'documentation_covers_motion_and_accessibility': ('reduced motion' in docs.lower() or 'reduced-motion' in docs.lower()) and 'touch' in docs.lower() and 'keyboard' in docs.lower(),
}

passed = sum(checks.values())
result = {'suite': 'phase1_navigation_motion', 'passed': passed, 'total': len(checks), 'checks': checks}
(root / 'qa/phase1_navigation_motion_static_results.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({'passed': passed, 'total': len(checks), 'failed': [key for key, value in checks.items() if not value]}, indent=2))
if passed != len(checks):
    raise SystemExit(1)
