// src/infrastructure/transports/api-gateway.ts
import { ServiceBroker } from 'moleculer';
import ApiGateway from 'moleculer-web';
import { config } from '../../config';
import logger from '../../utils/logger';

// Interface definitions for API routes
interface RouteOptions {
  path?: string;
  whitelist?: string[];
  authorization?: boolean;
  authentication?: boolean;
  autoAliases?: boolean;
  aliases?: Record<string, any>;
  bodyParsers?: {
    json?: boolean | Record<string, any>;
    urlencoded?: boolean | Record<string, any>;
  };
  mappingPolicy?: 'all' | 'restrict';
  cors?: {
    origin?: string | string[] | boolean;
    methods?: string[];
    allowedHeaders?: string[];
    exposedHeaders?: string[];
    credentials?: boolean;
    maxAge?: number;
  };
  onBeforeCall?: (ctx: any, route: any, req: any, res: any) => Promise<void>;
  onAfterCall?: (ctx: any, route: any, req: any, res: any, data: any) => Promise<any>;
}

interface ApiGatewayOptions {
  port: number;
  ip: string;
  routes: RouteOptions[];
  log?: boolean;
  assets?: {
    folder: string;
    options?: Record<string, any>;
  };
}

export class ApiGatewayTransport {
  private broker: ServiceBroker;
  private options: ApiGatewayOptions;

  constructor(broker: ServiceBroker, customOptions: Partial<ApiGatewayOptions> = {}) {
    this.broker = broker;

    // Default options
    this.options = {
      port: config.api.port,
      ip: '0.0.0.0',
      log: true,
      routes: [
        {
          path: '/api',
          whitelist: [
            // Access any actions in all services
            '**'
          ],
          authorization: false,
          authentication: false,
          autoAliases: true,
          bodyParsers: {
            json: true,
            urlencoded: {
              extended: true
            }
          },
          cors: {
            origin: config.api.corsOrigins,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
          },
          mappingPolicy: 'all',
        }
      ],
      assets: {
        folder: 'public',
        options: {}
      },
      ...customOptions
    };

    logger.debug('ApiGatewayTransport initialized with options:', this.options);
  }

  createService() {
    return {
      name: 'api',
      mixins: [ApiGateway],
      settings: this.options,
      methods: {
        authenticate: async (ctx: any, route: any, req: any) => {
          // Authentication logic would go here
          // This is a placeholder implementation
          const auth = req.headers.authorization;
          if (auth && auth.startsWith('Bearer ')) {
            const token = auth.slice(7);
            if (token) {
              // Validate token
              try {
                // Mock token validation
                return { id: '1', username: 'user' };
              } catch (err) {
                throw new ApiGateway.Errors.UnAuthorizedError(ApiGateway.Errors.ERR_INVALID_TOKEN);
              }
            }
          }
          throw new ApiGateway.Errors.UnAuthorizedError(ApiGateway.Errors.ERR_NO_TOKEN);
        },
        
        authorize: async (ctx: any, route: any, req: any) => {
          // Authorization logic would go here
          // This is a placeholder implementation
          return true;
        },
        
        // Error handler method
        errorHandler: (req: any, res: any, err: any) => {
          const error = require('./db-utils').errorHandler(err);
          res.writeHead(error.code || 500);
          res.end(JSON.stringify({
            status: error.code || 500,
            message: error.message || 'Unknown error occurred',
            code: error.type || 'UNKNOWN_ERROR'
          }));
        }
      }
    };
  }
}

export default ApiGatewayTransport;