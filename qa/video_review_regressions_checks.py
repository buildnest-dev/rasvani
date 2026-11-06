from pathlib import Path
import json
import re

root = Path(__file__).resolve().parents[1]
web = root / 'apps' / 'web'
checks: dict[str, bool] = {}

def read(rel: str) -> str:
    return (web / rel).read_text(encoding='utf-8')

map_component = read('components/india-boundary-map.tsx')
map_experience = read('components/india-map-experience.tsx')
region_page = read('app/explore-india/[region]/page.tsx')
district_page = read('app/explore-india/[region]/district/[district]/page.tsx')
auth = read('lib/auth/authorization.ts')
error_page = read('app/error.tsx')
home = read('components/home-experience.tsx')
stories = read('app/food-stories/page.tsx')
layout = read('app/layout.tsx')
shop = read('app/shop/page.tsx')
product = read('app/shop/[slug]/page.tsx')
search = read('components/regional-search-results.tsx')
account = read('app/account/page.tsx')

checks['map_load_has_bounded_timeout'] = '16000' in map_component and 'showError(' in map_component
checks['map_error_handler_is_attached_before_load'] = map_component.index("currentMap.on('error'") < map_component.index("currentMap.on('load'")
checks['map_error_can_fallback_after_initial_ready'] = 'terminalFailure' in map_component and 'mapReady' in map_component and 'if (!active || terminalFailure) return;' in map_component
checks['map_canvas_remains_mounted_for_cleanup'] = '<div className="india-boundary-map" ref={host}' in map_component
checks['map_loading_state_is_visible'] = 'boundary-map-loading' in map_component
checks['map_error_state_is_visible_and_retryable'] = 'boundary-map-fallback-stage' in map_component and 'setRetryKey((value) => value + 1)' in map_component
checks['bihar_districts_are_available_in_map_fallback'] = 'fallbackItems={isBihar ? districtList : []}' in map_experience and 'biharDistricts' in map_experience
checks['all_bihar_district_navigation_is_visible_without_database'] = "region === 'Bihar'" in region_page and 'biharDistricts.map' in region_page and 'districtNavigation.map' in region_page
checks['known_bihar_district_routes_resolve_without_database'] = 'slugifyDistrict(name) === districtSlug' in district_page and '!BiharDistrictName' in district_page
checks['region_page_keeps_district_index_outside_database_conditional'] = 'Discover {region}, district by district.' in region_page and 'districtNavigation.length > 0' in region_page
checks['district_page_has_nonempty_pending_collection_state'] = 'This district’s food collection is taking shape.' in district_page
checks['missing_supabase_role_lookup_does_not_throw'] = 'export async function getCurrentUserRoles' in auth and 'catch {' in auth and 'return [];' in auth
checks['error_boundary_offers_recovery_navigation'] = 'Try again' in error_page and 'href="/"' in error_page and 'href="/explore-india"' in error_page
checks['food_story_pillars_have_real_image_elements'] = stories.count('<Image src=') >= 4 and all(x in stories for x in ['/images/rasvani-editorial-vegetarian-feast.webp','/images/rasvani-editorial-spice-pantry.webp','/images/rasvani-editorial-snack-feast.webp'])
checks['homepage_no_longer_shows_producer_art_disclaimer'] = 'No producer identities' not in home
checks['footer_no_longer_discloses_image_creation_method'] = 'Illustrative design images' not in layout and 'image' not in layout.lower().split('regional information')[1].split('</p>')[0]
checks['catalogue_not_configured_copy_is_customer_friendly'] = 'not configured in this environment' not in shop and 'first regional collections are being prepared' in shop
checks['product_detail_fallback_is_customer_friendly'] = 'not available in this environment' not in product and 'could not be opened just now' in product
checks['shop_prelaunch_state_has_editorial_recovery_links'] = 'shop-empty-editorial' in shop and 'href="/explore-india"' in shop and 'href="/india-map"' in shop
checks['product_unavailable_state_has_catalogue_recovery'] = 'product-recovery-panel' in product and 'href="/shop"' in product
checks['account_setup_state_returns_visitors_to_public_pages'] = 'href="/for-producers"' in account and 'href="/explore-india"' in account
checks['regional_search_no_longer_mentions_environment_setup'] = 'not connected in this environment' not in search
checks['account_setup_copy_avoids_local_environment_instructions'] = 'local environment' not in account and 'account services are being prepared' in account

def customer_public_text() -> str:
    paths = [*((web / 'app').rglob('*.tsx')), *((web / 'components').rglob('*.tsx')), *((web / 'public').rglob('*'))]
    return '\n'.join(p.read_text(encoding='utf-8', errors='ignore') for p in paths if p.is_file() and p.suffix.lower() in {'.tsx', '.ts', '.css', '.html', '.svg'})

checks['map_loading_uses_one_overlaid_panel'] = 'map-loading' in map_component and '.map-loading .boundary-map-loading{position:absolute' in read('app/globals.css')
checks['map_fallback_district_grid_has_no_duplicate_bihar_section'] = 'fallbackItems={isBihar ? districtList : []}' in map_experience and 'Browse all {districtList.length} Bihar districts' not in map_experience
checks['public_ui_uses_no_illustrative_creation_disclosures'] = not re.search(r'illustrative|image[- ]creation method|not a real product photograph', customer_public_text(), re.IGNORECASE)
checks['explore_search_copy_does_not_reference_machine_generated_translations'] = 'machine-generated translations' not in read('components/explore-india-experience.tsx')
image_refs = set(re.findall(r"['\"](/images/[^'\"]+)['\"]", '\n'.join(p.read_text(encoding='utf-8', errors='ignore') for p in [*((web / 'app').rglob('*.tsx')), *((web / 'components').rglob('*.tsx'))])))
checks['all_referenced_public_images_exist'] = all((web / 'public' / ref.lstrip('/')).is_file() for ref in image_refs)

customer_text = customer_public_text()
forbidden_patterns = [r'\bAI[- ]generated\b', r'\bAI artwork\b', r'\bAI illustrative\b', r'\bartificial intelligence\b', r'\billustrative imagery\b', r'\billustrative design images\b']
checks['no_customer_facing_ai_creation_labels_or_disclaimers'] = not any(re.search(pattern, customer_text, re.IGNORECASE) for pattern in forbidden_patterns)

result = {
    'status': 'PASS' if all(checks.values()) else 'FAIL',
    'passed': sum(checks.values()),
    'total': len(checks),
    'checks': {name: {'passed': passed} for name, passed in checks.items()},
    'scope': 'Static source checks for regressions identified in the 252-second user screen recording; not a live browser, backend, map-network, or checkout test.',
}
out = root / 'qa' / 'video_review_regressions_static_results.json'
out.write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
print(json.dumps(result, indent=2))
if result['status'] != 'PASS':
    raise SystemExit(1)
