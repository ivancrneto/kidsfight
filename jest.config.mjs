// Enable ES modules support
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  extensionsToTreatAsEsm: ['.ts', '.jsx', '.tsx', '.json'],
  moduleNameMapper: {
    // Handle image imports
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^phaser$': '<rootDir>/__mocks__/phaser.js',
    '^websocket_manager$': '<rootDir>/__mocks__/websocket_manager',
  },
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', {
      useESM: true,
      tsconfig: 'tsconfig.json',
    }],
    '^.+\\.mjs$': ['babel-jest', { configFile: './babel.config.mjs' }]
  },
  testMatch: [
    '**/__tests__/**/*.test.{js,jsx,ts,tsx,mjs,cjs}'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  transformIgnorePatterns: [
    '/node_modules/(?!(phaser|@phaser)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setupTests.ts'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx,mjs}',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs', 'json', 'node'],
  // Handle ES modules in node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(phaser|@phaser)/)',
  ],
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.jest.json',
    },
  },
};
