// Unit tests for player scale logic in KidsFightScene
import KidsFightScene from '../kidsfight_scene';
import Phaser from 'phaser';

describe('KidsFightScene player scale', () => {
  let scene: KidsFightScene;
  let player1: Phaser.Physics.Arcade.Sprite;
  let player2: Phaser.Physics.Arcade.Sprite;

  beforeEach(() => {
    scene = new KidsFightScene();
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
    scene.players = [player1, player2];
    scene.playerBlocking = [false, false];
    // Mock setSafeFrame to call setFrame directly for testability
    scene.setSafeFrame = (player: any, frame: number) => player.setFrame(frame);
  });

  it('should use BASE_PLAYER_SCALE for idle', () => {
    player1.getData.mockReturnValueOnce(false); // not hit
    (scene as any)['updatePlayerAnimation'](0);
    expect(player1.setScale).toHaveBeenCalledWith(0.4);
  });

  it('should use BASE_PLAYER_SCALE for blocking', () => {
    scene.playerBlocking[0] = true;
    (scene as any)['updatePlayerAnimation'](0);
    // Blocking should use (0.9, 1.0) scale
    expect(player1.setScale).toHaveBeenCalledWith(0.9, 1.0);
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
    // Setup state for attack animation
    player1.getData.mockImplementation((key: string) => key === 'isAttacking');
    player1.isAttacking = true;
    player1.isBlocking = false;
    player1.health = 100;
    player1.special = 0;
    player1.direction = 'right';
    player1.walkAnimData = { frameTime: 0, currentFrame: 0, frameDelay: 0 };
    (scene as any)['updatePlayerAnimation'](0);
    expect(player1.setFrame).toHaveBeenCalledWith(4);
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
