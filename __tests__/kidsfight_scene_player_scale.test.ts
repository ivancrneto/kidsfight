// Unit tests for player scale logic in KidsFightScene
import KidsFightScene from '../kidsfight_scene';
import Phaser from 'phaser';

describe('KidsFightScene player scale', () => {
  let scene: KidsFightScene;
  let player1: Phaser.Physics.Arcade.Sprite;
  let player2: Phaser.Physics.Arcade.Sprite;

  beforeEach(() => {
    jest.useFakeTimers();
    scene = new KidsFightScene();
    // Mock AnimationManager to make attack animation available
    scene.anims = {
      exists: jest.fn().mockReturnValue(true),
      create: jest.fn(),
      get: jest.fn()
    } as any;
    // Mock Phaser add.graphics to avoid TypeError
    scene.add = {
      graphics: jest.fn(() => ({
        setDepth: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis(),
        setX: jest.fn().mockReturnThis(),
        setY: jest.fn().mockReturnThis(),
        destroy: jest.fn().mockReturnThis()
      }))
    } as any;
    // Mock Phaser sprite
    player1 = {
      setScale: jest.fn(),
      setFrame: jest.fn(),
      setData: jest.fn(),
      getData: jest.fn(),
      body: { blocked: { down: true }, velocity: { x: 0 } },
    } as any;
    player2 = {
      setScale: jest.fn(),
      setFrame: jest.fn(),
      setData: jest.fn(),
      getData: jest.fn(),
      body: { blocked: { down: true }, velocity: { x: 0 } },
    } as any;
    // Add anims and texture mocks for Phaser compatibility
    player1.anims = { play: jest.fn() } as any;
    player2.anims = { play: jest.fn() } as any;
    player1.texture = { key: 'player1' } as any;
    player2.texture = { key: 'player2' } as any;
    player1.walkAnimData = { frameTime: 0, currentFrame: 0, frameDelay: 0 };
    player2.walkAnimData = { frameTime: 0, currentFrame: 0, frameDelay: 0 };
    player1.direction = 'right';
    player2.direction = 'left';
    player1.play = jest.fn();
    player2.play = jest.fn();
    scene.players = [player1, player2];
    scene.playerBlocking = [false, false];
    // Mock setSafeFrame to call setFrame directly for testability
    scene.setSafeFrame = (player: any, frame: number) => player.setFrame(frame);
    
    // Mock time for delayedCall
    scene.time = {
      delayedCall: jest.fn((delay, callback) => {
        setTimeout(callback, delay);
        return { remove: jest.fn() };
      })
    } as any;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should use BASE_PLAYER_SCALE for idle', () => {
    player1.getData.mockReturnValueOnce(false); // not hit
    (scene as any)['updatePlayerAnimation'](0);
    expect(player1.setScale).toHaveBeenCalledWith(0.4);
  });

  it('should use base scale for blocking', () => {
    player1.getData.mockImplementation((key: string) => key === 'isBlocking');
    (scene as any)['updatePlayerAnimation'](0);
    // Blocking now uses base scale (0.4) per new implementation
    expect(player1.setScale).toHaveBeenCalledWith(0.4);
  });

  it('should use BASE_PLAYER_SCALE for special attack', () => {
    player1.getData.mockImplementation((key: string) => key === 'isSpecialAttacking');
    (scene as any)['updatePlayerAnimation'](0);
    expect(player1.setScale).toHaveBeenCalledWith(0.4);
  });

  it('should use BASE_PLAYER_SCALE for normal attack', () => {
    player1.getData.mockImplementation((key: string) => key === 'isAttacking');
    (scene as any)['updatePlayerAnimation'](0);
    expect(player1.setScale).toHaveBeenCalledWith(0.4);
  });

  it('should set correct frame for attack', () => {
    const scene = new KidsFightScene();
    scene.setSafeFrame = jest.fn();
    scene.time = {
      delayedCall: jest.fn((duration, callback) => {
        // Immediately execute the callback to simulate time passing
        callback();
      })
    };
    
    const player1 = {
      setScale: jest.fn(),
      setFrame: jest.fn(),
      setData: jest.fn(),
      getData: jest.fn(),
      body: { blocked: { down: true }, velocity: { x: 0 } },
      anims: { play: jest.fn() } as any,
      texture: { key: 'player1' } as any,
      walkAnimData: { frameTime: 0, currentFrame: 0, frameDelay: 0 },
      direction: 'right',
      play: jest.fn(),
    } as any;
    player1.getData = jest.fn().mockImplementation((key) => {
      if (key === 'isAttacking') return true;
      return false;
    });
    
    scene.players = [player1];
    
    // Execute
    scene.updatePlayerAnimation(0);
    
    // Verify attack frame was set
    expect(scene.setSafeFrame).toHaveBeenCalledWith(player1, 4);
    
    // Reset mocks to check the frame reset in the delayedCall
    scene.setSafeFrame.mockClear();
    // Reset attack flag: getData returns false to simulate state cleared
    player1.getData.mockReturnValue(false);
    player1.isAttacking = false;
    
    // Re-run update to simulate delayedCall reset logic
    scene.updatePlayerAnimation(0);
    
    // Verify revert to idle frame
    expect(scene.setSafeFrame).toHaveBeenCalledWith(player1, 0);
    expect(player1.play).not.toHaveBeenCalled();
  });

  it('should set correct frame for special attack', () => {
    // Setup state for special attack animation
    player1.getData.mockImplementation((key: string) => key === 'isSpecialAttacking');
    player1.isSpecialAttacking = true;
    player1.isAttacking = false;
    player1.isBlocking = false;
    player1.health = 100;
    player1.special = 1;
    player1.direction = 'right';
    player1.walkAnimData = { frameTime: 0, currentFrame: 0, frameDelay: 0 };
    (scene as any)['updatePlayerAnimation'](0);
    expect(player1.setFrame).toHaveBeenCalledWith(6);
  });

  it('should use BASE_PLAYER_SCALE for walking', () => {
    player1.body.blocked.down = true;
    player1.body.velocity.x = 10;
    (scene as any)['updatePlayerAnimation'](0);
    expect(player1.setScale).toHaveBeenCalledWith(0.4);
  });

  it('should use BASE_PLAYER_SCALE for jumping', () => {
    player1.body.blocked.down = false;
    (scene as any)['updatePlayerAnimation'](0);
    expect(player1.setScale).toHaveBeenCalledWith(0.4);
  });
});
