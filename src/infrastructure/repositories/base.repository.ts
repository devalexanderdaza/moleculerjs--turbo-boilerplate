// src/infrastructure/repositories/base.repository.ts
import { IBaseRepository } from "../../domain/interfaces/repositories/base.repository.interface";
import { IEntity, IPaginatedResult, IQueryOptions } from "../../types";
import logger from "../../utils/logger";

export class BaseRepository<T extends IEntity> implements IBaseRepository<T> {
  protected collection: T[] = [];
  protected entityName: string;

  constructor(entityName: string) {
    this.entityName = entityName;
    logger.debug(`Initialized ${entityName} repository`);
  }

  async findById(id: string): Promise<T | null> {
    logger.debug(`Finding ${this.entityName} by ID: ${id}`);
    const entity = this.collection.find(entity => entity.id === id);
    return entity || null;
  }

  async findAll(options?: IQueryOptions): Promise<IPaginatedResult<T>> {
    logger.debug(`Finding all ${this.entityName}s with options:`, options);
    
    let result = [...this.collection];
    
    // Apply filtering if provided
    if (options?.filter) {
      result = result.filter(item => {
        // Simple filter implementation
        return Object.entries(options.filter || {}).every(([key, value]) => {
          return item[key as keyof T] === value;
        });
      });
    }
    
    // Apply sorting if provided
    if (options?.sort) {
      const { field, order } = options.sort;
      result.sort((a, b) => {
        const valueA = a[field as keyof T];
        const valueB = b[field as keyof T];
        if (valueA < valueB) return order === 'asc' ? -1 : 1;
        if (valueA > valueB) return order === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    // Apply pagination if provided
    const total = result.length;
    const page = options?.pagination?.page || 1;
    const pageSize = options?.pagination?.pageSize || total;
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = result.slice(startIndex, startIndex + pageSize);
    
    return {
      data: paginatedItems,
      pagination: {
        page,
        pageSize,
        total
      }
    };
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const now = new Date();
    const id = this.generateId();
    
    // Create new entity with required fields
    const newEntity = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    } as T;
    
    this.collection.push(newEntity);
    
    logger.debug(`Created new ${this.entityName} with ID: ${id}`);
    return newEntity;
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const index = this.collection.findIndex(entity => entity.id === id);
    if (index === -1) {
      logger.debug(`${this.entityName} with ID ${id} not found for update`);
      return null;
    }
    
    const updatedEntity = {
      ...this.collection[index],
      ...data,
      updatedAt: new Date()
    };
    
    this.collection[index] = updatedEntity;
    
    logger.debug(`Updated ${this.entityName} with ID: ${id}`);
    return updatedEntity;
  }

  async delete(id: string): Promise<boolean> {
    const initialLength = this.collection.length;
    this.collection = this.collection.filter(entity => entity.id !== id);
    
    const success = initialLength > this.collection.length;
    logger.debug(`Deleted ${this.entityName} with ID ${id}: ${success}`);
    
    return success;
  }

  protected generateId(): string {
    // Simple ID generation
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }
}