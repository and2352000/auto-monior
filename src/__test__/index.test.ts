import { MethodLabel } from '../index';
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
        @MethodLabel((arg: number) => ({test: arg}))
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
        {
          methodName: 'testMethod',
          duration: expect.any(Number),
          data: 'result',
          labels: {},
          error: undefined
        }
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
        {
          methodName: 'testMethod',
          duration: expect.any(Number),
          data: 'result',
          labels: {},
          error: undefined
        }
      );
    });

    it('should monitor method with labels', () => {
      @AutoMonitor
      class TestClass {
        @MethodLabel((arg: number) => ({test: arg}))
        testMethod(arg: number) {}
      }

      const instance = new TestClass();
      instance.testMethod(123);

      expect(mockCallback).toHaveBeenCalledWith(
        {
          methodName: 'testMethod',
          duration: expect.any(Number),
          data: undefined,
          labels: {test: 123},
          error: undefined
        }
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
        {
          methodName: 'testMethod',
          duration: expect.any(Number),
          data: undefined,
          labels: {},
          error: expect.any(Error)
        }
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
        {
          methodName: 'testMethod',
          duration: expect.any(Number),
          data: 'result',
          labels: {},
          error: undefined
        }
      );
    });
  });
});
