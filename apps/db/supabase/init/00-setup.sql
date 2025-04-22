-- Create necessary roles
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE ROLE supabase_admin NOLOGIN SUPERUSER;

-- Grant roles to postgres user
GRANT anon TO postgres;
GRANT authenticated TO postgres;
GRANT service_role TO postgres;
GRANT supabase_admin TO postgres;

-- Create basic schema
CREATE SCHEMA IF NOT EXISTS public;

-- Enable PostgreSQL extensions required by Supabase
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- For UUID generation
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- For text search

-- Enable Row Level Security
ALTER DATABASE supabase SET "app.settings.jwt_secret" TO 'your-super-secret-jwt-token-with-at-least-32-characters';
ALTER DATABASE supabase SET "app.settings.anon_role" TO 'anon';

-- Create default permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated; 