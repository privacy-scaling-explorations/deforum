FROM node:18-alpine AS deps
WORKDIR /app

COPY package.json yarn.lock ./
COPY apps/client/package.json ./apps/client/

RUN yarn install --frozen-lockfile --network-timeout 100000

FROM node:18-alpine AS runner
WORKDIR /app

# Copy installed dependencies from the 'deps' stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/client/node_modules ./apps/client/node_modules

# Copy the entire application code
COPY . .

EXPOSE 3000
CMD ["yarn", "workspace", "client", "dev", "--host"] 