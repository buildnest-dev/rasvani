from pathlib import Path
import json
root = Path(__file__).resolve().parents[1]
sql = (root/'supabase/migrations/202611020008_editorial_translation_consent.sql').read_text()
checks = {
 'editorial draft save is role gated': "public.has_app_role('content_editor')" in sql,
 'draft submission requires author or admin': 'Only the author or admin may submit this draft' in sql,
 'review requires pending state': "where id=p_content_id and status='pending_review'" in sql,
 'publication requires approved and unpublished': "status='approved' and published_at is null" in sql,
 'archive requires admin and reason': "Admin role required to archive content" in sql and 'Archive reason required' in sql,
 'translation locales constrained to 12': "'en','hi','bn','ta','te','mr','gu','pa','kn','ml','or','as'" in sql,
 'translation approval requires reviewer role': "public.has_app_role('quality_reviewer')" in sql,
 'translation public read requires published source': 'c.status=\'approved\' and c.published_at is not null' in sql,
 'consent is append-only via RPC': 'insert into public.consent_records' in sql and 'update public.consent_records' not in sql,
 'consent revocation can be recorded': 'p_granted boolean' in sql,
 'all workflow RPCs revoke public execute': sql.count('revoke all on function') >= 9,
 'audit events recorded': sql.count('insert into public.audit_logs') >= 9,
}
failed = [k for k,v in checks.items() if not v]
result = {'suite':'phase8_9_11_editorial_privacy_static','passed':len(checks)-len(failed),'total':len(checks),'checks':checks,'failed':failed,'database_execution':'NOT RUN'}
out = root/'qa/phase8_9_11_editorial_privacy_static_results.json'
out.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
if failed: raise SystemExit(1)
