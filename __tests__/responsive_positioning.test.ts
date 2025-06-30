// @ts-ignore - Import KidsFightScene
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
    },
    Input: {
      Keyboard: {
        KeyCodes: {
          W: 'W',
          A: 'A',
          S: 'S',
          D: 'D',
          SPACE: 'SPACE',
          Q: 'Q',
          SHIFT: 'SHIFT',
          ENTER: 'ENTER'
        }
      }
    }
  };
});

// Create a testable subclass that exposes private methods
class TestableKidsFightScene extends KidsFightScene {
  // Expose private methods for testing
  public testCreatePlatforms() {
    // @ts-ignore - Access private method
    return this.createPlatforms();
  }
  
  public getMainPlatform() {
    // @ts-ignore - Access private property
    return this.mainPlatform;
  }
  
  public getUpperPlatform() {
    // @ts-ignore - Access private property
    return this.upperPlatform;
  }
  
  public getPlayers() {
    // @ts-ignore - Access private property
    return this.players;
  }
}

describe('Responsive Player Positioning', () => {
  let scene: TestableKidsFightScene;
  let addRectangleSpy: jest.SpyInstance;
  let addSpriteSpy: jest.SpyInstance;
  let addColliderSpy: jest.SpyInstance;
  let addExistingSpy: jest.SpyInstance;
  
  beforeEach(() => {
    // Create a fresh scene for each test with required parameters
    scene = new TestableKidsFightScene({ 
      key: 'TestScene',
      active: false,
      visible: false,
      pack: null,
      cameras: null,
      map: {},
      physics: {},
      loader: {},
      plugins: null
    });
    
    // Mock canvas dimensions
    // @ts-ignore - Set sys property
    scene.sys = {
      game: {
        canvas: {
          width: 800,
          height: 600
        }
      }
    } as any;
    
    // Mock physics and add methods
    scene['physics'] = {
      add: {
        sprite: jest.fn().mockImplementation((x, y, key) => {
          const sprite = new (jest.requireMock('phaser').Physics.Arcade.Sprite)();
          sprite.x = x;
          sprite.y = y;
          sprite.texture = { key };
          return sprite;
        }),
        existing: jest.fn(),
        collider: jest.fn()
      }
    } as any;
    
    scene['add'] = {
      rectangle: jest.fn().mockImplementation((x, y, width, height) => {
        const rect = new (jest.requireMock('phaser').GameObjects.Rectangle)();
        rect.x = x;
        rect.y = y;
        rect.width = width;
        rect.height = height;
        return rect;
      })
    } as any;
    
    // Set up spies
    addRectangleSpy = jest.spyOn(scene['add'], 'rectangle');
    addSpriteSpy = jest.spyOn(scene['physics'].add, 'sprite');
    addColliderSpy = jest.spyOn(scene['physics'].add, 'collider');
    addExistingSpy = jest.spyOn(scene['physics'].add, 'existing');
    
    // Mock input
    scene['input'] = {
      keyboard: {
        addKey: jest.fn(),
        createCursorKeys: jest.fn().mockReturnValue({})
      }
    } as any;
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Platform Creation', () => {
    it('should create a main platform with responsive width', () => {
      // Act
      scene.testCreatePlatforms();
      
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
      // Act
      scene.testCreatePlatforms();
      
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
      // Act
      scene.testCreatePlatforms();
      
      // Assert
      expect(addExistingSpy).toHaveBeenCalledTimes(2);
      expect(addColliderSpy).toHaveBeenCalledTimes(2);
    });
    
    it('should adjust platform width based on screen size', () => {
      // Arrange - Set a different screen width
      scene['sys'].game.canvas.width = 1200;
      
      // Act
      scene.testCreatePlatforms();
      
      // Assert - Check if main platform width matches screen width
      const mainPlatformCall = addRectangleSpy.mock.calls.find(
        call => call[1] === 360 && call[2] === 1200
      );
      
      expect(mainPlatformCall).toBeDefined();
      expect(mainPlatformCall[0]).toBe(600); // X position (center of screen)
    });
  });
  
  describe('Player Positioning', () => {
    beforeEach(() => {
      // Setup players array
      scene['players'] = [];
    });
    
    it('should position players responsively based on screen width', () => {
      // Arrange
      const screenWidth = 800;
      scene['sys'].game.canvas.width = screenWidth;
      
      // Act - Call create method to initialize players
      // @ts-ignore - Access create method
      scene.create({});
      
      // Assert
      const spriteCalls = addSpriteSpy.mock.calls;
      
      // Find player 1 and player 2 calls
      const player1Call = spriteCalls[0];
      const player2Call = spriteCalls[1];
      
      // Player 1 should be at 15% of screen width
      expect(player1Call[0]).toBeCloseTo(Math.max(screenWidth * 0.15, 80));
      expect(player1Call[1]).toBe(310); // 50px above platform
      
      // Player 2 should be at 85% of screen width
      expect(player2Call[0]).toBeCloseTo(Math.min(screenWidth * 0.85, screenWidth - 80));
      expect(player2Call[1]).toBe(310); // 50px above platform
    });
    
    it('should respect minimum margins on small screens', () => {
      // Arrange - Set a very small screen width
      const smallScreenWidth = 300;
      scene['sys'].game.canvas.width = smallScreenWidth;
      
      // Act
      scene['create']();
      
      // Assert
      const spriteCalls = addSpriteSpy.mock.calls;
      
      // Find player 1 and player 2 calls
      const player1Call = spriteCalls[0];
      const player2Call = spriteCalls[1];
      
      // Player 1 should be at minimum 80px from left
      expect(player1Call[0]).toBe(80);
      
      // Player 2 should be at minimum 80px from right
      expect(player2Call[0]).toBe(smallScreenWidth - 80);
    });
    
    it('should position players above the platform', () => {
      // Act
      scene['create']();
      
      // Assert
      const spriteCalls = addSpriteSpy.mock.calls;
      
      // Both players should be positioned 50px above the platform
      expect(spriteCalls[0][1]).toBe(310); // platformHeight(360) - 50
      expect(spriteCalls[1][1]).toBe(310); // platformHeight(360) - 50
    });
    
    it('should handle large screens correctly', () => {
      // Arrange - Set a large screen width
      const largeScreenWidth = 2000;
      scene['sys'].game.canvas.width = largeScreenWidth;
      
      // Act
      scene['create']();
      
      // Assert
      const spriteCalls = addSpriteSpy.mock.calls;
      
      // Player 1 should be at 15% of screen width
      expect(spriteCalls[0][0]).toBeCloseTo(largeScreenWidth * 0.15);
      
      // Player 2 should be at 85% of screen width
      expect(spriteCalls[1][0]).toBeCloseTo(largeScreenWidth * 0.85);
    });
  });
});
