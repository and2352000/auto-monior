import { Label } from '../index';
import CreateAutoMonitor from '../index';

describe('AutoMonitor', () => {
  let mockCallback: jest.Mock;
  let AutoMonitor: any;

  beforeEach(() => {
    mockCallback = jest.fn();
    AutoMonitor = CreateAutoMonitor(mockCallback);
  });

  describe('Label decorator', () => {
    it('should add label extractor to method', () => {
      class TestClass {
        @Label((arg: number) => ({test: arg}))
        testMethod(arg: number) {}
      }

      const instance = new TestClass();
      expect((instance.testMethod as any).__labelExtractor).toBeDefined();
    });
  });

  describe('AutoMonitor decorator', () => {
    it('should monitor sync method execution', () => {
      @AutoMonitor
      class TestClass {
        testMethod() {
          return 'result';
        }
      }

      const instance = new TestClass();
      instance.testMethod();

      expect(mockCallback).toHaveBeenCalledWith(
        'testMethod',
        expect.any(Number),
        false,
        {}
      );
    });

    it('should monitor async method execution', async () => {
      @AutoMonitor
      class TestClass {
        async testMethod() {
          await new Promise(resolve => setTimeout(resolve, 100));
          return 'result';
        }
      }

      const instance = new TestClass();
      await instance.testMethod();

      expect(mockCallback).toHaveBeenCalledWith(
        'testMethod',
        expect.any(Number),
        false,
        {}
      );
    });

    it('should monitor method with labels', () => {
      @AutoMonitor
      class TestClass {
        @Label((arg: number) => ({test: arg}))
        testMethod(arg: number) {}
      }

      const instance = new TestClass();
      instance.testMethod(123);

      expect(mockCallback).toHaveBeenCalledWith(
        'testMethod',
        expect.any(Number),
        false,
        {test: 123}
      );
    });

    it('should monitor method errors', () => {
      @AutoMonitor
      class TestClass {
        testMethod() {
          throw new Error('Test error');
        }
      }

      const instance = new TestClass();
      expect(() => instance.testMethod()).toThrow('Test error');

      expect(mockCallback).toHaveBeenCalledWith(
        'testMethod',
        expect.any(Number),
        true,
        {}
      );
    });

    it('should monitor static methods', () => {
      @AutoMonitor
      class TestClass {
        static testMethod() {
          return 'result';
        }
      }

      TestClass.testMethod();

      expect(mockCallback).toHaveBeenCalledWith(
        'testMethod',
        expect.any(Number),
        false,
        {}
      );
    });
  });
});
