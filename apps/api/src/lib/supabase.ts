import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL is not set');
}
const supabaseUrl = process.env.SUPABASE_URL;

// Use a token matching PostgREST's expected format
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
}
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Log detailed environment information for debugging
console.log('==== SUPABASE CLIENT CONFIGURATION ====');
console.log('Supabase URL:', supabaseUrl);
console.log('Using fixed JWT token for postgres role authentication');
console.log('====================================');

// Create client with proper token for postgres role access
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  global: {
    headers: {
      'x-client-info': `deforum-api/1.0.0`,
    },
  },
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});


// Add a helper function to check the connection
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('protocols').select('count').limit(1);
    if (error) {
      console.error('Supabase connection check failed:', error);
      return { ok: false, error };
    }
    console.log('Supabase connection successful, found protocols table');
    return { ok: true, data };
  } catch (error) {
    console.error('Supabase connection check exception:', error);
    return { ok: false, error };
  }
}

export type Todo = {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
  updated_at: string | null;
} 