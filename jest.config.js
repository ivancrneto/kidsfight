module.exports = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '^@/websocket_manager$': '<rootDir>/__mocks__/websocket_manager',
    '^websocket_manager$': '<rootDir>/__mocks__/websocket_manager',
    '^\.\/websocket_manager$': '<rootDir>/__mocks__/websocket_manager',
    '^\.\/websocket_manager.ts$': '<rootDir>/__mocks__/websocket_manager.ts',
    '^websocket-manager$': '<rootDir>/__mocks__/websocket_manager.ts',
    '^phaser$': '<rootDir>/__mocks__/phaser.js',
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.mjs$': 'babel-jest',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
    '**/__tests__/**/*.test.mjs',
    '**/__tests__/**/*.test.cjs',
  ],
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  // Reset the module registry before running each individual test
  resetModules: true,
  // Automatically reset mock state between all tests
  resetMocks: true,
  // Automatically restore mock state between all tests
  restoreMocks: true,
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  // An array of file extensions your modules use
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node', 'mjs', 'cjs'],
  // A list of paths to directories that Jest should use to search for files in
  roots: ['<rootDir>/src', '<rootDir>/__tests__', '<rootDir>/__mocks__'],
  // Setup files to run before each test
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Ignore node_modules for transforms
  transformIgnorePatterns: [
    '/node_modules/(?!(phaser|@phaser)/)',
  ],
};
