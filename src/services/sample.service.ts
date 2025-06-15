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
class SampleServiceSchema { // Removed "implements ServiceSchema"
  // public name!: string; // No longer needed as ServiceSchema is not directly implemented
  // public name = 'sample'; // Removed: Caused "TypeError: Cannot assign to read only property 'name'" with moleculer-decorators
  private sampleService!: import('../../src/application/services/sample.service').SampleService; // Type it properly
  private logger = logger.child({ service: 'sample' });

  /**
   * Service created lifecycle event handler
   */
  created(): void {
    this.sampleService = di.resolve('sampleService');
    this.logger.info('Sample service created and dependencies resolved');
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
      
      // Pass Moleculer context (ctx) to the application service
      // The application service now returns IServiceResponse
      const serviceResponse = await this.sampleService.list(ctx, { filter, page, pageSize });

      if (!serviceResponse.success) {
        // Convert IServiceResponse error to Moleculer error or re-throw
        // For now, let's assume serviceResponse.error has { code, message }
        // This part might need more sophisticated error handling later
        throw new Error(serviceResponse.error?.message || 'Unknown error from service');
      }
      
      return {
        success: true,
        data: serviceResponse.data // This should be IPaginatedResult<ISampleEntity>
      };
    } catch (error) {
      this.logger.error(error, 'Error in list samples action');
      
      return {
        success: false,
        error: {
          code: (error as any).code || 'INTERNAL_ERROR',
          message: (error as Error).message
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
      
      const serviceResponse = await this.sampleService.get(ctx, id);

      if (!serviceResponse.success) {
        if (serviceResponse.error?.code === 'NOT_FOUND') {
          throw new NotFoundError('Sample', id); // Or use Moleculer specific errors
        }
        throw new Error(serviceResponse.error?.message || 'Unknown error from service');
      }
      
      return {
        success: true,
        data: serviceResponse.data
      };
    } catch (error) {
      this.logger.error(error, `Error in get sample action for ID: ${ctx.params.id}`);
      
      // Handle specific errors thrown by the above logic or re-throw if necessary
      if (error instanceof NotFoundError) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND', // This should match the error code expected by clients
            message: (error as Error).message
          }
        };
      }
      
      return {
        success: false,
        error: {
          code: (error as any).code || 'INTERNAL_ERROR',
          message: (error as Error).message
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
      
      const serviceResponse = await this.sampleService.create(ctx, {
        name,
        description,
        status: status || 'pending',
        metadata
      });

      if (!serviceResponse.success) {
        if (serviceResponse.error?.code === 'VALIDATION_ERROR') {
           throw new ValidationError(serviceResponse.error.message);
        }
        throw new Error(serviceResponse.error?.message || 'Unknown error from service');
      }
      
      return {
        success: true,
        data: serviceResponse.data
      };
    } catch (error) {
      this.logger.error(error, 'Error in create sample action');

      if (error instanceof ValidationError) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR', // This should match the error code expected by clients
            message: (error as Error).message
          }
        };
      }
      
      return {
        success: false,
        error: {
          code: (error as any).code || 'INTERNAL_ERROR',
          message: (error as Error).message
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
      
      const serviceResponse = await this.sampleService.update(ctx, id, updateData);

      if (!serviceResponse.success) {
        if (serviceResponse.error?.code === 'NOT_FOUND') {
          throw new NotFoundError('Sample', id);
        } else if (serviceResponse.error?.code === 'VALIDATION_ERROR') {
          throw new ValidationError(serviceResponse.error.message);
        }
        throw new Error(serviceResponse.error?.message || 'Unknown error from service');
      }
      
      return {
        success: true,
        data: serviceResponse.data
      };
    } catch (error) {
      this.logger.error(error, `Error in update sample action for ID: ${ctx.params.id}`);

      if (error instanceof NotFoundError) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: (error as Error).message
          }
        };
      }
      
      if (error instanceof ValidationError) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: (error as Error).message
          }
        };
      }
      
      return {
        success: false,
        error: {
          code: (error as any).code || 'INTERNAL_ERROR',
          message: (error as Error).message
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
      
      const serviceResponse = await this.sampleService.delete(ctx, id);

      if (!serviceResponse.success) {
         if (serviceResponse.error?.code === 'NOT_FOUND') {
          throw new NotFoundError('Sample', id);
        }
        throw new Error(serviceResponse.error?.message || 'Unknown error from service');
      }
      
      return {
        success: true,
        data: serviceResponse.data
      };
    } catch (error) {
      this.logger.error(error, `Error in delete sample action for ID: ${ctx.params.id}`);

      if (error instanceof NotFoundError) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: (error as Error).message
          }
        };
      }
      
      return {
        success: false,
        error: {
          code: (error as any).code || 'INTERNAL_ERROR',
          message: (error as Error).message
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
      // Note: For simplicity, not deeply handling IServiceResponse here.
      // In a real app, you'd check response.success and response.error from these calls.
      if (data.action === 'create') {
        await this.sampleService.create(ctx, data.sample);
      } else if (data.action === 'update' && data.id) {
        await this.sampleService.update(ctx, data.id, data.sample);
      } else if (data.action === 'delete' && data.id) {
        await this.sampleService.delete(ctx, data.id);
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
          code: (error as any).code || 'INTERNAL_ERROR',
          message: (error as Error).message
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
      // Note: These calls now return IServiceResponse. The result processing needs adjustment.
      let serviceResponse;
      
      if (event.type === 'get') {
        serviceResponse = await this.sampleService.get(ctx, event.id);
      } else if (event.type === 'list') {
        // Assuming event.filter, event.page, event.pageSize are query params
        serviceResponse = await this.sampleService.list(ctx, {
          filter: event.filter,
          page: event.page || 1,
          pageSize: event.pageSize || 10
        });
      } else if (event.type === 'create') {
        serviceResponse = await this.sampleService.create(ctx, event.data);
      } else if (event.type === 'update') {
        serviceResponse = await this.sampleService.update(ctx, event.id, event.data);
      } else if (event.type === 'delete') {
        serviceResponse = await this.sampleService.delete(ctx, event.id);
      } else {
        throw new Error(`Unknown event type: ${event.type}`);
      }

      if (!serviceResponse.success) {
        throw new Error(serviceResponse.error?.message || `Error processing serverless event type: ${event.type}`);
      }
      
      return {
        success: true,
        data: serviceResponse.data
      };
    } catch (error) {
      this.logger.error(error, 'Error processing serverless event');
      
      return {
        success: false,
        error: {
          code: (error as any).code || 'INTERNAL_ERROR',
          message: (error as Error).message
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