// @ts-nocheck - Disable TypeScript checking for this test file
import KidsFightScene from '../kidsfight_scene';

// Mock Phaser
jest.mock('phaser', () => {
  return {
    Scene: class MockScene {},
    Physics: {
      Arcade: {
        Sprite: class MockSprite {
          setOrigin() { return this; }
          setScale() { return this; }
          setBounce() { return this; }
          setGravityY() { return this; }
          setCollideWorldBounds() { return this; }
          setSize() { return this; }
          setOffset() { return this; }
          setFlipX() { return this; }
          setData() { return this; }
          getData() { return false; }
          play() { return this; }
          anims = { stop: jest.fn() };
          body = { velocity: { x: 0, y: 0 } };
        }
      }
    },
    GameObjects: {
      Rectangle: class MockRectangle {
        setOrigin() { return this; }
      }
    }
  };
});

describe('Responsive Platform Creation', () => {
  let scene;
  let addRectangleSpy;
  let addExistingSpy;
  let addColliderSpy;
  
  beforeEach(() => {
    // Create mocks for the scene methods
    scene = {
      sys: {
        game: {
          canvas: {
            width: 800,
            height: 600
          }
        }
      },
      physics: {
        add: {
          existing: jest.fn(),
          collider: jest.fn()
        }
      },
      add: {
        rectangle: jest.fn().mockImplementation((x, y, width, height) => {
          return { x, y, width, height, setOrigin: () => ({}) };
        })
      },
      players: []
    };
    
    // Set up spies
    addRectangleSpy = jest.spyOn(scene.add, 'rectangle');
    addExistingSpy = jest.spyOn(scene.physics.add, 'existing');
    addColliderSpy = jest.spyOn(scene.physics.add, 'collider');
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it('should create a main platform with responsive width', () => {
    // Call the createPlatforms function directly with our mocked scene
    KidsFightScene.prototype.createPlatforms.call(scene);
    
    // Assert - Check if rectangle was created for main platform
    const mainPlatformCall = addRectangleSpy.mock.calls.find(
      call => call[1] === 360 // Y position of main platform
    );
    
    expect(mainPlatformCall).toBeDefined();
    expect(mainPlatformCall[0]).toBe(400); // X position (center of screen)
    expect(mainPlatformCall[2]).toBe(800); // Width (full screen width)
    expect(mainPlatformCall[3]).toBe(20);  // Height
  });
  
  it('should create an upper platform', () => {
    // Call the createPlatforms function directly with our mocked scene
    KidsFightScene.prototype.createPlatforms.call(scene);
    
    // Assert - Check if rectangle was created for upper platform
    const upperPlatformCall = addRectangleSpy.mock.calls.find(
      call => call[1] === 200 // Y position of upper platform
    );
    
    expect(upperPlatformCall).toBeDefined();
    expect(upperPlatformCall[0]).toBe(400); // X position
    expect(upperPlatformCall[2]).toBe(300); // Width
    expect(upperPlatformCall[3]).toBe(20);  // Height
  });
  
  it('should add physics to both platforms', () => {
    // Call the createPlatforms function directly with our mocked scene
    KidsFightScene.prototype.createPlatforms.call(scene);
    
    // Assert
    expect(addExistingSpy).toHaveBeenCalledTimes(2);
    expect(addColliderSpy).toHaveBeenCalledTimes(2);
  });
  
  it('should adjust platform width based on screen size', () => {
    // Arrange - Set a different screen width
    scene.sys.game.canvas.width = 1200;
    
    // Call the createPlatforms function directly with our mocked scene
    KidsFightScene.prototype.createPlatforms.call(scene);
    
    // Assert - Check if main platform width matches screen width
    const mainPlatformCall = addRectangleSpy.mock.calls.find(
      call => call[1] === 360 && call[2] === 1200
    );
    
    expect(mainPlatformCall).toBeDefined();
    expect(mainPlatformCall[0]).toBe(600); // X position (center of screen)
  });
});
