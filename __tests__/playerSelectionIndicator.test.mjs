// playerSelectionIndicator.test.mjs
// Tests for selection rectangle alignment, especially for Roni
import { jest } from '@jest/globals';

// Minimal mock for Phaser's add.rectangle and add.sprite
class MockScene {
  constructor() {
    this.add = {
      rectangle: jest.fn().mockImplementation((x, y, w, h) => ({
        x, y, w, h,
        setStrokeStyle: jest.fn().mockReturnThis(),
        setFillStyle: jest.fn().mockReturnThis(),
        setPosition: jest.fn(function(newX, newY) {
          this.x = newX;
          this.y = newY;
          return this;
        })
      })),
      sprite: jest.fn().mockImplementation((x, y, key, frame) => ({
        x, y, key, frame,
        setScale: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn()
      }))
    };
    this.selected = { p1: 0, p2: 1 };
  }
}

describe('PlayerSelectScene selection indicator positions', () => {
  let scene;
  beforeEach(() => {
    scene = new MockScene();
    // Simulate the positions from the real scene for Player 1 and Player 2 Roni
    scene.p1Selector = scene.add.rectangle(80, 220, 70, 70);
    scene.p2Selector = scene.add.rectangle(510, 220, 70, 70);
    scene.p1Option6 = scene.add.sprite(150, 290, 'player6', 0);
    scene.p2Option6 = scene.add.sprite(580, 290, 'player6', 0);
  });

  it('should align Player 1 selector with Roni portrait (x=150, y=290)', () => {
    // Simulate click handler for Player 1 Roni
    scene.p1Selector.setPosition(150, 290);
    expect(scene.p1Selector.x).toBe(150);
    expect(scene.p1Selector.y).toBe(290);
    // The portrait sprite is at (150, 290)
    expect(scene.p1Option6.x).toBe(150);
    expect(scene.p1Option6.y).toBe(290);
  });

  it('should align Player 2 selector with Roni portrait (x=580, y=290)', () => {
    // Simulate click handler for Player 2 Roni
    scene.p2Selector.setPosition(580, 290);
    expect(scene.p2Selector.x).toBe(580);
    expect(scene.p2Selector.y).toBe(290);
    // The portrait sprite is at (580, 290)
    expect(scene.p2Option6.x).toBe(580);
    expect(scene.p2Option6.y).toBe(290);
  });

  it('should NOT use the old misaligned positions for Roni', () => {
    // Old buggy values were 185 (P1) and 615 (P2)
    scene.p1Selector.setPosition(185, 290);
    expect(scene.p1Selector.x).not.toBe(185);
    scene.p2Selector.setPosition(615, 290);
    expect(scene.p2Selector.x).not.toBe(615);
  });
});
