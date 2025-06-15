// tests/integration/sample.service.test.ts
import { ServiceBroker, Context } from 'moleculer';
import SampleService from '../../src/services/sample.service';
import { ISampleEntity } from '../../src/domain/entities/sample.entity';

describe('Sample Service Integration Tests', () => {
  // Create a new broker for testing
  const broker = new ServiceBroker({
    logger: false, // Disable logger for tests
    transporter: 'fake'  // Use fake transporter for testing
  });

  // Create a mock repository that will be used by the service
  const mockRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  };

  // Mock dependencies before starting broker
  jest.mock('../../src/application/di-container', () => ({
    __esModule: true,
    default: {
      resolve: (name: string) => {
        // Return mock implementations for services
        if (name === 'sampleService') {
          return {
            getAll: async (filter, page, pageSize) => {
              // Mock implementation of the sample service
              return mockRepository.findAll(filter, page, pageSize);
            },
            getById: async (id) => {
              return mockRepository.findById(id);
            },
            create: async (data) => {
              return mockRepository.create(data);
            },
            update: async (id, data) => {
              return mockRepository.update(id, data);
            },
            delete: async (id) => {
              return mockRepository.delete(id);
            }
          };
        }
        throw new Error(`Unknown dependency: ${name}`);
      }
    }
  }));

  // Load the sample service
  broker.createService(SampleService);

  // Start the broker before all tests
  beforeAll(() => broker.start());

  // Stop the broker after all tests
  afterAll(() => broker.stop());

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('list action', () => {
    it('should return all samples with default pagination', async () => {
      // Arrange
      const samples: ISampleEntity[] = [
        {
          id: '1',
          name: 'Sample 1',
          description: 'First sample',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          name: 'Sample 2',
          description: 'Second sample',
          status: 'inactive',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      mockRepository.findAll.mockResolvedValue({
        data: samples,
        pagination: {
          page: 1,
          pageSize: 10,
          total: 2
        }
      });
      
      // Act
      const result = await broker.call('v1.sample.list');
      
      // Assert
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('data');
      expect(result.data.data).toHaveLength(2);
      expect(mockRepository.findAll).toHaveBeenCalledWith(undefined, 1, 10);
    });

    it('should apply filters and pagination', async () => {
      // Arrange
      const filter = { status: 'active' };
      const page = 2;
      const pageSize = 5;
      
      mockRepository.findAll.mockResolvedValue({
        data: [],
        pagination: {
          page,
          pageSize,
          total: 10
        }
      });
      
      // Act
      const result = await broker.call('v1.sample.list', { filter, page, pageSize });
      
      // Assert
      expect(mockRepository.findAll).toHaveBeenCalledWith(filter, page, pageSize);
    });
  });

  describe('get action', () => {
    it('should return a single sample by ID', async () => {
      // Arrange
      const sampleData: ISampleEntity = {
        id: '1',
        name: 'Test Sample',
        description: 'Sample for testing',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockRepository.findById.mockResolvedValue(sampleData);
      
      // Act
      const result = await broker.call('v1.sample.get', { id: '1' });
      
      // Assert
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result.data).toEqual(sampleData);
      expect(mockRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should return error when sample not found', async () => {
      // Arrange
      mockRepository.findById.mockImplementation(() => {
        const error = new Error('Sample not found with ID: 999');
        error.name = 'NotFoundError';
        throw error;
      });
      
      // Act
      const result = await broker.call('v1.sample.get', { id: '999' });
      
      // Assert
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(result.error).toHaveProperty('message', 'Sample not found with ID: 999');
    });
  });

  describe('create action', () => {
    it('should create a new sample', async () => {
      // Arrange
      const input = {
        name: 'New Sample',
        description: 'This is a new sample',
        status: 'active'
      };
      
      const createdSample: ISampleEntity = {
        ...input,
        id: 'new-id',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockRepository.create.mockResolvedValue(createdSample);
      
      // Act
      const result = await broker.call('v1.sample.create', input);
      
      // Assert
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result.data).toEqual(createdSample);
      expect(mockRepository.create).toHaveBeenCalledWith(input);
    });

    it('should return validation error for invalid input', async () => {
      // Arrange
      const input = {
        name: '', // Invalid - empty name
        description: 'This is a sample with empty name'
      };
      
      mockRepository.create.mockImplementation(() => {
        const error = new Error('Sample name is required');
        error.name = 'ValidationError';
        throw error;
      });
      
      // Act
      const result = await broker.call('v1.sample.create', input);
      
      // Assert
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(result.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('update action', () => {
    it('should update an existing sample', async () => {
      // Arrange
      const id = '1';
      const updateData = {
        name: 'Updated Sample',
        status: 'inactive'
      };
      
      const updatedSample: ISampleEntity = {
        id,
        name: 'Updated Sample',
        description: 'Original description',
        status: 'inactive',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockRepository.update.mockResolvedValue(updatedSample);
      
      // Act
      const result = await broker.call('v1.sample.update', { id, ...updateData });
      
      // Assert
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result.data.name).toBe('Updated Sample');
      expect(result.data.status).toBe('inactive');
      expect(mockRepository.update).toHaveBeenCalledWith(id, updateData);
    });
  });

  describe('remove action', () => {
    it('should delete a sample', async () => {
      // Arrange
      const id = '1';
      mockRepository.delete.mockResolvedValue(true);
      
      // Act
      const result = await broker.call('v1.sample.remove', { id });
      
      // Assert
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data', true);
      expect(mockRepository.delete).toHaveBeenCalledWith(id);
    });
  });

  describe('process queue message action', () => {
    it('should process create message from queue', async () => {
      // Arrange
      const message = {
        action: 'create',
        sample: {
          name: 'Queue Sample',
          description: 'Created from queue',
          status: 'pending'
        }
      };
      
      // Act
      const result = await broker.call('v1.sample.processQueueMessage', { data: message });
      
      // Assert
      expect(result).toHaveProperty('success', true);
      expect(mockRepository.create).toHaveBeenCalledWith(message.sample);
    });
  });

  describe('process serverless event action', () => {
    it('should process get event from serverless function', async () => {
      // Arrange
      const event = {
        type: 'get',
        id: '1'
      };
      
      const sample: ISampleEntity = {
        id: '1',
        name: 'Serverless Sample',
        description: 'Retrieved via serverless',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockRepository.findById.mockResolvedValue(sample);
      
      // Act
      const result = await broker.call('v1.sample.processServerlessEvent', { event });
      
      // Assert
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(mockRepository.findById).toHaveBeenCalledWith('1');
    });
  });
});