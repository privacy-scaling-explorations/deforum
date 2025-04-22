-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table according to ER diagram
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT NOT NULL,
    avatar TEXT,
    email TEXT,
    website TEXT,
    bio TEXT,
    is_anon BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Insert some test data
INSERT INTO users (id, username, avatar, email, website, bio, is_anon) VALUES
    (uuid_generate_v4(), 'testuser1', 'https://example.com/avatar1.png', 'test1@example.com', 'https://example.com/user1', 'Test user bio 1', FALSE),
    (uuid_generate_v4(), 'testuser2', 'https://example.com/avatar2.png', 'test2@example.com', 'https://example.com/user2', 'Test user bio 2', FALSE);

-- Create protocol_attributes table
CREATE TABLE IF NOT EXISTS protocol_attributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    type TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create protocols table
CREATE TABLE IF NOT EXISTS protocols (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    protocol_attribute_id UUID REFERENCES protocol_attributes(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Create communities table
CREATE TABLE IF NOT EXISTS communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    avatar TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Create posts table according to ER diagram
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES users(id),
    community_id UUID REFERENCES communities(id),
    is_anon BOOLEAN DEFAULT FALSE,
    total_views INTEGER DEFAULT 0,
    reactions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Create user_protocols table
CREATE TABLE IF NOT EXISTS user_protocols (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    protocol_id UUID REFERENCES protocols(id),
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

-- Create community_required_protocols table
CREATE TABLE IF NOT EXISTS community_required_protocols (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID REFERENCES communities(id),
    protocol_id UUID REFERENCES protocols(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create community_members table
CREATE TABLE IF NOT EXISTS community_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID REFERENCES communities(id),
    user_id UUID REFERENCES users(id),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create post_replies table
CREATE TABLE IF NOT EXISTS post_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    post_id UUID REFERENCES posts(id),
    author_id UUID REFERENCES users(id),
    reply_parent_id UUID REFERENCES post_replies(id),
    is_anon BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
); 