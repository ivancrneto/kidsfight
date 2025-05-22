/**
 * @jest-environment jsdom
 */
import { tryAttack } from '../gameUtils.cjs';

describe('Attack Cooldown Logic', () => {
  let scene;

  beforeEach(() => {
    scene = {
      lastAttackTime: [0, 0],
      attackCount: [0, 0],
      cameras: { main: { shake: jest.fn() } },
      player1: { x: 100, health: 100 },
      player2: { x: 110, health: 100 },
      playerHealth: [100, 100],
      healthBar1: { width: 200 },
      healthBar2: { width: 200 },
    };
  });

  it('should allow attack if cooldown has passed and in range', () => {
    const now = 1000;
    scene.lastAttackTime[1] = 0;
    tryAttack(scene, 1, scene.player2, scene.player1, now, false);
    expect(scene.playerHealth[0]).toBe(90);
    expect(scene.lastAttackTime[1]).toBe(now);
    expect(scene.attackCount[1]).toBe(1);
  });

  it('should NOT allow attack if cooldown has NOT passed', () => {
    const now = 1000;
    scene.lastAttackTime[1] = 900;
    scene.playerHealth[0] = 100;
    tryAttack(scene, 1, scene.player2, scene.player1, now, false);
    expect(scene.playerHealth[0]).toBe(100); // No change
    expect(scene.attackCount[1]).toBe(0);
  });

  it('should NOT allow attack if out of range', () => {
    const now = 2000;
    scene.player2.x = 100;
    scene.player1.x = 300; // Out of range
    scene.playerHealth[0] = 100;
    tryAttack(scene, 1, scene.player2, scene.player1, now, false);
    expect(scene.playerHealth[0]).toBe(100); // No change
    expect(scene.attackCount[1]).toBe(0);
  });

  it('should allow both players to attack independently', () => {
    const now = 3000;
    scene.player1.x = 100;
    scene.player2.x = 110;
    scene.playerHealth[0] = 100;
    scene.playerHealth[1] = 100;
    tryAttack(scene, 0, scene.player1, scene.player2, now, false);
    tryAttack(scene, 1, scene.player2, scene.player1, now, false);
    expect(scene.playerHealth[0]).toBe(90);
    expect(scene.playerHealth[1]).toBe(90);
    expect(scene.attackCount[0]).toBe(1);
    expect(scene.attackCount[1]).toBe(1);
  });
});
