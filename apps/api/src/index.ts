import express from 'express';
import cors from 'cors';
import http from 'http';
import { Pool } from 'pg';
import todoRouter from './modules/todos/todos.routes';
import protocolsRouter from './modules/protocols/protocols.routes';
import { checkSupabaseConnection } from './lib/supabase';
import { request as httpRequest, IncomingMessage } from 'http';
import { URL } from 'url';

// Load environment variables
const PORT = process.env.API_PORT || 5000;
const HOST = process.env.API_HOST || 'localhost';
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://supabase-rest:3000';

// Configure PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test database connection
pool.connect()
  .then(() => console.log('Successfully connected to the database'))
  .catch(error => console.error('Failed to connect to the database:', error));

// Check Supabase connection
checkSupabaseConnection()
  .then(result => {
    if (result.ok) {
      console.log('Successfully connected to Supabase');
    } else {
      console.error('Failed to connect to Supabase:', result.error);
    }
  })
  .catch(error => console.error('Error checking Supabase connection:', error));

// Initialize Express
const app = express();
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies

// Routes
app.use('/api/todos', todoRouter);
app.use('/api/protocols', protocolsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API is running' });
});

// Create a Supabase proxy endpoint to help with Docker networking issues
app.all('/api/supabase-proxy/*', async (req, res) => {
  try {
    const path = req.params[0] || '';
    const queryString = Object.keys(req.query).length > 0 
      ? '?' + new URLSearchParams(req.query as any).toString() 
      : '';
    
    const targetUrl = `${SUPABASE_URL}/${path}${queryString}`;
    console.log(`Proxying request to: ${targetUrl}`);

    // Parse the URL
    const parsedUrl = new URL(targetUrl);
    
    // Set up the request options
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: req.method,
      headers: {
        ...req.headers as any,
        host: parsedUrl.host,
        'apikey': process.env.SUPABASE_ANON_KEY || '',
        'authorization': req.headers.authorization || `Bearer ${process.env.SUPABASE_ANON_KEY || ''}`,
      }
    };

    // Create the proxy request
    const proxyReq = httpRequest(options, (proxyRes: IncomingMessage) => {
      // Forward the status code
      res.status(proxyRes.statusCode || 500);
      
      // Forward headers
      Object.entries(proxyRes.headers).forEach(([key, value]) => {
        if (value) res.setHeader(key, value);
      });
      
      // Set CORS header
      res.setHeader('access-control-allow-origin', '*');
      
      // Forward the response body
      proxyRes.pipe(res);
    });

    // Handle errors
    proxyReq.on('error', (error) => {
      console.error('Error in Supabase proxy:', error.message);
      res.status(500).json({
        error: 'Proxy error',
        message: error.message
      });
    });

    // Forward the request body if needed
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      proxyReq.write(JSON.stringify(req.body));
    }
    
    proxyReq.end();
  } catch (error: any) {
    console.error('Error in Supabase proxy:', error.message);
    res.status(500).json({
      error: 'Proxy error',
      message: error.message
    });
  }
});

// Create HTTP server
const server = http.createServer(app);

// Start server
server.listen(PORT, HOST as any, () => {
  console.log(`API Server running on http://${HOST}:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});

export default app; 