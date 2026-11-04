import 'server-only';
import type { User } from '@supabase/supabase-js';
import { getServerSupabase } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export interface AdminSession {
  user: User;
  isAdmin: boolean;
}

/**
 * Who is signed in, and are they allowed to edit the story.
 *
 * `getUser` is used rather than `getSession` because it verifies the token
 * with Supabase instead of trusting whatever is in the cookie.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await getServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const { data: admin } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', data.user.id)
    .maybeSingle();

  return { user: data.user, isAdmin: Boolean(admin) };
}

/** Throws unless the caller is a signed-in keeper. Used by every write action. */
export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) throw new Error('You need to sign in first.');
  if (!session.isAdmin) {
    throw new Error(
      'This account is signed in but is not a keeper of this story yet.',
    );
  }
  const supabase = await getServerSupabase(true);
  if (!supabase) throw new Error('The database is not connected.');
  return { session, supabase };
}
