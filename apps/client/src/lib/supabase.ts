import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:3001';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.ZopqpbRb_sReKnLypwLO9xiHdQvV2iwQeR_PTbWf2J8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-client-info': `pse-forum-client/1.0.0`,
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

// Helper functions for todos
export const todoService = {
  async getAll() {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Todo[];
  },

  async add(title: string) {
    const { data, error } = await supabase
      .from('todos')
      .insert([{ title }])
      .select();
    
    if (error) throw error;
    return data[0] as Todo;
  },

  async toggle(id: string, completed: boolean) {
    const { data, error } = await supabase
      .from('todos')
      .update({ completed, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0] as Todo;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
}; 