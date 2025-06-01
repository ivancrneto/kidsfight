import KidsFightScene from '../kidsfight_scene';

describe('KidsFightScene Comprehensive', () => {
  let scene: KidsFightScene;
  let now: number;
  beforeEach(() => {
    scene = new KidsFightScene({} as any);
    scene.sys = { game: { canvas: { width: 800, height: 480 } } } as any;
    scene.healthBar1 = { clear: jest.fn(), fillStyle: jest.fn(), fillRect: jest.fn(), setDepth: jest.fn(), setVisible: jest.fn() } as any;
    scene.healthBar2 = { clear: jest.fn(), fillStyle: jest.fn(), fillRect: jest.fn(), setDepth: jest.fn(), setVisible: jest.fn() } as any;
    scene.add = {
      graphics: jest.fn(() => ({ clear: jest.fn(), fillStyle: jest.fn(), fillRect: jest.fn(), setDepth: jest.fn() })),
      rectangle: jest.fn(),
      text: jest.fn(() => ({ setOrigin: jest.fn().mockReturnThis(), setInteractive: jest.fn().mockReturnThis(), setDepth: jest.fn().mockReturnThis(), on: jest.fn().mockReturnThis() }))
    } as any;
    scene.cameras = { main: { width: 800, height: 480, shake: jest.fn() } } as any;
    scene.physics = { pause: jest.fn() } as any;
    scene.players = [
      { health: 200, setData: jest.fn(), setFrame: jest.fn(), setAngle: jest.fn(), setVelocityX: jest.fn(), setFlipX: jest.fn(), setVelocityY: jest.fn(), body: { blocked: { down: true }, touching: { down: true }, velocity: { x: 0, y: 0 } }, anims: { getFrameName: jest.fn() } } as any,
      { health: 200, setData: jest.fn(), setFrame: jest.fn(), setAngle: jest.fn(), setVelocityX: jest.fn(), setFlipX: jest.fn(), setVelocityY: jest.fn(), body: { blocked: { down: true }, touching: { down: true }, velocity: { x: 0, y: 0 } }, anims: { getFrameName: jest.fn() } } as any,
    ];
    scene.playerHealth = [200, 200];
    scene.playerSpecial = [0, 0];
    scene.gameOver = false;
    scene.updateSpecialPips = jest.fn();
    scene.updateHealthBar = jest.fn();
    scene.wsManager = { send: jest.fn() } as any;
    scene.gameMode = 'local';
    now = Date.now();
  });

  describe('Special Attack Logic', () => {
    it('does not allow special attack with <3 pips', () => {
      scene.playerSpecial[0] = 2;
      const spy = jest.spyOn(scene, 'tryAttack');
      scene.tryAction(0, 'special', true);
      expect(spy).not.toHaveBeenCalled();
      expect(scene.playerSpecial[0]).toBe(2);
    });
    it('consumes all pips and updates UI on special', () => {
      scene.playerSpecial[0] = 3;
      const spy = jest.spyOn(scene, 'tryAttack');
      scene.tryAction(0, 'special', true);
      expect(scene.playerSpecial[0]).toBe(0);
      expect(scene.updateSpecialPips).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(0, 1, expect.any(Number), true);
    });
    it('does not throw if players missing', () => {
      scene.players = [null, null];
      expect(() => scene.tryAction(0, 'special', true)).not.toThrow();
    });
  });

  describe('Attack Damage and Health', () => {
    it('applies correct normal attack damage and caps health', () => {
      scene.DAMAGE = 10;
      scene.playerHealth = [200, 10];
      scene.players[1].health = 10;
      scene.tryAttack(0, 1, now, false);
      expect(scene.players[1].health).toBe(0);
      expect(scene.playerHealth[1]).toBe(0);
      expect(scene.updateHealthBar).toHaveBeenCalledWith(0);
      expect(scene.updateHealthBar).toHaveBeenCalledWith(1);
    });
    it('applies correct special attack damage and caps health', () => {
      scene.SPECIAL_DAMAGE = 20;
      scene.playerHealth = [200, 25];
      scene.players[1].health = 25;
      scene.tryAttack(0, 1, now, true);
      expect(scene.players[1].health).toBe(5);
      expect(scene.playerHealth[1]).toBe(5);
    });
    it('does not apply negative or excessive damage', () => {
      scene.DAMAGE = -5;
      scene.SPECIAL_DAMAGE = 1000;
      scene.playerHealth = [200, 200];
      scene.players[1].health = 200;
      scene.tryAttack(0, 1, now, false);
      expect(scene.players[1].health).toBe(200); // No negative damage
      scene.tryAttack(0, 1, now, true);
      expect(scene.players[1].health).toBe(180); // Max 20 damage
    });
  });

  describe('UI and State Feedback', () => {
    it('updates special pips and health bar after attacks', () => {
      scene.playerSpecial = [2, 2];
      scene.tryAttack(0, 1, now, false);
      expect(scene.updateSpecialPips).toHaveBeenCalled();
      expect(scene.updateHealthBar).toHaveBeenCalledWith(0);
      expect(scene.updateHealthBar).toHaveBeenCalledWith(1);
    });
  });

  describe('Multiplayer/Online Sync', () => {
    it('sends health update on online mode', () => {
      scene.gameMode = 'online';
      scene.wsManager = { send: jest.fn() } as any;
      scene.tryAttack(0, 1, now, false);
      expect(scene.wsManager.send).toHaveBeenCalled();
      const arg = (scene.wsManager.send as jest.Mock).mock.calls[0][0];
      const parsed = typeof arg === 'string' ? JSON.parse(arg) : arg;
      expect(parsed).toEqual(expect.objectContaining({ type: 'health_update', playerIndex: 1, health: expect.any(Number) }));
    });
  });

  describe('Touch Controls', () => {
    it('calls handleAttack and handleSpecial from updateTouchControlState', () => {
      scene.handleAttack = jest.fn();
      scene.handleSpecial = jest.fn();
      scene.updateTouchControlState('attack', true);
      expect(scene.handleAttack).toHaveBeenCalled();
      scene.updateTouchControlState('special', true);
      expect(scene.handleSpecial).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('does not throw on invalid actions', () => {
      scene.players = [null, null];
      expect(() => scene.tryAction(0, 'attack', false)).not.toThrow();
      expect(() => scene.tryAttack(0, 1, now, false)).not.toThrow();
    });
  });
});
