import KidsFightScene from '../kidsfight_scene';
import Phaser from 'phaser';

describe('KidsFightScene Touch Controls', () => {
  let scene: KidsFightScene;
  let mockPlayer: any;
  let mockTime: any;

  beforeEach(() => {
    scene = new KidsFightScene();
    // Mock Phaser methods and properties
    scene.sys = { game: { canvas: { width: 800, height: 600 }, device: { os: { android: false, iOS: false } } } } as any;
    scene.add = {
      rectangle: jest.fn(() => ({
        setAlpha: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis()
      })),
      image: jest.fn().mockReturnValue({ setOrigin: jest.fn().mockReturnThis(), setDisplaySize: jest.fn().mockReturnThis() }),
      text: jest.fn().mockReturnValue({ setOrigin: jest.fn().mockReturnThis(), setVisible: jest.fn().mockReturnThis() }),
    } as any;
    scene.physics = { add: { existing: jest.fn(), group: jest.fn(() => ({ add: jest.fn() })), collider: jest.fn() }, world: { setBounds: jest.fn() } } as any;
    scene.cameras = { main: { setBounds: jest.fn(), width: 800, height: 600 } } as any;
    scene.input = { keyboard: { createCursorKeys: jest.fn(() => ({ left: {}, right: {}, up: {} })), addKey: jest.fn() } } as any;
    scene.time = { delayedCall: jest.fn((delay, cb) => cb()) } as any;
    scene.player1 = { setVelocityX: jest.fn(), setVelocityY: jest.fn(), body: { touching: { down: true } }, getData: jest.fn(() => false), setData: jest.fn() } as any;
    scene.playerBlocking = [false, false];
    scene.playerHealth = [100, 100];
    scene.TOTAL_HEALTH = 100;
  });

  it('should call setVelocityX(-160) when left button is pressed', () => {
    scene.updateTouchControlState('left', true);
    expect(scene.player1.setVelocityX).toHaveBeenCalledWith(-160);
  });

  it('should call setVelocityX(160) when right button is pressed', () => {
    scene.updateTouchControlState('right', true);
    expect(scene.player1.setVelocityX).toHaveBeenCalledWith(160);
  });

  it('should call setVelocityY(-330) when jump button is pressed and player is on the ground', () => {
    scene.updateTouchControlState('jump', true);
    expect(scene.player1.setVelocityY).toHaveBeenCalledWith(-330);
  });

  it('should call handleAttack when attack button is pressed', () => {
    const spy = jest.spyOn(scene, 'handleAttack');
    scene.updateTouchControlState('attack', true);
    expect(spy).toHaveBeenCalled();
  });

  it('should call handleSpecial when special button is pressed', () => {
    const spy = jest.spyOn(scene, 'handleSpecial');
    scene.updateTouchControlState('special', true);
    expect(spy).toHaveBeenCalled();
  });

  it('should set playerBlocking[0] to true when block is pressed', () => {
    scene.updateTouchControlState('block', true);
    expect(scene.playerBlocking[0]).toBe(true);
  });

  it('should set playerBlocking[0] to false when block is released', () => {
    scene.playerBlocking[0] = true;
    scene.updateTouchControlState('block', false);
    expect(scene.playerBlocking[0]).toBe(false);
  });

  it('should not throw if player1 is undefined', () => {
    scene.player1 = undefined;
    expect(() => scene.updateTouchControlState('left', true)).not.toThrow();
    expect(() => scene.updateTouchControlState('right', true)).not.toThrow();
    expect(() => scene.updateTouchControlState('jump', true)).not.toThrow();
    expect(() => scene.updateTouchControlState('block', true)).not.toThrow();
  });

  it('should not throw if control is invalid', () => {
    expect(() => scene.updateTouchControlState('invalid' as any, true)).not.toThrow();
  });

  it('should trigger attack logic in handleAttack()', () => {
    scene.player1.getData = jest.fn(() => false);
    scene.player1.setData = jest.fn();
    scene.handleAttack();
    expect(scene.player1.setData).toHaveBeenCalledWith('isAttacking', true);
  });

  it('should trigger special logic in handleSpecial()', () => {
    scene.player1.getData = jest.fn(() => false);
    scene.player1.setData = jest.fn();
    scene.handleSpecial();
    expect(scene.player1.setData).toHaveBeenCalledWith('isSpecialAttacking', true);
  });

  it('should call setVisible on all buttons in showTouchControls', () => {
    const scene: any = new KidsFightScene();
    const btns = ['leftButton', 'rightButton', 'jumpButton', 'attackButton', 'specialButton', 'blockButton'];
    btns.forEach((name) => {
      scene[name] = { setVisible: jest.fn() };
    });
    scene.showTouchControls = KidsFightScene.prototype.showTouchControls;
    scene.showTouchControls(true);
    btns.forEach((name) => {
      expect(scene[name].setVisible).toHaveBeenCalledWith(true);
    });
    scene.showTouchControls(false);
    btns.forEach((name) => {
      expect(scene[name].setVisible).toHaveBeenCalledWith(false);
    });
  });

  it('should assign keys in setupInputHandlers', () => {
    const scene: any = new KidsFightScene();
    scene.input = { keyboard: { createCursorKeys: jest.fn(() => ({ left: 'l', right: 'r', up: 'u' })), addKey: jest.fn((k) => k) } };
    scene.setupInputHandlers = KidsFightScene.prototype.setupInputHandlers;
    scene.setupInputHandlers();
    expect(scene.keys.left).toBe('l');
    expect(scene.keys.right).toBe('r');
    expect(scene.keys.up).toBe('u');
    expect(scene.keys.attack).toBe(Phaser.Input.Keyboard.KeyCodes.SPACE);
    expect(scene.keys.special).toBe(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    expect(scene.keys.block).toBe(Phaser.Input.Keyboard.KeyCodes.CTRL);
  });

  it('should update health bar in updateHealthBar', () => {
    const scene: any = new KidsFightScene();
    scene.playerHealth = [50, 100];
    scene.TOTAL_HEALTH = 100;
    scene.sys = { game: { canvas: { width: 800 } } };
    const clear = jest.fn();
    const fillStyle = jest.fn().mockReturnThis();
    const fillRect = jest.fn();
    scene.healthBar1 = { clear, fillStyle, fillRect };
    scene.healthBar2 = { clear, fillStyle, fillRect };
    scene.updateHealthBar = KidsFightScene.prototype.updateHealthBar;
    scene.updateHealthBar(0);
    expect(clear).toHaveBeenCalled();
    expect(fillStyle).toHaveBeenCalledWith(0x00ff00);
    expect(fillRect).toHaveBeenCalledWith(10, 10, 100, 20);
    scene.updateHealthBar(1);
    expect(fillStyle).toHaveBeenCalledWith(0xff0000);
    expect(fillRect).toHaveBeenCalledWith(590, 10, 200, 20);
  });
});
