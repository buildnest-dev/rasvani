# Homepage Bihar exact dry-snack atlas and map integration — 5 November 2026

## Source of truth

The homepage and Bihar district selection on `/india-map` now use the three-page user-supplied research document `DOC-20261105-WA0005.pdf` (titled **Bihar — 38 Districts: Vegetarian Traditional & Dry Snacks | Rasvani Research List**). Its 38 district rows and the exact listed snack names were transcribed into `apps/web/lib/bihar-dry-snacks.ts`.

The data contains **38 district rows, 103 snack entries and 32 distinct displayed snack-name variants**. The homepage displays each snack name exactly as the supplied table writes it, including different spellings/variants where the document uses them (for example, `Til Laddoo` and `Til Ladoo`, generic `Khaja` and `Silao Khaja`, and `Maner Laddu`). The research table's `Kaimur` display label maps to the canonical district route `Kaimur (Bhabua)` without changing the source label.

## District-linked vs fallback handling

Each snack row has one of two explicit basis labels:

- `District-linked candidate`: the supplied table lists an associated district speciality and the snack is placed in the district-linked portion of the row.
- `Bihar-wide fallback`: the supplied table uses a Bihar-wide vegetarian dry snack because no reliable district-specific dry snack was confirmed. A fallback must not be described as originating in that district.

The third-column district focus/speciality is retained separately from the snack list. This is important for cases where a district ODOP/agricultural item is fresh fruit or an ingredient rather than a dry snack: Bhagalpur/Jardalu mango and Muzaffarpur/litchi are explicitly marked fresh-fruit exclusions; Begusarai/chilli and Samastipur/turmeric, Siwan/mentha and Vaishali/honey are not converted into snack-origin claims.

## Homepage and map experience

- Replaced the homepage's ODOP crop/product grid with the 38-district vegetarian dry-snack atlas.
- Each district card displays the district/speciality row and every snack name listed for that district, with an illustrative thumbnail for each snack entry.
- Added live search across district names, speciality text and exact snack names.
- Added filters for all entries, district-linked candidates and Bihar-wide fallback snacks.
- Each district card opens its existing district guide route.
- When Bihar is selected on `/india-map`, selecting a district now shows the same exact snack list, its basis labels, and the relevant caveats.
- Other States/UTs retain their existing map and district-navigation framework; their food collections remain pending independent research/approval.
- The separate ODOP dataset and spotlight were removed in the subsequent source-scope cleanup. The active food displays retain only the original-ZIP food entries and the exact updated-PDF dry-snack list.

## Exclusions and shelf-life controls preserved

The supplied list excludes fresh fruits, meat/fish, cooked curries, wet chutneys, curd-based foods and other moist dishes. Its page 3 explicitly excludes Litti with chokha, pittha, dahi-chura, makhana kheer, malpua served fresh, fruit/juice, wet chutney, cooked vegetables, fish/meat and dairy-rich moist sweets from the dry-snack recommendations; these are not added to the homepage list.

The document warns that candidate snacks are not automatically guaranteed to last seven days. The homepage displays that `7 days or more` must only be claimed after the exact producer batch and sealed pack have documented shelf-life validation. Belgrami, Batisa and Papdi retain recipe-specific shelf-life cautions. No entry is made purchasable by this atlas alone.

## Image governance

Every snack entry has an image reference. The thumbnails use available AI-generated illustrative artwork within the project, and each is explicitly labelled in its alternative text and surrounding page note as illustrative—not a photograph of a Rasvani producer's actual product, packaging, stock or inspection. Image assets are reused for repeated food names across districts; distinct names such as regular Khaja and Silao Khaja retain separate asset references.

## QA

Focused checks are in `qa/homepage_bihar_exact_dry_snacks_and_full_map_checks.py` and its result file `qa/homepage_bihar_exact_dry_snacks_and_full_map_static_results.json`.

The focused suite checks:

- all 38 district rows and sequential numbering;
- exact snack names against a row-by-row expected matrix derived from the supplied PDF (103 snack entries);
- the Kaimur-to-Kaimur (Bhabua) route alias;
- every snack artwork path;
- district-linked/fallback separation and fresh-fruit/ODOP caveats;
- exclusions and shelf-life caveats;
- homepage search, filters, thumbnails and district links;
- map selected-district snack display and retained 36-region map structure.

Static checks do not substitute for Next.js build, browser, live map-tile, database, accessibility or production checks. This project snapshot has no installed `node_modules`; live framework build/typecheck remains an environment-dependent follow-up.
