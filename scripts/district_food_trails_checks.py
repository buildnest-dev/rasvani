from pathlib import Path
import re, json
root = Path(__file__).resolve().parents[1]
web = root / 'apps/web'
checks=[]
def check(name, condition, detail=''):
    checks.append({'name':name,'passed':bool(condition),'detail':detail})

snacks=(web/'lib/bihar-dry-snacks.ts').read_text()
trail=(web/'components/bihar-district-food-trails.tsx').read_text()
stage=(web/'components/siwan-food-3d-stage.tsx').read_text()
district_page=(web/'app/explore-india/[region]/district/[district]/page.tsx').read_text()
siwan=(web/'components/siwan-district-experience.tsx').read_text()
header=(web/'components/site-header.tsx').read_text()

# Verify the canonical 38 district records and their item-level image assignments.
district_calls=re.findall(r"district\(\d+,\s*'([^']+)'", snacks)
check('38 Bihar district rows are in the source list',len(district_calls)==38,f'{len(district_calls)} parsed district calls')
check('Each district entry has an image resolver',"image: art.image" in snacks and 'No exact snack artwork mapping' in snacks)
check('Every snack artwork mapping resolves to an existing public asset',all((web/'public'/p.lstrip('/')).exists() for p in re.findall(r"image:\s*'(/images/[^']+)'", snacks)), 'Checked all declared /images mappings')
check('Buxar Batisa and Papdi use different food photos', "batisa: { image: '/images/snack-batisa.webp'" in snacks and "papdi: { image: '/images/snack-batisa-papdi.webp'" in snacks)
check('District Flavour Trails renders each food item as its own card', 'visible.map((item, index)' in trail and 'bihar-district-food-card' in trail)
check('Every district food card includes an image', '<Image src={item.image}' in trail and 'alt={item.imageAlt}' in trail)
check('Every district food card includes Food Stories & Vlogs', 'Food Stories &amp; Vlogs' in trail and 'storyHref(district, item)' in trail)
check('District page mounts the item-focused food trail', '<BiharDistrictFoodTrails district={drySnackDistrict} />' in district_page and 'biharDrySnackByDistrict' in district_page)
check('Traditional Foods section navigation resolves to the food grid', 'id="traditional-foods"' in trail and 'href="#traditional-foods"' in district_page)
check('District food trail includes a 3D animated showcase', '<SiwanFood3DStage' in trail and 'items={stageItems}' in trail)
check('3D showcase keeps drag, pointer and keyboard controls', 'onPointerDown' in stage and 'onPointerMove' in stage and "event.key === 'ArrowRight'" in stage and "event.key === 'ArrowLeft'" in stage)
check('3D showcase supports per-district accessible labels', 'ariaLabel = ' in stage and 'aria-label={ariaLabel}' in stage)
check('3D showcase respects reduced-motion preference', "prefers-reduced-motion: reduce" in stage)
check('Siwan keeps its original foods and adds the PDF dry-snack items', '...foods.map' in siwan and 'siwanDrySnacks.map' in siwan)
check('Siwan stage contains original and PDF food records', 'items={stageFoods}' in siwan)
check('Original Rasvani navigation tabs are retained', all(label in header for label in ['Home of Flavours','India, Unfolded','Flavour Trails','The Pantry','Food Stories','Meet the Makers']))
check('Home remains item-first rather than district-card-first', 'Start with the food. Discover the place.' in (web/'components/home-experience.tsx').read_text() and 'home-food-item-card' in (web/'components/home-experience.tsx').read_text())
check('No stock or sale claim is made for illustrative snack images', 'not photographs of an approved producer' in trail and 'not a guarantee of a seven-day shelf life' in trail)

failed=[x for x in checks if not x['passed']]
report={'suite':'district_food_trails','passed':len(checks)-len(failed),'failed':len(failed),'total':len(checks),'checks':checks}
out=root/'qa/district_food_trails_static_results.json'
out.write_text(json.dumps(report,indent=2))
print(json.dumps({'passed':report['passed'],'failed':report['failed'],'total':report['total'],'failures':failed},indent=2))
if failed: raise SystemExit(1)
