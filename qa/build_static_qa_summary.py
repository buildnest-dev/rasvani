from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
files=[
 ('Phase 1 navigation 3D motion', 'phase1_navigation_motion_static_results.json'),
 ('Phase 1 complete visual redesign', 'phase1_visual_redesign_static_results.json'),
 ('Phase 1 premium editorial and item imagery', 'phase1_premium_editorial_images_static_results.json'),
 ('Phase 3 regional directory', 'phase3_regional_directory_static_results.json'),
 ('Phase 3 regional food search', 'phase3_regional_search_static_results.json'),
 ('Phase 3 protected regional review workspace', 'phase3_regional_review_static_results.json'),
 ('Phase 3 district discovery', 'phase3_district_discovery_static_results.json'),
 ('Phase 3 district guide content', 'phase3_district_guide_content_static_results.json'),
 ('Phase 3 state and UT overview content', 'phase3_region_overview_static_results.json'),
 ('Phase 3 state category discovery', 'phase3_region_category_discovery_static_results.json'),
 ('Catalogue review workspace', 'phase4_catalogue_review_static_results.json'),
 ('Public catalogue and product detail UI', 'phase4_public_catalogue_static_results.json'),
 ('Public approved product media delivery', 'phase4_public_media_static_results.json'),
 ('Phase 4 regional catalogue filters', 'phase4_regional_catalogue_filters_static_results.json'),
 ('Phase 4 product detail regional story', 'phase4_product_detail_regional_story_static_results.json'),
 ('Phase 2 identity/access', 'phase2_static_results.json'),
 ('Inventory allocation/recall', 'phase10_workflow_static_results.json'),
 ('Receiving/returns/expiry', 'phase10_receiving_returns_static_results.json'),
 ('Reservation/dispatch', 'phase5_10_reservation_static_results.json'),
 ('Producer/catalogue governance', 'phase6_4_governance_static_results.json'),
 ('Customer commerce/B2B', 'phase5_7_commerce_b2b_static_results.json'),
 ('Editorial/translations/consent', 'phase8_9_11_editorial_privacy_static_results.json'),
 ('Admin reporting', 'phase11_reporting_static_results.json'),
 ('Protected admin dashboard UI', 'phase11_admin_ui_static_results.json'),
 ('Protected editorial workspace UI', 'phase8_editorial_ui_static_results.json'),
 ('Translation workspace UI', 'phase9_translation_ui_static_results.json'),
 ('Protected producer self-service portal', 'phase6_producer_portal_static_results.json'),
 ('Protected warehouse workspace UI', 'phase10_warehouse_workspace_static_results.json'),
 ('Customer order history and cancellation UI', 'phase5_customer_order_ui_static_results.json'),
 ('Business buyer self-service portal', 'phase7_business_portal_static_results.json'),
 ('Admin business verification queue', 'phase7_business_review_ui_static_results.json'),
 ('Producer facility self-service and staff review', 'phase6_facility_workspace_static_results.json'),
 ('Private product image upload and quality review', 'phase6_product_media_static_results.json'),
 ('Private warehouse receiving evidence review', 'phase10_private_receiving_evidence_static_results.json'),
 ('Quality-controlled product recall workspace', 'phase10_recall_workspace_static_results.json'),
 ('Read-only inventory movement ledger', 'phase10_inventory_movement_ledger_static_results.json'),
 ('Physical stock-count reconciliation workspace', 'phase10_stock_count_workspace_static_results.json'),
 ('Receiving checklist template editing', 'phase10_checklist_template_editing_static_results.json'),
 ('Independent stock-count variance investigation', 'phase10_stock_count_variance_investigation_static_results.json'),
 ('Immutable stock-count investigation evidence', 'phase10_immutable_stock_count_investigation_static_results.json'),
 ('Open stock-count cancellation', 'phase10_open_stock_count_cancellation_static_results.json'),
 ('Physical stock-count line audit', 'phase10_stock_count_line_audit_static_results.json'),
 ('Stock-count decision audit read model and register', 'phase10_stock_count_decision_audit_static_results.json'),
 ('Prevent overlapping full-warehouse stock counts', 'phase10_prevent_overlapping_stock_counts_static_results.json'),
 ('Database unique-index enforcement for active stock counts', 'phase10_stock_count_unique_index_static_results.json'),
 ('Visible stale stock-count snapshot read model and UI', 'phase10_stale_stock_count_snapshot_static_results.json'),
 ('Line-level stale stock-count explanations', 'phase10_stale_stock_count_line_explanations_static_results.json'),
 ('Stock-count line search and exception filters', 'phase10_stock_count_line_search_filters_static_results.json'),
 ('Physical stock-count filtered CSV export', 'phase10_stock_count_csv_export_static_results.json'),
 ('Video review regression remediation', 'video_review_regressions_static_results.json'),
 ('Homepage map separation and dedicated discovery routes', 'phase1_homepage_live_map_static_results.json'),
 ('Homepage Bihar exact dry-snack atlas and full map', 'homepage_bihar_exact_dry_snacks_and_full_map_static_results.json'),
 ('Siwan food imagery, interactive 3D carousel, and India map', 'siwan_reel_3d_category_static_results.json'),
 ('District Flavour Trails photos and per-item 3D', 'district_food_trails_static_results.json'),
 ('Sitewide locale, image quality and cinematic homepage motion', 'sitewide_locale_motion_image_quality_static_results.json'),
]
suites=[]
for label,fn in files:
 d=json.loads((root/'qa'/fn).read_text())
 checks=d.get('checks',{})
 passed=d.get('passed', sum(1 for x in (checks.values() if isinstance(checks,dict) else checks) if (x is True or (isinstance(x,dict) and x.get('passed') is True))))
 total=d.get('total', len(checks))
 suites.append({'suite':label,'passed':passed,'total':total,'status':'PASS' if passed==total else 'FAIL','file':fn})
passed=sum(x['passed'] for x in suites); total=sum(x['total'] for x in suites)
out={'status':'PASS' if passed==total else 'FAIL','passed':passed,'total':total,'suites':suites,'scope':'Static source checks only. No live PostgreSQL/Supabase, framework build, end-to-end, security penetration, accessibility audit or performance test is implied.'}
(root/'qa/static_qa_summary.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
if passed!=total: raise SystemExit(1)
