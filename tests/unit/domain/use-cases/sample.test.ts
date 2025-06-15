// tests/unit/domain/use-cases/sample.test.ts
import { GetSampleUseCase } from '../../../../src/domain/use-cases/sample/get-sample.use-case';
import { CreateSampleUseCase } from '../../../../src/domain/use-cases/sample/create-sample.use-case';
import { ISampleEntity } from '../../../../src/domain/entities/sample.entity';
import { NotFoundError, ValidationError } from '../../../../src/types';

// Mock repository for testing
class MockSampleRepository {
  private items: Map<string, ISampleEntity>;

  constructor(initialItems: ISampleEntity[] = []) {
    this.items = new Map();
    initialItems.forEach(item => this.items.set(item.id, item));
  }

  async findById(id: string): Promise<ISampleEntity | null> {
    return this.items.get(id) || null;
  }

  async create(item: Omit<ISampleEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ISampleEntity> {
    const now = new Date();
    const id = `mock-id-${Date.now()}`;
    const newItem: ISampleEntity = {
      ...item,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.items.set(id, newItem);
    return newItem;
  }

  // Add other methods as needed by use cases
  async findAll() {
    return {
      data: Array.from(this.items.values()),
      pagination: {
        page: 1,
        pageSize: 10,
        total: this.items.size
      }
    };
  }

  async update(id: string, update: Partial<ISampleEntity>): Promise<ISampleEntity | null> {
    const item = this.items.get(id);
    if (!item) return null;
    
    const updated = {
      ...item,
      ...update,
      id, // Preserve ID
      updatedAt: new Date()
    };
    
    this.items.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.items.delete(id);
  }
}

describe('Sample Use Cases Tests', () => {
  // Sample test data
  const sampleData: ISampleEntity = {
    id: '1',
    name: 'Test Sample',
    description: 'This is a test sample',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  describe('GetSampleUseCase', () => {
    it('should get a sample by ID successfully', async () => {
      // Arrange
      const repository = new MockSampleRepository([sampleData]);
      const useCase = new GetSampleUseCase(repository as any);
      
      // Act
      const result = await useCase.execute({ id: '1' });
      
      // Assert
      expect(result).toBeDefined();
      expect(result.sample).toBeDefined();
      expect(result.sample.id).toBe('1');
      expect(result.sample.name).toBe('Test Sample');
    });

    it('should throw NotFoundError when sample does not exist', async () => {
      // Arrange
      const repository = new MockSampleRepository();
      const useCase = new GetSampleUseCase(repository as any);
      
      // Act & Assert
      await expect(useCase.execute({ id: 'non-existent' }))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should throw ValidationError when ID is not provided', async () => {
      // Arrange
      const repository = new MockSampleRepository();
      const useCase = new GetSampleUseCase(repository as any);
      
      // Act & Assert
      await expect(useCase.execute({ id: '' }))
        .rejects
        .toThrow(ValidationError);
    });
  });

  describe('CreateSampleUseCase', () => {
    it('should create a sample successfully', async () => {
      // Arrange
      const repository = new MockSampleRepository();
      const useCase = new CreateSampleUseCase(repository as any);
      const input = {
        name: 'New Sample',
        description: 'This is a new sample',
        status: 'active' as const
      };
      
      // Act
      const result = await useCase.execute(input);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.sample).toBeDefined();
      expect(result.sample.name).toBe('New Sample');
      expect(result.sample.status).toBe('active');
    });

    it('should use default status when not provided', async () => {
      // Arrange
      const repository = new MockSampleRepository();
      const useCase = new CreateSampleUseCase(repository as any);
      const input = {
        name: 'Another Sample',
        description: 'This is another sample'
      };
      
      // Act
      const result = await useCase.execute(input);
      
      // Assert
      expect(result.sample.status).toBe('pending');
    });

    it('should throw ValidationError when name is empty', async () => {
      // Arrange
      const repository = new MockSampleRepository();
      const useCase = new CreateSampleUseCase(repository as any);
      const input = {
        name: '',
        description: 'This is a sample with no name'
      };
      
      // Act & Assert
      await expect(useCase.execute(input))
        .rejects
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when description is empty', async () => {
      // Arrange
      const repository = new MockSampleRepository();
      const useCase = new CreateSampleUseCase(repository as any);
      const input = {
        name: 'No Description Sample',
        description: ''
      };
      
      // Act & Assert
      await expect(useCase.execute(input))
        .rejects
        .toThrow(ValidationError);
    });

    it('should throw ValidationError when status is invalid', async () => {
      // Arrange
      const repository = new MockSampleRepository();
      const useCase = new CreateSampleUseCase(repository as any);
      const input = {
        name: 'Invalid Status',
        description: 'This has an invalid status',
        status: 'invalid' as any
      };
      
      // Act & Assert
      await expect(useCase.execute(input))
        .rejects
        .toThrow(ValidationError);
    });
  });
});