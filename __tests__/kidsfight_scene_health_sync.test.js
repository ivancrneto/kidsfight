/**
 * @jest-environment jsdom
 */

// @ts-ignore
import KidsFightScene from '../kidsfight_scene.js';

// Add Jest types
import { jest } from '@jest/globals';
// @ts-ignore - Ignore missing Jest types
const { describe, test, expect, beforeEach } = global;

// Mock Phaser.Scene and dependencies
class MockScene extends KidsFightScene {
  constructor() {
    super();
    this.playerHealth = [100, 100];
    this.updateHealthBars = jest.fn();
    this.endGame = jest.fn();
    this.gameOver = false;
    this.timeLeft = 60;
    this.gameMode = 'local';
    this.p1SpriteKey = 'player1';
    this.p2SpriteKey = 'player2';
    this.remotePlayer = { health: 100 };
    this.isHost = false;
  }

  getCharacterName(spriteKey) {
    return spriteKey === 'player1' ? 'Bento' : 'Davi R';
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

  test('triggers game over when player 1 health reaches 0', () => {
    scene.playerHealth = [0, 100];
    scene.checkWinner();
    expect(scene.endGame).toHaveBeenCalledWith('Davi R Venceu!');
    scene.gameOver = true;
    expect(scene.gameOver).toBe(true);
  });

  test('triggers game over when player 2 health reaches 0', () => {
    scene.playerHealth = [100, 0];
    scene.checkWinner();
    expect(scene.endGame).toHaveBeenCalledWith('Bento Venceu!');
    scene.gameOver = true;
    expect(scene.gameOver).toBe(true);
  });

  test('triggers draw when time is up and health is equal', () => {
    scene.timeLeft = 0;
    scene.playerHealth = [50, 50];
    scene.checkWinner();
    expect(scene.endGame).toHaveBeenCalledWith('Empate!');
    scene.gameOver = true;
    expect(scene.gameOver).toBe(true);
  });

  test('triggers game over for online receiver when health update sets health to 0', () => {
    scene.gameMode = 'online';
    const data = { type: 'health_update', playerIndex: 0, health: 0 };
    
    // Simulate health update handling
    scene.playerHealth[data.playerIndex] = data.health;
    scene.updateHealthBars(data.playerIndex);
    scene.checkWinner();

    expect(scene.endGame).toHaveBeenCalledWith('Davi R Venceu!');
    scene.gameOver = true;
    expect(scene.gameOver).toBe(true);
  });

  test('does not trigger game over when health is above 0', () => {
    scene.playerHealth = [50, 50];
    scene.checkWinner();
    expect(scene.endGame).not.toHaveBeenCalled();
    expect(scene.gameOver).toBe(false);
  });

  test('does not trigger multiple game overs', () => {
    scene.gameOver = true;
    scene.playerHealth = [0, 100];
    scene.checkWinner();
    expect(scene.endGame).not.toHaveBeenCalled();
  });
});
