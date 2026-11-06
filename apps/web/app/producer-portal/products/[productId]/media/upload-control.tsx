'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { registerProducerProductMedia } from './actions';

const maxBytes = 5 * 1024 * 1024;
const extensions: Record<string,string> = { 'image/jpeg':'jpg', 'image/png':'png', 'image/webp':'webp' };

export function UploadControl({ productId }: { productId: string }) {
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  async function upload() {
    const file = inputRef.current?.files?.[0];
    if (!file) { setMessage('Choose an image first.'); return; }
    if (!extensions[file.type] || file.size < 1 || file.size > maxBytes) {
      setMessage('Choose a JPEG, PNG or WebP image no larger than 5 MB.'); return;
    }
    setBusy(true); setMessage('Uploading privately…');
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) { setMessage('Sign in again before uploading.'); return; }
      const objectPath = `${user.id}/${productId}/${crypto.randomUUID()}.${extensions[file.type]}`;
      const { error: uploadError } = await supabase.storage.from('producer-product-media').upload(objectPath,file,{
        cacheControl:'3600', upsert:false, contentType:file.type,
      });
      if (uploadError) { setMessage('Upload failed. Confirm migration 020 and producer storage access.'); return; }
      const result = await registerProducerProductMedia(productId,objectPath,file.name,file.type,file.size);
      if (!result.ok) {
        await supabase.storage.from('producer-product-media').remove([objectPath]);
        setMessage('The image could not be registered. The unregistered upload was removed; check product ownership and status.');
        return;
      }
      setMessage('Image uploaded privately and sent for quality review.');
      if (inputRef.current) inputRef.current.value = '';
      window.location.reload();
    } catch {
      setMessage('Upload could not be completed. Check your connection and try again.');
    } finally { setBusy(false); }
  }
  return <div className="media-upload-control"><label htmlFor="product-media-file">Product photo (JPEG, PNG or WebP, up to 5 MB)</label><input ref={inputRef} id="product-media-file" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy}/><button type="button" className="btn" onClick={upload} disabled={busy}>{busy ? 'Uploading…' : 'Upload photo for review'}</button>{message && <p className="status" role="status">{message}</p>}</div>;
}
