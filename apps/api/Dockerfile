FROM node:18-alpine

WORKDIR /app

# Install netcat and curl for health checks
RUN apk add --no-cache netcat-openbsd curl

# Copy root config files
COPY package.json yarn.lock tsconfig.json ./

# Copy package files with their configs
COPY apps/shared/package.json apps/shared/tsconfig.json ./apps/shared/
COPY apps/api/package.json apps/api/tsconfig.json ./apps/api/

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy and build shared package first
COPY apps/shared/src ./apps/shared/src
RUN cd apps/shared && yarn build

# Copy API source and generate Prisma client
COPY apps/api/src ./apps/api/src
COPY apps/api/prisma ./apps/api/prisma
RUN cd apps/api && npx prisma generate

# Copy remaining files
COPY . .

# Build API
RUN cd apps/api && yarn build

EXPOSE 5000

WORKDIR /app/apps/api

CMD ["/app/apps/api/start.sh"] 