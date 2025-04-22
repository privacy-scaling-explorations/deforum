-- Create necessary roles
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;

-- Grant roles to postgres user
GRANT anon TO postgres;
GRANT authenticated TO postgres;
GRANT service_role TO postgres;

-- Create basic schema
CREATE SCHEMA IF NOT EXISTS public;

-- Enable PostgreSQL extensions required by Supabase
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- For UUID generation
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- For text search
CREATE EXTENSION IF NOT EXISTS "pgjwt";          -- For JWT handling

-- Enable Row Level Security
ALTER DATABASE supabase SET "app.settings.jwt_secret" TO 'your-super-secret-jwt-token-with-at-least-32-characters';
ALTER DATABASE supabase SET "app.settings.anon_role" TO 'anon';

-- Create a sample table
CREATE TABLE IF NOT EXISTS public.todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Enable Row Level Security on todos table
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anonymous users to select all todos
CREATE POLICY todo_select_policy ON public.todos 
    FOR SELECT 
    TO anon
    USING (true);

-- Create a policy that allows authenticated users to insert their own todos
CREATE POLICY todo_insert_policy ON public.todos 
    FOR INSERT 
    TO authenticated
    WITH CHECK (true);

-- Create default permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Insert sample data
INSERT INTO public.todos (title) VALUES 
  ('Learn about Supabase'),
  ('Set up PostgREST'),
  ('Create API endpoints'); 