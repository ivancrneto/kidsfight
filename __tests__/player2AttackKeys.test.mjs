// Unit test for Player 2 attack keys (; and K)
// Uses Jest-like syntax

import { jest } from '@jest/globals';
import { tryAttack } from '../gameUtils.mjs';

function createMockScene() {
  return {
    keys: {
      semicolon: { isDown: false },
      k: { isDown: false }
    },
    player2State: 'idle',
    lastAttackTime: [0, 0],
    time: { delayedCall: jest.fn((delay, cb) => cb()) },
    player2: { play: jest.fn(), x: 110, health: 100 },
    player1: { play: jest.fn(), x: 100, health: 100 },
    tryAttackCalled: false,
    playerHealth: [100, 100],
    attackCount: [0, 0],
    healthBar1: { width: 200 },
    healthBar2: { width: 200 },
  };
}

describe('Player 2 attack keys', () => {
  let scene;
  const now = 1000;

  beforeEach(() => {
    scene = createMockScene();
    scene.player2State = 'idle';
    scene.lastAttackTime[1] = 0;
    scene._touchJustPressedP2A = false;
  });

  function runAttackLogic() {
    // Simulate the attackConditionP2 logic from main.js
    const attackConditionP2 = (
      scene.keys &&
      ((scene.keys.semicolon && scene.keys.semicolon.isDown) || (scene.keys.k && scene.keys.k.isDown)) &&
      now > (scene.lastAttackTime?.[1] || 0) + 500 &&
      scene.player2State !== 'attack' &&
      scene.player2State !== 'special'
    ) || (scene._touchJustPressedP2A && scene.player2State !== 'attack' && scene.player2State !== 'special');
    if (attackConditionP2) {
      scene._touchJustPressedP2A = false;
      scene.player2.play('p2_attack', true);
      scene.player2State = 'attack';
      tryAttack(scene, 1, scene.player2, scene.player1, now, false);
      scene.healthBar1.width = 200;
      scene.time.delayedCall(400, () => {
        if (scene.player2State === 'attack') {
          scene.player2.play('p2_idle', true);
          scene.player2State = 'idle';
        }
      });
    }
  }

  it('attacks when ; key is pressed', () => {
    scene.keys.semicolon.isDown = true;
    runAttackLogic();
    expect(scene.player2.play).toHaveBeenCalledWith('p2_attack', true);
  });

  it('attacks when K key is pressed', () => {
    scene.keys.k.isDown = true;
    runAttackLogic();
    expect(scene.player2.play).toHaveBeenCalledWith('p2_attack', true);
  });

  it('does not attack if both keys are up', () => {
    runAttackLogic();
    expect(scene.player2.play).not.toHaveBeenCalledWith('p2_attack', true);
  });
});
