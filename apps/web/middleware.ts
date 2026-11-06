import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Role-specific entrances. admin.<domain> and baker.<domain> serve only their own area plus sign-in;
// access is still enforced per route by database roles (requireAnyRole), never by hostname alone.
function hostRouting(request: NextRequest): NextResponse | null {
  const host = (request.headers.get('host') ?? '').toLowerCase().split(':')[0];
  const { pathname } = request.nextUrl;
  const area = host.startsWith('admin.') ? '/admin' : host.startsWith('baker.') ? '/producer-portal' : null;
  if (area) {
    if (pathname === '/') { const url = request.nextUrl.clone(); url.pathname = area; return NextResponse.rewrite(url); }
    const allowed = pathname.startsWith(area) || pathname.startsWith('/account') || (area === '/admin' && pathname.startsWith('/warehouse'));
    if (!allowed) { const url = request.nextUrl.clone(); url.pathname = '/'; return NextResponse.redirect(url); }
    return null;
  }
  // Customer site: once the subdomains are live, keep staff tools off the public host.
  if (process.env.ENFORCE_STAFF_SUBDOMAINS === '1' && (pathname.startsWith('/admin') || pathname.startsWith('/producer-portal') || pathname.startsWith('/warehouse'))) {
    return new NextResponse('Not found', { status: 404 });
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const routed = hostRouting(request);
  if (routed && routed.status !== 200) return routed;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return routed ?? NextResponse.next({ request });

  let response = routed ?? NextResponse.next({ request });
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        if (!routed) response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  // Refreshes the auth session. Protected route authorization must still be enforced server-side and by RLS.
  await supabase.auth.getUser();
  return response;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|images/).*)'] };
