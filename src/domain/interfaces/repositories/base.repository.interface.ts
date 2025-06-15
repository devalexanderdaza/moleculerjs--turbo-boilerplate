// src/domain/interfaces/repositories/base.repository.interface.ts
import { IEntity, IPaginatedResult, IQueryOptions } from "../../../types";

export interface IBaseRepository<T extends IEntity> {
  /**
   * Find entity by id
   * @param id - Entity id
   */
  findById(id: string): Promise<T | null>;
  
  /**
   * Find all entities with optional filtering, sorting and pagination
   * @param options - Query options
   */
  findAll(options?: IQueryOptions): Promise<IPaginatedResult<T>>;
  
  /**
   * Create a new entity
   * @param data - Entity data
   */
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  
  /**
   * Update an existing entity
   * @param id - Entity id
   * @param data - Data to update
   */
  update(id: string, data: Partial<T>): Promise<T | null>;
  
  /**
   * Delete an entity
   * @param id - Entity id
   */
  delete(id: string): Promise<boolean>;
}