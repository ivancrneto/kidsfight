jest.mock('../websocket_manager');

import KidsFightScene from '../kidsfight_scene';
import { setupMockScene } from './test-utils-fix';

const MAX_HEALTH = 100;
const ATTACK_DAMAGE = 5;

/**
 * Regression tests for the facing + vertical constraints added to tryAttack.
 * Previously an attack connected on horizontal distance alone, so a player
 * could hit an opponent standing behind them or on a platform far above.
 */
describe('KidsFightScene - hit detection facing & vertical range', () => {
  let scene: any;
  let now: number;

  const makePlayers = (p0: any, p1: any) => {
    const base = { width: 50, height: 100, setData: jest.fn(), getData: jest.fn().mockReturnValue(false), health: MAX_HEALTH };
    scene.players = [{ ...base, ...p0 }, { ...base, ...p1 }];
  };

  beforeEach(() => {
    scene = new KidsFightScene({});
    setupMockScene(scene);
    scene.playerHealth = [MAX_HEALTH, MAX_HEALTH];
    scene.playerSpecial = [0, 0];
    scene.playerBlocking = [false, false];
    scene.updateSpecialPips = jest.fn();
    scene.updateHealthBar = jest.fn();
    scene.checkWinner = jest.fn();
    scene.healthBar1 = scene.add.graphics();
    scene.healthBar2 = scene.add.graphics();
    now = Date.now();
  });

  it('connects when in range, on the same level, and facing the target', () => {
    // Attacker at x=100 faces right (flipX=false); defender just to the right.
    makePlayers({ x: 100, y: 100, flipX: false }, { x: 150, y: 100, flipX: true });
    scene.tryAttack(0, 1, now, false);
    expect(scene.playerHealth[1]).toBe(MAX_HEALTH - ATTACK_DAMAGE);
  });

  it('misses when the attacker faces away from the defender', () => {
    // Attacker faces left (flipX=true) but defender is to the right.
    makePlayers({ x: 100, y: 100, flipX: true }, { x: 150, y: 100, flipX: false });
    scene.tryAttack(0, 1, now, false);
    expect(scene.playerHealth[1]).toBe(MAX_HEALTH); // no damage
  });

  it('misses when the defender is far above/below (different platform)', () => {
    // Horizontally close and facing correctly, but a big vertical gap.
    makePlayers({ x: 100, y: 100, flipX: false }, { x: 150, y: 300, flipX: true });
    scene.tryAttack(0, 1, now, false);
    expect(scene.playerHealth[1]).toBe(MAX_HEALTH); // no damage
  });
});
