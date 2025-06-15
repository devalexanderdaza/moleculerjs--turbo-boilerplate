import { IEntity } from '../../types';

/**
 * Sample entity representing a basic domain object
 * This serves as an example for creating other domain entities
 */
export interface ISampleEntity extends IEntity {
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'pending';
  metadata?: Record<string, any>;
}

/**
 * Sample entity implementation
 * Uses class for better type safety and encapsulation
 */
export class SampleEntity implements ISampleEntity {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'pending';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  
  constructor(data: {
    id: string;
    name: string;
    description: string;
    status: 'active' | 'inactive' | 'pending';
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.status = data.status;
    this.metadata = data.metadata;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    
    // Validate the entity
    this.validate();
  }
  
  /**
   * Validate the entity state
   * @throws Error if validation fails
   */
  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Sample name cannot be empty');
    }
    
    if (!this.description || this.description.trim().length === 0) {
      throw new Error('Sample description cannot be empty');
    }
    
    if (!['active', 'inactive', 'pending'].includes(this.status)) {
      throw new Error('Sample status must be one of: active, inactive, pending');
    }
  }
  
  /**
   * Create a new sample entity without ID and timestamps (for creation)
   */
  static create(data: {
    name: string;
    description: string;
    status: 'active' | 'inactive' | 'pending';
    metadata?: Record<string, any>;
  }): Omit<ISampleEntity, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      name: data.name,
      description: data.description,
      status: data.status,
      metadata: data.metadata
    };
  }
  
  /**
   * Activate the sample entity
   */
  activate(): void {
    this.status = 'active';
    this.updatedAt = new Date();
  }
  
  /**
   * Deactivate the sample entity
   */
  deactivate(): void {
    this.status = 'inactive';
    this.updatedAt = new Date();
  }
  
  /**
   * Set to pending state
   */
  setPending(): void {
    this.status = 'pending';
    this.updatedAt = new Date();
  }
  
  /**
   * Update the sample entity
   */
  update(data: Partial<Pick<ISampleEntity, 'name' | 'description' | 'metadata'>>): void {
    if (data.name !== undefined) {
      this.name = data.name;
    }
    
    if (data.description !== undefined) {
      this.description = data.description;
    }
    
    if (data.metadata !== undefined) {
      this.metadata = data.metadata;
    }
    
    this.updatedAt = new Date();
    this.validate();
  }
  
  /**
   * Serialize to plain object
   */
  toJSON(): ISampleEntity {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      status: this.status,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}