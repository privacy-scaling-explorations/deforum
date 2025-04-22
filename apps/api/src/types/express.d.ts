declare namespace Express {
  export interface Request {}
  export interface Response {}
}

declare module 'express' {
  import { Server } from 'http';
  
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
    }
    
    export interface Request {}
    export interface Response {
      status: (code: number) => Response;
      json: (body: any) => Response;
      send: (body: any) => Response;
      header: (name: string, value: string) => Response;
    }
    
    export function Router(): Router;
    export function json(): any;
    export function urlencoded(options: { extended: boolean }): any;
  }
} 