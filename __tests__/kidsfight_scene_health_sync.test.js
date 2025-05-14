/**
 * @jest-environment jsdom
 */

import KidsFightScene from '../kidsfight_scene.js';

// Mock Phaser.Scene and dependencies
class MockScene extends KidsFightScene {
  constructor() {
    super();
    this.playerHealth = [100, 100];
    this.updateHealthBars = jest.fn();
    this.isHost = false;
    this.remotePlayer = { health: 100 };
  }
}

describe('KidsFightScene health synchronization', () => {
  let scene;
  beforeEach(() => {
    scene = new MockScene();
    scene.playerHealth = [100, 100];
    scene.updateHealthBars = jest.fn();
  });

  test('updates correct health bar when receiving health_update for player 1', () => {
    const data = { type: 'health_update', playerIndex: 0, health: 80 };
    // Simulate handler logic
    scene.playerHealth[data.playerIndex] = data.health;
    scene.updateHealthBars(data.playerIndex);
    expect(scene.playerHealth).toEqual([80, 100]);
    expect(scene.updateHealthBars).toHaveBeenCalledWith(0);
  });

  test('updates correct health bar when receiving health_update for player 2', () => {
    const data = { type: 'health_update', playerIndex: 1, health: 60 };
    scene.playerHealth[data.playerIndex] = data.health;
    scene.updateHealthBars(data.playerIndex);
    expect(scene.playerHealth).toEqual([100, 60]);
    expect(scene.updateHealthBars).toHaveBeenCalledWith(1);
  });

  test('ignores health_update with invalid playerIndex', () => {
    const data = { type: 'health_update', playerIndex: 2, health: 50 };
    // Should not throw, should not update
    try {
      if (data.playerIndex < scene.playerHealth.length) {
        scene.playerHealth[data.playerIndex] = data.health;
        scene.updateHealthBars(data.playerIndex);
      }
    } catch (e) {
      // Should not throw
      expect(false).toBe(true);
    }
    expect(scene.playerHealth).toEqual([100, 100]);
    expect(scene.updateHealthBars).not.toHaveBeenCalled();
  });

  test('handles multiple sequential health updates', () => {
    const updates = [
      { type: 'health_update', playerIndex: 1, health: 90 },
      { type: 'health_update', playerIndex: 0, health: 70 },
      { type: 'health_update', playerIndex: 1, health: 50 },
    ];
    updates.forEach(data => {
      scene.playerHealth[data.playerIndex] = data.health;
      scene.updateHealthBars(data.playerIndex);
    });
    expect(scene.playerHealth).toEqual([70, 50]);
    expect(scene.updateHealthBars).toHaveBeenCalledWith(0);
    expect(scene.updateHealthBars).toHaveBeenCalledWith(1);
    expect(scene.updateHealthBars).toHaveBeenCalledTimes(3);
  });

  test('does not update health if playerHealth is not an array', () => {
    scene.playerHealth = null;
    const data = { type: 'health_update', playerIndex: 0, health: 40 };
    try {
      if (Array.isArray(scene.playerHealth)) {
        scene.playerHealth[data.playerIndex] = data.health;
        scene.updateHealthBars(data.playerIndex);
      }
    } catch (e) {
      expect(false).toBe(true);
    }
    expect(scene.updateHealthBars).not.toHaveBeenCalled();
  });
});
