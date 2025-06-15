import { Context, ServiceSchema } from 'moleculer';
import logger from '../../utils/logger';
import { IServiceResponse } from '../../types';

const serverlessLogger = logger.child({ transport: 'serverless' });

/**
 * Serverless transport adapter for MoleculerJS services
 * This allows services to be deployed as serverless functions
 * (AWS Lambda, Google Cloud Functions, Azure Functions, etc.)
 */
export const ServerlessTransport: ServiceSchema = {
  name: 'serverless-transport',
  
  settings: {
    // Function timeout in milliseconds
    timeout: 30000,
    // Maximum event payload size in bytes (10MB)
    maxPayloadSize: 10 * 1024 * 1024,
  },
  
  created() {
    serverlessLogger.info('Serverless transport created');
  },
  
  started() {
    serverlessLogger.info('Serverless transport started');
  },
  
  stopped() {
    serverlessLogger.info('Serverless transport stopped');
  },
  
  actions: {
    /**
     * The main function handler for serverless environments
     * This acts as the entry point for the serverless function
     */
    handler: {
      params: {
        event: { type: 'any' },
        context: { type: 'any', optional: true }
      },
      async handler(ctx: Context<{ event: any; context?: any }>): Promise<IServiceResponse<any>> {
        const { event, context = {} } = ctx.params;
        
        try {
          // Validate event payload size
          const payloadSize = this.getEventSize(event);
          if (payloadSize > this.settings.maxPayloadSize) {
            throw new Error(`Payload size exceeds maximum allowed (${payloadSize} > ${this.settings.maxPayloadSize})`);
          }
          
          // Extract event information
          const { service, action, params, meta = {} } = this.parseEvent(event);
          
          // Request metadata
          const requestMeta = {
            ...meta,
            transport: 'serverless',
            requestId: context.awsRequestId || context.requestId || ctx.id,
            timestamp: Date.now(),
          };
          
          serverlessLogger.debug({
            service,
            action,
            requestId: requestMeta.requestId,
          }, 'Processing serverless event');
          
          // Call appropriate service action with timeout
          const result = await this.broker.call(
            `${service}.${action}`,
            params,
            { meta: requestMeta, timeout: this.settings.timeout }
          );
          
          serverlessLogger.debug({
            requestId: requestMeta.requestId,
          }, 'Successfully processed serverless event');
          
          return {
            success: true,
            data: result
          };
        } catch (error) {
          serverlessLogger.error({
            error: (error as any).message,
            stack: (error as any).stack,
            event
          }, 'Error processing serverless event');
          
          return {
            success: false,
            error: {
              code: (error as any).code || 'INTERNAL_ERROR',
              message: (error as any).message || 'An unexpected error occurred'
            }
          };
        }
      }
    }
  },
  
  methods: {
    /**
     * Parse the incoming event based on the serverless platform
     */
    parseEvent(event: any): { service: string; action: string; params: any; meta?: any } {
      // Check if it's an API Gateway event (AWS)
      if (event.httpMethod && event.path) {
        return this.parseApiGatewayEvent(event);
      }
      
      // Check if it's an SQS event (AWS)
      if (event.Records && event.Records[0]?.eventSource === 'aws:sqs') {
        return this.parseSQSEvent(event);
      }
      
      // Check if it's an SNS event (AWS)
      if (event.Records && event.Records[0]?.eventSource === 'aws:sns') {
        return this.parseSNSEvent(event);
      }
      
      // Check if it's a direct invocation event
      if (event.service && event.action) {
        return {
          service: event.service,
          action: event.action,
          params: event.params || {},
          meta: event.meta
        };
      }
      
      // Default fallback - assume the structure is compatible
      return {
        service: 'sample',
        action: 'processServerlessEvent',
        params: event,
        meta: {}
      };
    },
    
    /**
     * Parse AWS API Gateway event
     */
    parseApiGatewayEvent(event: any): { service: string; action: string; params: any; meta: any } {
      // Extract path information and map to service/action
      const pathParts = event.path.split('/').filter(Boolean);
      let service = pathParts[0] || 'sample';
      let action = pathParts[1] || 'default';
      
      // For REST-style endpoints, map HTTP methods to actions
      if (pathParts.length === 1) {
        switch (event.httpMethod) {
          case 'GET':
            action = 'list';
            break;
          case 'POST':
            action = 'create';
            break;
          default:
            action = 'default';
        }
      } else if (pathParts.length === 2 && !isNaN(pathParts[1])) {
        // Handle ID-based routes like /users/123
        action = {
          'GET': 'get',
          'PUT': 'update',
          'DELETE': 'remove'
        }[event.httpMethod as string] || 'default';
      }
      
      // Parse request body if present
      let params = {};
      if (event.body) {
        try {
          params = JSON.parse(event.body);
        } catch (e) {
          // If not JSON, keep the raw string
          params = { body: event.body };
        }
      }
      
      // Add path parameters, query string parameters, and headers
      params = {
        ...params,
        ...event.pathParameters,
        ...event.queryStringParameters,
        headers: event.headers
      };
      
      return {
        service,
        action,
        params,
        meta: {
          httpMethod: event.httpMethod,
          path: event.path
        }
      };
    },
    
    /**
     * Parse AWS SQS event
     */
    parseSQSEvent(event: any): { service: string; action: string; params: any; meta: any } {
      // For SQS events, we get an array of records
      const record = event.Records[0];
      let params = {};
      
      try {
        params = JSON.parse(record.body);
      } catch (e) {
        params = { body: record.body };
      }
      
      return {
        service: 'sample',
        action: 'processQueueMessage',
        params,
        meta: {
          source: 'sqs',
          messageId: record.messageId,
          receiptHandle: record.receiptHandle
        }
      };
    },
    
    /**
     * Parse AWS SNS event
     */
    parseSNSEvent(event: any): { service: string; action: string; params: any; meta: any } {
      const record = event.Records[0];
      let params = {};
      
      try {
        params = JSON.parse(record.Sns.Message);
      } catch (e) {
        params = { message: record.Sns.Message };
      }
      
      return {
        service: 'sample',
        action: 'processNotification',
        params,
        meta: {
          source: 'sns',
          topicArn: record.Sns.TopicArn,
          messageId: record.Sns.MessageId
        }
      };
    },
    
    /**
     * Calculate the approximate size of the event in bytes
     */
    getEventSize(event: any): number {
      try {
        return Buffer.byteLength(JSON.stringify(event));
      } catch (e) {
        return 0;
      }
    }
  }
};