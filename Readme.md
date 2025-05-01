# Auto Monitor SDK Documentation

## Overview
Auto Monitor is a light way TypeScript SDK designed for automatic method monitoring and metrics collection in your applications. This SDK provides a seamless way to track method execution times, monitor errors, and collect custom metrics with minimal code modification.

## Environment Requirements

### TypeScript Configuration
To use decorators in TypeScript, you need to enable experimental decorators in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    // ... other options
  }
}
```

### Dependencies
- TypeScript >= 5.x

## Installation
```bash
npm install auto-monitor
```

## Basic Usage

### Custom Metric Handling
```typescript
const AutoMonitor = CreateAutoMonitor((
  methodName: string,
  duration: number,
  isError: boolean,
  labels?: Label[]
) => {
  console.log({
    method: methodName,
    executionTime: duration,
    failed: isError,
    metadata: labels
  });
});

@AutoMonitor
class MonitoredService {
  // Your class implementation
}
```

## Complete Example
```typescript
import { AutoMonitor, Label } from 'auto-monitor';

@AutoMonitor
class ExampleService {
  // Instance method with label
  @Label((orderId: number) => ({orderId}))
  async processOrder(orderId: number) {
    await new Promise(res => setTimeout(res, 100));
    return `Order ${orderId} processed`;
  }

  // Static method with label
  @Label((username: string) => ({user}))
  static greet(username: string) {
    return `Hello, ${username}!`;
  }
}

// Usage
const service = new ExampleService();
await service.processOrder(123);
ExampleService.greet("John");
```

