import winston from 'winston';
import { format, transports } from 'winston';

// Define custom log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  trace: 5
};

// Define log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'trace' : 'http';
};

// Custom format for development logs
const developmentFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.colorize({ all: true }),
  format.printf(
    (info: winston.Logform.TransformableInfo & { error?: Error; params?: any }) =>
      `${info.timestamp} ${info.level}: ${info.message}${info.params ? ' ' + JSON.stringify(info.params) : ''}${
        info.error ? '\n' + info.error.stack : ''
      }`
  )
);

// Custom format for production logs
const productionFormat = format.combine(format.timestamp(), format.json());

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  transports: [
    new transports.Console(),
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      dirname: process.cwd(),
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    new transports.File({
      filename: 'logs/combined.log',
      dirname: process.cwd(),
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ]
});

// Create a stream object for Morgan HTTP logging
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  }
};

// Log database queries in development mode
export const logQuery = (query: string, params: any[], duration: number) => {
  if (process.env.NODE_ENV !== 'production') {
    logger.debug(`Query (${duration}ms): ${query}`, { params });
  }
};

// Create specialized loggers for different parts of the application
export const dbLogger = {
  info: (message: string, meta?: any) => logger.info(`[DB] ${message}`, { ...meta }),
  warn: (message: string, meta?: any) => logger.warn(`[DB] ${message}`, { ...meta }),
  error: (message: string, error?: Error, meta?: any) =>
    logger.error(`[DB] ${message}`, { error, ...meta }),
  debug: (message: string, meta?: any) => logger.debug(`[DB] ${message}`, { ...meta })
};

export const trpcLogger = {
  info: (message: string, meta?: any) => logger.info(`[tRPC] ${message}`, { ...meta }),
  warn: (message: string, meta?: any) => logger.warn(`[tRPC] ${message}`, { ...meta }),
  error: (message: string, error?: Error, meta?: any) =>
    logger.error(`[tRPC] ${message}`, { error, ...meta }),
  debug: (message: string, meta?: any) => logger.debug(`[tRPC] ${message}`, { ...meta }),
  trace: (message: string, meta?: any) => logger.log('trace', `[tRPC] ${message}`, { ...meta })
};

export const authLogger = {
  info: (message: string, meta?: any) => logger.info(`[Auth] ${message}`, { ...meta }),
  warn: (message: string, meta?: any) => logger.warn(`[Auth] ${message}`, { ...meta }),
  error: (message: string, error?: Error, meta?: any) =>
    logger.error(`[Auth] ${message}`, { error, ...meta }),
  debug: (message: string, meta?: any) => logger.debug(`[Auth] ${message}`, { ...meta })
};

export default logger;
