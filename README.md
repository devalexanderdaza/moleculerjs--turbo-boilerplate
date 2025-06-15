# MoleculerJS Microservices Boilerplate

A highly customizable, production-ready microservices boilerplate built with MoleculerJS, TypeScript, and Node.js 20+. This template implements hexagonal architecture principles to create maintainable, scalable, and infrastructure-agnostic microservices.

## Features

- ✅ **MoleculerJS**: Fast and scalable microservices framework
- ✅ **TypeScript**: Full type safety across the application
- ✅ **Hexagonal Architecture**: Clear separation of concerns
- ✅ **Dependency Injection**: Using Awilix for IoC container
- ✅ **Multiple Transport Methods**:
  - API Gateway
  - Standalone REST Service
  - Queue-based processing
  - Serverless functions
- ✅ **Production Ready**: Optimized for performance and reliability
- ✅ **Infrastructure Agnostic**: Runs anywhere Node.js runs
- ✅ **Docker Support**: Ready for containerized deployment
- ✅ **Comprehensive Testing**: Unit and integration test examples

## Architecture Overview

The boilerplate follows the hexagonal architecture (ports and adapters) pattern:

# MoleculerJS Microservices Boilerplate

I've created a comprehensive boilerplate for building microservices with MoleculerJS, TypeScript, and Node.js 20+ following hexagonal architecture principles. Here's an overview of what's included:

## Architecture

The boilerplate implements hexagonal architecture (ports and adapters pattern) with the following layers:

1. **Domain Layer**:
   - Entities: Core business objects (e.g., `SampleEntity`)
   - Use Cases: Business logic implementation (e.g., `GetSampleUseCase`, `CreateSampleUseCase`)
   - Interfaces: Ports for repositories and services

2. **Application Layer**:
   - Services: Orchestrates use cases to fulfill business operations
   - Dependency Injection: Container to manage dependencies

3. **Infrastructure Layer**:
   - Repositories: Data access implementations
   - Transports: Communication methods (API Gateway, REST, Queue, Serverless)

4. **Interface Layer**:
   - MoleculerJS Services: Exposing functionality as microservices

## Key Features

- **Multiple Transport Methods**: API Gateway, standalone REST, Queue-based processing, Serverless functions
- **Dependency Injection**: Using Awilix for IoC container
- **Input Validation**: Parameter validation for all actions
- **Comprehensive Error Handling**: Standardized error responses
- **Logging**: Structured logging with Pino
- **Testing**: Unit and integration test examples
- **Docker Support**: Ready for containerized deployment
- **Environment Configuration**: Flexible configuration system

## Getting Started

1. Clone the repository
2. Create a `.env` file based on `.env.example`
3. Install dependencies: `npm install`
4. Start in development mode: `npm run dev`

## Creating New Services

To create a new microservice following the hexagonal architecture pattern:

1. Define your domain entity in `src/domain/entities/`
2. Create repository interface in `src/domain/interfaces/repositories/`
3. Implement use cases in `src/domain/use-cases/`
4. Create repository implementation in `src/infrastructure/repositories/`
5. Register dependencies in `src/application/di-container.ts`
6. Create MoleculerJS service in `src/services/`

## Example Use Cases

### As a REST API

```
GET /api/samples         # List all samples
GET /api/samples/:id     # Get one sample
POST /api/samples        # Create a sample
PUT /api/samples/:id     # Update a sample
DELETE /api/samples/:id  # Delete a sample
```

### As Direct Service Calls

```typescript
// Call service directly within Moleculer ecosystem
await broker.call('v1.sample.get', { id: '123' });
```

### As Queue-Based Processing

```typescript
// Publish a message to be processed asynchronously
await broker.call('queue-transport.publish', {
  queue: 'sample-queue',
  message: {
    action: 'create',
    sample: {
      name: 'Sample from queue',
      description: 'Created via message queue'
    }
  }
});
```

### As Serverless Function

```typescript
// Process event from serverless environment
await broker.call('serverless-transport.handler', {
  event: {
    type: 'create',
    data: {
      name: 'Serverless Sample',
      description: 'Created via serverless function'
    }
  }
});
```

## Testing

- Run unit tests: `npm run test:unit`
- Run integration tests: `npm run test:integration`
- Run all tests with coverage: `npm test`

The boilerplate is highly customizable and can be adapted to various deployment environments including DigitalOcean App Platform, Docker, Kubernetes, or traditional servers.
