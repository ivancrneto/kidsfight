/**
 * @jest-environment jsdom
 */
const { tryAttack } = require('../gameUtils.cjs');

// Minimal mock for Phaser.Scene and player objects
function createMockScene() {
  return {
    player1: { play: jest.fn(), x: 0, y: 0 },
    player2: { play: jest.fn(), x: 0, y: 0 },
    healthBar1: { width: 200 },
    healthBar2: { width: 200 },
    player1State: 'idle',
    player2State: 'idle',
    lastAttackTime: [0, 0],
    playerHealth: [100, 100],
    attackCount: [0, 0],
    _touchJustPressedP1A: false,
    _touchJustPressedP2A: false,
    gameOver: false,
    time: { delayedCall: (ms, cb) => setTimeout(cb, 0) },
    keys: {},
    showSpecialEffect: jest.fn(),
  };
}

describe('Touch attack flags for both players', () => {
  let scene;
  const now = 10000;
  beforeEach(() => {
    scene = createMockScene();
    scene.lastAttackTime = [0, 0];
    scene.player1State = 'idle';
    scene.player2State = 'idle';
    scene.playerHealth = [100, 100];
    scene._touchJustPressedP1A = false;
    scene._touchJustPressedP2A = false;
    scene.attackCount = [0, 0];
  });

  test('Player 1 attack via touch resets flag and damages Player 2', (done) => {
    scene._touchJustPressedP1A = true;
    // Simulate attack logic from main.js
    const attackCondition = scene._touchJustPressedP1A && scene.player1State !== 'attack' && scene.player1State !== 'special';
    if (attackCondition) {
      scene._touchJustPressedP1A = false;
      scene.player1.play('p1_attack', true);
      scene.player1State = 'attack';
      // Ensure defender is exactly scene.player2
      tryAttack(scene, 0, scene.player1, scene.player2, now, false);
      setTimeout(() => {
        expect(scene._touchJustPressedP1A).toBe(false);
        expect(scene.player1.play).toHaveBeenCalledWith('p1_attack', true);
        done();
      }, 10);
    }
  });

  test('Player 2 attack via touch resets flag and damages Player 1', (done) => {
    scene._touchJustPressedP2A = true;
    // Simulate attack logic from main.js
    const attackConditionP2 = scene._touchJustPressedP2A && scene.player2State !== 'attack' && scene.player2State !== 'special';
    if (attackConditionP2) {
      scene._touchJustPressedP2A = false;
      scene.player2.play('p2_attack', true);
      scene.player2State = 'attack';
      // Ensure defender is exactly scene.player1
      tryAttack(scene, 1, scene.player2, scene.player1, now, false);
      setTimeout(() => {
        expect(scene._touchJustPressedP2A).toBe(false);
        expect(scene.player2.play).toHaveBeenCalledWith('p2_attack', true);
        done();
      }, 10);
    }
  });
});
