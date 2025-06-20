// Global Jest setup to patch all scenes with Phaser mocks before each test
import { patchSceneWithPhaserMocks } from './test-utils-phaser';

beforeEach(() => {
  // Patch global.scene if it exists (legacy pattern)
  if (global.scene) {
    patchSceneWithPhaserMocks(global.scene);
  }
  // Optionally, patch any other global scenes or test-specific scenes here
});

// Optionally, export for explicit use in test files
export { patchSceneWithPhaserMocks };
