'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type AuthActionState = { error?: string; success?: string };

const credentialsSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(10).max(128),
});

function readCredentials(formData: FormData) {
  return credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
}

// Only these in-app destinations may follow sign-in (prevents open redirects).
function safeNext(formData: FormData): string {
  const value = String(formData.get('next') ?? '');
  return value === '/checkout' || value === '/cart' ? value : '/account';
}

export async function signInAction(_previous: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = readCredentials(formData);
  if (!parsed.success) return { error: 'Enter a valid email and a password of at least 10 characters.' };

  let supabase;
  try { supabase = await createClient(); }
  catch { return { error: 'Account access is being prepared. Please try again when sign-in opens.' }; }

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: 'We could not sign you in with those details. Check them and try again.' };
  redirect(safeNext(formData));
}

export async function signUpAction(_previous: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = readCredentials(formData);
  if (!parsed.success) return { error: 'Enter a valid email and a password of at least 10 characters.' };

  let supabase;
  try { supabase = await createClient(); }
  catch { return { error: 'Account registration is being prepared. Please try again when sign-up opens.' }; }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { error: 'We could not create the account. Please check your details or try again later.' };
  if (data.session) redirect(safeNext(formData));
  return { success: 'If registration is enabled, check your email for the verification message before signing in.' };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/account');
}
