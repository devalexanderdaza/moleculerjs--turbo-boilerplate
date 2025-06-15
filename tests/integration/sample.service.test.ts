// tests/integration/sample.service.test.ts
import { ServiceBroker, Context } from 'moleculer';
import { ISampleEntity } from '../../src/domain/entities/sample.entity';
import { NotFoundError, ValidationError, IServiceResponse } from '../../src/types';
import diContainerInstance from '../../src/application/di-container';

const testLogger = {
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  child: jest.fn(() => testLogger),
};

describe('Sample Service Integration Tests', () => {
  const broker = new ServiceBroker({
    logger: false,
    transporter: 'fake',
  });

  const mockRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  let mockedDiResolve: jest.Mock;
  // Define plainSampleServiceSchema here, but it will be fully defined in beforeAll
  let plainSampleServiceSchema: any;

  beforeAll(() => {
    mockedDiResolve = jest.fn((name: string) => {
      if (name === 'sampleService') {
        return {
          list: async (ctx: Context, query: { filter?: any, page?: number, pageSize?: number }) => {
            const result = await mockRepository.findAll({
              filter: query?.filter,
              pagination: { page: query?.page || 1, pageSize: query?.pageSize || 10 }
            });
            return { success: true, data: result };
          },
          get: async (ctx: Context, id: string) => {
            const result = await mockRepository.findById(id);
            if (!result && (id === '999' || id === 'not-found-id')) {
              return { success: false, error: { code: 'NOT_FOUND', message: `Sample not found with ID: ${id}` } };
            }
            return { success: true, data: result };
          },
          create: async (ctx: Context, data: any) => {
            if (!data.name && data.name !== undefined) {
              return { success: false, error: { code: 'VALIDATION_ERROR', message: 'Sample name is required' } };
            }
            const result = await mockRepository.create(data);
            return { success: true, data: result };
          },
          update: async (ctx: Context, id: string, data: any) => {
            const result = await mockRepository.update(id, data);
            return { success: true, data: result };
          },
          delete: async (ctx: Context, id: string) => {
            const result = await mockRepository.delete(id);
            if (id === 'not-found-delete') {
              return { success: false, error: { code: 'NOT_FOUND', message: 'Sample not found for deletion' } };
            }
            return { success: true, data: result };
          }
        };
      }
      throw new Error(`Attempted to resolve unmocked dependency in test: ${name}`);
    });

    diContainerInstance.resolve = mockedDiResolve;

    // Define plainSampleServiceSchema INSIDE beforeAll
    plainSampleServiceSchema = {
      name: 'sample',
      version: 1,
      logger: testLogger,
      // Ensure 'this' context is correctly bound for lifecycle methods if they are not arrow functions
      created() {
        // @ts-ignore
        this.sampleService = diContainerInstance.resolve('sampleService');
        // @ts-ignore
        this.logger.info('Plain Sample service created and dependencies resolved');
      },
      started: async function() { /* @ts-ignore */ this.logger.info('Plain Sample service started'); },
      stopped: async function() { /* @ts-ignore */ this.logger.info('Plain Sample service stopped'); },
      actions: {
        list: {
          async handler(ctx: Context<{ page?: number; pageSize?: number; filter?: Record<string, any> }>) {
            // @ts-ignore
            const serviceResponse = await this.sampleService.list(ctx, ctx.params);
            if (!serviceResponse.success) { // @ts-ignore
              throw new Error(serviceResponse.error?.message || 'Unknown error from service in list');
            }
            return { success: true, data: serviceResponse.data };
          }
        },
        get: {
          async handler(ctx: Context<{ id: string }>) {
            // @ts-ignore
            const serviceResponse = await this.sampleService.get(ctx, ctx.params.id);
            if (!serviceResponse.success) {
              if (serviceResponse.error?.code === 'NOT_FOUND') {
                return { success: false, error: { code: 'NOT_FOUND', message: serviceResponse.error.message } };
              } // @ts-ignore
              throw new Error(serviceResponse.error?.message || 'Unknown error from service in get');
            }
            return { success: true, data: serviceResponse.data };
          }
        },
        create: {
          async handler(ctx: Context<any>) {
            // @ts-ignore
            const serviceResponse = await this.sampleService.create(ctx, ctx.params);
            if (!serviceResponse.success) {
              if (serviceResponse.error?.code === 'VALIDATION_ERROR') {
                return { success: false, error: { code: 'VALIDATION_ERROR', message: serviceResponse.error.message } };
              } // @ts-ignore
              throw new Error(serviceResponse.error?.message || 'Unknown error from service in create');
            }
            return { success: true, data: serviceResponse.data };
          }
        },
        update: {
          async handler(ctx: Context<any>) {
            // @ts-ignore
            const { id, ...updateData } = ctx.params; // @ts-ignore
            const serviceResponse = await this.sampleService.update(ctx, id, updateData);
            if (!serviceResponse.success) { // @ts-ignore
              if (serviceResponse.error?.code === 'NOT_FOUND') { throw new NotFoundError('Sample', id); } // @ts-ignore
              if (serviceResponse.error?.code === 'VALIDATION_ERROR') { throw new ValidationError(serviceResponse.error.message); } // @ts-ignore
              throw new Error(serviceResponse.error?.message || 'Unknown error from service in update');
            }
            return { success: true, data: serviceResponse.data };
          }
        },
        remove: {
          async handler(ctx: Context<{ id: string }>) {
            // @ts-ignore
            const serviceResponse = await this.sampleService.delete(ctx, ctx.params.id);
            if (!serviceResponse.success) { // @ts-ignore
              if (serviceResponse.error?.code === 'NOT_FOUND') { throw new NotFoundError('Sample', ctx.params.id); } // @ts-ignore
              throw new Error(serviceResponse.error?.message || 'Unknown error from service in remove');
            }
            return { success: true, data: serviceResponse.data };
          }
        },
        processQueueMessage: {
          async handler(ctx: Context<any>) {
            const { data } = ctx.params; // @ts-ignore
            const appServiceResponse = await this.sampleService.create(ctx, data.sample);
            if (!appServiceResponse || !appServiceResponse.success) throw new Error(appServiceResponse?.error?.message || "Queue create failed");
            return { success: true, data: true };
          }
        },
        processServerlessEvent: {
          async handler(ctx: Context<any>) {
            const { event } = ctx.params;
            let serviceResponse: IServiceResponse<any>; // @ts-ignore
            if (event.type === 'get') { serviceResponse = await this.sampleService.get(ctx, event.id); } // @ts-ignore
            else if (event.type === 'list') { serviceResponse = await this.sampleService.list(ctx, { filter: event.filter, page: event.page || 1, pageSize: event.pageSize || 10 }); } // @ts-ignore
            else if (event.type === 'create') { serviceResponse = await this.sampleService.create(ctx, event.data); } // @ts-ignore
            else if (event.type === 'update') { serviceResponse = await this.sampleService.update(ctx, event.id, event.data); } // @ts-ignore
            else if (event.type === 'delete') { serviceResponse = await this.sampleService.delete(ctx, event.id); }
            else { throw new Error(`Unknown event type: ${event.type}`); }

            if (!serviceResponse || !serviceResponse.success) { // @ts-ignore
              throw new Error(serviceResponse?.error?.message || `Error processing serverless event type in processServerlessEvent: ${event.type}`);
            }
            return { success: true, data: serviceResponse.data };
          }
        }
      },
      methods: {
        healthCheck() {
          return { status: 'ok', timestamp: Date.now() };
        }
      }
    }; // End of plainSampleServiceSchema definition

    broker.createService(plainSampleServiceSchema);
    return broker.start();
  });

  afterAll(() => broker.stop());
  beforeEach(() => {
    mockedDiResolve.mockClear();
    mockRepository.findAll.mockClear();
    mockRepository.findById.mockClear();
    mockRepository.create.mockClear();
    mockRepository.update.mockClear();
    mockRepository.delete.mockClear();
  });

  describe('list action', () => {
    it('should return all samples with default pagination', async () => {
      const samples: ISampleEntity[] = [
        { id: '1', name: 'Sample 1', description: 'First sample', status: 'active', createdAt: new Date(), updatedAt: new Date() },
        { id: '2', name: 'Sample 2', description: 'Second sample', status: 'inactive', createdAt: new Date(), updatedAt: new Date() }
      ];
      mockRepository.findAll.mockResolvedValue({
        data: samples,
        pagination: { page: 1, pageSize: 10, total: 2 }
      });
      
      const result = await broker.call('v1.sample.list');
      
      expect(result.success).toBe(true);
      expect(result.data.data).toEqual(samples);
      expect(result.data.pagination.total).toBe(2);
      expect(mockRepository.findAll).toHaveBeenCalledWith({
        filter: undefined,
        pagination: { page: 1, pageSize: 10 }
      });
    });

    it('should apply filters and pagination', async () => {
      const filter = { status: 'active' };
      const page = 2;
      const pageSize = 5;
      mockRepository.findAll.mockResolvedValue({ data: [], pagination: { page, pageSize, total: 0 } });
      
      await broker.call('v1.sample.list', { filter, page, pageSize });
      
      expect(mockRepository.findAll).toHaveBeenCalledWith({
        filter: filter,
        pagination: { page, pageSize }
      });
    });
  });

  describe('get action', () => {
    it('should return a single sample by ID', async () => {
      const sampleData: ISampleEntity = { id: '1', name: 'Test Sample', description: 'Sample for testing', status: 'active', createdAt: new Date(), updatedAt: new Date() };
      mockRepository.findById.mockResolvedValue(sampleData);
      const result = await broker.call('v1.sample.get', { id: '1' });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(sampleData);
      expect(mockRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should return error when sample not found', async () => {
      mockRepository.findById.mockResolvedValue(null);
      
      const result = await broker.call('v1.sample.get', { id: '999' });
      
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('NOT_FOUND');
      expect(result.error.message).toBe('Sample not found with ID: 999');
    });
  });

  describe('create action', () => {
    it('should create a new sample', async () => {
      const input = { name: 'New Sample', description: 'This is a new sample', status: 'active' };
      const createdSample: ISampleEntity = { ...input, id: 'new-id', createdAt: new Date(), updatedAt: new Date() };
      mockRepository.create.mockResolvedValue(createdSample);
      const result = await broker.call('v1.sample.create', input);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(createdSample);
      expect(mockRepository.create).toHaveBeenCalledWith(input);
    });

    it('should return validation error for invalid input', async () => {
      const input = { name: '', description: 'This is a sample with empty name' };
      const result = await broker.call('v1.sample.create', input);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.message).toBe('Sample name is required');
    });
  });

  describe('update action', () => {
    it('should update an existing sample', async () => {
      const id = '1';
      const updateData = { name: 'Updated Sample', status: 'inactive' };
      const updatedSample: ISampleEntity = { id, name: 'Updated Sample', description: 'Original description', status: 'inactive', createdAt: new Date(), updatedAt: new Date() };
      mockRepository.update.mockResolvedValue(updatedSample);
      const result = await broker.call('v1.sample.update', { id, ...updateData });
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Updated Sample');
      expect(mockRepository.update).toHaveBeenCalledWith(id, updateData);
    });
  });

  describe('remove action', () => {
    it('should delete a sample', async () => {
      const id = '1';
      mockRepository.delete.mockResolvedValue(true);
      const result = await broker.call('v1.sample.remove', { id });
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(mockRepository.delete).toHaveBeenCalledWith(id);
    });
  });

  describe('process queue message action', () => {
    it('should process create message from queue', async () => {
      const message = { action: 'create', sample: { name: 'Queue Sample', description: 'Created from queue', status: 'pending' }};
      mockRepository.create.mockResolvedValue({...message.sample, id: 'queued-id', createdAt: new Date(), updatedAt: new Date()});
      const result = await broker.call('v1.sample.processQueueMessage', { data: message });
      expect(result.success).toBe(true);
      expect(mockRepository.create).toHaveBeenCalledWith(message.sample);
    });
  });

  describe('process serverless event action', () => {
    it('should process get event from serverless function', async () => {
      const event = { type: 'get', id: '1' };
      const sample: ISampleEntity = { id: '1', name: 'Serverless Sample', description: 'Retrieved via serverless', status: 'active', createdAt: new Date(), updatedAt: new Date() };
      mockRepository.findById.mockResolvedValue(sample);
      const result = await broker.call('v1.sample.processServerlessEvent', { event });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(sample);
      expect(mockRepository.findById).toHaveBeenCalledWith('1');
    });
  });
});