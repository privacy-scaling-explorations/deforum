FROM node:18-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --network-timeout 100000

# Build and run the application
FROM base AS runner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
WORKDIR /app/apps/client

# Install dependencies locally in the client directory
RUN yarn install --frozen-lockfile --network-timeout 100000

# Generate router types using the full path to the binary
RUN ./node_modules/.bin/router-generator

EXPOSE 3000
CMD ["yarn", "dev"] 