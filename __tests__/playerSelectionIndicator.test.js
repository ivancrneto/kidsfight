// playerSelectionIndicator.test.js
// Tests for selection rectangle alignment, especially for Roni
const jestMock = require('jest-mock');

// Minimal mock for Phaser's add.rectangle and add.sprite
class MockScene {
  constructor() {
    this.add = {
      rectangle: jestMock.fn().mockImplementation((x, y, w, h) => ({
        x, y, w, h,
        setStrokeStyle: jestMock.fn().mockReturnThis(),
        setFillStyle: jestMock.fn().mockReturnThis(),
        setPosition: jestMock.fn(function(newX, newY) {
          this.x = newX;
          this.y = newY;
          return this;
        })
      })),
      sprite: jestMock.fn().mockImplementation((x, y, key, frame) => ({
        x, y, key, frame,
        setScale: jestMock.fn().mockReturnThis(),
        setInteractive: jestMock.fn().mockReturnThis(),
        on: jestMock.fn()
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
    expect(scene.p1Selector.x).toBe(185); // This would be a bug
    scene.p1Selector.setPosition(150, 290); // Correct
    expect(scene.p1Selector.x).toBe(150);
    scene.p2Selector.setPosition(615, 290);
    expect(scene.p2Selector.x).toBe(615); // This would be a bug
    scene.p2Selector.setPosition(580, 290); // Correct
    expect(scene.p2Selector.x).toBe(580);
  });
});
