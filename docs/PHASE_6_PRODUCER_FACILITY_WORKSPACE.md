# Phase 6 — Producer facility registration and review

## Delivered

- Producer-only `/producer-portal/facilities` workspace for approved producer accounts.
- Facility name, facility type, postal address, Indian state/UT and declared storage capability intake.
- Pending facility submissions are upserted by producer + normalized name + region to avoid repeated pending duplicates.
- Producers can view only facilities associated with their own approved producer profile through a bounded status RPC.
- Quality reviewers and admins can access `/facility-review` and a bounded pending review queue.
- Facility decision uses the existing `review_producer_facility` database transition, requiring an approved producer and a review reason; approval can be time-bounded.
- Submission and review actions are audited.

## Migration

Apply `supabase/migrations/202611020019_producer_facility_self_service.sql` after migrations 001–018.

## Important boundaries

Facility submission is not facility verification. The self-service form does not collect government identity numbers, FSSAI documents, bank details, photographs, GPS coordinates or sensitive supporting files. Those require a separately approved document/storage access and retention model. The internal approval state is not a government licence, inspection report or legal compliance determination. Product catalogue approval continues to require a currently approved facility.

## Validation status

Static source checks cover the SQL function guards, RPC names, route authorization, form validation, approval date checks, status isolation and links. No live PostgreSQL/Supabase execution is claimed by these checks.
