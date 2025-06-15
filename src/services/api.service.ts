// src/services/api.service.ts
import { ServiceSchema } from 'moleculer';
import { ApiGatewayTransport } from '../infrastructure/transports/api-gateway';
import { config } from '../config';
import logger from '../utils/logger';

/**
 * API Gateway service that exposes the microservices via RESTful API
 */
const ApiServiceSchema: ServiceSchema = {
  name: 'api',
  
  mixins: [
    // Mix in the API Gateway transport
    ApiGatewayTransport
  ],
  
  settings: {
    // Override or extend settings from the mixin
    port: config.api.port,
    
    // Add specific API service settings
    routes: [
      {
        path: '/api',
        
        // Define which service actions are exposed via API
        whitelist: [
          'v1.sample.*',
          '$node.*',
          'api.*'
        ],
        
        // Enable automatic aliases from service names and versions
        autoAliases: true,
        
        // Define specific URL aliases for better API design
        aliases: {
          // RESTful routes for the sample service
          'GET /samples': 'v1.sample.list',
          'GET /samples/:id': 'v1.sample.get',
          'POST /samples': 'v1.sample.create',
          'PUT /samples/:id': 'v1.sample.update',
          'DELETE /samples/:id': 'v1.sample.remove',
          
          // Health check endpoint
          'GET /health': '$node.health',
          'GET /info': '$node.services'
        },
        
        // CORS settings
        cors: {
          origin: config.api.corsOrigins,
          methods: ['GET', 'OPTIONS', 'POST', 'PUT', 'DELETE']
        },
        
        // Body parser options
        bodyParsers: {
          json: { limit: '2MB' },
          urlencoded: { extended: true, limit: '2MB' }
        }
      }
    ]
  },
  
  created() {
    logger.info('API service created');
  },
  
  started() {
    logger.info({ port: config.api.port }, 'API service started');
  },
  
  stopped() {
    logger.info('API service stopped');
  },
  
  // Custom methods for the API service
  methods: {
    /**
     * Create a standardized error response
     */
    sendError(req: any, res: any, error: any) {
      // Log the error
      logger.error(error, 'API error');
      
      // Determine status code
      const statusCode = error.code >= 100 && error.code < 600 ? error.code : 500;
      
      // Send error response
      res.status(statusCode).send({
        success: false,
        error: {
          message: error.message,
          code: error.code || statusCode,
          type: error.type || 'INTERNAL_ERROR'
        }
      });
    }
  }
};

export = ApiServiceSchema;