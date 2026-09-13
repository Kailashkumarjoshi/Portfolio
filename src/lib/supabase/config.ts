export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * The site is fully viewable before Supabase is connected: it falls back to the
 * bundled demo story and the admin panel explains what to do next.
 */
export const isSupabaseConfigured: boolean =
  SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY.length > 20;

export const MEDIA_BUCKET = 'memories';
