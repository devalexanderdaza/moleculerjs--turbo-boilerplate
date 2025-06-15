import { ServiceSchema } from 'moleculer';
import ApiGateway from 'moleculer-web';
import { Request, Response, NextFunction } from 'express'; // Added for typing
import { config } from '../../config';
import logger from '../../utils/logger';

const apiLogger = logger.child({ transport: 'api-gateway' });

/**
 * API Gateway transport adapter for MoleculerJS services
 * This allows services to be exposed via REST API endpoints
 */
export const ApiGatewayTransport: ServiceSchema = {
  name: 'api-gateway',
  mixins: [ApiGateway],
  
  settings: {
    port: config.api.port,
    
    // Global CORS settings
    cors: {
      origin: config.api.corsOrigins,
      methods: ['GET', 'OPTIONS', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['Content-Length', 'Date', 'X-Request-Id'],
      credentials: true,
      maxAge: 3600
    },
    
    // Global rate limiter settings
    rateLimit: {
      window: 60 * 1000,
      limit: 100,
      headers: true
    },
    
    // Request logging
    log4XXResponses: config.isDevelopment,
    logRequestParams: config.isDevelopment,
    logResponseData: config.isDevelopment,

    routes: [
      // Public API route (no authentication)
      {
        path: '/api',
        whitelist: [
          // Add the actions you want to expose
          'sample.*',
          'v1.sample.*',
          '$node.*'  // Expose node service methods
        ],
        // Enable auto-alias mapping with versioning support
        autoAliases: true,
        
        // Route-specific CORS settings
        cors: {
          origin: config.api.corsOrigins,
          methods: ['GET', 'OPTIONS', 'POST', 'PUT', 'DELETE']
        },
        
        // Request body parsing
        bodyParsers: {
          json: { limit: '2MB' },
          urlencoded: { extended: true, limit: '2MB' }
        },

        // Route mappings
        aliases: {
          // Map RESTful routes to actions
          'REST services/sample': 'sample',
          'GET health': '$node.health'
        },
        
        // Enable/disable parameter validation
        callOptions: {
          meta: {
            logRequest: true,
            transport: 'api-gateway'
          }
        }
      },
      
      // Protected API route (with authentication)
      {
        path: '/api/v1',
        whitelist: [
          'v1.sample.*'
        ],
        autoAliases: true,
        
        // Auth middleware
        use: [
          // Authentication middleware would be implemented here
          // This is just a placeholder
          (req: Request, res: Response, next: NextFunction) => {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
              // Ensure error is passed to next for proper handling by MoleculerWeb or custom errorHandler
              return next(new ApiGateway.Errors.UnAuthorizedError("NO_TOKEN", "Unauthorized"));
            }
            // Would verify token here
            next();
          }
        ],
        
        bodyParsers: {
          json: { limit: '1MB' },
          urlencoded: { extended: true, limit: '1MB' }
        }
      }
    ],
    
    // Custom error handling
    onError(req: Request, res: Response, err: any) {
      apiLogger.error({
        error: err.message,
        code: err.code,
        type: err.type,
        path: req.url,
        method: req.method
      }, 'API Gateway error');
      
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(err.code || 500);
      res.end(JSON.stringify({
        success: false,
        error: {
          message: err.message,
          code: err.code || 500,
          type: err.type
        }
      }));
    }
  },

  methods: {
    /**
     * Authenticate the request
     */
    authenticate(ctx, route, req) {
      // This is a placeholder for authentication logic
      // Would typically verify JWT tokens or other authentication methods
      return Promise.resolve(ctx);
    }
  },

  // Service started lifecycle event handler
  started() {
    apiLogger.info({ port: config.api.port }, 'API Gateway started');
  },

  // Service stopped lifecycle event handler
  stopped() {
    apiLogger.info('API Gateway stopped');
  }
};