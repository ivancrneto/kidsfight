/**
 * @jest-environment jsdom
 */
const { tryAttack } = require('../gameUtils');

describe('Attack Cooldown Logic', () => {
  let scene, attacker, defender;

  beforeEach(() => {
    scene = {
      lastAttackTime: [0, 0],
      attackCount: [0, 0],
      cameras: { main: { shake: jest.fn() } },
    };
    attacker = { x: 100 };
    defender = { x: 110, health: 100 };
  });

  it('should allow attack if cooldown has passed and in range', () => {
    const now = 2000;
    scene.lastAttackTime[1] = 0;
    tryAttack(scene, 1, attacker, defender, now, false);
    expect(defender.health).toBe(90);
    expect(scene.lastAttackTime[1]).toBe(now);
    expect(scene.attackCount[1]).toBe(1);
  });

  it('should NOT allow attack if cooldown has NOT passed', () => {
    const now = 1000;
    scene.lastAttackTime[1] = 900;
    defender.health = 100;
    tryAttack(scene, 1, attacker, defender, now, false);
    expect(defender.health).toBe(100); // No change
    expect(scene.attackCount[1]).toBe(0);
  });

  it('should NOT allow attack if out of range', () => {
    const now = 2000;
    attacker.x = 100;
    defender.x = 300; // Out of range
    defender.health = 100;
    tryAttack(scene, 1, attacker, defender, now, false);
    expect(defender.health).toBe(100); // No change
    expect(scene.attackCount[1]).toBe(0);
  });

  it('should allow both players to attack independently', () => {
    const now = 2000;
    let attacker1 = { x: 100 };
    let defender1 = { x: 110, health: 100 };
    let attacker2 = { x: 110 };
    let defender2 = { x: 100, health: 100 };
    scene.lastAttackTime = [0, 0];
    scene.attackCount = [0, 0];
    tryAttack(scene, 0, attacker1, defender1, now, false);
    tryAttack(scene, 1, attacker2, defender2, now, false);
    expect(defender1.health).toBe(90);
    expect(defender2.health).toBe(90);
    expect(scene.attackCount[0]).toBe(1);
    expect(scene.attackCount[1]).toBe(1);
  });
});
