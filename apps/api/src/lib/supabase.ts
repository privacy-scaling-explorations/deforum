import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:3001';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.ZopqpbRb_sReKnLypwLO9xiHdQvV2iwQeR_PTbWf2J8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-client-info': `pse-forum-api/1.0.0`,
    },
  },
});

export type Todo = {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
  updated_at: string | null;
} 