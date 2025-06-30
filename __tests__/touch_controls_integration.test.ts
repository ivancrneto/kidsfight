// @ts-nocheck
import KidsFightScene from '../kidsfight_scene';

describe('Touch Controls Integration', () => {
  let scene;
  
  beforeEach(() => {
    // Create a new scene instance
    scene = new KidsFightScene();
    
    // Mock all required methods and properties
    scene.add = {
      image: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
      }),
      rectangle: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis(),
      }),
      circle: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
      }),
      text: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
      }),
    };
    
    scene.physics = {
      add: {
        existing: jest.fn(),
        collider: jest.fn(),
        sprite: jest.fn().mockReturnValue({
          setOrigin: jest.fn().mockReturnThis(),
          setBounce: jest.fn().mockReturnThis(),
          setCollideWorldBounds: jest.fn().mockReturnThis(),
          body: { setGravityY: jest.fn() },
          setScale: jest.fn().mockReturnThis(),
        }),
      },
    };
    
    scene.anims = {
      create: jest.fn(),
      exists: jest.fn().mockReturnValue(false),
      generateFrameNumbers: jest.fn().mockReturnValue([]),
    };
    
    scene.sys = {
      game: {
        canvas: {
          width: 800,
          height: 600,
        },
      },
    };
    
    // Spy on the createTouchControls method
    scene.createTouchControls = jest.fn();
    scene.createPlatforms = jest.fn();
    
    // Mock other required methods
    scene.getCharacterName = jest.fn().mockReturnValue('Test Character');
    scene.createAnimations = jest.fn();
    scene.createHealthBars = jest.fn();
    scene.createSpecialPips = jest.fn();
    scene.createTimer = jest.fn();
    scene.setupCollisions = jest.fn();
    scene.setupKeyboardControls = jest.fn();
  });
  
  test('should call createTouchControls in create method', () => {
    // Call the create method
    scene.create({});
    
    // Verify that createTouchControls was called
    expect(scene.createTouchControls).toHaveBeenCalledTimes(1);
  });
  
  test('should call createTouchControls after createPlatforms', () => {
    // Create a mock implementation to track call order
    const callOrder = [];
    
    scene.createPlatforms.mockImplementation(() => {
      callOrder.push('createPlatforms');
    });
    
    scene.createTouchControls.mockImplementation(() => {
      callOrder.push('createTouchControls');
    });
    
    // Call the create method
    scene.create({});
    
    // Verify the call order
    expect(callOrder[0]).toBe('createPlatforms');
    expect(callOrder[1]).toBe('createTouchControls');
  });
});
