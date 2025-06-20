// Jest global setup for KidsFight project: patch Phaser mocks before each test
const { patchSceneWithPhaserMocks } = require('./setupPhaserGlobalMocks');

global.beforeEach(() => {
  if (global.scene) {
    patchSceneWithPhaserMocks(global.scene);
  }
});
