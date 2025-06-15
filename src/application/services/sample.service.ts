// src/application/services/sample.service.ts
import { ISampleEntity } from '../../domain/entities/sample.entity';
import { IBaseRepository } from '../../domain/interfaces/repositories/base.repository.interface';
import { IBaseService } from '../../domain/interfaces/services/base.service.interface';
import { GetSampleUseCase } from '../../domain/use-cases/sample/get-sample.use-case';
import { CreateSampleUseCase } from '../../domain/use-cases/sample/create-sample.use-case';
import { ValidationError, NotFoundError } from '../../types';
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
  async getAll(filter?: Record<string, any>, page: number = 1, pageSize: number = 10) {
    try {
      const result = await this.repository.findAll({
        pagination: { page, pageSize },
        filter
      });

      return {
        data: result.data,
        pagination: result.pagination
      };
    } catch (error) {
      this.logger.error(error, 'Error retrieving all samples');
      throw error;
    }
  }

  /**
   * Get a single sample by ID
   * Uses the GetSampleUseCase following hexagonal architecture
   */
  async getById(id: string): Promise<ISampleEntity> {
    try {
      // Create and execute the use case
      const getSampleUseCase = new GetSampleUseCase(this.repository);
      const { sample } = await getSampleUseCase.execute({ id });
      
      return sample;
    } catch (error) {
      if (error instanceof NotFoundError) {
        this.logger.warn({ id }, 'Sample not found');
      } else {
        this.logger.error(error, `Error retrieving sample with ID: ${id}`);
      }
      throw error;
    }
  }

  /**
   * Create a new sample
   * Uses the CreateSampleUseCase following hexagonal architecture
   */
  async create(data: Omit<ISampleEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ISampleEntity> {
    try {
      // Create and execute the use case
      const createSampleUseCase = new CreateSampleUseCase(this.repository);
      const { sample } = await createSampleUseCase.execute(data);

      this.logger.info({ id: sample.id }, 'Sample created successfully');
      return sample;
    } catch (error) {
      if (error instanceof ValidationError) {
        this.logger.warn({ data, error: error.message }, 'Validation error creating sample');
      } else {
        this.logger.error(error, 'Error creating sample');
      }
      throw error;
    }
  }

  /**
   * Update an existing sample
   */
  async update(id: string, data: Partial<ISampleEntity>): Promise<ISampleEntity> {
    try {
      // First check if the sample exists
      await this.getById(id);
      
      // Update the sample
      const updatedSample = await this.repository.update(id, data);
      
      if (!updatedSample) {
        throw new NotFoundError('Sample', id);
      }
      
      this.logger.info({ id }, 'Sample updated successfully');
      return updatedSample;
    } catch (error) {
      this.logger.error(error, `Error updating sample with ID: ${id}`);
      throw error;
    }
  }

  /**
   * Delete a sample
   */
  async delete(id: string): Promise<boolean> {
    try {
      // First check if the sample exists
      await this.getById(id);
      
      // Delete the sample
      const result = await this.repository.delete(id);
      
      this.logger.info({ id, success: result }, 'Sample deletion attempt');
      return result;
    } catch (error) {
      if (error instanceof NotFoundError) {
        // If it doesn't exist, consider the deletion successful
        return true;
      }
      
      this.logger.error(error, `Error deleting sample with ID: ${id}`);
      throw error;
    }
  }
}