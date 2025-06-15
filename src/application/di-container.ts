// src/application/di-container.ts
import { createContainer, asClass, asValue, asFunction, InjectionMode, AwilixContainer } from 'awilix';
import { ISampleEntity } from '../domain/entities/sample.entity';
import { IBaseRepository } from '../domain/interfaces/repositories/base.repository.interface';
import { IBaseService } from '../domain/interfaces/services/base.service.interface';
import { BaseRepository } from '../infrastructure/repositories/base.repository';
import { SampleService } from './services/sample.service';
import logger from '../utils/logger';
import { db } from '../infrastructure/db';

// Create a container for dependency injection
const container = createContainer({
  injectionMode: InjectionMode.PROXY
});

// Configure dependency injection container
export function configureContainer(): AwilixContainer {
  const diLogger = logger.child({ component: 'DIContainer' });
  
  try {
    diLogger.info('Configuring dependency injection container');
    
    // Register repositories
    container.register({
      // Base repositories
      sampleRepository: asClass<IBaseRepository<ISampleEntity>>(BaseRepository).singleton(),
      
      // Services
      sampleService: asClass<IBaseService<ISampleEntity>>(SampleService).singleton(),
      
      // Infrastructure
      db: asValue(db),
      logger: asValue(logger),
    });
    
    diLogger.info('Dependency injection container configured successfully');
    return container;
  } catch (error) {
    diLogger.error(error, 'Error configuring dependency injection container');
    throw error;
  }
}

// Create and export a singleton container instance
export default configureContainer();