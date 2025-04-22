import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://supabase-rest:3000';
// Use a simple token matching our PostgREST configuration
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoicG9zdGdyZXMifQ.oM0SXF31Vs1nfwCaDxjlOfipxZ4N4RjHRvFgEWJqZ7g';

// Log detailed environment information for debugging
console.log('==== SUPABASE CLIENT CONFIGURATION ====');
console.log('Supabase URL:', supabaseUrl);
console.log('Using fixed JWT token for postgres role authentication');
console.log('====================================');

// Create client with proper token for postgres role access
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-client-info': `pse-forum-api/1.0.0`,
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