# Rasvani — Product Requirements Document (PRD)

| | |
|---|---|
| **Product** | Rasvani — Pan-India Traditional Vegetarian Food Marketplace |
| **Tagline** | The taste of home, wherever you are. · One India. Many Traditions. |
| **Owner** | Chinmay Anand, Founder & CEO |
| **Version / Date** | v0.1 draft · 30 Oct 2026 |
| **Status** | For founder review. Items marked **[DECIDE]** need a founder decision. Items marked **[VERIFY]** need a lawyer / CA / FSSAI consultant / real data. |

**Document set:** `01-PRD.md` (this) → `02-TECH.md` → `03-APP-FLOW.md` → `04-AI-RULES.md` → `05-DESIGN.md`

---

## 1. Vision & Positioning

**Vision.** A trusted online destination for India's traditional vegetarian foods, covering as many states and regions as possible, so people living away from home can reconnect with familiar tastes and discover new ones, and traditional food makers can reach customers across India.

**One-line positioning.** A multi-state vegetarian food marketplace built around **regional origin, maker stories and honest delivery clarity**.

**What makes us different from an ordinary food/grocery site**
1. Discovery is by **place and tradition** (India map → state → region → dish), not by a flat product grid.
2. **Origin trust**: every product shows who makes it, where, and whether origin is verified.
3. **Honest delivery**: availability is checked per PIN code *and* per product type. We never promise what we cannot safely deliver.
4. **Experience**: an interactive journey through India's food culture, with premium motion and a warm Indian identity.

## 2. Problem

| Who | Pain |
|---|---|
| Customers living away from home (Delhi, Bengaluru, Kolkata, Mumbai…) | Hometown foods are not available locally; supply is scattered across local shops, social pages and separate websites. |
| Food explorers | Cannot easily discover unfamiliar regional foods with trustworthy information. |
| Traditional makers / small producers | Depend on local buyers and word of mouth; little access to digital orders, wider demand, or delivery support. |
| Everyone | Trust gap: unclear origin, ingredients, shelf life, seller, and whether delivery is realistically possible. |

**Canonical example.** A Bihari customer in Delhi wants authentic Pharra. Today: no reliable way to find it.

## 3. Target Users & Personas

| Persona | Description | Primary need |
|---|---|---|
| **The Displaced Local** (core) | 22–45, migrated for work/study, craves hometown food, especially around festivals (Chhath, Durga Puja, Diwali, Pongal, Onam…) | Find *exact* hometown items, trust authenticity, get them delivered in good condition |
| **The Food Explorer** | Curious urban foodie, gifts, tries new regions | Inspiration, stories, curated boxes |
| **The Gifter** | Sends sweets/snacks to family or colleagues across cities | Festival collections, gift packs, reliable dates |
| **The Maker** | Home-based/small FSSAI-registered producer or regional shop | Orders without tech burden, fair payouts, clear packing/dispatch rules |
| **The Ops/Admin** | Founder + small team | One dashboard to verify sellers, manage orders/exceptions, curate content |

## 4. Product Principles

1. **Never over-promise delivery.** Fresh/perishable foods are local/regional only unless proven otherwise.
2. **Origin and maker first.** Story and provenance are the product, not decoration.
3. **Vegetarian integrity.** Strict, visible, auditable vegetarian standard (see §7.3).
4. **Pilot, then expand.** Prove demand and delivery quality in a few regions before scaling state by state.
5. **Delight without friction.** Animation enriches discovery; checkout stays fast and calm.
6. **Mobile-first.** Most Indian shoppers are on mid-range Android phones over 4G.

## 5. Goals / Non-Goals

**Goals (first 12 months)**
- Launch a pilot with a small set of verified makers and shelf-stable products with reliable intercity delivery.
- Reach repeat purchase behaviour (customers come back for festivals and cravings).
- Build the **Regional Food Library** (state → region → dish) as a long-term data asset.
- Capture demand data (what is searched for, in which city/PIN, but not available).

**Non-goals (for now)**
- Nationwide delivery of every product (esp. fresh foods).
- Restaurant/ready-meal delivery or quick-commerce (10-minute).
- Non-vegetarian items (never).
- Native mobile apps (PWA first; native later if metrics justify).

## 6. Business & Fulfilment Model

### 6.1 Revenue
Seller **commission** on completed orders; optional **product margin** on curated/own-label assortments; **curated regional food boxes**; **festival collections**; (later) sponsored placement / maker subscriptions. **[DECIDE]** exact commission %, platform/packing fees, minimum order value, free-shipping threshold. Validate AOV, commission, packaging, delivery, returns and CAC during the pilot (as stated in the pitch deck: illustrative, not a forecast).

### 6.2 Fulfilment model **[DECIDE]**
| Option | How it works | Pros | Cons |
|---|---|---|---|
| **A. Seller-ships (marketplace)** | Seller packs; courier picks up from seller's location; we manage orders, QC rules, support | Low capital, scalable, true maker stories | Packaging/quality variance; multi-seller carts mean multiple shipments |
| **B. Hub-and-spoke** | Sellers send bulk to our hub; we repack & ship | Consistent packaging, consolidated shipments, brand control | Capital, storage, shelf-life/waste risk, FSSAI licence for our own premises |
| **C. Hybrid (recommended start)** | **A** for pilot with strict packaging SOP + sample QC; add hubs in 1–2 demand cities for fast-moving shelf-stable items later | Learn fast with low capital | Operational complexity grows later |

**Recommendation:** Start with **A (seller-ships) for shelf-stable items**, add a QC sample step per seller, and move high-volume SKUs to hub fulfilment only when data justifies it.

### 6.3 Multi-seller cart
A single customer order may contain items from multiple sellers. The system splits it into **sub-orders** (one per seller/shipment) with separate tracking, while the customer sees one order, one payment. Shipping fee logic across sub-orders: **[DECIDE]** (per-shipment fee vs. flat fee vs. free above threshold).

## 7. Catalogue Model

### 7.1 Dish vs Product (important)
- **Dish** = a cultural entry in the Regional Food Library (e.g., *Litti Chokha*, *Thekua*). Has description, origin regions, aliases/spellings, festival tags, veg-confirmation notes. **A dish can exist without being purchasable.**
- **Product** = a specific item a **seller** sells (e.g., "Thekua — 500 g, by Maker X, Patna"). Has price, stock, photos, shelf life, FSSAI details, delivery class.
- **Relationships:** a dish links to **many regions** (the founder's list itself notes foods are not exclusive to one state, e.g., Thekua in Bihar *and* Jharkhand; Faraa/Pharra across Chhattisgarh/Bihar/eastern UP). A dish has many **aliases** (Pharra / Farra / Faraa / फरा) used by search.
- Dishes with no seller show **"Notify me when available"** → feeds the demand-insights engine.

### 7.2 Seed data
The founder's "India's 28 States — Traditional Vegetarian Foods — Final List" (142 entries: 5 per state, 7 for Bihar) is the **seed for the Regional Food Library**. Rules carried over from that document:
- Entries are *representative*, not exclusive to a state; recipes vary by district/community.
- Several Northeast entries have vegetarian and non-vegetarian versions (e.g., Eromba, Paknam, Pudoh, Galho, Axone, Anishi, Sawhchiar, Pika Pila, Mosdeng Serma, Tungrymbai). **A product may be listed only after the seller confirms a meat- and fish-free recipe**, checked by Admin.
- 28 states first; Union Territories (Delhi, J&K, Ladakh, Puducherry, etc.) added after.
- Before publishing dish pages, verify local spellings and regional associations with regional sources.

### 7.3 Vegetarian standard **[DECIDE + VERIFY]**
Proposed definition (Indian lacto-vegetarian): no meat, fish, egg, gelatin, animal rennet or animal-derived colour/flavour. Dairy allowed. Additional optional filters: **Jain-friendly**, **No onion/garlic (Satvik / festival-friendly)**, **Vegan**, **Gluten-free**, **Contains nuts / sesame / dairy / gluten / soy** allergen flags. Display the FSSAI-style green veg mark on every product. Sellers declare; Admin verifies ingredient lists.

### 7.4 Delivery classes
Every product must have exactly one class, which drives serviceability rules:

| Class | Examples (to confirm with makers) | Delivery rule |
|---|---|---|
| **SHELF_STABLE** (weeks+) | Thekua, Gaya Tilkut, pickles, namkeen, dry sweets | Courier, wide PIN coverage |
| **SHORT_LIFE** (days) | Khoya-based sweets (Belgrami, Laung-Latika), some Khaja | Express/air, limited PIN coverage, dispatch cut-offs |
| **FRESH / PERISHABLE** (hours–1–2 days) | Pharra, Litti Chokha, Dal Pitha, fresh sweets | **Local / same-city or regional only**, hyperlocal courier, time slots |
| **CHILLED/FROZEN** (later) | Frozen ready-to-cook | Cold chain, **out of scope for MVP** |

## 8. Functional Requirements

Priority: **P0** = MVP must-have · **P1** = V1 · **P2** = later. IDs are used across all documents and in tickets.

### 8.1 Discovery
| ID | Requirement | Pri |
|---|---|---|
| FR-DISC-01 | **Interactive India map** on home page; select a state → state page listing its dishes and available products. Keyboard-accessible; mobile uses tap + bottom sheet; fallback list for no-JS/screen readers. Uses a legally correct India boundary [VERIFY]. | P0 |
| FR-DISC-02 | **State page**: story intro, region sub-areas (e.g., Mithila, Bhojpur, Magadh), dish grid with "available now / notify me" status, makers from that state, festival tags. | P0 |
| FR-DISC-03 | **Smart search**: by dish, state, region, category, maker; typo-tolerant; transliteration & alias aware ("pharra/farra/faraa/फरा"), natural phrases ("traditional snacks from Rajasthan"). Search suggestions + recent searches. | P0 |
| FR-DISC-04 | **Filters/sort**: state, category (sweets, snacks, meals/ready-to-cook, pickles, beverages, dry goods), delivery class, veg type (Jain/no-onion-garlic/vegan), price, shelf life, festival, rating, "delivers to my PIN". | P0 |
| FR-DISC-05 | **Dish page** (Library): story, regions, aliases, how it's traditionally eaten, available products/sellers, "Notify me". | P1 |
| FR-DISC-06 | **Festival & special collections** (Chhath Puja, Durga Puja, Diwali, Pongal, Onam, Ganesh Chaturthi, Holi, Eid-neutral veg sweets etc.) with time-boxed landing pages. | P0 (Chhath/Diwali), P1 rest |
| FR-DISC-07 | **Curated regional food boxes** (e.g., "Bihar Chhath Box", "Rajasthan Snack Box"). | P1 |
| FR-DISC-08 | **Meet the Makers**: maker profile (location, method, story, photos/video, products, verification badges). | P0 |
| FR-DISC-09 | Recommendations ("From your home state", "People in Bengaluru also order"). | P2 |

### 8.2 Product page
| ID | Requirement | Pri |
|---|---|---|
| FR-PDP-01 | Real photographs (min. 3 incl. packaging), optional short video; **no stock/AI imagery for actual products**. | P0 |
| FR-PDP-02 | Name (+ local-script name), price, pack sizes/variants, quantity, stock status. | P0 |
| FR-PDP-03 | Region of origin, maker/seller details, **verification badges** (Maker Verified, Origin Verified, FSSAI Verified, GI-tagged where applicable). | P0 |
| FR-PDP-04 | Ingredients, allergens, veg mark, nutrition (if available), shelf life, storage instructions, net weight. | P0 |
| FR-PDP-05 | **PIN-code check** with estimated delivery date/time and reason if unavailable. Remembers PIN. | P0 |
| FR-PDP-06 | Ratings & reviews (verified-purchase only), Q&A (P2). | P1 |
| FR-PDP-07 | Share, save to favourites, "Notify me" when out of stock. | P0/P1 |

### 8.3 PIN-code serviceability (core trust feature)
| ID | Requirement | Pri |
|---|---|---|
| FR-SVC-01 | For each (product, destination PIN) return `AVAILABLE`, `AVAILABLE_LIMITED` (slower/extra fee/specific days), or `UNAVAILABLE` with a human-readable reason. | P0 |
| FR-SVC-02 | Rules combine: seller pickup PIN, delivery class, max transit hours, courier serviceability, seller dispatch days/cut-off, blackout dates. | P0 |
| FR-SVC-03 | **Fail closed**: if courier/API data is unavailable, show "can't confirm right now" — never "available". | P0 |
| FR-SVC-04 | Cart re-validates serviceability at checkout and again at payment. | P0 |
| FR-SVC-05 | Log unserviceable searches (PIN + product) for demand insights. | P1 |

### 8.4 Cart & Checkout
| ID | Requirement | Pri |
|---|---|---|
| FR-CHK-01 | Cart (persisted for guests and logged-in users), multi-seller grouping, per-item serviceability warnings, min order value rules. | P0 |
| FR-CHK-02 | Checkout: contact (phone OTP), address (with PIN auto-fill/validation), delivery options, summary with price breakup (items, shipping, packaging, taxes, discounts). | P0 |
| FR-CHK-03 | Guest checkout via phone OTP (account auto-created). | P0 |
| FR-CHK-04 | Coupons / gift messages / gift wrap (P1). | P1 |
| FR-CHK-05 | Stock reservation during checkout (time-boxed, e.g., 15 min). | P0 |
| FR-CHK-06 | Order confirmation page + email/WhatsApp/SMS confirmation + invoice (GST-compliant) [VERIFY]. | P0 |

### 8.5 Payments
| ID | Requirement | Pri |
|---|---|---|
| FR-PAY-01 | Online payments via a gateway (proposed: **Razorpay**): UPI, cards, netbanking, wallets. Hosted checkout; we never touch card data. | P0 |
| FR-PAY-02 | Payment confirmed **only by verified server-side signature/webhook**, idempotent. | P0 |
| FR-PAY-03 | Failed/pending payment handling and retry without losing the cart. | P0 |
| FR-PAY-04 | Refunds (full/partial) to original method with status visible to the customer. | P0 |
| FR-PAY-05 | COD: **off** for perishables; optional for shelf-stable later (RTO risk) [DECIDE]. | P2 |
| FR-PAY-06 | Seller payouts (split/transfer or periodic settlement) with ledger & statements [VERIFY gateway marketplace eligibility, TCS/TDS]. | P0 manual / P1 automated |

### 8.6 Order tracking
| ID | Requirement | Pri |
|---|---|---|
| FR-TRK-01 | Customer-visible timeline: **Confirmed → Prepared → Packed → Dispatched → Delivered** (plus *Out for delivery*, *Delayed*, *Cancelled*, *Returned*). | P0 |
| FR-TRK-02 | Courier tracking link/AWB, live status via courier webhooks, ETA changes explained. | P0 |
| FR-TRK-03 | Proactive notifications at each milestone (email + WhatsApp/SMS). | P0 |
| FR-TRK-04 | Delivery exceptions (failed attempt, address issue, damage) flow to support queue automatically. | P1 |

### 8.7 Customer account & support
| ID | Requirement | Pri |
|---|---|---|
| FR-ACC-01 | Phone-OTP login (+ email/Google optional). Profile, **saved addresses**, order history, reorder. | P0 |
| FR-ACC-02 | **Favourites / wishlist**, "My home state" preference to personalise the home page. | P0/P1 |
| FR-ACC-03 | Support: help centre/FAQ, contact form, WhatsApp/chat link, ticket per order with photo upload for damage claims. | P0 |
| FR-ACC-04 | Returns/refund policy suited to food (no returns for taste; replacement/refund for damaged, wrong, expired, or spoiled items within a defined window) [DECIDE + VERIFY]. | P0 |
| FR-ACC-05 | Data rights: view/export/delete data (DPDP Act) [VERIFY]. | P1 |

### 8.8 Seller portal
| ID | Requirement | Pri |
|---|---|---|
| FR-SEL-01 | **Seller onboarding**: application → document upload (FSSAI licence/registration, PAN, GST if applicable, bank details, address proof) → Admin verification → sample tasting/QC → agreement e-sign → go-live. | P0 |
| FR-SEL-02 | Product management: create/edit products & variants, upload photos, ingredients, allergens, shelf life, storage, delivery class, handling time, dispatch days, pickup address. Submissions go to **Admin approval**. | P0 |
| FR-SEL-03 | Inventory & availability toggle, vacation mode, daily capacity for fresh items. | P0 |
| FR-SEL-04 | Orders inbox: accept/reject within SLA, mark Preparing/Packed, print label/invoice, schedule pickup, see courier status. | P0 |
| FR-SEL-05 | Earnings: pending/settled amounts, commission breakup, downloadable statements. | P1 (P0 as simple report) |
| FR-SEL-06 | Seller performance score (on-time dispatch, cancellation rate, complaints, rating). | P1 |
| FR-SEL-07 | Simple UI in **English + Hindi** (later regional languages); mobile-friendly; WhatsApp notifications for new orders. | P0 |

### 8.9 Admin dashboard
| ID | Requirement | Pri |
|---|---|---|
| FR-ADM-01 | Seller verification queue with document viewer, checklists, approve/reject/request-changes, audit trail. | P0 |
| FR-ADM-02 | Catalogue management: states, regions, dishes (Library), aliases, categories, tags; product approvals; bulk import (CSV) of the 28-state seed. | P0 |
| FR-ADM-03 | Order management: search, filter, status override, cancel/refund, reassign courier, handle exceptions (NDR/RTO). | P0 |
| FR-ADM-04 | Serviceability management: PIN coverage per delivery class/courier, blackout dates, hyperlocal zones. | P0 |
| FR-ADM-05 | Collections, boxes, homepage modules, festival pages, makers' stories (CMS). | P0 |
| FR-ADM-06 | Customers & support tickets, refund approvals, review moderation. | P0/P1 |
| FR-ADM-07 | Finance: payments reconciliation, commissions, payouts, GST/TCS reports. | P1 |
| FR-ADM-08 | Analytics: sales, AOV, repeat rate, demand by city/PIN, unserviceable searches, waitlist counts, seller scores. | P1 |
| FR-ADM-09 | Role-based access (Super Admin, Catalogue, Ops, Support, Finance) + audit logs. | P0 |

### 8.10 Notifications
Email (order, shipping, invoices), WhatsApp/SMS (OTP, status updates), push (PWA, P2). All templates managed centrally; DLT-registered for SMS [VERIFY].

### 8.11 Demand insights & waitlist
"Notify me" requests and failed searches are stored with city/PIN → Admin report: *"Top 20 foods wanted in Delhi that we don't have"* → drives seller recruitment. **P1**, but data capture starts in MVP.

## 9. Non-Functional Requirements

| Area | Target |
|---|---|
| Performance (mobile, 4G mid-range Android) | LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 on key pages; animated home page still meets budgets |
| Availability | ≥ 99.9% for storefront & checkout; graceful degradation if third-party APIs fail |
| Security | OWASP ASVS L2 aims; HTTPS only; no card data stored; secrets never in client; rate-limits on OTP/search/pincode endpoints; audit logs for admin actions |
| Accessibility | WCAG 2.2 AA; full keyboard use; `prefers-reduced-motion` respected; map has non-visual alternative |
| Localisation | English + Hindi at launch; architecture ready for Bengali, Tamil, Telugu, Marathi, Gujarati, Odia, Malayalam, Kannada, Punjabi, Assamese… ; native-script dish names |
| SEO | Server-rendered state/dish/product pages, structured data (Product, Recipe-like info, Breadcrumb, Organization), sitemap, canonical URLs, shareable OG images |
| Scalability | Handle festival spikes (Chhath/Diwali) — cached catalogue, queue-based side effects, idempotent webhooks |
| Data | India-region hosting preferred (data localisation of payment data is gateway-side); backups & PITR; DPDP-aligned consent & retention |
| Browser support | Last 2 versions of Chrome, Safari, Edge, Firefox, Samsung Internet; animation features progressively enhanced |

## 10. Compliance & Legal Checklist **[VERIFY with professionals]**
- **FSSAI**: sellers' licence/registration displayed & verified; our own registration/licence as an e-commerce food business operator; label requirements; veg/non-veg logo; shelf-life/expiry on pack; storage; allergen declaration.
- **Legal Metrology** (packaged commodity declarations) for packed goods.
- **Consumer Protection (E-Commerce) Rules, 2020**: grievance officer, seller details, return/refund policy, country-of-origin display, no misleading claims.
- **GST** registration, invoicing, **TCS** as e-commerce operator, TDS on payouts as applicable.
- **DPDP Act 2023 & Rules**: consent notices, purpose limitation, grievance, data deletion.
- **Payments**: gateway KYC, marketplace/split-settlement eligibility (e.g., Razorpay Route).
- **Maps**: India boundary depiction must follow official Survey of India norms (Geospatial regulations).
- **Claims policy**: no health/medical claims; "authentic" and "traditional" claims only with evidence (maker/region verification); GI-tag claims only if registered.
- **Terms, Privacy, Shipping, Refund & Cancellation, Seller Agreement** pages drafted by a lawyer.

## 11. Success Metrics

| Category | Metric |
|---|---|
| Acquisition | Visitors → PIN-check rate; waitlist sign-ups; demand by city/PIN |
| Conversion | PIN-check → add-to-cart → checkout → paid; payment success rate |
| Retention | 60/90-day repeat rate; festival-season reorder; favourites per user |
| Operations | On-time dispatch %, on-time delivery %, damaged/spoiled complaint %, RTO %, refund %, support first-response time |
| Supply | Active verified makers, SKUs live, states covered, seller NPS |
| Unit economics | AOV, contribution margin per order, packaging+shipping % of AOV, CAC, LTV |
| Quality | Avg. rating, "Not as authentic" complaints |

> The pitch deck states metrics are "to be measured". Targets above must be set from pilot data, not assumed.

## 12. Roadmap (indicative)

| Phase | Scope | Exit criteria |
|---|---|---|
| **0. Validate (4–6 wks)** | Brand site + India map teaser + waitlist/"Notify me", 5–10 makers shortlisted, sample orders by manual courier, test packaging | Proven packaging survives transit; first 50–100 interested customers with PINs |
| **1. MVP Pilot** | Core site, 1–3 pilot states (suggested: **Bihar + Jharkhand + one more**), SHELF_STABLE (+ limited SHORT_LIFE) products, ~5–15 sellers, 5–8 destination metros, Razorpay + Shiprocket, seller portal v1, admin v1, Chhath/Diwali collection | ≥ target on-time delivery, damage < agreed %, first repeat orders |
| **2. V1** | More states, Library pages, boxes, reviews, wishlist, payouts automation, WhatsApp updates, Hindi + 1–2 languages, local fresh delivery in 1–2 cities | Positive contribution margin per order on core SKUs |
| **3. V2** | Hubs, subscriptions, recommendations, PWA push, more languages, UTs, chilled/frozen exploration | Repeat rate & margin targets met |
| **4. Scale** | Selective nationwide expansion as unit economics support (pitch-deck Years 4–5) | — |

**Suggested Bihar pilot catalogue (to confirm with makers):** shelf-stable — Thekua/Khajuria, Gaya Tilkut, Silao Khaja; short-life — Belgrami, Laung-Latika; fresh (local only, later) — Litti Chokha, Dal Pitha, Pharra.

## 13. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Food spoils/damages in transit | Delivery classes, tested packaging SOP, shelf-life validation, start with shelf-stable, courier-damage claims process |
| Seller quality inconsistency | Verification + sample tasting, seller scorecards, secret-shopper orders, delist rules |
| Authenticity disputes | Origin evidence on file, "Origin Verified" badge only with proof, transparent "representative, recipes vary" wording |
| Veg-integrity errors (esp. NE dishes) | Mandatory veg declaration + Admin ingredient check, complaint → immediate delist workflow |
| High shipping cost vs low AOV | Minimum order value, boxes/bundles, free-shipping thresholds, multi-item cart nudges |
| Multi-seller shipping complexity | Sub-orders, clear UI, hub model later |
| Over-animated site hurts speed/accessibility | Performance budgets, reduced-motion support, motion stays out of checkout |
| Regulatory gaps | Early legal/FSSAI consult, checklists in §10 |
| Single-founder bandwidth | Narrow pilot, buy not build where possible (payments, shipping, CMS) |

## 14. Open Questions **[DECIDE]**
1. Fulfilment: A (seller-ships) vs C (hybrid)? Who handles packaging materials?
2. Commission %, minimum order, shipping fee policy?
3. Which 2–3 states and which destination cities for the pilot?
4. COD: yes/no for shelf-stable?
5. Languages at launch: English + Hindi only?
6. Brand assets: final logo files, colours, fonts, real food photography (the deck's imagery looks illustrative/AI-generated; product pages need **real** photos).
7. Legal entity, FSSAI route (marketplace vs also own-label), GST status?
8. Domain name and brand spelling (Rasvani; renamed from Yaad Ki Sawad)?
9. Who is on the team beyond the founder (developer, designer, ops)?

## 15. Glossary
**AWB** courier air-waybill number · **NDR** non-delivery report · **RTO** return-to-origin · **SKU** stock-keeping unit · **GI** Geographical Indication · **PIN** postal index number · **DPDP** Digital Personal Data Protection Act.
