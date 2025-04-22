FROM node:18 AS builder
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install
# Install type definitions and dependencies
RUN yarn add -W @types/express @types/node @types/pg @types/cors dotenv @types/dotenv
RUN yarn add -W @supabase/supabase-js cors

COPY . .
WORKDIR /app/apps/api

# Copy our fix-types script and run it
COPY apps/api/fix-types.sh ./fix-types.sh
RUN chmod +x fix-types.sh && ./fix-types.sh

FROM node:18 AS runner
WORKDIR /app
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/apps/api/dist ./dist
RUN yarn install --production

ENV NODE_ENV production
EXPOSE 5000
CMD ["yarn", "start"] 