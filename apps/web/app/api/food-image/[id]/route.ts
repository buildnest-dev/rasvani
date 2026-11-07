import { adminDb } from '@/lib/firebase/admin';
import { UPLOAD_ID } from '@/lib/food-images';

export const runtime = 'nodejs';

const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/** Serves a food picture that the admin uploaded. The bytes were checked when they were stored. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UPLOAD_ID.test(id)) return new Response('Not found', { status: 404 });
  try {
    const snap = await adminDb().collection('foodImages').doc(id).get();
    const data = snap.data();
    if (!data || !TYPES.has(String(data.type)) || !data.bytes) return new Response('Not found', { status: 404 });
    const body = Buffer.from(data.bytes as Uint8Array);
    return new Response(body, {
      headers: {
        'Content-Type': String(data.type),
        'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; sandbox",
        'Content-Disposition': 'inline',
      },
    });
  } catch { return new Response('Not found', { status: 404 }); }
}
