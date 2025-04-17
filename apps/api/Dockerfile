FROM node:18 AS builder
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install
# Install type definitions and dotenv in workspace root
RUN yarn add -W @types/express @types/node @types/pg dotenv @types/dotenv
COPY . .
WORKDIR /app/apps/api
RUN yarn build

FROM node:18 AS runner
WORKDIR /app
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/apps/api/dist ./dist
RUN yarn install --production

ENV NODE_ENV production
EXPOSE 5000
CMD ["yarn", "start"] 