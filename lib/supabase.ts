import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: any = null;

// Initialize client only if env vars are present
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };

// Server-side client for Edge Functions
export const getSupabaseServerClient = () => {
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.warn('[v0] Supabase service client not available - missing env vars');
    return null;
  }
  
  return createClient(supabaseUrl, supabaseServiceRoleKey);
};
