from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
home = (ROOT / "apps/web/components/home-experience.tsx").read_text()
locale = (ROOT / "apps/web/components/locale-provider.tsx").read_text()
map_component = (ROOT / "apps/web/components/india-boundary-map.tsx").read_text()
regions = (ROOT / "apps/web/lib/regions.ts").read_text()
doc = (ROOT / "docs/FINAL_CREATIVE_DIRECTION_AND_P0_REMEDIATION_2026-11-03.md").read_text()

checks = {
    "approved emotional homepage proposition": "India Is More Than a Place. It’s a Thousand Flavours of Home." in locale,
    "English homepage explains hometown food discovery": "A taste of your hometown, even when you’re miles away." in home,
    "ordering availability is qualified": "wherever service is available across India" in home,
    "long English copy is locale-gated": "locale === 'en' ?" in home,
    "12 locale selector options retained": all(f"code: '{c}'" in locale for c in ["en","hi","bn","ta","te","mr","gu","pa","kn","ml","or","as"]),
    "36 region taxonomy retained": regions.count("'") >= 72 and "West Bengal" in regions,
    "separate map route retained": (ROOT / "apps/web/app/india-map/page.tsx").exists(),
    "separate explore route retained": (ROOT / "apps/web/app/explore-india/page.tsx").exists(),
    "district map historical provenance remains explicit": "LGD), 2024 snapshot" in map_component,
    "P0 plan explicitly blocks unsupported origin claims": "No unverified dish origin" in doc,
    "licensing and official LGD source gates documented": "explicit reuse rights" in doc and "LGD codes" in doc,
}
failed = [name for name, ok in checks.items() if not ok]
for name, ok in checks.items():
    print(("PASS" if ok else "FAIL") + " - " + name)
print(f"RESULT: {len(checks)-len(failed)}/{len(checks)} passed")
raise SystemExit(1 if failed else 0)
