import { PrismaClient } from '@prisma/client';
import { dbLogger } from './logger';

// Create Prisma client with query logging
export const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query'
    },
    {
      emit: 'event',
      level: 'error'
    },
    {
      emit: 'event',
      level: 'info'
    },
    {
      emit: 'event',
      level: 'warn'
    }
  ]
});

// Log database events
prisma.$on('query', (e) => {
  dbLogger.debug(`Query: ${e.query}`, {
    params: e.params,
    duration: e.duration
  });
});

prisma.$on('info', (e) => {
  dbLogger.info(e.message);
});

prisma.$on('warn', (e) => {
  dbLogger.warn(e.message);
});

prisma.$on('error', (e) => {
  dbLogger.error('Database error', new Error(e.message), {
    target: e.target
  });
});

// Log connection status on startup
prisma
  .$connect()
  .then(() => {
    dbLogger.info('Successfully connected to the database');
  })
  .catch((error) => {
    dbLogger.error('Failed to connect to the database', error);
  });
