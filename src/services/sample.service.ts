// src/services/sample.service.ts
import { Service, Action, Method } from 'moleculer-decorators';
import { Context, ServiceBroker, ServiceSchema } from 'moleculer';
import { IServiceResponse, ValidationError, NotFoundError } from '../types';
import { ISampleEntity } from '../domain/entities/sample.entity';
import di from '../application/di-container';
import logger from '../utils/logger';

/**
 * MoleculerJS Sample Service
 * This is the integration layer that connects the application layer to the Moleculer microservices framework
 */
@Service({
  name: 'sample',
  version: 1,
})
class SampleServiceSchema implements ServiceSchema {
  private sampleService = di.resolve('sampleService');
  private logger = logger.child({ service: 'sample' });

  /**
   * Service created lifecycle event handler
   */
  created(): void {
    this.logger.info('Sample service created');
  }

  /**
   * Service started lifecycle event handler
   */
  async started(): Promise<void> {
    this.logger.info('Sample service started');
  }

  /**
   * Service stopped lifecycle event handler
   */
  async stopped(): Promise<void> {
    this.logger.info('Sample service stopped');
  }

  /**
   * Get all samples action
   */
  @Action({
    params: {
      page: { type: 'number', integer: true, positive: true, optional: true, default: 1 },
      pageSize: { type: 'number', integer: true, positive: true, optional: true, default: 10 },
      filter: { type: 'object', optional: true }
    }
  })
  async list(ctx: Context<{ page?: number; pageSize?: number; filter?: Record<string, any> }>): Promise<IServiceResponse<{ data: ISampleEntity[], pagination: any }>> {
    try {
      const { page, pageSize, filter } = ctx.params;

      this.logger.debug({ page, pageSize, filter }, 'List samples request');
      
      const result = await this.sampleService.getAll(filter, page, pageSize);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      this.logger.error(error, 'Error in list samples action');
      
      return {
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message
        }
      };
    }
  }

  /**
   * Get sample by ID action
   */
  @Action({
    params: {
      id: { type: 'string' }
    }
  })
  async get(ctx: Context<{ id: string }>): Promise<IServiceResponse<ISampleEntity>> {
    try {
      const { id } = ctx.params;
      
      this.logger.debug({ id }, 'Get sample by ID request');
      
      const sample = await this.sampleService.getById(id);
      
      return {
        success: true,
        data: sample
      };
    } catch (error) {
      this.logger.error(error, `Error in get sample action for ID: ${ctx.params.id}`);
      
      if (error instanceof NotFoundError) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: error.message
          }
        };
      }
      
      return {
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message
        }
      };
    }
  }

  /**
   * Create sample action
   */
  @Action({
    params: {
      name: { type: 'string', min: 1, max: 100 },
      description: { type: 'string', min: 1 },
      status: { type: 'enum', values: ['active', 'inactive', 'pending'], optional: true },
      metadata: { type: 'object', optional: true }
    }
  })
  async create(ctx: Context<{ 
    name: string; 
    description: string; 
    status?: 'active' | 'inactive' | 'pending';
    metadata?: Record<string, any>;
  }>): Promise<IServiceResponse<ISampleEntity>> {
    try {
      const { name, description, status, metadata } = ctx.params;
      
      this.logger.debug({ name, status }, 'Create sample request');
      
      const sample = await this.sampleService.create({
        name,
        description,
        status: status || 'pending',
        metadata
      });
      
      return {
        success: true,
        data: sample
      };
    } catch (error) {
      this.logger.error(error, 'Error in create sample action');
      
      if (error instanceof ValidationError) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message
          }
        };
      }
      
      return {
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message
        }
      };
    }
  }

  /**
   * Update sample action
   */
  @Action({
    params: {
      id: { type: 'string' },
      name: { type: 'string', min: 1, max: 100, optional: true },
      description: { type: 'string', min: 1, optional: true },
      status: { type: 'enum', values: ['active', 'inactive', 'pending'], optional: true },
      metadata: { type: 'object', optional: true }
    }
  })
  async update(ctx: Context<{ 
    id: string;
    name?: string; 
    description?: string; 
    status?: 'active' | 'inactive' | 'pending';
    metadata?: Record<string, any>;
  }>): Promise<IServiceResponse<ISampleEntity>> {
    try {
      const { id, ...updateData } = ctx.params;
      
      this.logger.debug({ id, ...updateData }, 'Update sample request');
      
      const sample = await this.sampleService.update(id, updateData);
      
      return {
        success: true,
        data: sample
      };
    } catch (error) {
      this.logger.error(error, `Error in update sample action for ID: ${ctx.params.id}`);
      
      if (error instanceof NotFoundError) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: error.message
          }
        };
      }
      
      if (error instanceof ValidationError) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message
          }
        };
      }
      
      return {
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message
        }
      };
    }
  }

  /**
   * Delete sample action
   */
  @Action({
    params: {
      id: { type: 'string' }
    }
  })
  async remove(ctx: Context<{ id: string }>): Promise<IServiceResponse<boolean>> {
    try {
      const { id } = ctx.params;
      
      this.logger.debug({ id }, 'Delete sample request');
      
      const result = await this.sampleService.delete(id);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      this.logger.error(error, `Error in delete sample action for ID: ${ctx.params.id}`);
      
      if (error instanceof NotFoundError) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: error.message
          }
        };
      }
      
      return {
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message
        }
      };
    }
  }

  /**
   * Process queue message action
   */
  @Action({
    visibility: 'private',
    params: {
      data: { type: 'any' },
      meta: { type: 'object', optional: true }
    }
  })
  async processQueueMessage(ctx: Context<{ data: any; meta?: Record<string, any> }>): Promise<IServiceResponse<boolean>> {
    try {
      const { data, meta } = ctx.params;
      
      this.logger.debug({ data, meta }, 'Processing queue message');
      
      // Handle the queue message based on its content
      // This is just an example - implement your actual logic here
      if (data.action === 'create') {
        await this.sampleService.create(data.sample);
      } else if (data.action === 'update' && data.id) {
        await this.sampleService.update(data.id, data.sample);
      } else if (data.action === 'delete' && data.id) {
        await this.sampleService.delete(data.id);
      }
      
      return {
        success: true,
        data: true
      };
    } catch (error) {
      this.logger.error(error, 'Error processing queue message');
      
      return {
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message
        }
      };
    }
  }

  /**
   * Process serverless event action
   */
  @Action({
    visibility: 'public',
    params: {
      event: { type: 'any' }
    }
  })
  async processServerlessEvent(ctx: Context<{ event: any }>): Promise<IServiceResponse<any>> {
    try {
      const { event } = ctx.params;
      
      this.logger.debug({ event }, 'Processing serverless event');
      
      // Handle the serverless event based on its content
      // This is just an example - implement your actual logic here
      let result;
      
      if (event.type === 'get') {
        result = await this.sampleService.getById(event.id);
      } else if (event.type === 'list') {
        result = await this.sampleService.getAll(
          event.filter,
          event.page || 1,
          event.pageSize || 10
        );
      } else if (event.type === 'create') {
        result = await this.sampleService.create(event.data);
      } else if (event.type === 'update') {
        result = await this.sampleService.update(event.id, event.data);
      } else if (event.type === 'delete') {
        result = await this.sampleService.delete(event.id);
      } else {
        throw new Error(`Unknown event type: ${event.type}`);
      }
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      this.logger.error(error, 'Error processing serverless event');
      
      return {
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message
        }
      };
    }
  }

  /**
   * Health check method
   */
  @Method
  healthCheck(): { status: string; timestamp: number } {
    return {
      status: 'ok',
      timestamp: Date.now()
    };
  }
}

export = SampleServiceSchema;