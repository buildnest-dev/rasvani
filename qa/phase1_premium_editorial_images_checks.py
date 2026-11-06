from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parents[1]
web=root/'apps/web'
home=(web/'components/home-experience.tsx').read_text()
stories=(web/'app/food-stories/page.tsx').read_text()
producers=(web/'app/for-producers/page.tsx').read_text()
explore=(web/'components/explore-india-experience.tsx').read_text()
assets={
 'rasvani-editorial-vegetarian-feast.webp':(1536,1024),
 'rasvani-editorial-sweets-brass.webp':(1254,1254),
 'rasvani-editorial-spice-pantry.webp':(1254,1254),
 'rasvani-editorial-snack-feast.webp':(1536,1024),
}
checks={}
for name,expected in assets.items():
 p=web/'public/images'/name
 checks[f'{name} exists with approved source dimensions']=p.exists() and Image.open(p).size==expected
 checks[f'{name} is WebP']=p.exists() and Image.open(p).format=='WEBP'
checks['homepage hero uses five item-specific foods in the cinematic 3D stage']= 'homeHeroStageItems' in home and 'SiwanFood3DStage' in home and 'variant="cinematic"' in home and all(name in home for name in ['Thekua','Silao Khaja','Tilkut','Sattu Ladoo','Roasted Makhana'])
checks['featured food cards use distinct editorial food imagery']=all(x in home for x in ['rasvani-editorial-snack-feast.webp','rasvani-editorial-sweets-brass.webp','rasvani-editorial-spice-pantry.webp'])
checks['homepage food cards use Next image optimization']= 'sizes="(max-width: 650px) 88vw, (max-width: 1100px) 42vw, 24vw"' in home and 'unoptimized' not in home
checks['food stories uses premium editorial images']=all(x in stories for x in ['rasvani-editorial-vegetarian-feast.webp','rasvani-editorial-spice-pantry.webp','rasvani-editorial-snack-feast.webp'])
checks['producer page image does not claim to depict a named producer']='rasvani-editorial-spice-pantry.webp' in producers and 'producer portrait' not in producers.lower()
checks['Explore India hero uses a general food-spread visual']='rasvani-editorial-vegetarian-feast.webp' in explore
checks['editorial visuals are explicitly excluded from product evidence']='not photographs of a specific saleable product' in (root/'docs/PHASE_1_IMAGE_ASSET_REGISTER.md').read_text().lower()
checks['product pages retain approved product media workflow']='get_public_catalogue_product_media' in (web/'app/shop/page.tsx').read_text()
passed=sum(checks.values()); result={'suite':'phase1_premium_editorial_images','passed':passed,'total':len(checks),'checks':checks,'scope':'Asset existence, dimensions, format and source wiring only; not a subjective visual-quality or browser-rendering audit.'}
(root/'qa/phase1_premium_editorial_images_static_results.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'passed':passed,'total':len(checks),'failed':[k for k,v in checks.items() if not v]},indent=2))
if passed != len(checks): raise SystemExit(1)
