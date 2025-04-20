# Stage 1: Install dependencies for the entire workspace
FROM node:18-alpine AS deps
WORKDIR /app
# Copy files required for installation (package manifests, lock file)
# Ensure workspace structure is understood by yarn
COPY package.json yarn.lock ./
COPY apps/api/package.json ./apps/api/
COPY apps/client/package.json ./apps/client/
# Install all workspace dependencies
RUN yarn install --frozen-lockfile --network-timeout 100000

# Stage 2: Setup the runtime environment
FROM node:18-alpine AS runner
WORKDIR /app

# Copy installed dependencies from the 'deps' stage
COPY --from=deps /app/node_modules ./node_modules
# Copy the entire application code
COPY . .

# Set the working directory to the client app
WORKDIR /app/apps/client

# Expose the Vite port
EXPOSE 3000

# Command to run the Vite development server
# We are skipping the problematic build-time route generation
CMD ["yarn", "dev"] 