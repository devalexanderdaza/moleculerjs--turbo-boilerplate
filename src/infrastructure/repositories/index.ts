import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

interface MoleculerConfig {
  namespace: string;
  transporter: string | null;
  logLevel: string;
  metrics: boolean;
  tracing: boolean;
}

interface ApiConfig {
  port: number;
  corsOrigins: string[];
}

interface Config {
  env: string;
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  service: {
    name: string;
    version: string;
  };
  database: DatabaseConfig;
  moleculer: MoleculerConfig;
  api: ApiConfig;
  redis: {
    host: string;
    port: number;
    password: string | null;
  };
}

// Get environment variables with fallbacks
const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
};

// Parse numeric environment variables
const getNumericEnv = (key: string, defaultValue?: number): number => {
  const value = process.env[key];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value ? parseInt(value, 10) : defaultValue as number;
};

// Parse boolean environment variables
const getBooleanEnv = (key: string, defaultValue = false): boolean => {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  return ['true', '1', 'yes'].includes(value.toLowerCase());
};

// Environment
const env = getEnv('NODE_ENV', 'development');
const isDevelopment = env === 'development';
const isProduction = env === 'production';
const isTest = env === 'test';

// Export configuration
export const config: Config = {
  env,
  isDevelopment,
  isProduction,
  isTest,
  service: {
    name: getEnv('SERVICE_NAME', 'sample-service'),
    version: getEnv('SERVICE_VERSION', '1.0.0'),
  },
  database: {
    host: getEnv('DB_HOST', 'localhost'),
    port: getNumericEnv('DB_PORT', 5432),
    database: getEnv('DB_NAME', 'microservice'),
    username: getEnv('DB_USER', 'postgres'),
    password: getEnv('DB_PASSWORD', 'postgres'),
  },
  moleculer: {
    namespace: getEnv('MOLECULER_NAMESPACE', 'microservices'),
    transporter: process.env.MOLECULER_TRANSPORTER || null,
    logLevel: getEnv('MOLECULER_LOG_LEVEL', 'info'),
    metrics: getBooleanEnv('MOLECULER_METRICS', false),
    tracing: getBooleanEnv('MOLECULER_TRACING', false),
  },
  api: {
    port: getNumericEnv('API_PORT', 3000),
    corsOrigins: getEnv('CORS_ORIGINS', '*').split(','),
  },
  redis: {
    host: getEnv('REDIS_HOST', 'localhost'),
    port: getNumericEnv('REDIS_PORT', 6379),
    password: process.env.REDIS_PASSWORD || null,
  },
};

export default config;