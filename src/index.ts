type Label = Record<string, string | number | boolean>;
type LabelExtractor = (...args: any[]) => Label;

interface FunctionWithLabel extends Function {
  __labelExtractor?: LabelExtractor;
}

export function Label(extractor: LabelExtractor) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    (descriptor.value as FunctionWithLabel).__labelExtractor = extractor;
  };
}

type MetricCallback = (methodName: string, duration: number, isError: boolean, labels?: Label) => void;

function Metric(_constructor: Function, propertyKey: string, descriptor: PropertyDescriptor, callback: MetricCallback) {
    const originalMethod = descriptor.value as FunctionWithLabel;

    descriptor.value = function (...args: any[]) {
      const start = performance.now();

      let labels: Label = {};
      if (originalMethod.__labelExtractor) {
        labels = originalMethod.__labelExtractor(...args);
      }
      const handleMetric = (duration: number, isError: boolean) => {
        callback(propertyKey, duration, isError, labels);
      };
      try{
        const result = originalMethod.apply(this, args);
        //async function
        if (result instanceof Promise) {
          return result.then((res) => {
            const time = performance.now() - start;
            handleMetric(time, false);
            return res;
          }).catch((err) => {
            const time = performance.now() - start;
            handleMetric(time, true);
            throw err;
          });
        }
        //sync function 
        const time = performance.now() - start;
        handleMetric(time, false);
        return result;
      }catch(err){
        const time = performance.now() - start;
        handleMetric(time, true );
        throw err;
      }
    };
  }

export default function CreateAutoMonitor(callback: MetricCallback){
  return function (constructor: Function) {
    const prototype = constructor.prototype;
  
    // instance methods
    const instanceMethods = Object.getOwnPropertyNames(prototype)
      .filter(key => key !== 'constructor' && typeof prototype[key] === 'function');
  
    for (const name of instanceMethods) {
      const descriptor = Object.getOwnPropertyDescriptor(prototype, name);
      if (descriptor) {
        Metric(constructor, name, descriptor,callback);
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
