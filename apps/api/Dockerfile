FROM node:23-alpine

WORKDIR /app

# Install netcat, curl, and postgresql-client for health checks and database operations
RUN apk add --no-cache netcat-openbsd curl postgresql-client

# Set production mode
ENV NODE_ENV=production

# Set default environment variables
ENV DB_HOST=db \
    DB_PORT=5432 \
    DB_NAME=deforum \
    DB_USER=postgres \
    DB_PASSWORD=postgres \
    DATABASE_URL=postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME} 

# Copy root config files
COPY package.json yarn.lock tsconfig.json ./

# Copy package files with their configs
COPY apps/shared/package.json apps/shared/tsconfig.json ./apps/shared/
COPY apps/api/package.json apps/api/tsconfig.json ./apps/api/

# Install dependencies (including devDependencies for build)
RUN yarn install --frozen-lockfile --production=false

# Install tsx globally
RUN yarn global add tsx

# Copy and build shared package first
COPY apps/shared/src ./apps/shared/src
RUN cd apps/shared && yarn build

# Copy API source and generate Prisma client
COPY apps/api/src ./apps/api/src
COPY apps/api/prisma ./apps/api/prisma
RUN cd apps/api && \
    npx prisma generate && \
    # Create prisma client output directory
    mkdir -p node_modules/.prisma/client

# Copy remaining files
COPY . .

# Build API
RUN cd apps/api && yarn build

# Remove dev dependencies after build
RUN yarn install --frozen-lockfile --production=true

EXPOSE 5000

WORKDIR /app/apps/api

CMD ["/app/apps/api/start.sh"] 