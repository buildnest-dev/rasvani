from pathlib import Path
import json
root = Path(__file__).resolve().parents[1]
component = (root / 'apps/web/components/region-directory.tsx').read_text()
page = (root / 'apps/web/app/explore-india/page.tsx').read_text()
experience = (root / 'apps/web/components/explore-india-experience.tsx').read_text()
regions = (root / 'apps/web/lib/regions.ts').read_text()
css = (root / 'apps/web/app/globals.css').read_text()
checks = {
    'uses canonical 36-region taxonomy': "from '@/lib/regions'" in component and 'regions.slice(0, 28)' in component and 'regions.slice(28)' in component,
    'offers all states and union territories filters': all(x in component for x in ["'all'", "'states'", "'territories'", '28 States', '8 Union Territories']),
    'searches region names without a map dependency': 'region.toLocaleLowerCase().includes(normalized)' in component,
    'filter controls expose accessible pressed state': 'aria-pressed={scope ===' in component and 'aria-label="Filter regions by type"' in component,
    'search results announce changes': 'aria-live="polite"' in component,
    'zero-result state is explained': 'No matching region.' in component,
    'region links resolve to region detail route': '`/explore-india/${encodeURIComponent(region.toLowerCase().replaceAll(\' \', \'-\'))}`' in component,
    'Bihar is identified as first launch focus without invented food claims': 'isBihar' in component and "t('firstLaunch')" in component and 'Individual food, district and producer content will be published only when verified' in component,
    'availability and delivery are not implied': 'does not imply product availability or delivery coverage' in component,
    'directory page retains map-independent browsing': 'RegionDirectory' in experience and '<RegionDirectory/>' in experience.replace(' ', ''),
    'taxonomy includes 36 region records': regions.count("'") >= 72 and 'West Bengal' in regions and 'Puducherry' in regions,
    'responsive styling is present': '@media(max-width:560px)' in css and '.region-scope' in css,
}
passed = sum(checks.values())
out = {'suite': 'Phase 3 regional directory', 'passed': passed, 'total': len(checks), 'checks': checks}
(root / 'qa/phase3_regional_directory_static_results.json').write_text(json.dumps(out, indent=2) + '\n')
print(json.dumps(out, indent=2))
if passed != len(checks):
    raise SystemExit(1)
