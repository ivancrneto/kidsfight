import KidsFightScene from '../kidsfight_scene';

describe('KidsFightScene.tryAction', () => {
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
    now = Date.now();
  });

  it('should not perform action if players are not ready', () => {
    scene.players = [null, null];
    const spy = jest.spyOn(scene, 'tryAttack');
    scene.tryAction(0, 'attack', false);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should not perform special if not enough pips', () => {
    scene.playerSpecial[0] = 2;
    const spy = jest.spyOn(scene, 'tryAttack');
    scene.tryAction(0, 'special', true);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should consume all pips and call tryAttack for special', () => {
    scene.playerSpecial[0] = 3;
    const spy = jest.spyOn(scene, 'tryAttack');
    scene.updateSpecialPips = jest.fn();
    scene.tryAction(0, 'special', true);
    expect(scene.playerSpecial[0]).toBe(0);
    expect(scene.updateSpecialPips).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(0, 1, expect.any(Number), true);
  });

  it('should call tryAttack for normal attack', () => {
    const spy = jest.spyOn(scene, 'tryAttack');
    scene.tryAction(0, 'attack', false);
    expect(spy).toHaveBeenCalledWith(0, 1, expect.any(Number), false);
  });

  it('should not fail if attacker or target is missing', () => {
    scene.players[1] = null;
    const spy = jest.spyOn(scene, 'tryAttack');
    scene.tryAction(0, 'attack', false);
    expect(spy).not.toHaveBeenCalled();
  });
});
