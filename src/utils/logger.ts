// src/utils/logger.ts
import pino from 'pino';

// Define log levels
type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';

// Get environment from process.env directly to avoid circular dependency
const isDevelopment = (process.env.NODE_ENV || 'development') === 'development';
const logLevel = (process.env.LOG_LEVEL || 'info') as LogLevel;

// Configure logger
const loggerOptions = {
  level: logLevel,
  formatters: {
    level: (label: string) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
};

// Create development logger with pretty printing if in development
const developmentLogger = () => {
  return pino({
    ...loggerOptions,
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  });
};

// Production logger with JSON output
const productionLogger = () => {
  return pino(loggerOptions);
};

// Create the appropriate logger based on environment
const logger = isDevelopment ? developmentLogger() : productionLogger();

export default logger;

// Create a child logger for specific components
export const createLogger = (component: string) => {
  return logger.child({ component });
};