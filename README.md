# deforum

## Tech Stack

### Frontend
- TypeScript
- React
- Next.js App Router
- TanStack Router (React Router)
- Tailwind CSS
- Radix UI for accessible components
- SWR for data fetching

### Backend
- Node.js
- Express
- Supabase (for database, authentication, and real-time features)

## Project Structure

The project is structured as a monorepo using Yarn workspaces and Turborepo:

```
/apps
  /client - Frontend React application
  /api - Backend Express API service
  /supabase-rest - Supabase REST API configuration
  /shared - Shared types and utilities
```

## Setup & Installation

### Prerequisites
- Node.js (v18+ recommended)
- Yarn package manager
- Docker and Docker Compose

### Getting Started

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/pse-forum.git
   cd pse-forum
   ```

2. Copy environment variables
   ```bash
   cp .env.example .env
   ```
   The .env file contains all necessary configuration for both the main application and Supabase services, including API, client, database, and authentication settings.

3. Install dependencies
   ```bash
   yarn install
   ```

4. Start the development environment using Docker
   ```bash
   docker compose up
   ```
   This command sets up all required services:
   - Supabase (PostgreSQL with extensions)
   - PostgREST API
   - Backend API service
   - Frontend client application

   > **Note:** Initial Docker build can take several minutes (2-3 minutes). For faster development, consider running only specific services or using local development.

   Alternatively, you can use the Yarn script which wraps Docker Compose:
   ```bash
   yarn dev
   ```

5. Your application should now be running at:
   - Frontend: http://localhost:3000
   - API: http://localhost:8000/api
   - Supabase REST API: http://localhost:3001

## Development

### Client-only Development

If you want to work only on the frontend without starting all services:

```bash
cd apps/client
yarn dev
```

### API-only Development

To work only on the backend API:

```bash
cd apps/api
yarn dev
```

### Building for Production

```bash
yarn build
```

## Useful Commands

- `docker compose up` - Start all services
- `docker compose down` - Stop all services
- `yarn generate` - Generate TanStack Router files
- `yarn clean` - Clean build artifacts
- `yarn build` - Build all applications

## License

[MIT](LICENSE) 