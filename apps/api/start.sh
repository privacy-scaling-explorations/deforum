#!/bin/sh

# Wait for database to be ready
echo "Waiting for database to be ready..."
while ! nc -z db 5432; do
  sleep 0.1
done
echo "Connection to db ($DB_HOST) 5432 port [tcp/postgresql] succeeded!"

# Run Prisma migrations
echo "Running database migrations..."
npx prisma migrate deploy

echo "Running database seed..."
npx prisma db seed

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Start the application based on NODE_ENV
echo "Starting the application in $NODE_ENV mode..."
if [ "$NODE_ENV" = "production" ]; then
  yarn start
else
  yarn dev
fi 