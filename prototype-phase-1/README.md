# Rasvani — Phase 1 design prototype

**Brand:** Rasvani  
**Tagline:** India, Served by Region.  
**Status:** Refined owner-review prototype; not a production website.

## Open the prototype

Keep `index.html` and the complete `assets/` folder together. For a simple preview, open `index.html` in a modern browser. If local-file restrictions interfere, run a static server from this folder:

### Windows PowerShell

```powershell
py -m http.server 8000
```

Open `http://localhost:8000` in Chrome. To preview on a phone connected to the same Wi-Fi, use your computer's local IPv4 address instead of `localhost` and allow Python through Windows Firewall only on your private network.

## Included design and interactions

- Homepage with the source-PDF hero message and calls to action.
- Regional cards for Bihar, West Bengal, Rajasthan and Tamil Nadu.
- Selectable taxonomy for all 28 states and 8 Union Territories.
- Better Choices product-transparency concept.
- Sample Shop and product-detail panels.
- Food Stories / recipe editorial concept.
- Producer application journey preview.
- Retailer/business buyer journey preview.
- Admin workspace wireframe preview for catalogue, receiving, batch/expiry, warehouse, orders, CMS, approvals and reporting.
- Demo search, account preview, mobile menu and in-memory demo bag.
- Keyboard-accessible region buttons, accessible dialog semantics, focus handling and reduced-motion support.

## Important limitations

This is a static Phase 1 design prototype. It has no production backend, database, authentication, real product catalogue, stock, warehouse operations, batch/expiry tracking, FEFO/FIFO allocation, checkout, payment, order tracking, producer application storage, CMS or B2B portal. Demo interactions are local and temporary and reset on refresh. Do not treat any preview as a live service or offer.

All current food visuals are AI-generated illustrative placeholders; some were cropped from generated concept mockups. They are **not** verified photographs of regional dishes, actual products, producers, facilities, packaging or certifications. The master PDF permits AI imagery for conceptual moodboards/decorative illustration only, not as evidence of real products, origins, certifications or producers. Replace them with rights-cleared, fact-checked and regionally verified photographs before public production use.

Do not add invented prices, producer identities, FSSAI/GST details, certifications, stock, delivery promises, founder claims or customer reviews.

## Review and approval

Review the prototype in Chrome on desktop and mobile. See `PHASE_1_VERIFICATION_REPORT.md` for checks and limitations. Phase 2 production coding remains gated on explicit Phase 1 design acceptance.
