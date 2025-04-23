-- Create the database schema based on ER diagram
-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS post_replies CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS community_members CASCADE;
DROP TABLE IF EXISTS community_required_protocols CASCADE;
DROP TABLE IF EXISTS communities CASCADE;
DROP TABLE IF EXISTS user_protocols CASCADE;
DROP TABLE IF EXISTS protocols CASCADE;
DROP TABLE IF EXISTS protocol_attributes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
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

-- Create communities table
CREATE TABLE IF NOT EXISTS communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    avatar TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
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

-- Create posts table
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

-- Create indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_protocols_slug ON protocols(slug);
CREATE INDEX idx_protocols_attribute_id ON protocols(protocol_attribute_id);
CREATE INDEX idx_user_protocols_user_id ON user_protocols(user_id);
CREATE INDEX idx_user_protocols_protocol_id ON user_protocols(protocol_id);
CREATE INDEX idx_community_required_protocols_community_id ON community_required_protocols(community_id);
CREATE INDEX idx_community_required_protocols_protocol_id ON community_required_protocols(protocol_id);
CREATE INDEX idx_community_members_community_id ON community_members(community_id);
CREATE INDEX idx_community_members_user_id ON community_members(user_id);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_community_id ON posts(community_id);
CREATE INDEX idx_post_replies_post_id ON post_replies(post_id);
CREATE INDEX idx_post_replies_author_id ON post_replies(author_id);
CREATE INDEX idx_post_replies_parent_id ON post_replies(reply_parent_id);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_required_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_replies ENABLE ROW LEVEL SECURITY;

-- Create policies for each table with proper security
-- Users table policies
CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid() = id);

-- Protocol attributes policies
CREATE POLICY "Protocol attributes are viewable by everyone" ON protocol_attributes FOR SELECT USING (true);

-- Protocols policies
CREATE POLICY "Protocols are viewable by everyone" ON protocols FOR SELECT USING (true);

-- User protocols policies
CREATE POLICY "User protocols are viewable by everyone" ON user_protocols FOR SELECT USING (true);
CREATE POLICY "Users can manage their own protocols" ON user_protocols 
    USING (auth.uid() = user_id);

-- Communities policies
CREATE POLICY "Communities are viewable by everyone" ON communities FOR SELECT USING (true);
CREATE POLICY "Community members can update community" ON communities 
    USING (EXISTS (
        SELECT 1 FROM community_members 
        WHERE community_id = id AND user_id = auth.uid()
    ));

-- Community required protocols policies
CREATE POLICY "Community required protocols are viewable by everyone" 
    ON community_required_protocols FOR SELECT USING (true);

-- Community members policies
CREATE POLICY "Community members are viewable by everyone" 
    ON community_members FOR SELECT USING (true);
CREATE POLICY "Users can manage their own community membership" 
    ON community_members USING (user_id = auth.uid());

-- Posts policies
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can manage their own posts" ON posts 
    USING (author_id = auth.uid());

-- Post replies policies
CREATE POLICY "Post replies are viewable by everyone" ON post_replies FOR SELECT USING (true);
CREATE POLICY "Users can manage their own replies" ON post_replies 
    USING (author_id = auth.uid());

-- Grant appropriate permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated; 