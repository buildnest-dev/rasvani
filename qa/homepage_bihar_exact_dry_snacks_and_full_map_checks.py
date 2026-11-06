from pathlib import Path
import re
import json

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / 'apps' / 'web'

def check(name, condition, detail=''):
    checks.append({'check': name, 'status': 'PASS' if condition else 'FAIL', 'detail': detail})

checks = []
data = (WEB / 'lib' / 'bihar-dry-snacks.ts').read_text(encoding='utf-8')
home = (WEB / 'components' / 'home-experience.tsx').read_text(encoding='utf-8')
map_ui = (WEB / 'components' / 'india-map-experience.tsx').read_text(encoding='utf-8')
boundary = (WEB / 'components' / 'india-boundary-map.tsx').read_text(encoding='utf-8')
regions = (WEB / 'lib' / 'regions.ts').read_text(encoding='utf-8')
bihar_districts = (WEB / 'lib' / 'bihar-districts.ts').read_text(encoding='utf-8')

EXPECTED = {
'Araria':['Roasted Makhana','Masala Makhana'],
'Arwal':['Sattu Ladoo','Sattu Mathri (dry baked/fried snack)'],
'Aurangabad':['Thekua','Anarsa','Chana Bhunja'],
'Banka':['Katarni Chura (Flattened Katarni Rice)','Chura Bhunja'],
'Begusarai':['Thekua','Nimki (Bihar-style savoury crackers)','Chana Bhunja'],
'Bhagalpur':['Thekua','Anarsa','Tilkut'],
'Bhojpur':['Khurma','Belgrami'],
'Buxar':['Batisa','Papdi'],
'Darbhanga':['Roasted Makhana','Masala Makhana'],
'East Champaran':['Thekua','Anarsa','Chana Bhunja'],
'Gaya':['Tilkut','Til Laddoo (Sesame-Jaggery Ladoo)','Anarsa'],
'Gopalganj':['Thekua','Khaja','Nimki'],
'Jamui':['Thekua','Sattu Ladoo','Chana Bhunja'],
'Jehanabad':['Sattu Ladoo','Besan Sev','Chana Bhunja'],
'Kaimur':['Murmura (Puffed Rice)','Chura Bhunja','Dry Chura Mixture'],
'Katihar':['Roasted Makhana','Masala Makhana'],
'Khagaria':['Thekua','Anarsa','Murmura Ladoo'],
'Kishanganj':['Thekua','Nimki','Chana Bhunja'],
'Lakhisarai':['Thekua','Til Ladoo','Nimki'],
'Madhepura':['Thekua','Anarsa','Murmura Ladoo'],
'Madhubani':['Roasted Makhana','Masala Makhana','Makhana Ladoo'],
'Munger':['Murmura','Chura Bhunja','Dry Chura Mixture'],
'Muzaffarpur':['Thekua','Anarsa','Tilkut'],
'Nalanda':['Silao Khaja','Thekua'],
'Nawada':['Thekua','Tilkut','Chana Bhunja'],
'Patna':['Maner Laddu','Khaja','Dry Thekua'],
'Purnia':['Makai ke Lawa (Popped Corn)','Roasted Maize'],
'Rohtas':['Murmura','Chura Bhunja','Dry Chura Mixture'],
'Saharsa':['Roasted Makhana','Masala Makhana'],
'Samastipur':['Thekua','Nimki','Chana Bhunja'],
'Saran':['Thekua','Anarsa','Khaja'],
'Sheikhpura':['Thekua','Til Ladoo','Nimki'],
'Sheohar':['Thekua','Murmura Ladoo','Chana Bhunja'],
'Sitamarhi':['Thekua','Anarsa','Nimki'],
'Siwan':['Thekua','Sattu Ladoo','Chana Bhunja'],
'Supaul':['Roasted Makhana','Masala Makhana'],
'Vaishali':['Thekua','Anarsa','Tilkut'],
'West Champaran':['Gur Chikki (Jaggery Brittle)','Til-Gur Ladoo','Thekua'],
}
rows = re.findall(r"district\((\d+),\s*'([^']+)',\s*'([^']+)',\s*(\[[^\]]*\]),\s*(\[[^\]]*\])", data)
parsed = {}
for number, district, speciality, linked_src, fallback_src in rows:
    linked = re.findall(r"'([^']*)'", linked_src)
    fallback = re.findall(r"'([^']*)'", fallback_src)
    parsed[district] = linked + fallback

check('38 district rows transcribed', len(rows) == 38, f'Found {len(rows)} records')
check('District snack names match all 38 supplied PDF rows exactly', parsed == EXPECTED, f'{sum(len(v) for v in parsed.values())} snack entries parsed; compare the EXPECTED matrix for row-level differences')
unique_snack_names = {name for names in parsed.values() for name in names}
check('All 32 distinct display-name variants from the PDF are represented', len(unique_snack_names) == 32, f'{len(unique_snack_names)} distinct names')
check('District numbering is sequential 1–38', [int(row[0]) for row in rows] == list(range(1,39)))
canonical_block = bihar_districts.split('export const biharDistricts = [', 1)[1].split('] as const', 1)[0]
canonical = re.findall(r"'([^']+)'", canonical_block)
normalized_rows = ['Kaimur (Bhabua)' if row[1] == 'Kaimur' else row[1] for row in rows]
check('All research rows align with canonical district navigation', normalized_rows == canonical, 'The PDF display label Kaimur maps to the canonical Kaimur (Bhabua) route')
check('No duplicate district rows', len(parsed) == 38)

artwork_block = data.split('const artwork:',1)[1].split('\n};',1)[0]
images = re.findall(r"image: '([^']+)'", artwork_block)
missing = [path for path in images if not (WEB / 'public' / path.lstrip('/')).exists()]
check('Every snack artwork path resolves', not missing, ', '.join(missing) or f'{len(images)} artwork mappings resolve')
check('Illustrations are explicitly not producer product photos', 'not an actual producer product photograph' in data and 'not actual producer or pack photographs' in home)
check('Shelf-life evidence disclaimer is visible', 'documented shelf-life validation' in home and 'exact producer batch and sealed pack' in home)
check('Bihar-wide fallback distinction is visible', 'Bihar-wide fallback' in home and 'rather than district-origin claims' in home)
check('Fresh-fruit-linked districts are not treated as snack origin', 'Jardalu mango is fresh fruit and is excluded' in data and 'Litchi is fresh fruit and is excluded' in data)
check('ODOP chilli, turmeric, mentha and honey do not become snack origin claims', all(x in data for x in ['district focus is chilli', 'district ODOP focus', 'ODOP: mentha', 'ODOP: honey']))
check('Recipe-specific shelf-life cautions retained for Belgrami, Batisa and Papdi', all(x in data for x in ['recipe and batch shelf life', 'long-lasting dry snack']))
check('Excluded wet/fresh/non-vegetarian foods are documented', all(x in data for x in ['Litti with chokha','Pittha','Dahi-chura','Makhana kheer','Malpua served fresh','wet chutney','fish/meat']))

home_items = (WEB / 'lib' / 'bihar-home-food-items.ts').read_text(encoding='utf-8')
siwan_foods = (WEB / 'lib' / 'siwan-foods.ts').read_text(encoding='utf-8')
research = (WEB / 'lib' / 'bihar-food-research.ts').read_text(encoding='utf-8')
check('Homepage is item-first, not district-card-first', 'home-food-item-grid' in home and 'biharHomeFoodItems' in home and 'home-dry-snack-grid' not in home)
check('Homepage item cards feature item title and image', 'home-food-item-image' in home and 'home-food-item-copy' in home and 'item.name' in home and 'item.image' in home)
check('Districts are secondary associations on item cards', 'PLACE ASSOCIATIONS' in home and 'association.label' in home and 'home-food-item-card' in home)
check('Food item search includes aliases and associated place names', 'setFoodQuery' in home and 'item.aliases' in home and 'item.associations.map' in home)
check('Homepage has food-source filters rather than district filters', 'setFoodFilter' in home and 'dry-snacks' in home and 'siwan' in home and 'research' in home)
check('Food-first aggregation imports the exact PDF snack list', "from '@/lib/bihar-dry-snacks'" in home_items and 'biharDrySnackDistricts' in home_items)
check('Food-first aggregation retains all original Siwan food entries', "from '@/lib/siwan-foods'" in home_items and all(name in siwan_foods for name in ['Litti Chokha', 'Kadhi', 'Jhal Muri', 'Sattu', 'Khaja', 'Balushahi', 'Kala Jamun', 'Mawa Barfi', 'Peda', 'Doodh Laddoo']))
check('Food-first aggregation retains all six original research leads', "from '@/lib/bihar-food-research'" in home_items and all(name in research for name in ['Maner Laddoo', 'Khoye-ki-Lai', 'Silao Khaja', 'Gaya Tilkut', 'Kheer-Makhana', 'Belgrami']))
check('Name variants are retained as aliases when items are consolidated', 'identityAliases' in home_items and 'entry.aliases.add' in home_items and 'aliases: Array.from(item.aliases)' in home_items)
check('Kheer-Makhana remains distinct from dry-snack list and notes its exclusion', "lead.name === 'Kheer-Makhana'" in home_items and 'Excluded from the supplied dry-snack list' in home_items)
check('Every homepage item image source is defined in preserved food data', 'image: snack.image' in home_items and 'image: food.image' in home_items and 'image: lead.image' in home_items)
check('Food cards identify research and product imagery as illustrative', 'not a producer product photograph' in home_items and 'not actual producer or pack photographs' in home)
check('Homepage keeps the exact PDF source, fallback and shelf-life caveats', 'DOC-20261105-WA0005.pdf' in home and 'Bihar-wide fallback' in home and 'documented shelf-life validation' in home)
check('Homepage offers the India map separately as a place-first path', 'home-food-atlas-map-link' in home and 'href="/india-map"' in home)
check('Responsive item-first food grid styles exist', '.home-food-item-grid' in (WEB / 'app' / 'globals.css').read_text(encoding='utf-8') and '@media(max-width:430px)' in (WEB / 'app' / 'globals.css').read_text(encoding='utf-8'))

check('India map selected Bihar district uses exact dry-snack data', 'biharDrySnackByDistrict' in map_ui and 'selectedDrySnackDistrict.snacks.map' in map_ui)
check('India map labels linked and fallback snacks separately', 'District-linked candidate' in map_ui and 'Bihar-wide fallback' in map_ui)
check('India map preserves the non-sale approval notice', 'no item is approved for sale' in map_ui)
check('Map remains dedicated to India map route', 'IndiaMapExperience' in (WEB / 'app' / 'india-map' / 'page.tsx').read_text(encoding='utf-8'))
check('All 36 regions remain available', len(re.findall(r"'[^']+'", regions.split('export const regions = [',1)[1].split(']',1)[0])) == 36)
check('District boundary map still builds district index from loaded tiles', 'querySourceFeatures' in boundary and 'onDistrictsAvailable' in boundary)
check('Map boundary snapshot is still disclosed', 'LGD 2024 snapshot via Bharatlas' in boundary and 'LGD 2024 SNAPSHOT' in map_ui)

# Extra scope-cleanup assertions: the only active district food sources are the user's original ZIP and updated PDF.
siwan_page = (WEB / 'components' / 'siwan-district-experience.tsx').read_text(encoding='utf-8')
siwan_foods = (WEB / 'lib' / 'siwan-foods.ts').read_text(encoding='utf-8')
research = (WEB / 'lib' / 'bihar-food-research.ts').read_text(encoding='utf-8')
district_page = (WEB / 'app' / 'explore-india' / '[region]' / 'district' / '[district]' / 'page.tsx').read_text(encoding='utf-8')
check('Separate ODOP spotlight module removed', not (WEB / 'components' / 'bihar-odop-spotlight.tsx').exists())
check('Separate ODOP dataset removed', not (WEB / 'lib' / 'bihar-odop.ts').exists())
check('No district ODOP spotlight is rendered', 'BiharOdopSpotlight' not in district_page and 'biharOdop' not in district_page)
check('Original Siwan food entries remain in the shared data module', all(name in siwan_foods for name in ['Litti Chokha', 'Kadhi', 'Jhal Muri', 'Sattu', 'Khaja', 'Balushahi', 'Kala Jamun', 'Mawa Barfi', 'Peda', 'Doodh Laddoo']))
check('Original Bihar research leads remain', all(name in research for name in ['Maner Laddoo', 'Khoye-ki-Lai', 'Silao Khaja', 'Gaya Tilkut', 'Kheer-Makhana', 'Belgrami']))
check('Snack art filenames no longer expose ODOP programme labels', 'odop-' not in data)
check('Original ZIP spelling Doodh Laddoo is preserved', "name: 'Doodh Laddoo'" in siwan_foods and "name: 'Milk Laddoo'" not in siwan_foods)

result = {
    'suite': 'Bihar exact vegetarian dry-snack atlas and India map — source scope cleanup',
    'passed': sum(c['status'] == 'PASS' for c in checks),
    'total': len(checks),
    'status': 'PASS' if all(c['status'] == 'PASS' for c in checks) else 'FAIL',
    'checks': checks,
}
out = ROOT / 'qa' / 'homepage_bihar_exact_dry_snacks_and_full_map_static_results.json'
out.write_text(json.dumps(result, indent=2), encoding='utf-8')
print(json.dumps(result, indent=2))
if result['status'] != 'PASS':
    raise SystemExit(1)
