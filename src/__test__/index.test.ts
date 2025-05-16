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
        @MethodLabel((arg: number) => ({ test: arg }))
        testMethod(arg: number) { }
      }

      const instance = new TestClass();
      expect((instance.testMethod as any).__labelExtractor).toBeDefined();
    });
  });

  describe('AutoMonitor decorator', () => {
    it('should monitor sync method execution', () => {
      @AutoMonitor('TestClass', ['label'])
      class TestClass {
        public label = 'test'
        testMethod() {
          return 'result';
        }
      }

      const instance = new TestClass();
      instance.testMethod();

      expect(mockCallback).toHaveBeenCalledWith(
        {
          className: 'TestClass',
          methodName: 'testMethod',
          duration: expect.any(Number),
          data: 'result',
          labels: {},
          props: { label: 'test' },
          error: undefined
        }
      );
    });

    it('should monitor async method execution', async () => {
      @AutoMonitor('TestClass', [])
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
          className: 'TestClass',
          methodName: 'testMethod',
          duration: expect.any(Number),
          data: 'result',
          labels: {},
          props: {},
          error: undefined
        }
      );
    });

    it('should monitor method with labels', () => {
      @AutoMonitor('TestClass', [])
      class TestClass {
        @MethodLabel((arg: number) => ({ test: arg }))
        testMethod(arg: number) { }
      }

      const instance = new TestClass();
      instance.testMethod(123);

      expect(mockCallback).toHaveBeenCalledWith(
        {
          className: 'TestClass',
          methodName: 'testMethod',
          duration: expect.any(Number),
          data: undefined,
          labels: { test: 123 },
          props: {},
          error: undefined
        }
      );
    });

    it('should monitor method errors', () => {
      @AutoMonitor('TestClass', [])
      class TestClass {
        testMethod() {
          throw new Error('Test error');
        }
      }

      const instance = new TestClass();
      expect(() => instance.testMethod()).toThrow('Test error');

      expect(mockCallback).toHaveBeenCalledWith(
        {
          className: 'TestClass',
          methodName: 'testMethod',
          duration: expect.any(Number),
          data: undefined,
          labels: {},
          props: {},
          error: expect.any(Error)
        }
      );
    });

    it('should monitor static methods', () => {
      @AutoMonitor('TestClass', [])
      class TestClass {
        static testMethod() {
          return 'result';
        }
      }

      TestClass.testMethod();

      expect(mockCallback).toHaveBeenCalledWith(
        {
          className: 'TestClass',
          methodName: 'testMethod',
          duration: expect.any(Number),
          data: 'result',
          labels: {},
          props: {},
          error: undefined
        }
      );
    });
  });
});
