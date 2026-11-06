from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
a=(root/'apps/web/app/regional-review/actions.ts').read_text()
w=(root/'apps/web/app/regional-review/page.tsx').read_text()
d=(root/'apps/web/app/explore-india/[region]/district/[district]/page.tsx').read_text()
m=(root/'supabase/migrations/202611020023_district_guide_content.sql').read_text()
c=(root/'apps/web/app/globals.css').read_text()
checks={
 'migration_adds_optional_district_introduction': 'add column introduction text' in m,
 'migration_adds_optional_heritage_note': 'add column heritage_note text' in m,
 'migration_bounds_copy_lengths': 'between 1 and 500' in m and 'between 1 and 2000' in m,
 'legacy_district_rpc_signature_removed': 'drop function if exists public.save_district_draft(uuid,text,text,text,text)' in m,
 'new_rpc_keeps_editor_role_gate': "public.has_app_role('content_editor')" in m,
 'new_rpc_audits_guide_content_presence': "regional.district_guide_draft_saved" in m,
 'action_validates_guide_copy_lengths': 'introduction.length > 500' in a and 'heritageNote.length > 2000' in a,
 'action_sends_both_guide_fields_to_rpc': 'p_introduction: introduction || null' in a and 'p_heritage_note: heritageNote || null' in a,
 'workspace_collects_introduction': 'name="introduction"' in w and 'maxLength={500}' in w,
 'workspace_collects_heritage_context': 'name="heritage_note"' in w and 'maxLength={2000}' in w,
 'workspace_explains_evidence_review': 'reviewed together against this evidence reference' in w,
 'review_queue_displays_proposed_copy': 'Proposed district guide copy' in w and 'item.detail' in w,
 'public_page_selects_approved_district_copy': "select('id,name,slug,introduction,heritage_note')" in d and "eq('publication_status', 'approved')" in d,
 'public_page_renders_optional_intro': 'district-guide-intro' in d,
 'public_page_renders_optional_heritage_note': 'district-heritage-note' in d,
 'public_copy_not_seeded': 'No district examples, foods, heritage facts or origin claims are seeded' in (root/'docs/PHASE_3_DISTRICT_GUIDE_CONTENT.md').read_text(),
 'responsive_guide_styles_exist': '.district-guide-intro' in c and '.regional-district-review-copy' in c,
}
passed=sum(checks.values()); result={'suite':'phase3_district_guide_content','passed':passed,'total':len(checks),'checks':checks}
(root/'qa/phase3_district_guide_content_static_results.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'passed':passed,'total':len(checks),'failed':[k for k,v in checks.items() if not v]},indent=2))
if passed != len(checks): raise SystemExit(1)
