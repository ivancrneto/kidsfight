module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: ["jest-canvas-mock"],
  testMatch: ["**/?(*.)+(test).[jt]s", "**/?(*.)+(test).mjs"],
  transform: {},
  moduleNameMapper: {
    '^phaser3spectorjs$': '<rootDir>/test_helpers/phaser3spectorjs.mjs',
    '\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/__mocks__/fileMock.js'
  },
  transformIgnorePatterns: []
};
