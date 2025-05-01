/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
      '^.+\\.tsx?$': ['ts-jest', {
        tsconfig: {
          experimentalDecorators: true,
          emitDecoratorMetadata: true
        }
      }]
    }
  };