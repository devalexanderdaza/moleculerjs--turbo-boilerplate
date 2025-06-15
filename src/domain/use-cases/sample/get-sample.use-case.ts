import { IBaseRepository } from '../../interfaces/repositories/base.repository.interface';
import { ISampleEntity, SampleEntity } from '../../entities/sample.entity';
import { NotFoundError, ValidationError, IUseCase } from '../../../types';

/**
 * Input for GetSample use case
 */
export interface GetSampleInput {
  id: string;
}

/**
 * Output for GetSample use case
 */
export interface GetSampleOutput {
  sample: ISampleEntity;
}

/**
 * Get Sample use case
 * Demonstrates a simple use case following the hexagonal architecture pattern
 */
export class GetSampleUseCase implements IUseCase<GetSampleInput, GetSampleOutput> {
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
   * @throws NotFoundError if the sample doesn't exist
   */
  async execute(input: GetSampleInput): Promise<GetSampleOutput> {
    // Input validation
    if (!input.id) {
      throw new ValidationError('Sample ID is required');
    }
    
    // Get sample from repository
    const sample = await this.repository.findById(input.id);
    
    // Check if sample exists
    if (!sample) {
      throw new NotFoundError('Sample', input.id);
    }
    
    // Return the sample
    return {
      sample
    };
  }
}