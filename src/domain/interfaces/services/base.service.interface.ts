// src/domain/interfaces/services/base.service.interface.ts
import { IServiceContext, IServiceResponse, IPaginatedResult } from "../../../types";

/**
 * Base service interface for all domain services
 */
export interface IBaseService<T> {
  /**
   * Get entity by id
   * @param ctx - Service context
   * @param id - Entity id
   */
  get(ctx: IServiceContext, id: string): Promise<IServiceResponse<T>>;
  
  /**
   * Get all entities with optional filtering
   * @param ctx - Service context
   * @param query - Optional query parameters
   */
  list(ctx: IServiceContext, query?: Record<string, any>): Promise<IServiceResponse<IPaginatedResult<T>>>;
  
  /**
   * Create a new entity
   * @param ctx - Service context
   * @param data - Entity data
   */
  create(ctx: IServiceContext, data: Record<string, any>): Promise<IServiceResponse<T>>;
  
  /**
   * Update an existing entity
   * @param ctx - Service context
   * @param id - Entity id
   * @param data - Data to update
   */
  update(ctx: IServiceContext, id: string, data: Record<string, any>): Promise<IServiceResponse<T>>;
  
  /**
   * Delete an entity
   * @param ctx - Service context
   * @param id - Entity id
   */
  delete(ctx: IServiceContext, id: string): Promise<IServiceResponse<boolean>>;
}