// src/types/index.ts
// Type definitions for the entire application

// Base entity interfaces
export interface IEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Generic repository interfaces
export interface IPagination {
  page: number;
  pageSize: number;
  total: number;
}

export interface IQueryOptions {
  pagination?: {
    page: number;
    pageSize: number;
  };
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  filter?: Record<string, any>;
}

export interface IPaginatedResult<T> {
  data: T[];
  pagination: IPagination;
}

// Error types
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id?: string) {
    super(`${entity} not found${id ? ` with ID: ${id}` : ''}`);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Moleculer context extensions
export interface IServiceContext {
  meta: Record<string, any>;
  params: Record<string, any>;
  id: string;
}

// Service response formats
export interface IServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Sample entity types
export interface ISampleEntity extends IEntity {
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'pending';
  metadata?: Record<string, any>;
}

// Generic use case interfaces
export interface IUseCase<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}