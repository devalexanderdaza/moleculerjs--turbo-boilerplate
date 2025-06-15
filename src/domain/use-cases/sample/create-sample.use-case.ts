import { IBaseRepository } from '../../interfaces/repositories/base.repository.interface';
import { ISampleEntity, SampleEntity } from '../../entities/sample.entity';
import { ValidationError, IUseCase } from '../../../types';

/**
 * Input for CreateSample use case
 */
export interface CreateSampleInput {
  name: string;
  description: string;
  status?: 'active' | 'inactive' | 'pending';
  metadata?: Record<string, any>;
}

/**
 * Output for CreateSample use case
 */
export interface CreateSampleOutput {
  sample: ISampleEntity;
}

/**
 * Create Sample use case
 * Demonstrates creating a new entity following the hexagonal architecture pattern
 */
export class CreateSampleUseCase implements IUseCase<CreateSampleInput, CreateSampleOutput> {
  private repository: IBaseRepository<ISampleEntity>;
  
  /**
   * Constructor with dependency injection
   * @param repository Repository for sample entities
   */
  constructor(repository: IBaseRepository<ISampleEntity>) {
    this.repository = repository;
  }
  
  /**
   * Execute the use case
   * @param input Use case input data
   * @returns Use case output
   * @throws ValidationError if input validation fails
   */
  async execute(input: CreateSampleInput): Promise<CreateSampleOutput> {
    // Input validation
    this.validateInput(input);
    
    // Create sample entity (without ID and timestamps)
    const sampleData = SampleEntity.create({
      name: input.name,
      description: input.description,
      status: input.status || 'pending',
      metadata: input.metadata
    });
    
    // Persist the entity
    const createdSample = await this.repository.create(sampleData);
    
    // Return the created entity
    return {
      sample: createdSample
    };
  }
  
  /**
   * Validate input data
   * @param input Input data to validate
   * @throws ValidationError if validation fails
   */
  private validateInput(input: CreateSampleInput): void {
    // Name validation
    if (!input.name || input.name.trim().length === 0) {
      throw new ValidationError('Sample name is required');
    }
    
    if (input.name.length > 100) {
      throw new ValidationError('Sample name cannot exceed 100 characters');
    }
    
    // Description validation
    if (!input.description || input.description.trim().length === 0) {
      throw new ValidationError('Sample description is required');
    }
    
    // Status validation (if provided)
    if (input.status && !['active', 'inactive', 'pending'].includes(input.status)) {
      throw new ValidationError('Sample status must be one of: active, inactive, pending');
    }
    
    // Metadata validation (if provided)
    if (input.metadata && typeof input.metadata !== 'object') {
      throw new ValidationError('Sample metadata must be an object');
    }
  }
}