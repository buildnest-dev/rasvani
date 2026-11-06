from pathlib import Path
import json
import re
import subprocess
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / 'apps' / 'web'
read = lambda rel: (WEB / rel).read_text(encoding='utf-8')
checks = {}

provider = read('components/locale-provider.tsx')
translator = read('lib/site-copy-translations.ts')
localized = read('components/localized-copy.tsx')
layout = read('app/layout.tsx')
header = read('components/site-header.tsx')
home = read('components/home-experience.tsx')
stage = read('components/siwan-food-3d-stage.tsx')
styles = read('app/globals.css')

# One provider owns the locale for the whole App Router shell and persists it through navigation.
checks['global locale provider still exposes all twelve Indian language options'] = all(
    f"code: '{code}'" in provider for code in ['en','hi','bn','ta','te','mr','gu','pa','kn','ml','or','as']
)
checks['locale choice is restored from and saved to local storage'] = "localStorage.getItem('rasvani-locale')" in provider and "localStorage.setItem('rasvani-locale'" in provider
checks['active document language is updated'] = 'document.documentElement.lang = locale' in provider
checks['provider exposes a shared translation function'] = 'translate: (text: string) => string' in provider and 'translateSiteCopy(text, locale)' in provider
checks['sitewide copy layer translates nested text and accessibility attributes'] = all(x in localized for x in ['translateNode','placeholder','aria-label','title','alt','cloneElement'])
checks['main route content and shared footer are inside the locale-aware layer'] = '<LocalizedCopy>{children}</LocalizedCopy>' in layout and '<LocalizedCopy><footer' in layout
checks['all six original Rasvani navigation tabs use active-language labels'] = all(f"translate('{label}')" in header for label in ['Home of Flavours','India, Unfolded','Flavour Trails','The Pantry','Food Stories','Meet the Makers'])
checks['home hero and home UI are wrapped for live locale updates'] = 'return <LocalizedCopy>' in home and '</LocalizedCopy>;' in home
checks['India map and boundary map are locale-aware client experiences'] = 'LocalizedCopy' in read('components/india-map-experience.tsx') and 'LocalizedCopy' in read('components/india-boundary-map.tsx')
checks['Explore India and the region directory are locale-aware'] = 'LocalizedCopy' in read('components/explore-india-experience.tsx') and 'LocalizedCopy' in read('components/region-directory.tsx')
checks['district food pages and the food-stage controls are locale-aware'] = all('LocalizedCopy' in read(f) for f in ['components/bihar-district-food-trails.tsx','components/siwan-district-experience.tsx','components/district-food-discovery.tsx','components/siwan-food-3d-stage.tsx'])
checks['account sign-in and district switcher copy are locale-aware'] = 'LocalizedCopy' in read('app/account/auth-form.tsx') and 'LocalizedCopy' in read('components/bihar-district-switcher.tsx')
checks['English source food names are intentionally preserved by the phrase glossary'] = all(f"'{name}'" not in translator for name in ['Thekua','Tilkut','Silao Khaja','Makhana Ladoo'])
checks['long product, ingredient, allergen and legal statements are marked for qualified translation review'] = 'not legal/food-label copy' in translator and 'source-controlled and must receive qualified review' in translator
checks['translated collection label preserves the Rasvani brand spelling'] = "'THE RASVANI COLLECTION'" in translator and 'Rasvani संग्रह' in translator

# Exercise the pure phrase translator against every released locale, including dynamic district titles.
node_test = r'''const fs=require('fs'); const ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js'); const src=fs.readFileSync('apps/web/lib/site-copy-translations.ts','utf8'); const js=ts.transpile(src,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}); const m={exports:{}}; new Function('exports','module','require',js)(m.exports,m,require); const fn=m.exports.translateSiteCopy; const codes=['hi','bn','ta','te','mr','gu','pa','kn','ml','or','as']; const result={}; for(const c of codes){ const nav=fn('Home of Flavours',c); const district=fn('Traditional foods of Buxar',c); const action=fn('Explore India ↗',c); const food=fn('Thekua',c); const brand=fn('THE RASVANI COLLECTION',c); result[c]={nav,district,action,food,brand}; if(nav==='Home of Flavours'||district==='Traditional foods of Buxar'||action==='Explore India ↗'||food!=='Thekua'||!brand.includes('Rasvani')) throw new Error('Incomplete or over-translated phrase in '+c); } console.log(JSON.stringify(result));'''
try:
    proc = subprocess.run(['node', '-e', node_test], cwd=ROOT, capture_output=True, text=True, check=True)
    locale_probe = json.loads(proc.stdout)
    checks['translation glossary returns localized navigation, district headings and actions in all eleven non-English languages'] = len(locale_probe) == 11
    checks['food names remain unchanged in all supported non-English languages'] = all(v['food'] == 'Thekua' for v in locale_probe.values())
except Exception as exc:
    checks['translation glossary returns localized navigation, district headings and actions in all eleven non-English languages'] = False
    checks['food names remain unchanged in all supported non-English languages'] = False
    locale_probe = {'error': str(exc)}

# The newly sharpened snack artwork should have real source pixels for high-density cards.
image_dir = WEB / 'public/images'
snack_assets = sorted(image_dir.glob('snack-*.webp')) + sorted(image_dir.glob('research-*.webp'))
image_sizes = {p.name: Image.open(p).size for p in snack_assets}
checks['all snack and research thumbnails are at least 1000 pixels wide after image cleanup'] = bool(image_sizes) and all(size[0] >= 1000 for size in image_sizes.values())
checks['Buxar Batisa and Papdi retain separate food-specific photo assets'] = "batisa: { image: '/images/snack-batisa.webp'" in read('lib/bihar-dry-snacks.ts') and "papdi: { image: '/images/snack-batisa-papdi.webp'" in read('lib/bihar-dry-snacks.ts')
checks['homepage food cards no longer force unoptimized local thumbnails'] = 'unoptimized' not in home and 'sizes="(max-width: 650px) 88vw, (max-width: 1100px) 42vw, 24vw"' in home
checks['India-map food thumbnails no longer force unoptimized local images'] = 'unoptimized' not in read('components/india-map-experience.tsx')
checks['3D food stage images use Next image optimisation'] = 'from \'next/image\'' in stage and 'unoptimized' not in stage

# Cinematic home experience checks.
checks['homepage hero renders the five-food cinematic stage'] = all(x in home for x in ['Thekua','Silao Khaja','Tilkut','Sattu Ladoo','Roasted Makhana']) and 'variant="cinematic"' in home
checks['hero stage supports animated 3D rotation, dragging, keyboard and pause'] = all(x in stage for x in ['requestAnimationFrame','onPointerDown','onPointerMove',"event.key === 'ArrowRight'",'setPaused'])
checks['cinematic hero uses layered light, orbit and floating-map treatments'] = all(x in styles for x in ['home-hero-light-rings','home-hero-cinematic-map','home-hero-cinematic-grain','@keyframes homeHeroHalo','@keyframes homeHeroOrbit'])
checks['cinematic hero responds to tablet and mobile breakpoints'] = '@media(max-width:1100px)' in styles and '@media(max-width:900px)' in styles and '@media(max-width:650px)' in styles
checks['cinematic hero and thumbnails respect reduced-motion preference'] = '@media(prefers-reduced-motion:reduce)' in styles and 'home-hero-cinematic-stage .siwan-food-3d-halo{animation:none!important' in styles

passed = sum(checks.values())
result = {
    'suite': 'sitewide locale, image clarity and cinematic homepage motion',
    'passed': passed,
    'total': len(checks),
    'status': 'PASS' if passed == len(checks) else 'FAIL',
    'checks': {k: {'passed': v} for k, v in checks.items()},
    'translation_probe': locale_probe,
    'image_asset_count': len(image_sizes),
    'minimum_image_width': min((size[0] for size in image_sizes.values()), default=0),
    'scope': 'Static checks and pure phrase-translation exercises. Does not imply reviewed legal/food-label translations or a live browser render.'
}
(ROOT / 'qa/sitewide_locale_motion_image_quality_static_results.json').write_text(json.dumps(result, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print(json.dumps({'passed': passed, 'total': len(checks), 'failed': [k for k,v in checks.items() if not v], 'image_asset_count': len(image_sizes)}, indent=2, ensure_ascii=False))
if passed != len(checks):
    raise SystemExit(1)
