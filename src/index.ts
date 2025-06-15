// src/index.ts
import { ServiceBroker } from 'moleculer';
import moleculerConfig from './molecular.config';
import logger from './utils/logger';
import { db } from './infrastructure/db';
import { config } from './config';

// Initialize the service broker with the configuration
const broker = new ServiceBroker(moleculerConfig);

// Register services
logger.info('Loading services...');

// Import API service
broker.loadService('./src/services/api.service.js');

// Import the sample service
broker.loadService('./src/services/sample.service.js');

// Initialize the microservice broker
async function main() {
  try {
    logger.info({
      service: config.service.name,
      version: config.service.version,
      env: config.env
    }, 'Starting microservice');

    // Connect to the database
    await db.connect();
    
    // Start the broker
    await broker.start();
    
    logger.info('Microservice successfully started');
  } catch (error) {
    logger.fatal(error, 'Failed to start microservice');
    process.exit(1);
  }
}

// Handle termination signals
process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down...');
  await broker.stop();
  await db.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down...');
  await broker.stop();
  await db.disconnect();
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.fatal(error, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({ reason, promise }, 'Unhandled rejection');
  process.exit(1);
});

// Start the application
main();