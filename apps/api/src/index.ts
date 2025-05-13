import express from 'express';
import cors from 'cors';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from './lib/router';
import { createContext } from './lib/context';
import path from 'path';
import morgan from 'morgan';
import logger, { stream } from './lib/logger';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const app = express();

// Environment logging
logger.info(`Server starting in ${process.env.NODE_ENV || 'development'} mode`);
logger.debug('Environment variables:', {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL ? '[REDACTED]' : 'Not set'
});

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  })
);

// HTTP request logging
app.use(morgan('combined', { stream }));

// Serve static files from uploads directory
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  logger.info(`Created uploads directory at ${uploadsDir}`);
}
app.use('/uploads', express.static(uploadsDir));

// tRPC
app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext
  })
);

// Health check
app.get('/health', (_, res) => {
  logger.debug('Health check endpoint called');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Express error handler caught an error', err);
  res.status(err.status || 500).json({
    message: err.message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
});

const port = parseInt(process.env.PORT || '3002', 10);
app.listen(port, '0.0.0.0', () => {
  logger.info(`Server running at http://0.0.0.0:${port}`);
  logger.info(`Health check available at http://0.0.0.0:${port}/health`);
  logger.info(`tRPC API available at http://0.0.0.0:${port}/trpc`);
});

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', reason instanceof Error ? reason : new Error(String(reason)));
  // Don't exit for unhandled rejections to allow for recovery
});

export { appRouter };
