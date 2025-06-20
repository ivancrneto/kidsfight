// Global test setup for Phaser graphics mocks for all tests
import Phaser from 'phaser';
import { jest } from '@jest/globals';

// Comprehensive MockGraphics for all test environments
class MockGraphics {
  fillStyle = jest.fn().mockReturnThis();
  fillRect = jest.fn().mockReturnThis();
  lineStyle = jest.fn().mockReturnThis();
  strokeRect = jest.fn().mockReturnThis();
  clear = jest.fn().mockReturnThis();
  setVisible = jest.fn().mockReturnThis();
  setScrollFactor = jest.fn().mockReturnThis();
  setDepth = jest.fn().mockReturnThis();
  destroy = jest.fn();
  setAlpha = jest.fn().mockReturnThis();
  setPosition = jest.fn().mockReturnThis();
  setSize = jest.fn().mockReturnThis();
  dirty = false;
}

// Make MockGraphics globally available for all tests
global.MockGraphics = MockGraphics;

// Patch Phaser.Scene.prototype.add.graphics unconditionally for all tests
if (global.Phaser && global.Phaser.Scene && global.Phaser.Scene.prototype) {
  global.Phaser.Scene.prototype.add = global.Phaser.Scene.prototype.add || {};
  global.Phaser.Scene.prototype.add.graphics = jest.fn(() => new MockGraphics());
}

// Globally patch Phaser.Scene.prototype.anims for all scenes
if (global.Phaser && global.Phaser.Scene && global.Phaser.Scene.prototype) {
  global.Phaser.Scene.prototype.anims = {
    exists: jest.fn().mockReturnValue(false),
    create: jest.fn(),
    generateFrameNumbers: jest.fn(() => [{ key: '', frame: 0 }]),
  };
}

beforeEach(() => {
  // Mock all Phaser add methods needed by KidsFightScene
  const mockFn = jest.fn().mockReturnThis();
  const mockCircle = jest.fn(() => ({
    setDepth: mockFn,
    setOrigin: mockFn,
    setAlpha: mockFn,
    setInteractive: mockFn,
    on: mockFn,
    destroy: mockFn
  }));
  const mockText = jest.fn(() => ({
    setDepth: mockFn,
    setOrigin: mockFn,
    setAlpha: mockFn,
    setInteractive: mockFn,
    on: mockFn,
    setVisible: mockFn,
    destroy: mockFn
  }));
  const mockImage = jest.fn(() => ({
    setDepth: mockFn,
    setOrigin: mockFn,
    setAlpha: mockFn,
    setInteractive: mockFn,
    on: mockFn,
    setDisplaySize: mockFn,
    destroy: mockFn
  }));
  const mockRectangle = jest.fn(() => ({
    setDepth: mockFn,
    setOrigin: mockFn,
    setAlpha: mockFn,
    setInteractive: mockFn,
    on: mockFn,
    destroy: mockFn
  }));

  if (!global.KidsFightScene) return;
  global.KidsFightScene.prototype.add = {
    circle: mockCircle,
    text: mockText,
    image: mockImage,
    rectangle: mockRectangle,
    graphics: jest.fn(() => ({
      fillStyle: mockFn,
      fillRect: mockFn,
      lineStyle: mockFn,
      strokeRect: mockFn,
      clear: mockFn,
      setScrollFactor: mockFn,
      setDepth: mockFn,
      destroy: mockFn
    }))
  };

  // Robustly mock player.anims for all player objects
  global.KidsFightScene.prototype.players = [
    { anims: { play: mockFn }, texture: { key: 'player1' }, frame: { name: 0 }, flipX: false, x: 0, y: 0, body: { velocity: { x: 0, y: 0 } } },
    { anims: { play: mockFn }, texture: { key: 'player2' }, frame: { name: 0 }, flipX: false, x: 0, y: 0, body: { velocity: { x: 0, y: 0 } } }
  ];

  // Patch safeAddImage to always return a mock with setDepth and other relevant methods
  if (global.KidsFightScene) {
    global.KidsFightScene.prototype.safeAddImage = jest.fn(() => ({
      setDepth: jest.fn().mockReturnThis(),
      setOrigin: jest.fn().mockReturnThis(),
      setAlpha: jest.fn().mockReturnThis(),
      setInteractive: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      setDisplaySize: jest.fn().mockReturnThis(),
      destroy: jest.fn().mockReturnThis()
    }));
  }

  // Mock Phaser animation manager for all scenes
  const proto = global.KidsFightScene?.prototype || {};
  if (!proto.anims) {
    proto.anims = {
      exists: jest.fn().mockReturnValue(false),
      create: jest.fn(),
      generateFrameNumbers: jest.fn(() => [{ key: '', frame: 0 }]),
    };
  }
});
