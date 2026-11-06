import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Completes Google / Apple sign-in and email-verification links.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');
  const destination = next === '/checkout' || next === '/cart' || next === '/account/orders' ? next : '/account';
  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(`${origin}${destination}`);
    } catch { /* fall through to the error page */ }
  }
  return NextResponse.redirect(`${origin}/account?error=verification-failed`);
}
