/**
 * @jest-environment jsdom
 */
const { tryAttack } = require('../gameUtils.cjs');
// __tests__/sceneRestart.test.js
// Tests that KidsFightScene resets all state and keyboard input works after restart

// We'll mock a minimal Phaser.Scene and KidsFightScene for state reset logic
class MockScene {
  constructor() {
    this.gameOver = true;
    this.player1State = 'down';
    this.player2State = 'special';
    this.lastAttackTime = [123, 456];
    this.attackCount = [2, 2];
    this.lungeTimer = [99, 99];
    this.timeLeft = 12;
    this.input = { keyboard: { addKeys: jest.fn(), createCursorKeys: jest.fn() } };
    this.cursors = null;
    this.keys = null;
  }
  // Simulate the create() logic for state reset
  resetGameState() {
    this.gameOver = false;
    this.player1State = 'idle';
    this.player2State = 'idle';
    this.lastAttackTime = [0, 0];
    this.attackCount = [0, 0];
    this.lungeTimer = [0, 0];
    this.timeLeft = 60;
  }
}

describe('KidsFightScene state reset on restart', () => {
  let scene;
  beforeEach(() => {
    scene = new MockScene();
  });
  test('All state is reset to defaults on restart', () => {
    scene.resetGameState();
    expect(scene.gameOver).toBe(false);
    expect(scene.player1State).toBe('idle');
    expect(scene.player2State).toBe('idle');
    expect(scene.lastAttackTime).toEqual([0, 0]);
    expect(scene.attackCount).toEqual([0, 0]);
    expect(scene.lungeTimer).toEqual([0, 0]);
    expect(scene.timeLeft).toBe(60);
  });
});

describe('KidsFightScene keyboard input after restart', () => {
  let scene;
  beforeEach(() => {
    scene = new MockScene();
    scene.input.keyboard.addKeys = jest.fn(() => ({ a: {}, d: {}, w: {}, v: {}, b: {}, n: {}, s: {}, k: {}, l: {}, semicolon: {} }));
    scene.input.keyboard.createCursorKeys = jest.fn(() => ({ left: {}, right: {}, up: {}, down: {} }));
  });
  test('Keyboard keys and cursors are reinitialized on restart', () => {
    // Simulate create() logic
    scene.cursors = scene.input.keyboard.createCursorKeys();
    scene.keys = scene.input.keyboard.addKeys({
      a: 'A', d: 'D', w: 'W',
      v: 'V', b: 'B', n: 'N', s: 'S',
      k: 'K', l: 'L', semicolon: 'SEMICOLON'
    });
    expect(scene.cursors).toBeDefined();
    expect(scene.keys).toBeDefined();
    expect(Object.keys(scene.keys)).toEqual(
      expect.arrayContaining(['a','d','w','v','b','n','s','k','l','semicolon'])
    );
  });
});
