// src/molecular.config.ts
import { BrokerOptions } from 'moleculer';
import { config } from './config';

/**
 * Moleculer Service Broker configuration
 */
const moleculerConfig: BrokerOptions = {
  // Define namespace for the services
  namespace: config.moleculer.namespace,
  
  // Node identifier
  nodeID: `${config.service.name}-${process.pid}`,
  
  // Enable/disable logger
  logger: true,
  
  // Log level
  logLevel: config.moleculer.logLevel as any,
  
  // Define transporter
  transporter: config.moleculer.transporter,
  
  // Define cacher
  cacher: {
    type: 'Memory',
    options: {
      maxParamsLength: 100,
      ttl: 60 // 1 minute
    }
  },
  
  // Serializer - using JSON for simplicity, switch to Avro/MessagePack for performance
  serializer: 'JSON',
  
  // Request timeout in milliseconds
  requestTimeout: 10 * 1000, // 10 seconds
  
  // Retry policy settings
  retryPolicy: {
    enabled: true,
    retries: 5,
    delay: 100,
    maxDelay: 3000,
    factor: 2,
    check: (err: Error) => err && err.hasOwnProperty('retryable') ? (err as any).retryable : true
  },
  
  // Maximum concurrent executions of actions
  maxCallLevel: 100,
  
  // Number of heartbeats to wait before setting node unavailable status
  heartbeatTimeout: 10,
  
  // Number of seconds to wait before force shutdowning if node is still has in-progress requests
  shutdownTimeout: 10000,
  
  // Tracking requests and statistics
  tracking: {
    enabled: true,
    shutdownTimeout: 5000
  },
  
  // Disable built-in balancer in case of using an external balancer
  disableBalancer: false,
  
  // Settings of Circuit Breaker. More info: https://moleculer.services/docs/0.14/fault-tolerance.html#Circuit-Breaker
  circuitBreaker: {
    enabled: true,
    threshold: 0.5,
    minRequestCount: 20,
    windowTime: 60,
    halfOpenTime: 10 * 1000,
    check: (err: Error) => err && err.hasOwnProperty('code') ? (err as any).code >= 500 : false
  },
  
  // Settings of bulkhead feature. More info: https://moleculer.services/docs/0.14/fault-tolerance.html#Bulkhead
  bulkhead: {
    enabled: true,
    concurrency: 10,
    maxQueueSize: 100
  },
  
  // Enable metrics
  metrics: {
    enabled: config.moleculer.metrics,
    reporter: [
      {
        type: 'Console',
        options: {
          includes: ['moleculer.**.total'],
          interval: 10
        }
      }
    ]
  },
  
  // Enable tracing
  tracing: {
    enabled: config.moleculer.tracing,
    exporter: {
      type: 'Console',
      options: {
        width: 100,
        colors: true,
        logger: console.log
      }
    }
  },

  // Register custom middlewares
  middlewares: [
    // Example middleware
    {
      name: "Request Logger",
      localAction: function(next) {
        return function(ctx) {
          const startTime = process.hrtime();
          return next(ctx).then(res => {
            const endTime = process.hrtime(startTime);
            const duration = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(2);
            
            this.logger.debug({ 
              action: ctx.action.name,
              params: ctx.params, 
              meta: ctx.meta,
              duration: `${duration} ms`
            }, `Request processed`);
            
            return res;
          });
        };
      }
    }
  ],
  
  // Register custom REPL commands
  replCommands: []
};

export = moleculerConfig;