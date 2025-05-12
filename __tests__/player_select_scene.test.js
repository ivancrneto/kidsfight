import PlayerSelectScene from '../player_select_scene';
import wsManager from '../websocket_manager';

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  send: jest.fn(),
  close: jest.fn(),
  onmessage: jest.fn()
}));

// Mock scene, add, cameras, and other Phaser components
const mockScene = {
  start: jest.fn()
};

const createMockSprite = () => ({
  setOrigin: jest.fn().mockReturnThis(),
  setInteractive: jest.fn().mockReturnThis(),
  on: jest.fn().mockReturnThis(),
  setScale: jest.fn().mockReturnThis(),
  setDepth: jest.fn().mockReturnThis(),
  setAlpha: jest.fn().mockReturnThis(),
  setVisible: jest.fn().mockReturnThis(),
  setText: jest.fn().mockReturnThis(),
  setColor: jest.fn().mockReturnThis(),
  setCrop: jest.fn().mockReturnThis(),
  setPosition: jest.fn().mockReturnThis(),
  setStrokeStyle: jest.fn().mockReturnThis()
});

const mockAdd = {
  sprite: jest.fn(() => createMockSprite()),
  text: jest.fn(() => createMockSprite()),
  image: jest.fn(() => createMockSprite()),
  rectangle: jest.fn(() => createMockSprite()),
  circle: jest.fn(() => createMockSprite())
};

const mockCameras = {
  main: {
    width: 800,
    height: 600
  }
};

const mockScale = {
  width: 800,
  height: 600,
  on: jest.fn().mockReturnThis()
};

const mockTextures = {
  addSpriteSheet: jest.fn()
};

describe('D.Isa (player9) integration', () => {
  let scene;
  
  beforeEach(() => {
    jest.clearAllMocks();
    scene = new PlayerSelectScene();
    scene.selected = { p1: 'player1', p2: 'player2' };
    scene.CHARACTER_KEYS = [
      'player1', 'player2', 'player3', 'player4',
      'player5', 'player6', 'player7', 'player8', 'player9'
    ];
    scene.scene = mockScene;
    scene.add = mockAdd;
    scene.cameras = mockCameras;
    scene.scale = mockScale;
    scene.textures = {
      ...mockTextures,
      exists: jest.fn(key => key === 'player9' ? false : true), // Simulate player9 not existing yet
      get: jest.fn(key => ({
        getSourceImage: jest.fn(),
        frames: { __BASE: {} },
        add: jest.fn()
      }))
    };
    scene.time = {
      delayedCall: jest.fn((delay, callback) => callback())
    };
  });

  it('creates player9 spritesheet if not already loaded', () => {
    // Should call addSpriteSheet for player9
    scene.textures.addSpriteSheet = jest.fn();
    scene.createScene();
    expect(scene.textures.addSpriteSheet).toHaveBeenCalledWith(
      'player9',
      undefined,
      expect.objectContaining({ 
        frameWidth: expect.any(Number), 
        frameHeight: expect.any(Number),
        startFrame: expect.any(Number),
        endFrame: expect.any(Number)
      })
    );
  });

  it('includes D.Isa (player9) in CHARACTER_KEYS and options arrays', () => {
    scene.textures.exists = jest.fn(() => true); // Simulate all textures exist
    scene.createScene();
    expect(scene.CHARACTER_KEYS).toContain('player9');
    expect(scene.p1Options.length).toBeGreaterThanOrEqual(9);
    expect(scene.p2Options.length).toBeGreaterThanOrEqual(9);
  });
});
