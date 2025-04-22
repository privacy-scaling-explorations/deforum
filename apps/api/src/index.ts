import dotenv from 'dotenv';
import { Pool } from 'pg';
import app from './app';

dotenv.config();

const PORT = parseInt(process.env.API_PORT || '5000', 10);
const HOST = process.env.API_HOST || '0.0.0.0';

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } // Basic SSL for production
    : false
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Successfully connected to the database');
  release();
});

// Make pool available to routes
app.locals.pool = pool;

app.listen(PORT, HOST, () => {
  console.log(`API Server running on http://${HOST}:${PORT}`);
}); 