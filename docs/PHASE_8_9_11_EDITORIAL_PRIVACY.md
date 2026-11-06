# Rasvani editorial, translation and consent workflows

Migration: `202611020008_editorial_translation_consent.sql` (after migrations 001–007).

## Editorial lifecycle

`draft → pending_review → approved/rejected → published` with a separate archive action. Draft saves are limited to the author or an admin; review and publication require content-editor/admin roles. Publication is only possible after approval. Each state transition records an audit event. Rejected items must be edited and resubmitted as a new draft cycle.

## Translation lifecycle

Translations are stored against the source content and one of the 12 configured locales (`en`, `hi`, `bn`, `ta`, `te`, `mr`, `gu`, `pa`, `kn`, `ml`, `or`, `as`). Saving or editing resets the translation to draft. Submission and approval are separate actions; quality reviewer/admin roles perform the review. The workflow does not claim machine translations are professionally reviewed.

## Consent history

Authenticated users can append a consent decision keyed to a policy version. Records are append-only through the exposed RPC; a withdrawal is a new record with `granted=false`, not a destructive update. The implementation does not determine legal consent wording, cookie categories, retention period or lawful basis; those require owner and legal review.

## Security and verification

- Direct browser table writes remain unavailable.
- Functions use authenticated identity and explicit role checks.
- Public read policies continue to require approved/published source content and approved translations.
- Static checks cover expected workflow gates and audit calls. PostgreSQL/Supabase execution, RLS integration and concurrency tests remain NOT RUN until a configured database is available.
