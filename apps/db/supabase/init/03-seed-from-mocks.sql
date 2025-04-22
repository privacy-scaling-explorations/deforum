-- Seed data using mock values from the frontend
-- This script populates the database with initial data based on the mocks

-- Clear existing data (if any exists) to avoid conflicts
TRUNCATE TABLE post_replies CASCADE;
TRUNCATE TABLE posts CASCADE;
TRUNCATE TABLE community_members CASCADE;
TRUNCATE TABLE community_required_protocols CASCADE;
TRUNCATE TABLE communities CASCADE;
TRUNCATE TABLE user_protocols CASCADE;
TRUNCATE TABLE protocols CASCADE;
TRUNCATE TABLE protocol_attributes CASCADE;
TRUNCATE TABLE users CASCADE;

-- Insert users from users.mocks.ts
INSERT INTO users (id, username, avatar, email, website, bio, is_anon, created_at, updated_at) VALUES
  ('123e4567-e89b-12d3-a456-426614174000', 'kali', 'https://pse.dev/logos/pse-logo-bg.svg', 'kali@example.com', 'https://example.com', 'lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.', FALSE, NOW(), NOW()),
  ('123e4567-e89b-12d3-a456-426614174001', 'Mario Rossi', 'https://pse.dev/logos/pse-logo-bg.svg', 'mario.rossi@example.com', 'https://example.com', 'lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.', FALSE, NOW(), NOW()),
  ('123e4567-e89b-12d3-a456-426614174002', 'Mario Bianchi', 'https://pse.dev/logos/pse-logo-bg.svg', 'john.doe@example.com', 'https://example.com', 'lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.', FALSE, NOW(), NOW()),
  ('123e4567-e89b-12d3-a456-426614174003', 'Mario Neri', 'https://pse.dev/logos/pse-logo-bg.svg', 'mario.neri@example.com', NULL, NULL, FALSE, NOW(), NOW()),
  ('123e4567-e89b-12d3-a456-426614174004', 'Mario Verdi', 'https://pse.dev/logos/pse-logo-bg.svg', 'mario.verdi@example.com', NULL, NULL, FALSE, NOW(), NOW());

-- Insert protocol attributes from protocol_attributes.mocks.ts
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

-- Insert protocols based on protocols.mocks.ts
INSERT INTO protocols (id, name, slug, description, is_active, protocol_attribute_id, created_at, updated_at) VALUES
  (uuid_generate_v4(), 'Google Sign-in', 'google', 'Sign in with a Google account', TRUE, (SELECT id FROM protocol_attributes WHERE slug = 'email'), NOW(), NOW()),
  (uuid_generate_v4(), 'Magic Link', 'magic-link', 'Sign in with a magic link sent to your email', FALSE, (SELECT id FROM protocol_attributes WHERE slug = 'email'), NOW(), NOW()),
  (uuid_generate_v4(), 'Steathnote', 'steathnote', 'Sign in with a Steathnote account', FALSE, (SELECT id FROM protocol_attributes WHERE slug = 'email'), NOW(), NOW()),
  (uuid_generate_v4(), 'zkemail', 'zkemail', 'Sign in with a zkemail account', FALSE, (SELECT id FROM protocol_attributes WHERE slug = 'email'), NOW(), NOW());


-- Create user protocols
INSERT INTO user_protocols (id, user_id, protocol_id, is_public, created_at, updated_at, verified_at) VALUES
  (uuid_generate_v4(), '123e4567-e89b-12d3-a456-426614174000', (SELECT id FROM protocols WHERE slug = 'google'), TRUE, NOW(), NOW(), NOW()),
  (uuid_generate_v4(), '123e4567-e89b-12d3-a456-426614174000', (SELECT id FROM protocols WHERE slug = 'magic-link'), TRUE, NOW(), NOW(), NOW()),
  (uuid_generate_v4(), '123e4567-e89b-12d3-a456-426614174001', (SELECT id FROM protocols WHERE slug = 'google'), TRUE, NOW(), NOW(), NOW()),
  (uuid_generate_v4(), '123e4567-e89b-12d3-a456-426614174002', (SELECT id FROM protocols WHERE slug = 'protocol-3'), TRUE, NOW(), NOW(), NOW());

-- Create communities based on community.mocks.ts
INSERT INTO communities (id, name, description, avatar, created_at, updated_at) VALUES
  (uuid_generate_v4(), 'Privacy + Scaling Explorations', 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.', 'https://pse.dev/logos/pse-logo-bg.svg', NOW(), NOW()),
  (uuid_generate_v4(), 'Test 2', 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.', 'https://pse.dev/logos/pse-logo-bg.svg', NOW(), NOW()),
  (uuid_generate_v4(), 'Test 3', 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.', 'https://pse.dev/logos/pse-logo-bg.svg', NOW(), NOW()),
  (uuid_generate_v4(), 'Test 4', 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.', 'https://pse.dev/logos/pse-logo-bg.svg', NOW(), NOW());

-- Create community required protocols
INSERT INTO community_required_protocols (id, community_id, protocol_id, created_at) VALUES
  (uuid_generate_v4(), (SELECT id FROM communities WHERE name = 'Privacy + Scaling Explorations'), (SELECT id FROM protocols WHERE slug = 'google'), NOW()),
  (uuid_generate_v4(), (SELECT id FROM communities WHERE name = 'Privacy + Scaling Explorations'), (SELECT id FROM protocols WHERE slug = 'magic-link'), NOW()),
  (uuid_generate_v4(), (SELECT id FROM communities WHERE name = 'Test 2'), (SELECT id FROM protocols WHERE slug = 'google'), NOW()),
  (uuid_generate_v4(), (SELECT id FROM communities WHERE name = 'Test 3'), (SELECT id FROM protocols WHERE slug = 'protocol-3'), NOW());

-- Create community members
INSERT INTO community_members (id, community_id, user_id, joined_at) VALUES
  (uuid_generate_v4(), (SELECT id FROM communities WHERE name = 'Privacy + Scaling Explorations'), '123e4567-e89b-12d3-a456-426614174000', NOW()),
  (uuid_generate_v4(), (SELECT id FROM communities WHERE name = 'Privacy + Scaling Explorations'), '123e4567-e89b-12d3-a456-426614174001', NOW()),
  (uuid_generate_v4(), (SELECT id FROM communities WHERE name = 'Privacy + Scaling Explorations'), '123e4567-e89b-12d3-a456-426614174002', NOW()),
  (uuid_generate_v4(), (SELECT id FROM communities WHERE name = 'Test 2'), '123e4567-e89b-12d3-a456-426614174000', NOW()),
  (uuid_generate_v4(), (SELECT id FROM communities WHERE name = 'Test 2'), '123e4567-e89b-12d3-a456-426614174001', NOW()),
  (uuid_generate_v4(), (SELECT id FROM communities WHERE name = 'Test 3'), '123e4567-e89b-12d3-a456-426614174002', NOW());

-- Create posts based on posts.mocks.ts
WITH new_posts AS (
  INSERT INTO posts (id, title, content, author_id, community_id, is_anon, total_views, reactions, created_at, updated_at) VALUES
    (uuid_generate_v4(), 'Lorem ipsum dolor sit amet', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.', '123e4567-e89b-12d3-a456-426614174000', (SELECT id FROM communities WHERE name = 'Privacy + Scaling Explorations'), FALSE, 1205, '{"like": 5, "love": 2}', '2024-03-10T10:00:00Z', '2024-03-10T10:00:00Z')
  RETURNING id, title
), post1 AS (
  SELECT id FROM new_posts WHERE title = 'Lorem ipsum dolor sit amet'
)
INSERT INTO posts (id, title, content, author_id, community_id, is_anon, total_views, reactions, created_at, updated_at) VALUES
  (uuid_generate_v4(), 'Neque porro quisquam', 'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam.', '123e4567-e89b-12d3-a456-426614174001', (SELECT id FROM communities WHERE name = 'Privacy + Scaling Explorations'), FALSE, 892, '{"like": 3, "wow": 1}', '2024-03-09T15:00:00Z', '2024-03-09T15:00:00Z'),
  (uuid_generate_v4(), 'Similique sunt in culpa', 'Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit.', '123e4567-e89b-12d3-a456-426614174002', (SELECT id FROM communities WHERE name = 'Test 2'), FALSE, 1567, '{"like": 10, "confused": 3}', '2024-03-08T09:15:00Z', '2024-03-08T09:15:00Z'),
  (uuid_generate_v4(), 'At vero eos et accusamus', 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi.', '123e4567-e89b-12d3-a456-426614174000', (SELECT id FROM communities WHERE name = 'Test 3'), TRUE, 445, '{}', '2024-03-07T14:20:00Z', '2024-03-07T14:20:00Z');

-- Create post replies
WITH
first_post AS (SELECT id FROM posts WHERE title = 'Lorem ipsum dolor sit amet'),
second_post AS (SELECT id FROM posts WHERE title = 'Neque porro quisquam'),
reply1 AS (
  INSERT INTO post_replies (id, content, post_id, author_id, is_anon, created_at, updated_at) VALUES
    (uuid_generate_v4(), 'Great post! I found this really helpful for getting started.', 
     (SELECT id FROM first_post), 
     '123e4567-e89b-12d3-a456-426614174001', 
     FALSE, 
     '2024-03-10T11:30:00Z', 
     '2024-03-10T11:30:00Z')
  RETURNING id, content
),
reply2 AS (
  INSERT INTO post_replies (id, content, post_id, author_id, is_anon, created_at, updated_at) VALUES
    (uuid_generate_v4(), 'Could you provide more information about gas optimization?', 
     (SELECT id FROM first_post), 
     '123e4567-e89b-12d3-a456-426614174002', 
     FALSE, 
     '2024-03-10T12:30:00Z', 
     '2024-03-10T12:30:00Z'),
    (uuid_generate_v4(), 'This is an interesting perspective. I never thought about it this way before.', 
     (SELECT id FROM second_post), 
     '123e4567-e89b-12d3-a456-426614174002', 
     FALSE, 
     '2024-03-09T16:00:00Z', 
     '2024-03-09T16:00:00Z')
  RETURNING id, content
)
-- Create nested replies
INSERT INTO post_replies (id, content, post_id, author_id, reply_parent_id, is_anon, created_at, updated_at) VALUES
  (uuid_generate_v4(), 'Thanks for the feedback! I''ll add more examples soon.', 
   (SELECT id FROM first_post), 
   '123e4567-e89b-12d3-a456-426614174000', 
   (SELECT id FROM reply1 WHERE content = 'Great post! I found this really helpful for getting started.'), 
   FALSE, 
   '2024-03-10T12:00:00Z', 
   '2024-03-10T12:00:00Z');

-- Create additional random data to ensure at least 3 items per table
DO $$
DECLARE
  random_user_id UUID;
  random_protocol_attr_id UUID;
  random_protocol_id UUID;
  random_community_id UUID;
  random_post_id UUID;
BEGIN
  -- Additional users if needed
  IF (SELECT COUNT(*) FROM users) < 8 THEN
    INSERT INTO users (id, username, avatar, email, is_anon, created_at, updated_at)
    SELECT 
      uuid_generate_v4(),
      'Random User ' || i,
      'https://pse.dev/logos/pse-logo-bg.svg',
      'random' || i || '@example.com',
      (i % 2 = 0),
      NOW() - (i || ' days')::interval,
      NOW() - (i || ' days')::interval
    FROM generate_series(1, 5) i;
  END IF;

  -- Select a random user
  SELECT id INTO random_user_id FROM users ORDER BY RANDOM() LIMIT 1;

  -- Additional protocol attributes if needed
  IF (SELECT COUNT(*) FROM protocol_attributes) < 10 THEN
    INSERT INTO protocol_attributes (id, name, slug, description, type, is_active)
    SELECT 
      uuid_generate_v4(),
      'Random Attribute ' || i,
      'random-attr-' || i,
      'Random attribute description ' || i,
      CASE i % 3 
        WHEN 0 THEN 'type1'
        WHEN 1 THEN 'type2'
        ELSE 'type3'
      END,
      (i % 3 <> 0)
    FROM generate_series(1, 5) i;
  END IF;

  -- Select a random protocol attribute
  SELECT id INTO random_protocol_attr_id FROM protocol_attributes ORDER BY RANDOM() LIMIT 1;

  -- Additional protocols if needed
  IF (SELECT COUNT(*) FROM protocols) < 8 THEN
    INSERT INTO protocols (id, name, slug, description, is_active, protocol_attribute_id, created_at, updated_at)
    SELECT 
      uuid_generate_v4(),
      'Random Protocol ' || i,
      'random-protocol-' || i,
      'Random protocol description ' || i,
      (i % 2 = 0),
      random_protocol_attr_id,
      NOW() - (i || ' days')::interval,
      NOW() - (i || ' days')::interval
    FROM generate_series(1, 5) i;
  END IF;

  -- Select a random protocol
  SELECT id INTO random_protocol_id FROM protocols ORDER BY RANDOM() LIMIT 1;

  -- Additional user_protocols if needed
  IF (SELECT COUNT(*) FROM user_protocols) < 10 THEN
    INSERT INTO user_protocols (id, user_id, protocol_id, is_public, created_at, updated_at, verified_at)
    SELECT 
      uuid_generate_v4(),
      u.id,
      p.id,
      (ROW_NUMBER() OVER () % 2 = 0),
      NOW() - (ROW_NUMBER() OVER () || ' days')::interval,
      NOW() - (ROW_NUMBER() OVER () || ' days')::interval,
      CASE WHEN ROW_NUMBER() OVER () % 2 = 0 THEN NOW() ELSE NULL END
    FROM 
      (SELECT id FROM users ORDER BY RANDOM() LIMIT 3) u
      CROSS JOIN
      (SELECT id FROM protocols ORDER BY RANDOM() LIMIT 3) p;
  END IF;

  -- Additional communities if needed
  IF (SELECT COUNT(*) FROM communities) < 8 THEN
    INSERT INTO communities (id, name, description, avatar, created_at, updated_at)
    SELECT 
      uuid_generate_v4(),
      'Random Community ' || i,
      'Random community description ' || i,
      'https://pse.dev/logos/pse-logo-bg.svg',
      NOW() - (i || ' days')::interval,
      NOW() - (i || ' days')::interval
    FROM generate_series(1, 5) i;
  END IF;

  -- Select a random community
  SELECT id INTO random_community_id FROM communities ORDER BY RANDOM() LIMIT 1;

  -- Additional community_required_protocols if needed
  IF (SELECT COUNT(*) FROM community_required_protocols) < 10 THEN
    INSERT INTO community_required_protocols (id, community_id, protocol_id, created_at)
    SELECT 
      uuid_generate_v4(),
      c.id,
      p.id,
      NOW() - (ROW_NUMBER() OVER () || ' days')::interval
    FROM 
      (SELECT id FROM communities ORDER BY RANDOM() LIMIT 3) c
      CROSS JOIN
      (SELECT id FROM protocols ORDER BY RANDOM() LIMIT 3) p;
  END IF;

  -- Additional community_members if needed
  IF (SELECT COUNT(*) FROM community_members) < 10 THEN
    INSERT INTO community_members (id, community_id, user_id, joined_at)
    SELECT 
      uuid_generate_v4(),
      c.id,
      u.id,
      NOW() - (ROW_NUMBER() OVER () || ' days')::interval
    FROM 
      (SELECT id FROM communities ORDER BY RANDOM() LIMIT 3) c
      CROSS JOIN
      (SELECT id FROM users ORDER BY RANDOM() LIMIT 3) u;
  END IF;

  -- Additional posts if needed
  IF (SELECT COUNT(*) FROM posts) < 8 THEN
    INSERT INTO posts (id, title, content, author_id, community_id, is_anon, total_views, reactions, created_at, updated_at)
    SELECT 
      uuid_generate_v4(),
      'Random Post Title ' || i,
      'Random post content ' || i || '. This is a longer content with more details about the post.',
      (SELECT id FROM users ORDER BY RANDOM() LIMIT 1),
      (SELECT id FROM communities ORDER BY RANDOM() LIMIT 1),
      (i % 3 = 0),
      (i * 100),
      CASE i % 3
        WHEN 0 THEN ('{"like": ' || (i*2) || ', "love": ' || i || '}')::jsonb
        WHEN 1 THEN ('{"wow": ' || i || '}')::jsonb
        ELSE '{}'::jsonb
      END,
      NOW() - (i || ' days')::interval,
      NOW() - (i || ' days')::interval
    FROM generate_series(1, 5) i;
  END IF;

  -- Select a random post
  SELECT id INTO random_post_id FROM posts ORDER BY RANDOM() LIMIT 1;

  -- Additional post_replies if needed
  IF (SELECT COUNT(*) FROM post_replies) < 15 THEN
    INSERT INTO post_replies (id, content, post_id, author_id, is_anon, created_at, updated_at)
    SELECT 
      uuid_generate_v4(),
      'Random reply content ' || i,
      (SELECT id FROM posts ORDER BY RANDOM() LIMIT 1),
      (SELECT id FROM users ORDER BY RANDOM() LIMIT 1),
      (i % 4 = 0),
      NOW() - (i || ' hours')::interval,
      NOW() - (i || ' hours')::interval
    FROM generate_series(1, 10) i;
  END IF;

  -- Additional nested replies if needed
  IF (SELECT COUNT(*) FROM post_replies WHERE reply_parent_id IS NOT NULL) < 5 THEN
    INSERT INTO post_replies (id, content, post_id, author_id, reply_parent_id, is_anon, created_at, updated_at)
    SELECT 
      uuid_generate_v4(),
      'Random nested reply ' || i,
      r.post_id,
      (SELECT id FROM users ORDER BY RANDOM() LIMIT 1),
      r.id,
      (i % 3 = 0),
      NOW() - (i || ' hours')::interval,
      NOW() - (i || ' hours')::interval
    FROM 
      (SELECT id, post_id FROM post_replies WHERE reply_parent_id IS NULL ORDER BY RANDOM() LIMIT 3) r,
      generate_series(1, 2) i;
  END IF;
END $$; 