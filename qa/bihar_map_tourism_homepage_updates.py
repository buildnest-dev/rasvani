import re, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
WEB=ROOT/'apps/web'
district_src=(WEB/'lib/bihar-districts.ts').read_text()
block=district_src.split('export const biharDistricts = [',1)[1].split('] as const',1)[0]
districts=re.findall(r"'([^']+)'",block)
places=(WEB/'lib/bihar-tourist-places.ts').read_text()
keys=re.findall(r"^  ['\"]?([a-z-]+)['\"]?: \[",places,re.M)
slug=lambda x: re.sub(r'[()]','',x.lower().replace(' ','-'))
expected={slug(d) for d in districts}
found=set(keys)
region_page=(WEB/'app/explore-india/[region]/page.tsx').read_text()
district_page=(WEB/'app/explore-india/[region]/district/[district]/page.tsx').read_text()
food=(WEB/'lib/bihar-home-food-items.ts').read_text()
results={
 'canonical_bihar_districts_38':len(districts)==38,
 'tourism_place_records_38':len(found)==38,
 'tourism_records_cover_all_districts':expected==found,
 'bihar_region_page_embeds_interactive_district_map':'<BiharDistrictMap />' in region_page,
 'map_component_links_each_district':'biharDistricts.map' in (WEB/'components/bihar-district-map.tsx').read_text() and '/explore-india/bihar/district/' in (WEB/'components/bihar-district-map.tsx').read_text(),
 'generic_district_pages_render_places':'<BiharTouristPlacesSection districtSlug={districtSlug}' in district_page,
 'siwan_special_route_renders_places':'districtSlug="siwan"' in district_page,
 'homepage_adds_perukia':'homepage:perukia' in food,
 'homepage_adds_gujiya':'homepage:gujiya' in food,
 'homepage_excludes_kadhi_and_litti':'[\'kadhi\', \'litti-chokha\']' in food,
 'perukia_image_exists':(WEB/'public/images/homepage-perukia.webp').exists(),
 'gujiya_image_exists':(WEB/'public/images/homepage-gujiya.webp').exists(),
}
print(json.dumps({'passed':sum(results.values()),'total':len(results),'checks':results,'missing_place_keys':sorted(expected-found),'unexpected_place_keys':sorted(found-expected)},indent=2))
if not all(results.values()): raise SystemExit(1)
