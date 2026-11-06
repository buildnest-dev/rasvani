from pathlib import Path

root = Path(__file__).resolve().parents[1]
layout = (root / 'apps/web/app/layout.tsx').read_text()
motion = (root / 'apps/web/components/site-motion-director.tsx').read_text()
css = (root / 'apps/web/app/globals.css').read_text()
checks = {
    'motion director mounted once in root layout': 'SiteMotionDirector' in layout and '<SiteMotionDirector />' in layout,
    'motion enhancement is client-side and effect-based': "'use client'" in motion and 'useEffect' in motion,
    'intersection observer reveals are present': 'IntersectionObserver' in motion and 'motion-in-view' in motion,
    'pointer perspective is bounded by fine-pointer check': 'finePointer.matches' in motion and 'data-motion-tilt' in motion,
    'scroll depth uses passive listener and animation frame': "{ passive: true }" in motion and 'requestAnimationFrame' in motion,
    'dynamic route content is registered': 'MutationObserver' in motion and 'register(node)' in motion,
    'homepage hero has separate floating choreography': '.hero-main-disc' in css and '.hero-disc-spice' in css and '.hero-disc-sweets' in css,
    'collection imagery has distinct timings': 'nth-child(3n+1)' in css and 'nth-child(3n+2)' in css and 'nth-child(3n)' in css,
    'map geometry is not targeted for transform': '.map-visual-stage{' in css and 'maplibre' not in motion.lower(),
    'reduced motion preference is respected': '(prefers-reduced-motion:reduce)' in css and "reducedMotion.matches" in motion,
    'coarse pointer motion is restrained': '(hover:none),(pointer:coarse)' in css,
    'product detail and regional food imagery are covered': '.product-detail-gallery figure' in motion and '.regional-product-art' in motion,
    'producer and editorial imagery are covered': '.producer-public-art' in motion and '.journal-pillar-art' in motion,
    'account and operations panels are covered': "'.form-shell'" in motion and "'.warehouse-panel'" in motion and "'.admin-subsection'" in motion,
    'no extra animation runtime dependency added': 'framer-motion' not in (root / 'apps/web/package.json').read_text() and 'gsap' not in (root / 'apps/web/package.json').read_text(),
}
failed = [name for name, ok in checks.items() if not ok]
for name, ok in checks.items():
    print(('PASS' if ok else 'FAIL') + ' | ' + name)
print(f'\n{len(checks)-len(failed)}/{len(checks)} static motion checks passed')
raise SystemExit(1 if failed else 0)
