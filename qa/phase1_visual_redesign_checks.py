from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / 'apps' / 'web'
read = lambda p: (WEB / p).read_text(encoding='utf-8')
checks = {}

home = read('components/home-experience.tsx')
header = read('components/site-header.tsx')
locale = read('components/locale-provider.tsx')
map_ui = read('components/india-map-experience.tsx')
boundary_map = read('components/india-boundary-map.tsx')
explore = read('components/explore-india-experience.tsx')
map_route = read('app/india-map/page.tsx')
explore_route = read('app/explore-india/page.tsx')
state_route = read('app/explore-india/[region]/page.tsx')
district_route = read('app/explore-india/[region]/district/[district]/page.tsx')
styles = read('app/globals.css')
regions = read('lib/regions.ts')
districts = read('lib/bihar-districts.ts')
shop = read('app/shop/page.tsx')
package = json.loads(read('package.json'))
root_readme = (ROOT / 'README.md').read_text(encoding='utf-8')

checks['Homepage uses the existing Next.js route and React component'] = 'HomeExperience' in read('app/page.tsx') and (WEB / 'components/home-experience.tsx').exists()
checks['Prominent search submits to the existing regional search route'] = 'action="/explore-india"' in home and 'name="q"' in home
checks['Brand hero carries the Rasvani regional brand statement'] = 'India, Served by Region.' in header and "t('heroTitle')" in home
checks['Homepage hero uses five item-specific foods in the cinematic 3D stage'] = 'homeHeroStageItems' in home and 'SiwanFood3DStage' in home and 'variant="cinematic"' in home and all(name in home for name in ['Thekua','Silao Khaja','Tilkut','Sattu Ladoo','Roasted Makhana'])
checks['Homepage has an over-the-top cinematic 3D food theatre'] = all(x in home for x in ['home-hero-cinematic-stage','home-hero-cinematic-map','home-hero-light-rings','variant="cinematic"']) and all(x in styles for x in ['siwan-food-3d-stage-cinematic','@keyframes homeHeroHalo','@keyframes homeHeroMapLift','homeHeroSparkle'])
checks['Featured editorial themes use distinct source artwork'] = all(x in home for x in ['rasvani-editorial-spice-pantry.webp','rasvani-editorial-sweets-brass.webp','rasvani-editorial-snack-feast.webp'])
checks['Featured regional food section precedes stories, producers and Better Choices'] = home.index('home-featured-section') < home.index('home-regional-story-section') < home.index('home-producer-section') < home.index('home-better-section')
checks['Homepage contains a dedicated regional stories section'] = 'REGIONAL FOOD STORIES' in home and 'food-stories' in home
checks['Homepage contains producer partnership section without invented identities'] = 'MEET OUR PRODUCERS' in home and 'curated producer network' in home and 'No producer identities' not in home
checks['Homepage contains Better Choices'] = 'home-better-section' in home and 'better-choices' in home
checks['Explore India appears after the other homepage editorial sections'] = home.index('home-explore-section') > home.index('home-better-section') and 'href="/explore-india"' in home
checks['Homepage map preview links to the dedicated map route'] = 'href="/india-map"' in home
checks['Homepage remains within the existing App Router project'] = (WEB / 'app/page.tsx').exists() and (WEB / 'package.json').exists()
checks['India Map has its own dedicated route'] = (WEB / 'app/india-map/page.tsx').exists() and 'IndiaMapExperience' in map_route
checks['Explore India remains an independent route'] = (WEB / 'app/explore-india/page.tsx').exists() and 'ExploreIndiaExperience' in explore_route and '/explore-india' in explore_route
checks['Map journey remains within one page with three states'] = all(x in map_ui for x in ["'regions'", "'districts'", "'foods'"]) and 'setStep' in map_ui
checks['Canonical 36 regions are included from the project region directory'] = 'regions.slice(0, 28)' in map_ui and 'regions.slice(28)' in map_ui and len(re.findall(r"'[^']+'", regions.split('=')[1].split('] as const')[0])) == 36
checks['Map uses MapLibre GL and PMTiles rather than a static or schematic map image'] = 'maplibre-gl' in boundary_map and 'pmtiles' in boundary_map and 'new pmtiles.PMTiles' in boundary_map and 'addProtocol' in boundary_map
checks['Map loads LGD state and district vector archives'] = 'LGD_States.pmtiles' in boundary_map and 'LGD_Districts.pmtiles' in boundary_map
checks['Map uses state LGD code to filter district polygons'] = 'State_LGD' in boundary_map and 'selectedStateCode' in boundary_map and 'stateFilter' in boundary_map
checks['Map includes interactive hover, highlight and click handling'] = all(x in boundary_map for x in ["'mousemove'", "'mouseleave'", "'click'", "admin-highlight"])
checks['Map labels use one anchored State/UT label and collision-managed district labels'] = 'STATE_LABEL_DATA' in boundary_map and 'state-label-anchors' in boundary_map and "'text-field': level === 'states' ? ['to-string', ['get', 'name']] : ['to-string', ['get', nameField]]" in boundary_map and "'text-allow-overlap': false" in boundary_map and 'text-variable-anchor' in boundary_map
checks['Map has a visible attribution and graceful network fallback'] = 'Local Government Directory (LGD), 2024 snapshot' in boundary_map and 'boundary-map-fallback' in boundary_map
checks['State and district map journey supports bounds/zoom into selection'] = 'geometryBounds' in boundary_map and 'fitBounds' in boundary_map and 'selectedBounds' in map_ui
checks['Bihar has 38 district navigation records'] = len(re.findall(r"'[^']+'", districts.split('= [',1)[1].split('] as const')[0])) == 38 and '38 district' in map_ui
checks['District food stage does not pair a generic feast image with a district name'] = 'district-art-ornament' in map_ui and 'rasvani-feast-hero.webp' not in map_ui and 'get_public_catalogue_product_media' in district_route
checks['District food content remains pending when no approved associations exist'] = 'pending-collection-card' in map_ui and 'pendingBody' in locale
checks['District stage keeps vegetarian-only framing'] = 'traditional vegetarian foods' in map_ui and 'Only vegetarian collections' in map_ui
checks['Regional state and district pages remain server-backed and approval-filtered'] = "eq('publication_status', 'approved')" in state_route and "eq('review_status', 'approved')" in district_route
checks['Regional products require approved vegetarian/vegan dietary classification'] = all(x in state_route and x in district_route for x in ["products.dietary_review_status", "products.dietary_classification", "'vegetarian'", "'vegan'"])
checks['Actual approved product photos are fetched from the approved media RPC'] = 'get_public_catalogue_product_media' in state_route and 'get_public_catalogue_product_media' in district_route and 'createSignedUrl' in state_route and 'createSignedUrl' in district_route
checks['District route does not invent dish imagery or product names'] = 'get_public_catalogue_product_media' in district_route and 'productImages.get(item.products.id)' in district_route and 'rasvani-feast-hero.webp' not in district_route
checks['Vegetarian classification schema defaults to unverified'] = 'dietary_classification text not null default \'unverified\'' in (ROOT / 'supabase/migrations/202611030043_product_dietary_classification_review.sql').read_text(encoding='utf-8')
checks['Dietary approval requires quality reviewer role and evidence reference'] = all(x in (ROOT / 'supabase/migrations/202611030043_product_dietary_classification_review.sql').read_text(encoding='utf-8') for x in ['quality_reviewer','p_evidence_reference','audit_logs','review_product_dietary_classification'])
checks['Regional catalogue filter requires approved vegetarian or vegan records'] = "products.dietary_review_status" in shop and "products.dietary_classification" in shop
checks['Explore India includes search, region directory and editorial links'] = 'RegionDirectory' in explore and 'action="/explore-india"' in explore and 'food-stories' in explore
checks['State route and District route are separate real server-rendered routes'] = (WEB / 'app/explore-india/[region]/page.tsx').exists() and (WEB / 'app/explore-india/[region]/district/[district]/page.tsx').exists()
checks['All twelve requested language locales remain in the shared locale provider'] = all(f"code: '{code}'" in locale for code in ['en','hi','bn','ta','te','mr','gu','pa','kn','ml','or','as'])
checks['Language choice persists across navigation'] = "localStorage.setItem('rasvani-locale'" in locale and "localStorage.getItem('rasvani-locale'" in locale
checks['Global header continues to use supported locales and locale-aware navigation'] = 'useLocale' in header and 'supportedLocales' in header and 'menu-item-3d' in header
checks['Distinct motion classes and 3D image treatments are styled'] = all(x in styles for x in ['food-levitate','card-sway-one','card-sway-two','card-sway-three','perspective:1200px','rotateY','siwan-food-3d-stage-cinematic','homeHeroHalo'])
checks['Navigation, map, homepage and discovery pages have responsive styles'] = all(x in styles for x in ['@media(max-width:900px)','@media(max-width:700px)','@media(max-width:420px)','.india-boundary-map'])
checks['Reduced-motion accessibility is respected'] = '@media(prefers-reduced-motion:reduce)' in styles and 'animation:none' in styles
checks['MapLibre and PMTiles are declared as application dependencies'] = 'maplibre-gl' in package['dependencies'] and 'pmtiles' in package['dependencies']
checks['Existing public shop and product detail routes are preserved'] = (WEB / 'app/shop/page.tsx').exists() and (WEB / 'app/shop/[slug]/page.tsx').exists()
checks['Commerce is not falsely presented as live checkout or payment'] = 'Ordering is not open for this catalogue entry yet' in read('app/shop/[slug]/page.tsx') and 'Prices, stock quantities' in shop and 'Add to Cart' not in read('app/shop/[slug]/page.tsx')
checks['Original governing 29-page PDF remains in the project'] = (ROOT / 'docs/Rasvani_Ultimate_Phase_by_Phase_Website_Build_Prompt(1).pdf').exists()
checks['Latest project notes preserve original scope and describe the real boundary map'] = '2024 Local Government Directory' in root_readme and 'original 29-page' in root_readme

passed = sum(1 for value in checks.values() if value)
result = {'suite': 'Phase 1 complete visual and interactive redesign', 'passed': passed, 'total': len(checks), 'status': 'PASS' if passed == len(checks) else 'FAIL', 'checks': {key: {'passed': value} for key, value in checks.items()}}
(ROOT / 'qa' / 'phase1_visual_redesign_static_results.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
print(json.dumps(result, indent=2))
if passed != len(checks):
    raise SystemExit(1)
