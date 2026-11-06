-- Private warehouse receiving evidence. Photos are staff-only and are never exposed
-- through public catalogue media or public object URLs.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'warehouse-receiving-evidence', 'warehouse-receiving-evidence', false, 5242880,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

-- Object path: <uploader-auth-uuid>/<receipt-uuid>/<random-uuid>.<extension>
drop policy if exists warehouse_receiving_evidence_upload on storage.objects;
create policy warehouse_receiving_evidence_upload on storage.objects
for insert to authenticated
with check (
  bucket_id = 'warehouse-receiving-evidence'
  and (storage.foldername(name))[1] = auth.uid()::text
  and (public.has_app_role('warehouse_operator') or public.has_app_role('admin') or public.has_app_role('super_admin'))
);

drop policy if exists warehouse_receiving_evidence_private_read on storage.objects;
create policy warehouse_receiving_evidence_private_read on storage.objects
for select to authenticated
using (
  bucket_id = 'warehouse-receiving-evidence'
  and (
    public.has_app_role('warehouse_operator')
    or public.has_app_role('quality_reviewer')
    or public.has_app_role('admin')
    or public.has_app_role('super_admin')
  )
);

drop policy if exists warehouse_receiving_evidence_owner_cleanup on storage.objects;
create policy warehouse_receiving_evidence_owner_cleanup on storage.objects
for delete to authenticated
using (
  bucket_id = 'warehouse-receiving-evidence'
  and (storage.foldername(name))[1] = auth.uid()::text
  and (public.has_app_role('warehouse_operator') or public.has_app_role('admin') or public.has_app_role('super_admin'))
);
