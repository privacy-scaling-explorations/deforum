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

-- Create policies for each table (basic read access for now)
CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Protocol attributes are viewable by everyone" ON protocol_attributes FOR SELECT USING (true);
CREATE POLICY "Protocols are viewable by everyone" ON protocols FOR SELECT USING (true);
CREATE POLICY "User protocols are viewable by everyone" ON user_protocols FOR SELECT USING (true);
CREATE POLICY "Communities are viewable by everyone" ON communities FOR SELECT USING (true);
CREATE POLICY "Community required protocols are viewable by everyone" ON community_required_protocols FOR SELECT USING (true);
CREATE POLICY "Community members are viewable by everyone" ON community_members FOR SELECT USING (true);
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
CREATE POLICY "Post replies are viewable by everyone" ON post_replies FOR SELECT USING (true);

-- Grant appropriate permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated; -- Seed data for the forum database

-- Insert protocol attributes based on protocol_attributes.mocks.ts
INSERT INTO protocol_attributes (id, name, slug, description, type, is_active) VALUES
    (uuid_generate_v4(), 'Age (18+)', 'age-18', 'Age verification protocol', 'age', TRUE),
    (uuid_generate_v4(), 'Email', 'email', 'Email verification protocol', 'email', TRUE),
    (uuid_generate_v4(), 'Events', 'events', 'Event attendance verification', 'events', TRUE),
    (uuid_generate_v4(), 'Gender', 'gender', 'Gender verification', 'gender', TRUE),
    (uuid_generate_v4(), 'Residency', 'residency', 'Residency verification', 'residency', TRUE),
    (uuid_generate_v4(), 'Income', 'income', 'Income verification', 'income', TRUE),
    (uuid_generate_v4(), 'Ethereum Staker', 'ethereum-staker', 'Ethereum staking verification', 'ethereum_staker', TRUE),
    (uuid_generate_v4(), 'Attestation', 'attestation', 'Attestation verification', 'attestation', TRUE),
    (uuid_generate_v4(), 'Followers', 'followers', 'Followers verification', 'followers', TRUE);

-- Get protocol attribute IDs
DO $$
DECLARE
    email_attr_id UUID;
BEGIN
    -- Get email protocol attribute ID to link with protocols
    SELECT id INTO email_attr_id FROM protocol_attributes WHERE type = 'email';

    -- Insert protocols from protocols.mocks.ts
    INSERT INTO protocols (id, name, slug, description, is_active, protocol_attribute_id, created_at) VALUES
        (uuid_generate_v4(), 'Google Sign-in', 'google', 'Sign in with a Google account', TRUE, email_attr_id, NOW()),
        (uuid_generate_v4(), 'Magic Link', 'magic-link', 'Sign in with a magic link sent to your email', FALSE, email_attr_id, NOW()),
        (uuid_generate_v4(), 'Steathnote', 'steathnote', 'Sign in with a Steathnote account', FALSE, email_attr_id, NOW()),
        (uuid_generate_v4(), 'zkemail', 'zkemail', 'Sign in with a zkemail account', FALSE, email_attr_id, NOW());
END $$;

-- Insert sample users
INSERT INTO users (id, username, avatar, email, bio, is_anon, created_at) VALUES
    (uuid_generate_v4(), 'alice', 'https://i.pravatar.cc/150?u=alice', 'alice@example.com', 'Blockchain developer and enthusiast', FALSE, NOW()),
    (uuid_generate_v4(), 'bob', 'https://i.pravatar.cc/150?u=bob', 'bob@example.com', 'Smart contract auditor', FALSE, NOW()),
    (uuid_generate_v4(), 'charlie', 'https://i.pravatar.cc/150?u=charlie', 'charlie@example.com', 'Community manager and protocol researcher', FALSE, NOW()),
    (uuid_generate_v4(), 'diana', 'https://i.pravatar.cc/150?u=diana', 'diana@example.com', 'Governance specialist', FALSE, NOW());

-- Create variables for linking relations
DO $$
DECLARE
    alice_id UUID;
    bob_id UUID;
    charlie_id UUID;
    diana_id UUID;
    google_protocol_id UUID;
    magic_link_protocol_id UUID;
    steathnote_protocol_id UUID;
    zkemail_protocol_id UUID;
    eth_community_id UUID;
    dev_community_id UUID;
    governance_community_id UUID;
    first_post_id UUID;
BEGIN
    -- Get user IDs
    SELECT id INTO alice_id FROM users WHERE username = 'alice';
    SELECT id INTO bob_id FROM users WHERE username = 'bob';
    SELECT id INTO charlie_id FROM users WHERE username = 'charlie';
    SELECT id INTO diana_id FROM users WHERE username = 'diana';
    
    -- Get protocol IDs
    SELECT id INTO google_protocol_id FROM protocols WHERE slug = 'google';
    SELECT id INTO magic_link_protocol_id FROM protocols WHERE slug = 'magic-link';
    SELECT id INTO steathnote_protocol_id FROM protocols WHERE slug = 'steathnote';
    SELECT id INTO zkemail_protocol_id FROM protocols WHERE slug = 'zkemail';
    
    -- Create user protocols
    INSERT INTO user_protocols (user_id, protocol_id, is_public, verified_at) VALUES
        (alice_id, google_protocol_id, TRUE, NOW()),
        (alice_id, magic_link_protocol_id, TRUE, NOW()),
        (bob_id, google_protocol_id, TRUE, NOW()),
        (charlie_id, steathnote_protocol_id, TRUE, NOW()),
        (diana_id, zkemail_protocol_id, TRUE, NOW());
    
    -- Create communities
    INSERT INTO communities (id, name, description, avatar, created_at) VALUES
        (uuid_generate_v4(), 'Ethereum Developers', 'A community for Ethereum developers', 'https://i.pravatar.cc/150?u=eth', NOW()),
        (uuid_generate_v4(), 'Developer Hub', 'General development discussions', 'https://i.pravatar.cc/150?u=dev', NOW()),
        (uuid_generate_v4(), 'Governance Lab', 'Discussing and building governance systems', 'https://i.pravatar.cc/150?u=gov', NOW());
    
    -- Get community IDs
    SELECT id INTO eth_community_id FROM communities WHERE name = 'Ethereum Developers';
    SELECT id INTO dev_community_id FROM communities WHERE name = 'Developer Hub';
    SELECT id INTO governance_community_id FROM communities WHERE name = 'Governance Lab';
    
    -- Create community required protocols
    INSERT INTO community_required_protocols (community_id, protocol_id) VALUES
        (eth_community_id, google_protocol_id),
        (eth_community_id, magic_link_protocol_id),
        (dev_community_id, google_protocol_id),
        (governance_community_id, zkemail_protocol_id);
    
    -- Create community members
    INSERT INTO community_members (community_id, user_id) VALUES
        (eth_community_id, alice_id),
        (eth_community_id, bob_id),
        (dev_community_id, alice_id),
        (dev_community_id, charlie_id),
        (governance_community_id, diana_id),
        (governance_community_id, charlie_id);
    
    -- Create posts
    INSERT INTO posts (id, title, content, author_id, community_id, is_anon, created_at) VALUES
        (uuid_generate_v4(), 'Introduction to Ethereum Development', 'This post covers the basics of Ethereum development including setting up your environment and writing your first smart contract.', alice_id, eth_community_id, FALSE, NOW()),
        (uuid_generate_v4(), 'Smart Contract Security Best Practices', 'A comprehensive guide to securing your smart contracts and avoiding common vulnerabilities.', bob_id, eth_community_id, FALSE, NOW()),
        (uuid_generate_v4(), 'Community Guidelines Discussion', 'Let''s discuss how we can improve our community guidelines to make this a better place for everyone.', charlie_id, dev_community_id, FALSE, NOW()),
        (uuid_generate_v4(), 'Governance Models Comparison', 'A comparison of different governance models used in web3 projects and their pros and cons.', diana_id, governance_community_id, FALSE, NOW());
    
    -- Get first post ID for replies
    SELECT id INTO first_post_id FROM posts WHERE title = 'Introduction to Ethereum Development';
    
    -- Create post replies
    INSERT INTO post_replies (id, content, post_id, author_id, is_anon, created_at) VALUES
        (uuid_generate_v4(), 'Great post! I found this really helpful for getting started.', first_post_id, bob_id, FALSE, NOW()),
        (uuid_generate_v4(), 'Could you provide more information about gas optimization?', first_post_id, charlie_id, FALSE, NOW());
    
    -- Get the first reply ID for nested replies
    DECLARE first_reply_id UUID;
    SELECT id INTO first_reply_id FROM post_replies WHERE content = 'Great post! I found this really helpful for getting started.';
    
    -- Create nested replies
    INSERT INTO post_replies (content, post_id, author_id, reply_parent_id, is_anon, created_at) VALUES
        ('Thanks for the feedback! I''ll add more examples soon.', first_post_id, alice_id, first_reply_id, FALSE, NOW());
END $$; 