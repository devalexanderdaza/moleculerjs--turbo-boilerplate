import { Context, ServiceSchema } from 'moleculer';
import Redis from 'ioredis';
import { config } from '../../config';
import logger from '../../utils/logger';

const queueLogger = logger.child({ transport: 'queue' });

/**
 * Queue-based transport for MoleculerJS services
 * This allows services to process messages asynchronously from queues
 */
export const QueueTransport: ServiceSchema = {
  name: 'queue-transport',

  // Set dependencies if needed
  dependencies: [],

  created() {
    // Initialize Redis client for queue processing
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        queueLogger.info({ retryAttempt: times, delay }, 'Redis reconnection attempt');
        return delay;
      }
    });

    this.redis.on('error', (err: Error) => {
      queueLogger.error(err, 'Redis connection error');
    });

    this.redis.on('connect', () => {
      queueLogger.info('Redis connected');
    });

    queueLogger.info('Queue transport created');
  },

  started() {
    // Start listening to queues
    this.consumeQueues();
    queueLogger.info('Queue transport started');
  },

  async stopped() {
    // Stop all consumers and close Redis connection
    if (this.redis) {
      await this.redis.quit();
      queueLogger.info('Redis connection closed');
    }
    queueLogger.info('Queue transport stopped');
  },

  actions: {
    /**
     * Publish a message to a queue
     */
    publish: {
      params: {
        queue: { type: 'string' },
        message: { type: 'any' },
        options: { type: 'object', optional: true }
      },
      async handler(ctx: Context<{ queue: string; message: any; options?: any }>) {
        const { queue, message, options = {} } = ctx.params;
        
        try {
          const messageStr = JSON.stringify({
            data: message,
            meta: {
              ...ctx.meta,
              timestamp: Date.now(),
              options
            }
          });
          
          await this.redis.lpush(queue, messageStr);
          queueLogger.debug({ queue }, 'Message published to queue');
          
          return { success: true, queue };
        } catch (error) {
          queueLogger.error(error, `Failed to publish message to queue '${queue}'`);
          throw error;
        }
      }
    },

    /**
     * Get the queue length
     */
    getQueueLength: {
      params: {
        queue: { type: 'string' }
      },
      async handler(ctx: Context<{ queue: string }>) {
        const { queue } = ctx.params;
        const length = await this.redis.llen(queue);
        
        return { queue, length };
      }
    },

    /**
     * Purge a queue
     */
    purgeQueue: {
      params: {
        queue: { type: 'string' }
      },
      async handler(ctx: Context<{ queue: string }>) {
        const { queue } = ctx.params;
        await this.redis.del(queue);
        
        queueLogger.info({ queue }, 'Queue purged');
        return { success: true, queue };
      }
    }
  },

  methods: {
    /**
     * Start consuming messages from queues
     */
    async consumeQueues() {
      // List of queues to consume
      const queues = [
        { name: 'sample-queue', handler: this.handleSampleQueue.bind(this) }
      ];
      
      // Start consumers for each queue
      for (const queue of queues) {
        this.startConsumer(queue.name, queue.handler);
        queueLogger.info({ queue: queue.name }, 'Started consumer');
      }
    },
    
    /**
     * Start a consumer for a specific queue
     */
    async startConsumer(queueName: string, handler: Function) {
      // Polling strategy for simplicity
      // In production, consider using blocking operations or pub/sub
      const pollQueue = async () => {
        try {
          // Pop message from right of the list (FIFO)
          const result = await this.redis.rpop(queueName);
          
          if (result) {
            const message = JSON.parse(result);
            await handler(message);
            
            // Immediately check for more messages
            setImmediate(pollQueue);
          } else {
            // No messages, wait before polling again
            setTimeout(pollQueue, 1000);
          }
        } catch (error) {
          queueLogger.error(error, `Error processing message from queue '${queueName}'`);
          // Wait before retrying
          setTimeout(pollQueue, 5000);
        }
      };
      
      // Start polling
      pollQueue();
    },
    
    /**
     * Handler for sample queue messages
     */
    async handleSampleQueue(message: any) {
      try {
        queueLogger.debug({ message }, 'Processing sample queue message');
        
        // Process the message
        // In a real implementation, you would call the appropriate service action
        await this.broker.call('sample.processQueueMessage', {
          data: message.data,
          meta: message.meta
        });
        
        queueLogger.debug('Sample queue message processed successfully');
      } catch (error) {
        queueLogger.error(error, 'Failed to process sample queue message');
        // In production, implement retry logic or dead letter queue
      }
    }
  }
};