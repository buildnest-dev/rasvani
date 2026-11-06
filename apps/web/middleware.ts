import { NextResponse, type NextRequest } from 'next/server';

// Role-specific entrances. admin.<domain> serves only /admin; baker.<domain> serves only /baker.
// Hostnames only choose which screen to show: every action is verified again on the server from the
// signed-in user's Firebase token and role, never from the hostname.
const RETIRED_ROUTES = ['/producer-portal', '/warehouse', '/catalogue-review', '/regional-review', '/facility-review', '/editorial', '/business-portal'];

export function middleware(request: NextRequest) {
  const host = (request.headers.get('host') ?? '').toLowerCase().split(':')[0];
  const { pathname } = request.nextUrl;

  if (RETIRED_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) return new NextResponse('Not found', { status: 404 });

  const area = host.startsWith('admin.') ? '/admin' : host.startsWith('baker.') ? '/baker' : null;
  if (area) {
    if (pathname === '/') { const url = request.nextUrl.clone(); url.pathname = area; return NextResponse.rewrite(url); }
    if (!pathname.startsWith(area)) { const url = request.nextUrl.clone(); url.pathname = '/'; return NextResponse.redirect(url); }
    return NextResponse.next();
  }
  // Customer site: once the subdomains are live, keep staff screens off the public host.
  if (process.env.ENFORCE_STAFF_SUBDOMAINS === '1' && (pathname.startsWith('/admin') || pathname.startsWith('/baker'))) {
    return new NextResponse('Not found', { status: 404 });
  }
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|images/).*)'] };
