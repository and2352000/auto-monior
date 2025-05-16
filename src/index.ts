type Label = Record<string, string | number | boolean>;
type LabelExtractor = (...args: any[]) => Label;

interface FunctionWithLabel extends Function {
  __labelExtractor?: LabelExtractor;
}

export function MethodLabel(extractor: LabelExtractor) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    (descriptor.value as FunctionWithLabel).__labelExtractor = extractor;
  };
}

interface MetricCallbackArgs {
  methodName: string,
  duration: number,
  data: any,
  error?: Error,
  labels?: Label,
  props: Record<string, any>
}

type MetricCallback = (args: MetricCallbackArgs) => void;

function Metric(_constructor: Function, propertyKey: string, descriptor: PropertyDescriptor, callback: MetricCallback) {
  const originalMethod = descriptor.value as FunctionWithLabel;

  descriptor.value = function (this: any, ...args: any[]) {
    const start = performance.now();
    const propNames = Object.getOwnPropertyNames(this);
    const props = propNames.reduce((acc: any, key) => {
      acc[key] = this[key];
      return acc;
    }, {});

    let labels: Label = {};
    if (originalMethod.__labelExtractor) {
      labels = originalMethod.__labelExtractor(...args);
    }
    const handleMetric = (duration: number, error?: Error, data?: any) => {
      callback({
        methodName: propertyKey,
        duration,
        data,
        labels,
        props,
        error
      });
    };
    try {
      const result = originalMethod.apply(this, args);
      //async function
      if (result instanceof Promise) {
        return result.then((res) => {
          const time = performance.now() - start;
          handleMetric(time, undefined, res);
          return res;
        }).catch((err) => {
          const time = performance.now() - start;
          handleMetric(time, err);
          throw err;
        });
      }
      //sync function 
      const time = performance.now() - start;
      handleMetric(time, undefined, result);
      return result;
    } catch (err) {
      const time = performance.now() - start;
      handleMetric(time, err as Error);
      throw err;
    }
  };
}

function MetricInjector(callback: MetricCallback) {
  return function (constructor: Function) {
    const prototype = constructor.prototype;

    // instance methods
    const instanceMethods = Object.getOwnPropertyNames(prototype)
      .filter(key => key !== 'constructor' && typeof prototype[key] === 'function');

    for (const name of instanceMethods) {
      const descriptor = Object.getOwnPropertyDescriptor(prototype, name);
      if (descriptor) {
        Metric(constructor, name, descriptor, callback);
        Object.defineProperty(prototype, name, descriptor);
      }
    }

    // static methods
    const staticMethods = Object.getOwnPropertyNames(constructor)
      .filter(key => key !== 'prototype' && typeof (constructor as any)[key] === 'function');

    for (const name of staticMethods) {
      const descriptor = Object.getOwnPropertyDescriptor(constructor, name);
      if (descriptor) {
        Metric(constructor, name, descriptor, callback);
        Object.defineProperty(constructor, name, descriptor);
      }
    }
  }
}


interface AutoMonitorCallbackArgs extends MetricCallbackArgs {
  className: string
}

type AutoMonitorCallback = (args: AutoMonitorCallbackArgs) => void;

export default (callback: AutoMonitorCallback) =>
  (className: string, propsLabel: string[]) =>
    MetricInjector((args) => {
      const propsSelected = propsLabel.reduce((acc: any, key: string) => {
        acc[key] = args.props[key as any];
        return acc;
      }, {});
      callback({ ...args, className, props: propsSelected });
    });