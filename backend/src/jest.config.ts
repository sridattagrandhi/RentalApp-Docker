// backend/jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],

  // --- MODIFICATION: Explicitly tell Jest to use ts-jest for all .ts files ---
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  // --- END OF MODIFICATION ---
  
  // This will prevent Jest from using Babel to transform your TS files
  // and will rely on ts-jest instead.
  transformIgnorePatterns: ['node_modules/(?!(.*ts-jest.*))'],

  clearMocks: true,
  verbose: true,

  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
    },
  },
};

export default config;