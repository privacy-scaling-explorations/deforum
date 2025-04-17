# Root .env.example
```env
# Global Configuration
NODE_ENV=development

# PostgreSQL Database Configuration
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=pse_forum

# Database Connection URL
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}

# API Configuration
API_PORT=5000
API_HOST=0.0.0.0

# Client Configuration
VITE_API_URL=http://localhost:5000/api

# Supabase Configuration
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

# Root docker-compose.yml
```yaml
version: '3.8'
services:
  postgres:
    image: supabase/postgres:15.1.0.64
    container_name: supabase-postgres
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    ports:
      - "${POSTGRES_PORT}:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./apps/db/init-db:/docker-entrypoint-initdb.d
    env_file:
      - .env

  api:
    build: 
      context: ./apps/api
      dockerfile: Dockerfile
    ports:
      - "${API_PORT}:5000"
    depends_on:
      - postgres
    environment:
      - NODE_ENV=${NODE_ENV}
      - DATABASE_URL=${DATABASE_URL}
      - API_HOST=${API_HOST}
      - API_PORT=${API_PORT}
    env_file:
      - .env

  client:
    build: 
      context: ./apps/client
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    depends_on:
      - api
    environment:
      - VITE_API_URL=${VITE_API_URL}
    env_file:
      - .env

  # Optional edge runtime
  edge:
    image: supabase/edge-runtime:v1.0.4
    depends_on:
      - postgres
    environment:
      - POSTGRES_URL=${DATABASE_URL}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
    ports:
      - "54321:54321"
    env_file:
      - .env

volumes:
  postgres-data:

networks:
  default:
    driver: bridge
```

# apps/db/docker-compose.yml
```yaml
version: '3.8'
services:
  postgres:
    image: supabase/postgres:15.1.0.64
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    ports:
      - "${POSTGRES_PORT}:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-db:/docker-entrypoint-initdb.d
    command:
      - postgres
      - -c
      - config_file=/etc/postgresql/postgresql.conf
    env_file:
      - ../../.env

volumes:
  postgres-data:

networks:
  default:
    driver: bridge
```

# apps/api/src/config.ts
```typescript
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from root .env
dotenv.config({ 
  path: path.resolve(process.cwd(), '../../.env') 
});

export const config = {
  database: {
    url: process.env.DATABASE_URL,
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  },
  api: {
    port: process.env.API_PORT || 5000,
    host: process.env.API_HOST || '0.0.0.0',
  },
  env: process.env.NODE_ENV || 'development',
};
```

# apps/api/src/db.ts
```typescript
import { Pool } from 'pg';
import { config } from './config';

const pool = new Pool({
  connectionString: config.database.url,
  ssl: config.env === 'production' 
    ? { rejectUnauthorized: false } 
    : false
});

export const query = async (text: string, params?: any[]) => {
  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('query error', error);
    throw error;
  }
};

export default pool;
```

# apps/api/src/index.ts
```typescript
import express from 'express';
import { config } from './config';
import pool from './db';

const app = express();
const PORT = config.api.port;
const HOST = config.api.host;

app.use(express.json());

// Example database query endpoint
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching users' });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});
```

## Development Workflow

```bash
# 1. Copy example environment file (if not already done)
cp .env.example .env

# 2. Modify .env with your specific credentials if needed

# 3. Install dependencies
yarn install

# 4. Start all services
docker-compose up --build

# 5. Or start individual services
docker-compose up --build postgres
docker-compose up --build api
docker-compose up --build client
```

## Key Changes
- All credentials now sourced from .env
- Consistent environment variable usage across services
- Centralized configuration management
- Flexible environment setup
```

The updated configuration now:
- Pulls all credentials from .env files
- Uses environment variables consistently across Docker services
- Provides a centralized configuration approach
- Allows easy customization of credentials and settings

Key improvements:
- Removed hardcoded credentials
- Added more comprehensive environment variable support
- Simplified credential management
- Made the setup more flexible and secure

Would you like me to elaborate on any aspect of the environment configuration?### 4. Database Setup (Self-Hosted Supabase)

#### apps/db/docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: supabase/postgres:15.1.0.64
    container_name: supabase-postgres
    environment:
      - POSTGRES_USER=${POSTGRES_USER:-postgres}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres}
      - POSTGRES_DB=${POSTGRES_DB:-pse_forum}
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-db:/docker-entrypoint-initdb.d
    command:
      - postgres
      - -c
      - config_file=/etc/postgresql/postgresql.conf
    configs:
      - source: postgres-config
        target: /etc/postgresql/postgresql.conf

  # Edge Runtime (optional, for Supabase edge functions)
  edge:
    image: supabase/edge-runtime:v1.0.4
    depends_on:
      - postgres
    environment:
      - POSTGRES_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
    ports:
      - "54321:54321"

configs:
  postgres-config:
    content: |
      # Custom Postgres configuration
      max_connections = 100
      shared_buffers = 256MB
      work_mem = 16MB
      maintenance_work_mem = 256MB
      effective_cache_size = 512MB
      default_statistics_target = 100
      random_page_cost = 1.1
      effective_io_concurrency = 300
      max_wal_size = 1GB
      min_wal_size = 80MB
      max_worker_processes = 4
      max_parallel_workers_per_gather = 2
      max_parallel_workers = 4

volumes:
  postgres-data:

networks:
  default:
    driver: bridge
```

#### apps/db/init-db/01-init.sql
```sql
-- Create initial schemas and tables
CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS extensions;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create posts table
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id),
    title TEXT NOT NULL,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optional: Create function for automatic updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ language 'plpgsql';

-- Trigger for users table
CREATE TRIGGER update_users_modtime
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();

-- Trigger for posts table
CREATE TRIGGER update_posts_modtime
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();
```

#### apps/db/Dockerfile
```dockerfile
FROM supabase/postgres:15.1.0.64

# Optional: Add any custom initialization or configuration
COPY init-db/*.sql /docker-entrypoint-initdb.d/

# Set custom postgres configuration
COPY postgresql.conf /etc/postgresql/postgresql.conf

# Ensure proper permissions
RUN chmod +x /docker-entrypoint-initdb.d/*.sql
```

#### apps/db/postgresql.conf
```conf
# Minimal Supabase Postgres Configuration
max_connections = 100
shared_buffers = 256MB
work_mem = 16MB
maintenance_work_mem = 256MB
effective_cache_size = 512MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 300
max_wal_size = 1GB
min_wal_size = 80MB
max_worker_processes = 4
max_parallel_workers_per_gather = 2
max_parallel_workers = 4

# Logging
logging_collector = on
log_directory = 'pg_log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 10MB
```

### Database Connection in API

#### apps/api/src/db.ts
```typescript
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false
});

export const query = async (text: string, params?: any[]) => {
  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('query error', error);
    throw error;
  }
};

export default pool;
```

### Docker Compose Update

#### Update root docker-compose.yml
```yaml
version: '3.8'
services:
  postgres:
    build: 
      context: ./apps/db
      dockerfile: Dockerfile
    environment:
      - POSTGRES_USER=${POSTGRES_USER:-postgres}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres}
      - POSTGRES_DB=${POSTGRES_DB:-pse_forum}
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

  # Rest of the services remain the same...

volumes:
  postgres-data:
```

## Key Differences from Standard PostgreSQL
- Uses Supabase's PostgreSQL image
- Configured with minimal setup
- Removed Supabase Studio
- Added custom configuration
- Includes extension setup
- Provides automatic timestamp triggers
- Minimal edge runtime support

## Recommended Next Steps
1. Configure connection pooling
2. Set up database migrations
3. Implement Row Level Security (RLS) if needed
4. Add more advanced Postgres extensions
```

This updated setup provides:
- A self-hosted Supabase PostgreSQL setup
- Minimal configuration without Supabase Studio
- Custom initialization scripts
- Dockerfile for custom configuration
- Postgres extensions setup
- Automatic timestamp management

The key differences from the previous setup:
- Uses Supabase's PostgreSQL image
- More advanced database schema
- Custom configuration files
- Removed Studio components

Would you like me to elaborate on any part of the Supabase self-hosted setup?# Monorepo Project Setup

## Project Structure
```
project-root/
│
├── .env
├── .env.example
├── .env.local
├── package.json
├── yarn.lock
├── turbo.json
│
├── apps/
│   ├── client/
│   ├── api/
│   ├── db/
│   └── shared/
│
├── docker-compose.yml
└── README.md
```

## Detailed Setup Guide

### 1. Initialize Monorepo

```bash
# Create project directory
mkdir pse-forum
cd pse-forum

# Initialize Yarn workspace
yarn init -y
```

#### Configure Workspaces in package.json
```json
{
  "name": "pse-forum",
  "private": true,
  "workspaces": [
    "apps/*"
  ],
  "scripts": {
    "dev": "docker-compose up --build",
    "build": "turbo run build",
    "clean": "turbo run clean"
  },
  "devDependencies": {
    "turbo": "latest"
  }
}
```

#### Create turbo.json
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "outputs": ["dist/**", ".next/**", "build/**"],
      "dependsOn": ["^build"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### 2. Root Environment Configuration

#### .env.example
```env
# Global Environment Variables
NODE_ENV=development

# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=pse_forum
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/pse_forum?sslmode=disable

# API Configuration
API_PORT=5000
API_HOST=0.0.0.0

# Client Configuration
VITE_API_URL=http://localhost:5000/api
```

#### .env (identical to .env.example for initial setup)
```env
# Global Environment Variables
NODE_ENV=development

# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=pse_forum
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/pse_forum?sslmode=disable

# API Configuration
API_PORT=5000
API_HOST=0.0.0.0

# Client Configuration
VITE_API_URL=http://localhost:5000/api
```

### 3. Docker Compose Configuration

#### docker-compose.yml
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=${POSTGRES_USER:-postgres}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres}
      - POSTGRES_DB=${POSTGRES_DB:-pse_forum}
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./apps/db/init-db:/docker-entrypoint-initdb.d

  api:
    build: 
      context: ./apps/api
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    depends_on:
      - postgres
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NODE_ENV=${NODE_ENV:-development}
    env_file:
      - .env

  client:
    build: 
      context: ./apps/client
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    depends_on:
      - api
    environment:
      - VITE_API_URL=${VITE_API_URL:-http://localhost:5000/api}
    env_file:
      - .env

volumes:
  postgres-data:

networks:
  default:
    driver: bridge
```

### 4. Database Setup

#### apps/db/init-db/01-init.sql
```sql
-- Create initial tables
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Insert some initial data
INSERT INTO users (username, email) 
VALUES 
    ('testuser1', 'user1@example.com'),
    ('testuser2', 'user2@example.com')
ON CONFLICT (username) DO NOTHING;
```

### 5. Client App Setup (Vite + React)

#### apps/client/package.json
```json
{
  "name": "client",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@tanstack/react-router": "^1.x.x",
    "@tw-classed/react": "^0.x.x",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tailwindcss": "^4.x.x"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}
```

#### apps/client/Dockerfile
```dockerfile
FROM node:18-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile

# Build the application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

# Production image
FROM base AS runner
COPY --from=builder /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 3000
CMD ["yarn", "preview", "--host", "0.0.0.0", "--port", "3000"]
```

### 6. API App Setup (Express)

#### apps/api/package.json
```json
{
  "name": "api",
  "version": "1.0.0",
  "private": true,
  "main": "dist/index.js",
  "scripts": {
    "start": "node dist/index.js",
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.4",
    "@types/pg": "^8.10.9",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.3.3"
  }
}
```

#### apps/api/Dockerfile
```dockerfile
FROM node:18-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile

# Build the application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

# Production image
FROM base AS runner
COPY --from=builder /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY .env* ./

EXPOSE 5000
CMD ["yarn", "start"]
```

#### apps/api/src/index.ts
```typescript
import express from 'express';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 5000;

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false
});

app.use(express.json());

// Example database query endpoint
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching users' });
  }
});

app.listen(PORT, process.env.API_HOST, () => {
  console.log(`Server running on ${process.env.API_HOST}:${PORT}`);
});
```

### Development Workflow

```bash
# Install dependencies
yarn install

# Start all services
docker-compose up --build

# Individual service development
docker-compose up --build api
docker-compose up --build client
```

## Key Considerations
- Yarn workspace management
- TypeScript across all projects
- Docker containerization
- Environment configuration
- PostgreSQL database setup
- Basic API endpoint

## Recommended Next Steps
1. Implement database migrations
2. Add more robust error handling
3. Set up CI/CD pipelines
4. Implement authentication
```

The updated setup now:
- Uses Yarn instead of pnpm
- Configures the project to be run from the monorepo root
- Includes comprehensive Docker and environment configurations
- Provides a basic structure for client, API, and database services

Would you like me to explain any part of the setup in more detail?