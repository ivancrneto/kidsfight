module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts', '.jsx', '.tsx', '.json'],
  moduleNameMapper: {
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
    '^.+\\.mjs$': ['babel-jest', { configFile: './babel.config.js' }]
  },
  testMatch: [
    '**/__tests__/server.test.js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs', 'json', 'node'],
  collectCoverage: false,
};
