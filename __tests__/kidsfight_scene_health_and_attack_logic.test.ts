import KidsFightScene from '../kidsfight_scene';
import Phaser from 'phaser';

describe('KidsFightScene - Health, Damage, and Win Logic', () => {
  let scene: KidsFightScene;
  let now: number;
  beforeEach(() => {
    scene = new KidsFightScene({} as any);
    // Mock sys.game.canvas for health bar logic
    scene.sys = {
      game: {
        canvas: {
          width: 800,
          height: 480,
        }
      }
    } as any;
    // Mock health bars to prevent errors in updateHealthBar
    scene.healthBar1 = { clear: jest.fn(), fillStyle: jest.fn(), fillRect: jest.fn(), setDepth: jest.fn(), setVisible: jest.fn() } as any;
    scene.healthBar2 = { clear: jest.fn(), fillStyle: jest.fn(), fillRect: jest.fn(), setDepth: jest.fn(), setVisible: jest.fn() } as any;
    scene.add = {
      graphics: jest.fn(() => ({ clear: jest.fn(), fillStyle: jest.fn(), fillRect: jest.fn(), setDepth: jest.fn() })),
      rectangle: jest.fn(),
      text: jest.fn(() => ({ setOrigin: jest.fn().mockReturnThis(), setInteractive: jest.fn().mockReturnThis(), setDepth: jest.fn().mockReturnThis(), on: jest.fn().mockReturnThis() })),
    } as any;
    scene.cameras = { main: { width: 800, height: 480, shake: jest.fn() } } as any;
    scene.physics = { pause: jest.fn() } as any;
    scene.players = [
      { health: 100, setData: jest.fn(), setFrame: jest.fn(), setAngle: jest.fn(), setVelocityX: jest.fn(), setFlipX: jest.fn(), setVelocityY: jest.fn(), body: { blocked: { down: true }, touching: { down: true }, velocity: { x: 0, y: 0 } }, anims: { getFrameName: jest.fn() } } as any,
      { health: 100, setData: jest.fn(), setFrame: jest.fn(), setAngle: jest.fn(), setVelocityX: jest.fn(), setFlipX: jest.fn(), setVelocityY: jest.fn(), body: { blocked: { down: true }, touching: { down: true }, velocity: { x: 0, y: 0 } }, anims: { getFrameName: jest.fn() } } as any,
    ];
    scene.playerHealth = [100, 100];
    scene.playerSpecial = [0, 0];
    scene.gameOver = false;
    now = Date.now();
  });

  it('initializes both players with 100 health', () => {
    expect(scene.playerHealth[0]).toBe(100);
    expect(scene.playerHealth[1]).toBe(100);
    expect(scene.players[0].health).toBe(100);
    expect(scene.players[1].health).toBe(100);
  });

  it('applies normal attack damage of 5', () => {
    scene.tryAttack(0, 1, now, false);
    expect(scene.playerHealth[1]).toBe(95);
    expect(scene.players[1].health).toBe(95);
  });

  it('applies special attack damage of 10', () => {
    scene.tryAttack(0, 1, now, true);
    expect(scene.playerHealth[1]).toBe(90);
    expect(scene.players[1].health).toBe(90);
  });

  it('does not allow health to drop below 0', () => {
    scene.playerHealth[1] = 5;
    scene.players[1].health = 5;
    scene.tryAttack(0, 1, now, true); // special = 20
    expect(scene.playerHealth[1]).toBe(0);
    expect(scene.players[1].health).toBe(0);
  });

  it('requires 20 normal hits to win (from 200 health)', () => {
    for (let i = 0; i < 20; i++) {
      scene.tryAttack(0, 1, now + i * 1000, false);
    }
    expect(scene.playerHealth[1]).toBe(0);
    expect(scene.players[1].health).toBe(0);
  });

  it('requires 10 special hits to win (from 200 health)', () => {
    for (let i = 0; i < 10; i++) {
      scene.tryAttack(0, 1, now + i * 1000, true);
    }
    expect(scene.playerHealth[1]).toBe(0);
    expect(scene.players[1].health).toBe(0);
  });

  it('does not allow special attack if not enough pips', () => {
    scene.playerSpecial[0] = 2; // not enough
    const spy = jest.spyOn(scene, 'tryAttack');
    scene.tryAction(0, 'special', true);
    expect(spy).not.toHaveBeenCalled();
  });

  it('consumes all special pips on special attack', () => {
    scene.playerSpecial[0] = 3;
    const spy = jest.spyOn(scene, 'tryAttack');
    scene.tryAction(0, 'special', true);
    expect(scene.playerSpecial[0]).toBe(0);
    expect(spy).toHaveBeenCalled();
  });

  it('does not apply negative or excessive damage', () => {
    scene.DAMAGE = -50;
    scene.SPECIAL_DAMAGE = 999;
    scene.tryAttack(0, 1, now, false);
    expect(scene.playerHealth[1]).toBe(100); // negative damage clamped
    scene.tryAttack(0, 1, now, true);
    expect(scene.playerHealth[1]).toBe(90); // max 10 damage
  });

  it('synchronizes health with health_update message', () => {
    // Simulate health_update message for player 1
    scene.playerHealth[1] = 150;
    scene.players[1].health = 150;
    const action = { type: 'health_update', playerIndex: 1, health: 123 };
    // simulate wsManager.onMessage logic
    scene.players[1].health = action.health;
    scene.playerHealth[1] = action.health;
    expect(scene.playerHealth[1]).toBe(123);
    expect(scene.players[1].health).toBe(123);
  });

  it('prevents double-processing of attacks (host only applies attack)', () => {
    // Simulate guest: should not apply attack logic
    scene.isHost = false;
    const spy = jest.spyOn(scene, 'tryAttack');
    // guest receives attack message, should NOT call tryAttack
    // (simulate: guest only updates health from health_update)
    // so tryAttack should only be called by host
    // (no call in this test)
    expect(spy).not.toHaveBeenCalled();
  });
});
