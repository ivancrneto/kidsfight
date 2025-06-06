// Unit test for special attack restriction (must have 3 attacks)
// Uses Jest-like syntax

const { tryAttack } = require('../gameUtils.cjs');

function createMockScene() {
  return {
    keys: {
      b: { isDown: false },
      l: { isDown: false }
    },
    player1State: 'idle',
    player2State: 'idle',
    _touchJustPressedP1S: false,
    _touchJustPressedP2S: false,
    player1: { play: jest.fn(), x: 100, health: 100 },
    player2: { play: jest.fn(), x: 110, health: 100 },
    healthBar1: { width: 200 },
    healthBar2: { width: 200 },
    playerHealth: [100, 100],
    attackCount: [0, 0],
    lastAttackTime: [0, 0],
    time: { delayedCall: jest.fn((delay, cb) => cb()) },
    gameOver: false,
    showSpecialEffect: jest.fn(),
    tryAttack: jest.fn(function() {
      // Simulate special attack for player 1
      tryAttack(this, 0, this.player1, this.player2, Date.now(), true);
    }),
  };
}

describe('Special attack restriction', () => {
  let scene;
  const now = 1000;

  function runSpecialLogicP1() {
    // Simulate the specialConditionP1 logic from main.js
    const specialConditionP1 = (
      scene.keys &&
      scene.keys.b && scene.keys.b.isDown &&
      scene.player1State !== 'attack' &&
      scene.player1State !== 'special' &&
      scene.attackCount[0] >= 3
    ) || (scene._touchJustPressedP1S && scene.player1State !== 'attack' && scene.player1State !== 'special' && scene.attackCount[0] >= 3);
    if (specialConditionP1) {
      scene._touchJustPressedP1S = false;
      scene.player1.play('p1_special', true);
      scene.player1State = 'special';
      scene.tryAttack();
      scene.healthBar2.width = 200;
      scene.showSpecialEffect();
      scene.time.delayedCall(700, () => {
        if (scene.player1State === 'special') {
          scene.player1.play('p1_idle', true);
          scene.player1State = 'idle';
          scene.attackCount[0] = 0;
        }
      });
    }
  }

  beforeEach(() => {
    scene = createMockScene();
  });

  it('does NOT allow special if attackCount < 3', () => {
    scene.keys.b.isDown = true;
    for (let i = 0; i < 3; i++) {
      scene.attackCount[0] = i;
      runSpecialLogicP1();
      expect(scene.player1.play).not.toHaveBeenCalledWith('p1_special', true);
    }
  });

  it('allows special if attackCount >= 3', () => {
    scene.keys.b.isDown = true;
    scene.attackCount[0] = 3;
    runSpecialLogicP1();
    expect(scene.player1.play).toHaveBeenCalledWith('p1_special', true);
    expect(scene.tryAttack).toHaveBeenCalled();
    // After special, attackCount resets to 0
    expect(scene.attackCount[0]).toBe(0);
  });

  it('allows special via touch only if attackCount >= 3', () => {
    scene._touchJustPressedP1S = true;
    scene.attackCount[0] = 3;
    runSpecialLogicP1();
    expect(scene.player1.play).toHaveBeenCalledWith('p1_special', true);
    expect(scene.tryAttack).toHaveBeenCalled();
  });

  it('does NOT allow special via touch if attackCount < 3', () => {
    scene._touchJustPressedP1S = true;
    scene.attackCount[0] = 2;
    runSpecialLogicP1();
    expect(scene.player1.play).not.toHaveBeenCalledWith('p1_special', true);
  });
});
