from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
component_path = root / 'apps/web/components/siwan-district-experience.tsx'
stage_path = root / 'apps/web/components/siwan-food-3d-stage.tsx'
component = component_path.read_text()
food_data = (root / 'apps/web/lib/siwan-foods.ts').read_text()
stage = stage_path.read_text()
css = (root / 'apps/web/app/globals.css').read_text()
route = (root / 'apps/web/app/explore-india/[region]/district/[district]/page.tsx').read_text()
map_route = (root / 'apps/web/app/india-map/page.tsx').read_text()
map_component = (root / 'apps/web/components/india-map-experience.tsx').read_text()
research_data = (root / 'apps/web/lib/bihar-food-research.ts').read_text()
district_page = (root / 'apps/web/app/explore-india/[region]/district/[district]/page.tsx').read_text()

required_foods = {
    'Litti Chokha': '/images/siwan-litti-chokha.png',
    'Kadhi': '/images/siwan-kadhi.png',
    'Jhal Muri': '/images/siwan-jhal-muri.png',
    'Sattu': '/images/siwan-sattu.png',
    'Khaja': '/images/khaja.jpg',
    'Balushahi': '/images/balushahi.jpg',
    'Kala Jamun': '/images/kala-jamun.jpg',
    'Mawa Barfi': '/images/siwan-khoya-barfi.png',
    'Peda': '/images/siwan-peda.png',
    'Doodh Laddoo': '/images/siwan-doodh-laddoo.png',
}

checks = {
    'Siwan route resolves to its dedicated district experience': 'SiwanDistrictExperience' in route and "districtSlug === 'siwan'" in route,
    'Official Siwan district foods are all included': all(f"name: '{name}'" in food_data for name in ['Litti Chokha', 'Kadhi', 'Jhal Muri', 'Sattu']),
    'Locally covered sweet-shop foods remain separately represented': all(f"name: '{name}'" in food_data for name in ['Khaja', 'Balushahi', 'Kala Jamun', 'Mawa Barfi', 'Peda', 'Doodh Laddoo']),
    'All ten food entries map to their own image assets': all(f"image: '{path}'" in food_data for path in required_foods.values()),
    'All ten image files exist in the public image directory': all((root / 'apps/web/public' / path.lstrip('/')).is_file() for path in required_foods.values()),
    'Food entries clearly distinguish official district references from local coverage': "status: 'district-source'" in food_data and "status: 'local-coverage'" in food_data and 'LOCAL SWEET-SHOP COVERAGE' in component,
    'Search and all food category filters remain interactive': 'setQuery' in component and 'setCategory(item.name)' in component and "'Meals & Savoury'" in component,
    'Every food card renders its exact item image and descriptive alt text': '<img src={food.image}' in component and '{food.imageAlt}' in component,
    'A dedicated 3D food carousel is mounted in the Siwan hero': 'SiwanFood3DStage' in component and 'siwan-food-3d-stage' in stage,
    '3D carousel uses perspective and preserve-3d transforms': 'perspective:' in css and 'transform-style:preserve-3d' in css and 'translateZ(var(--food-radius))' in css,
    '3D carousel supports pointer drag and touch interaction': all(token in stage for token in ['onPointerDown', 'onPointerMove', 'onPointerUp', 'setPointerCapture']),
    '3D carousel supports keyboard and previous/next controls': "event.key === 'ArrowRight'" in stage and "event.key === 'ArrowLeft'" in stage and 'Next food' in stage and 'Previous food' in stage,
    '3D carousel respects reduced-motion preference': "prefers-reduced-motion: reduce" in stage and 'preference.matches' in stage,
    'Hero has a direct link to the dedicated interactive India map': "href=\"/india-map\"" in component and 'IndiaMapExperience' in map_route and 'IndiaBoundaryMap' in map_component,
    'Producer, stories and About Siwan sections remain present': all(token in component for token in ['id="siwan-producers"', 'id="siwan-stories"', 'id="siwan-about"']),
    'No unsupported sale or shelf-life promise is made': 'not automatically shelf-stable' in component and 'not a verified producer product photograph' in food_data,
    'No misleading AI-generation label is shown in the customer interface': 'AI-generated' not in component and 'AI Generated' not in component,
}

research_images = {
    'Maner Laddoo': '/images/research-maner-laddoo.webp',
    'Khoye-ki-Lai': '/images/research-khoye-ki-lai.webp',
    'Silao Khaja': '/images/research-silao-khaja.webp',
    'Gaya Tilkut': '/images/research-gaya-tilkut.webp',
    'Kheer-Makhana': '/images/research-kheer-makhana.webp',
    'Belgrami': '/images/research-belgrami.webp',
}
checks.update({
    'All six Bihar research leads have a dedicated matching illustration asset': all(f"image: '{path}'" in research_data for path in research_images.values()),
    'All six Bihar research-lead illustrations exist': all((root / 'apps/web/public' / path.lstrip('/')).is_file() for path in research_images.values()),
    'Research-lead images render in the district review cards': 'Image src={lead.image}' in district_page and 'district-lead-image' in district_page,
    'Research-lead artwork is explicitly not product photography': 'Illustrative visual · not product photography' in district_page and 'not an actual producer or pack photograph' in district_page,
    'Illustrations do not promote pending leads as approved foods': 'EDITORIAL REVIEW PENDING' in district_page and 'editorial verification pending' in district_page,
})

failed = [name for name, ok in checks.items() if not ok]
for name, ok in checks.items():
    print(('PASS' if ok else 'FAIL') + ' | ' + name)
print(f'\n{len(checks)-len(failed)}/{len(checks)} Siwan food + 3D + map checks passed')
result = {
    'suite': 'Siwan original ZIP foods, 3D carousel, pending Bihar research leads and India map',
    'passed': len(checks) - len(failed),
    'total': len(checks),
    'status': 'PASS' if not failed else 'FAIL',
    'checks': [{'check': name, 'status': 'PASS' if ok else 'FAIL'} for name, ok in checks.items()],
}
(root / 'qa/siwan_reel_3d_category_static_results.json').write_text(__import__('json').dumps(result, indent=2) + '\n')
raise SystemExit(1 if failed else 0)
