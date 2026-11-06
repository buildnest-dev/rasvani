from pathlib import Path
import json
import re
root=Path(__file__).resolve().parents[1]
web=root/'apps'/'web'
home=(web/'components/home-experience.tsx').read_text()
map_ui=(web/'components/india-map-experience.tsx').read_text()
boundary=(web/'components/india-boundary-map.tsx').read_text()
header=(web/'components/site-header.tsx').read_text()
locale=(web/'components/locale-provider.tsx').read_text()
css=(web/'app/globals.css').read_text()
regions_source=(web/'lib/regions.ts').read_text()
region_block=re.search(r'export const regions = \[(.*?)\] as const', regions_source, re.S)
region_names=re.findall(r"'([^']+)'", region_block.group(1)) if region_block else []
camera_block=boundary.split('const REGION_CAMERA:', 1)[1].split('\n};', 1)[0]
camera_names=re.findall(r"^\s{2}(?:'([^']+)'|([A-Za-z][A-Za-z ]*?)):\s*\{ center:", camera_block, re.M)
camera_names=[quoted or bare.strip() for quoted, bare in camera_names]
checks={
  'homepage_does_not_embed_full_interactive_map':'IndiaMapExperience' not in home and 'home-inline-atlas' not in home,
  'homepage_has_a_separate_map_call_to_action':'href="/india-map"' in home,
  'explore_india_preview_remains_late_and_separate':'home-explore-last' in home and home.index('home-explore-last') > home.index('home-better-section') and 'href="/explore-india"' in home,
  'hero_search_remains_prominent_before_hero':home.index('home-search-band') < home.index('home-hero-living'),
  'cinematic_food_hero_has_interactive_3d_carousel':'home-hero-cinematic-stage' in home and 'SiwanFood3DStage' in home and 'variant="cinematic"' in home and 'home-hero-light-rings' in home,
  'homepage_uses_translated_hero_and_search':"t('heroTitle')" in home and "t('searchPlaceholder')" in home,
  'homepage_featured_food_and_story_sections_remain':all(x in home for x in ['featured-heading','home-regional-story-section','home-producer-section','home-better-section']),
  'dedicated_map_route_uses_full_discovery_component':(root/'apps/web/app/india-map/page.tsx').exists() and 'IndiaMapExperience' in (root/'apps/web/app/india-map/page.tsx').read_text(),
  'dedicated_map_component_keeps_36_region_directory':'regions.slice(0, 28)' in map_ui and 'regions.slice(28)' in map_ui and 'region-count">36' in map_ui,
  'state_hover_preview_and_map_highlight_are_wired':'onHover={setHoveredRegion}' in map_ui and 'map-hover-preview' in map_ui and 'Select the highlighted region' in map_ui,
  'map_hover_uses_animated_highlight':'animateHighlight(name)' in boundary and 'requestAnimationFrame' in boundary and 'setPaintProperty' in boundary,
  'map_labels_remain_enabled':'admin-labels' in boundary and "'text-field': level === 'states'" in boundary,
  'state_labels_use_one_anchor_per_region':'state-label-anchors' in boundary and 'Object.entries(REGION_CAMERA)' in boundary and "source: labelSource" in boundary,
  'one_label_anchor_exists_for_each_of_the_36_regions':len(camera_names)==36 and set(camera_names)==set(region_names),
  'map_label_collision_detection_is_enabled':"'text-allow-overlap': false" in boundary and "'text-ignore-placement': false" in boundary,
  'map_labels_have_adaptive_placement':'text-variable-anchor' in boundary and 'text-radial-offset' in boundary and 'text-padding' in boundary,
  'map_label_zoom_hint_is_visible':'zoom in for smaller regions' in boundary and 'HOVER · ZOOM · SELECT' in map_ui,
  'state_selection_opens_district_step':"setStep('districts')" in map_ui and 'chooseRegion' in map_ui,
  'district_selection_opens_food_step':"setStep('foods')" in map_ui and 'chooseDistrictFromMap' in map_ui,
  'bihar_38_districts_are_selectable':'Browse all 38 Bihar districts' in map_ui and 'visibleDistrictList.map' in map_ui and 'biharDistricts' in map_ui,
  'district_foods_are_not_fabricated_when_unapproved':"t('pendingBody')" in map_ui and 'approval' in map_ui.lower(),
  '12_language_selector_remains_visible_and_functional':'supportedLocales.map' in header and 'setLocale(' in header and 'supportedLocales' in locale and len([x for x in ['en','hi','bn','ta','te','mr','gu','pa','kn','ml','or','as'] if f"code: '{x}'" in locale])==12,
  'palette_uses_requested_cream_maroon_terracotta_green_gold':all(x in css for x in ['--cream:#F6EBDD','--maroon:#5A1F24','--terracotta:#A64F2B','--green:#263D32','--gold:#D6A44D']),
  'map_component_remains_dedicated_and_not_home_embedded':'map-page-embedded' in map_ui and 'map-page-premium' in map_ui,
  'responsive_map_and_district_indexes_defined':'@media(max-width:700px)' in css and '.bihar-district-index .map-district-grid{grid-template-columns:repeat(2,minmax(0,1fr))' in css,
  'map_is_linked_from_shared_navigation':"translate('India, Unfolded')" in header,
  'explore_india_is_linked_from_shared_navigation':"translate('Flavour Trails')" in header,
  'homepage_no_longer_places_full_map_before_featured_foods':'home-inline-atlas' not in home,
}
passed=sum(checks.values()); total=len(checks)
result={'status':'PASS' if passed==total else 'FAIL','passed':passed,'total':total,'checks':{k:{'passed':v} for k,v in checks.items()},'scope':'Static source checks that the homepage remains a preview-only entry point and the complete interactive India map stays on its dedicated route; does not claim live browser, network map, backend, or commerce verification.'}
(root/'qa'/'phase1_homepage_live_map_static_results.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
if passed!=total: raise SystemExit(1)
