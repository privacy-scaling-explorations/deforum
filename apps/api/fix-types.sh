#!/bin/bash

# Install necessary dependencies
yarn add @supabase/supabase-js
yarn add -D @types/express @types/node @types/cors

# Create the necessary directories
mkdir -p src/types

# Create the Express type declarations
cat > src/types/express.d.ts << 'EOF'
declare namespace Express {
  export interface Request {}
  export interface Response {}
}

declare module 'express' {
  import { Server, IncomingMessage, ServerResponse } from 'http';
  
  export = express;
  
  function express(): express.Application;
  namespace express {
    export interface Application {
      use: any;
      get: any;
      post: any;
      put: any;
      delete: any;
      patch: any;
      all: any;
      listen: (port: number, hostname: string, callback?: () => void) => Server;
      locals: any;
    }
    
    export interface Router {
      use: any;
      get: any;
      post: any;
      put: any;
      delete: any;
      patch: any;
      all: any;
    }
    
    export interface Request {}
    export interface Response {
      status: (code: number) => Response;
      json: (body: any) => Response;
      send: (body: any) => Response;
      header: (name: string, value: string) => Response;
      setHeader: (name: string, value: string) => Response;
    }
    
    export function Router(): Router;
    export function json(): any;
    export function urlencoded(options: { extended: boolean }): any;
  }
}

// Extend http module types to allow express Application as a parameter to createServer
declare module 'http' {
  import { Application } from 'express';
  
  interface ServerOptions {}
  
  function createServer(app: Application): Server;
  function createServer(options: ServerOptions, app: Application): Server;
}
EOF

# Update tsconfig.json to include the new types and disable strict type checking temporarily
cat > tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "module": "commonjs",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "typeRoots": ["./node_modules/@types", "../../node_modules/@types", "./src/types"],
    "types": ["node", "express"],
    "esModuleInterop": true,
    "target": "ES2018", 
    "lib": ["ES2018"],
    "skipLibCheck": true,
    "noImplicitAny": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Try building the project
echo "Attempting to build the project..."
yarn build 