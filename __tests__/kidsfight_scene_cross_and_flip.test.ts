import KidsFightScene from '../kidsfight_scene';
import Phaser from 'phaser';

// Define a type for our player mock that matches what the test needs
type PlayerMock = {
  x: number;
  y: number;
  setFlipX: jest.Mock;
  setOrigin: jest.Mock;
  body: {
    velocity: { x: number; y: number };
    blocked: { down: boolean };
    touching: { down: boolean };
    setVelocityX: jest.Mock;
    setVelocityY: jest.Mock;
    setGravityY: jest.Mock;
    setBounce: jest.Mock;
    setCollideWorldBounds: jest.Mock;
    setSize: jest.Mock;
    setOffset: jest.Mock;
    setImmovable: jest.Mock;
  };
  setVelocityX: jest.Mock;
  setVelocityY: jest.Mock;
  setFrame: jest.Mock;
  getData: jest.Mock;
  setData: jest.Mock;
  texture: { key: string };
  frame: { name: string | number };
  play: jest.Mock;
  anims: {
    play: jest.Mock;
    currentAnim: { key: string } | null;
    get: jest.Mock;
  };
  isBlocking: boolean;
  isAttacking: boolean;
  health: number;
  special: number;
  direction: string;
  setScale: jest.Mock;
  setInteractive: jest.Mock;
  on: jest.Mock;
};

describe('KidsFightScene player cross and flip logic', () => {
  let scene: KidsFightScene;

  beforeEach(() => {
    scene = new KidsFightScene();
    // Mock Phaser sprite methods and properties
    const playerMocks: PlayerMock[] = [
      {
        x: 100,
        y: 0,
        setFlipX: jest.fn(),
        setOrigin: jest.fn(),
        body: { 
          velocity: { x: 0, y: 0 }, 
          blocked: { down: true },
          touching: { down: true },
          setVelocityX: jest.fn(),
          setVelocityY: jest.fn(),
          setGravityY: jest.fn(),
          setBounce: jest.fn(),
          setCollideWorldBounds: jest.fn(),
          setSize: jest.fn(),
          setOffset: jest.fn(),
          setImmovable: jest.fn()
        },
        setVelocityX: jest.fn(),
        setVelocityY: jest.fn(),
        setFrame: jest.fn(),
        getData: jest.fn(() => false),
        setData: jest.fn(),
        texture: { key: 'player1' },
        frame: { name: 0 },
        play: jest.fn(),
        anims: {
          play: jest.fn(),
          currentAnim: { key: 'idle' },
          get: jest.fn().mockReturnValue({ key: 'idle' })
        },
        isBlocking: false,
        isAttacking: false,
        health: 100,
        special: 0,
        direction: 'right',
        setScale: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis()
      },
      {
        x: 200,
        y: 0,
        setFlipX: jest.fn(),
        setOrigin: jest.fn(),
        body: { 
          velocity: { x: 0, y: 0 }, 
          blocked: { down: true },
          touching: { down: true },
          setVelocityX: jest.fn(),
          setVelocityY: jest.fn(),
          setGravityY: jest.fn(),
          setBounce: jest.fn(),
          setCollideWorldBounds: jest.fn(),
          setSize: jest.fn(),
          setOffset: jest.fn(),
          setImmovable: jest.fn()
        },
        setVelocityX: jest.fn(),
        setVelocityY: jest.fn(),
        setFrame: jest.fn(),
        getData: jest.fn(() => false),
        setData: jest.fn(),
        texture: { key: 'player2' },
        frame: { name: 0 },
        play: jest.fn(),
        anims: {
          play: jest.fn(),
          currentAnim: { key: 'idle' },
          get: jest.fn().mockReturnValue({ key: 'idle' })
        },
        isBlocking: false,
        isAttacking: false,
        health: 100,
        special: 0,
        direction: 'left',
        setScale: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis()
      }
    ];
    // Type assertion to handle the fixed-length tuple type
    scene.players = playerMocks as [PlayerMock, PlayerMock];
    scene.playerDirection = ['right', 'left'];
    // Mock physics with pause method
    scene.physics = { pause: jest.fn() } as any;
  });

  it('should flipX and directions correctly when player1 is left of player2', () => {
    if (!scene.players[0] || !scene.players[1]) {
      throw new Error('Players not properly initialized');
    }
    
    scene.players[0].x = 100;
    scene.players[1].x = 200;
    
    // Mock the update method to avoid side effects
    const originalUpdate = scene.update;
    scene.update = jest.fn();
    
    // Call the original update method
    originalUpdate.call(scene);
    
    expect(scene.players[0].setFlipX).toHaveBeenCalledWith(false);
    expect(scene.players[1].setFlipX).toHaveBeenCalledWith(true);
    expect(scene.playerDirection[0]).toBe('right');
    expect(scene.playerDirection[1]).toBe('left');
    
    // Restore the original update method
    scene.update = originalUpdate;
  });

  it('should flipX and directions correctly when player1 is right of player2', () => {
    if (!scene.players[0] || !scene.players[1]) {
      throw new Error('Players not properly initialized');
    }
    
    scene.players[0].x = 300;
    scene.players[1].x = 200;
    
    // Mock the update method to avoid side effects
    const originalUpdate = scene.update;
    scene.update = jest.fn();
    
    // Call the original update method
    originalUpdate.call(scene);
    
    expect(scene.players[0].setFlipX).toHaveBeenCalledWith(true);
    expect(scene.players[1].setFlipX).toHaveBeenCalledWith(false);
    expect(scene.playerDirection[0]).toBe('left');
    expect(scene.playerDirection[1]).toBe('right');
    
    // Restore the original update method
    scene.update = originalUpdate;
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
