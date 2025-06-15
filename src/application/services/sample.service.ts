// src/application/services/sample.service.ts
import { ISampleEntity } from '../../domain/entities/sample.entity';
import { IBaseRepository } from '../../domain/interfaces/repositories/base.repository.interface';
import { IBaseService } from '../../domain/interfaces/services/base.service.interface';
import { GetSampleUseCase } from '../../domain/use-cases/sample/get-sample.use-case';
import { CreateSampleUseCase } from '../../domain/use-cases/sample/create-sample.use-case';
import { ValidationError, NotFoundError, IServiceContext, IServiceResponse, IPaginatedResult } from '../../types';
import logger from '../../utils/logger';

/**
 * Implementation of the Sample Service using the hexagonal architecture
 * This service orchestrates use cases to fulfill business operations
 */
export class SampleService implements IBaseService<ISampleEntity> {
  private repository: IBaseRepository<ISampleEntity>;
  private logger = logger.child({ service: 'SampleService' });

  /**
   * Constructor with repository dependency injection
   */
  constructor(repository: IBaseRepository<ISampleEntity>) {
    this.repository = repository;
    this.logger.info('Sample service initialized');
  }

  /**
   * Get all samples with optional filtering and pagination
   */
  async list(ctx: IServiceContext, query?: Record<string, any>): Promise<IServiceResponse<IPaginatedResult<ISampleEntity>>> {
    try {
      const page = query?.page || 1;
      const pageSize = query?.pageSize || 10;
      const filter = query?.filter;
      const result: IPaginatedResult<ISampleEntity> = await this.repository.findAll({
        pagination: { page, pageSize },
        filter
      });

      return {
        success: true,
        data: result // result already matches IPaginatedResult<ISampleEntity>
      };
    } catch (error) {
      this.logger.error(error, 'Error retrieving all samples');
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: (error as Error).message }
      };
    }
  }

  /**
   * Get a single sample by ID
   * Uses the GetSampleUseCase following hexagonal architecture
   */
  async get(ctx: IServiceContext, id: string): Promise<IServiceResponse<ISampleEntity>> {
    try {
      // Create and execute the use case
      const getSampleUseCase = new GetSampleUseCase(this.repository);
      const { sample } = await getSampleUseCase.execute({ id });
      
      return { success: true, data: sample };
    } catch (error) {
      if (error instanceof NotFoundError) {
        this.logger.warn({ id }, 'Sample not found');
        return { success: false, error: { code: 'NOT_FOUND', message: (error as Error).message } };
      } else {
        this.logger.error(error, `Error retrieving sample with ID: ${id}`);
        return { success: false, error: { code: 'INTERNAL_ERROR', message: (error as Error).message } };
      }
    }
  }

  /**
   * Create a new sample
   * Uses the CreateSampleUseCase following hexagonal architecture
   */
  async create(ctx: IServiceContext, data: Omit<ISampleEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<IServiceResponse<ISampleEntity>> {
    try {
      // Create and execute the use case
      const createSampleUseCase = new CreateSampleUseCase(this.repository);
      const { sample } = await createSampleUseCase.execute(data);

      this.logger.info({ id: sample.id }, 'Sample created successfully');
      return { success: true, data: sample };
    } catch (error) {
      if (error instanceof ValidationError) {
        this.logger.warn({ data, error: (error as Error).message }, 'Validation error creating sample');
        return { success: false, error: { code: 'VALIDATION_ERROR', message: (error as Error).message } };
      } else {
        this.logger.error(error, 'Error creating sample');
        return { success: false, error: { code: 'INTERNAL_ERROR', message: (error as Error).message } };
      }
    }
  }

  /**
   * Update an existing sample
   */
  async update(ctx: IServiceContext, id: string, data: Partial<ISampleEntity>): Promise<IServiceResponse<ISampleEntity>> {
    try {
      // First check if the sample exists
      // Note: getById was renamed to get, and its signature changed.
      // For now, directly call repository.findById or adapt to the new get signature if context is needed here.
      // To avoid breaking changes immediately, let's assume repository check is enough or use a direct repo call.
      const existing = await this.repository.findById(id);
      if (!existing) {
        throw new NotFoundError('Sample', id);
      }
      
      // Update the sample
      const updatedSample = await this.repository.update(id, data);
      
      if (!updatedSample) {
        // This case might be redundant if findById already threw NotFoundError
        throw new NotFoundError('Sample', id);
      }
      
      this.logger.info({ id }, 'Sample updated successfully');
      return { success: true, data: updatedSample };
    } catch (error) {
      this.logger.error(error, `Error updating sample with ID: ${id}`);
      if (error instanceof NotFoundError) {
        return { success: false, error: { code: 'NOT_FOUND', message: (error as Error).message } };
      }
      return { success: false, error: { code: 'INTERNAL_ERROR', message: (error as Error).message } };
    }
  }

  /**
   * Delete a sample
   */
  async delete(ctx: IServiceContext, id: string): Promise<IServiceResponse<boolean>> {
    try {
      // First check if the sample exists (similar to update)
      const existing = await this.repository.findById(id);
      if (!existing) {
        // If it doesn't exist, Moleculer might expect an error or a specific response.
        // For now, aligning with IBaseService which expects a boolean response.
        // Depending on strictness, not finding could be success:false or success:true, data:false.
        // Let's consider not found as an error for delete.
        throw new NotFoundError('Sample', id);
      }
      
      // Delete the sample
      const result = await this.repository.delete(id);
      
      this.logger.info({ id, success: result }, 'Sample deletion attempt');
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof NotFoundError) {
        this.logger.warn({ id }, 'Sample not found for deletion');
        return { success: false, error: { code: 'NOT_FOUND', message: (error as Error).message } };
      }
      
      this.logger.error(error, `Error deleting sample with ID: ${id}`);
      return { success: false, error: { code: 'INTERNAL_ERROR', message: (error as Error).message } };
    }
  }
}