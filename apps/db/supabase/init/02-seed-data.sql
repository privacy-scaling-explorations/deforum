-- Seed data for the forum database

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
    first_reply_id UUID;
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
    SELECT id INTO first_reply_id FROM post_replies WHERE content = 'Great post! I found this really helpful for getting started.';
    
    -- Create nested replies
    INSERT INTO post_replies (content, post_id, author_id, reply_parent_id, is_anon, created_at) VALUES
        ('Thanks for the feedback! I''ll add more examples soon.', first_post_id, alice_id, first_reply_id, FALSE, NOW());
END $$; 