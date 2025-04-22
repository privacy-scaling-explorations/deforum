#!/bin/bash

# Script to import mock data into the Supabase database
echo "Importing mock data into Supabase database..."

# Get the container ID
CONTAINER_ID=$(docker ps -qf "name=supabase-db")

if [ -z "$CONTAINER_ID" ]; then
  echo "Supabase database container not found. Make sure it's running."
  exit 1
fi

# Copy the seed script into the container
docker cp apps/db/supabase/init/03-seed-from-mocks.sql $CONTAINER_ID:/tmp/

# Execute the truncate statements
docker exec $CONTAINER_ID psql -U postgres -d supabase -c "
TRUNCATE TABLE post_replies CASCADE;
TRUNCATE TABLE posts CASCADE;
TRUNCATE TABLE community_members CASCADE;
TRUNCATE TABLE community_required_protocols CASCADE;
TRUNCATE TABLE communities CASCADE;
TRUNCATE TABLE user_protocols CASCADE;
TRUNCATE TABLE protocols CASCADE;
TRUNCATE TABLE protocol_attributes CASCADE;
TRUNCATE TABLE users CASCADE;
"

# Run the seed script file
docker exec $CONTAINER_ID psql -U postgres -d supabase -f /tmp/03-seed-from-mocks.sql

echo "Mock data import completed!" 