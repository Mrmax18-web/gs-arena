import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'your_supabase_url_here' &&
    !supabaseUrl.includes('placeholder-project')
  );
}

if (!isSupabaseConfigured()) {
  console.warn('[Supabase] Missing or unconfigured VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY environment variables.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
