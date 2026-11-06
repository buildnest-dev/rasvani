import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const APP_ROLES = [
  'customer',
  'producer',
  'retailer',
  'warehouse_operator',
  'quality_reviewer',
  'content_editor',
  'support_agent',
  'admin',
  'super_admin',
] as const;

export type AppRole = (typeof APP_ROLES)[number];

/**
 * Returns the authenticated user's database-assigned roles.
 * Never reads role claims from editable user metadata or client input.
 */
export async function getCurrentUserRoles(): Promise<AppRole[]> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return [];

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (error || !data) return [];
    return data
      .map((row) => row.role)
      .filter((role): role is AppRole => APP_ROLES.includes(role as AppRole));
  } catch {
    // Missing local Supabase configuration must not crash public navigation.
    // Protected routes receive no roles and redirect to the account setup page.
    return [];
  }
}

/** Server-side route guard. Database RLS remains mandatory for every data query. */
export async function requireAnyRole(allowedRoles: readonly AppRole[]) {
  const roles = await getCurrentUserRoles();
  if (!roles.some((role) => allowedRoles.includes(role))) redirect('/account?access=denied');
  return roles;
}
