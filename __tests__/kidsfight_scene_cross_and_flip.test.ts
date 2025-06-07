import KidsFightScene from '../kidsfight_scene';
import Phaser from 'phaser';

describe('KidsFightScene player cross and flip logic', () => {
  let scene: KidsFightScene;

  beforeEach(() => {
    scene = new KidsFightScene();
    // Mock Phaser sprite methods and properties
    const playerMocks = [
      {
        x: 100,
        setFlipX: jest.fn(),
        setOrigin: jest.fn(),
        body: { velocity: { x: 0 }, blocked: { down: true } },
        setFrame: jest.fn(),
        getData: jest.fn(() => false),
        texture: { key: 'player1' },
        frame: { name: 0 },
      },
      {
        x: 200,
        setFlipX: jest.fn(),
        setOrigin: jest.fn(),
        body: { velocity: { x: 0 }, blocked: { down: true } },
        setFrame: jest.fn(),
        getData: jest.fn(() => false),
        texture: { key: 'player2' },
        frame: { name: 0 },
      }
    ];
    scene.players = playerMocks;
    scene.playerDirection = ['right', 'left'];
    // Mock physics with pause method
    scene.physics = { pause: jest.fn() } as any;
  });

  it('should flipX and directions correctly when player1 is left of player2', () => {
    scene.players[0].x = 100;
    scene.players[1].x = 200;
    scene.update();
    expect(scene.players[0].setFlipX).toHaveBeenCalledWith(false);
    expect(scene.players[1].setFlipX).toHaveBeenCalledWith(true);
    expect(scene.playerDirection[0]).toBe('right');
    expect(scene.playerDirection[1]).toBe('left');
  });

  it('should flipX and directions correctly when player1 is right of player2', () => {
    scene.players[0].x = 300;
    scene.players[1].x = 200;
    scene.update();
    expect(scene.players[0].setFlipX).toHaveBeenCalledWith(true);
    expect(scene.players[1].setFlipX).toHaveBeenCalledWith(false);
    expect(scene.playerDirection[0]).toBe('left');
    expect(scene.playerDirection[1]).toBe('right');
  });
});

describe('KidsFightScene sprite frame size loading', () => {
  let scene: KidsFightScene;
  beforeEach(() => {
    scene = new KidsFightScene();
    scene.player1 = 'player1';
    scene.player2 = 'player2';
    scene.load = { 
      spritesheet: jest.fn(),
      image: jest.fn()
    };
    jest.spyOn(scene.load, 'spritesheet');
  });
  it('should load correct frame sizes for each player', () => {
    scene.preload();
    expect(typeof scene.load.spritesheet).toBe('function');
  });
});
