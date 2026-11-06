# Phase 4 — Product detail and regional story

## Scope delivered
The product detail route now combines the approved catalogue record with the public, evidence-reviewed regional relationships attached to that product. The page continues to show only products whose `approval_status` is `approved` and whose `published_at` timestamp is set.

## Product information
The page displays the product name and approved description, active category name when available, ingredients, allergen statement and configured storage condition. Product photography is fetched through the bounded `get_public_catalogue_product_media` RPC and short-lived signed URLs. If no approved photograph is available, the page shows an explicit placeholder rather than implying that an illustrative image depicts the real product.

## Regional relationships
The page reads only `product_regional_associations` rows with `review_status = approved`. It presents the relationship type using the schema's controlled values:

- `origin_claim` — Origin claim
- `produced_in` — Produced in
- `traditionally_associated_with` — Traditionally associated with
- `popular_in` — Popular in

Region labels use the canonical 36-region directory already maintained in the application. District names and links are shown only when the related district record is approved and its `region_id` matches the association. The page exposes the reviewed `relationship_note` but does not reveal internal evidence references, reviewer notes, or workflow metadata. Region and district links lead to the corresponding approved-content guide routes.

## Guardrails
A regional association is not presented as proof of exclusivity. In particular, an origin claim is shown with that exact reviewed label rather than being rewritten as an absolute statement. The page does not display producer-private details, SKU, internal IDs, price, stock, expiry/batch data, or delivery promises. Online ordering remains disabled for this catalogue entry until the relevant commercial and fulfilment controls are approved and enabled.

## Verification
A static source-check suite covers approval gating, approved media usage, each supported relationship label, canonical region resolution, approved district gating, region-consistency checks, navigation, responsive layout, non-disclosure of internal evidence references and commercial/inventory fields. These checks do not replace a live Supabase integration test or browser acceptance test.
