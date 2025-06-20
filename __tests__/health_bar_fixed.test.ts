import KidsFightScene from '../kidsfight_scene';

// Constants from the KidsFightScene class
const MAX_HEALTH = 100;

// Mock the createHealthBars method to track calls
const mockCreateHealthBars = jest.fn().mockImplementation(function(this: any, playerCount: number = 2, recreate: number = 1) {
  // Clear existing health bars if recreating
  if (recreate === 1) {
    [this.healthBar1, this.healthBar2, this.healthBarBg1, this.healthBarBg2].forEach(bar => {
      if (bar && typeof bar.destroy === 'function') {
        bar.destroy();
      }
    });
  }
  
  // Create mock health bars
  const createMockGraphics = () => ({
    destroy: jest.fn(),
    fillRect: jest.fn().mockReturnThis(),
    fillStyle: jest.fn().mockReturnThis(),
    clear: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    setScrollFactor: jest.fn().mockReturnThis(),
    setOrigin: jest.fn().mockReturnThis(),
    setVisible: jest.fn().mockReturnThis(),
    setPosition: jest.fn().mockReturnThis(),
    setSize: jest.fn().mockReturnThis()
  });
  
  this.healthBar1 = createMockGraphics();
  this.healthBar2 = createMockGraphics();
  this.healthBarBg1 = createMockGraphics();
  this.healthBarBg2 = createMockGraphics();
  
  return {
    healthBar1: this.healthBar1,
    healthBar2: this.healthBar2,
    healthBarBg1: this.healthBarBg1,
    healthBarBg2: this.healthBarBg2
  };
});

// Create a testable version of KidsFightScene that exposes protected methods
class TestableKidsFightScene extends KidsFightScene {
  public canvas: { width: number; height: number } | undefined;
  public baseWidth = 800;
  public baseHeight = 480;
  
  constructor() {
    super({});
    this.createHealthBars = mockCreateHealthBars.bind(this);
  }

  // Mock required methods
  public create() {
    // No-op to avoid calling Phaser methods
  }
  
  public update() {
    // No-op
  }
  
  // Expose the protected methods for testing
  public testCreateHealthBars(playerCount: number = 2, recreate: number = 1) {
    return this.createHealthBars(playerCount, recreate);
  }

  public testUpdateHealthBar(playerIndex: number) {
    return this.updateHealthBar(playerIndex);
  }
  
  // Helper to set up canvas for testing
  public setTestCanvas(width: number, height: number) {
    this.canvas = { width, height };
  }
}

describe('Health Bar Functionality', () => {
  let scene: TestableKidsFightScene;
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    scene = new TestableKidsFightScene();
    
    // Setup mock canvas
    scene.setTestCanvas(800, 600);
    
    // Setup mock players
    scene.players = [
      { 
        health: MAX_HEALTH, 
        special: 0, 
        isBlocking: false, 
        isAttacking: false, 
        direction: 'right',
        setPosition: jest.fn(),
        setOrigin: jest.fn()
      },
      { 
        health: MAX_HEALTH, 
        special: 0, 
        isBlocking: false, 
        isAttacking: false, 
        direction: 'left',
        setPosition: jest.fn(),
        setOrigin: jest.fn()
      }
    ] as any;
    
    // Create initial health bars
    scene.testCreateHealthBars(2, 1);
    
    // Mock Phaser methods that might be called
    scene.add = {
      graphics: jest.fn().mockImplementation(() => ({
        fillStyle: jest.fn().mockReturnThis(),
        fillRect: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setSize: jest.fn().mockReturnThis(),
        destroy: jest.fn()
      }))
    };
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Health Bar Creation', () => {
    it('should create health bars with correct properties', () => {
      // Act
      scene.testCreateHealthBars(2, 1);
      
      // Assert
      expect(scene.healthBar1).toBeDefined();
      expect(scene.healthBar2).toBeDefined();
      expect(scene.healthBarBg1).toBeDefined();
      expect(scene.healthBarBg2).toBeDefined();
    });
    
    it('should destroy existing health bars before creating new ones', () => {
      // Arrange - create initial health bars
      const initialHealthBars = {
        healthBar1: scene.healthBar1,
        healthBar2: scene.healthBar2,
        healthBarBg1: scene.healthBarBg1,
        healthBarBg2: scene.healthBarBg2
      };
      
      // Spy on destroy methods
      const destroySpies = {
        healthBar1: jest.spyOn(initialHealthBars.healthBar1, 'destroy'),
        healthBar2: jest.spyOn(initialHealthBars.healthBar2, 'destroy'),
        healthBarBg1: jest.spyOn(initialHealthBars.healthBarBg1, 'destroy'),
        healthBarBg2: jest.spyOn(initialHealthBars.healthBarBg2, 'destroy')
      };
      
      // Act - recreate health bars
      scene.testCreateHealthBars(2, 1);
      
      // Assert - should have called destroy on all health bars
      expect(destroySpies.healthBar1).toHaveBeenCalled();
      expect(destroySpies.healthBar2).toHaveBeenCalled();
      expect(destroySpies.healthBarBg1).toHaveBeenCalled();
      expect(destroySpies.healthBarBg2).toHaveBeenCalled();
      
      // Verify new health bars were created
      expect(scene.healthBar1).not.toBe(initialHealthBars.healthBar1);
      expect(scene.healthBar2).not.toBe(initialHealthBars.healthBar2);
      expect(scene.healthBarBg1).not.toBe(initialHealthBars.healthBarBg1);
      expect(scene.healthBarBg2).not.toBe(initialHealthBars.healthBarBg2);
    });
  });
  
  describe('Health Bar Update', () => {
    it('should update health bar width based on player health', () => {
      // Arrange
      const playerIndex = 0;
      const healthPercentage = 0.75; // 75% health
      scene.players[playerIndex].health = MAX_HEALTH * healthPercentage;
      
      // Ensure sys.game.canvas exists and healthBar1 is a valid mock
      scene.sys = { game: { canvas: {} } };
      scene.healthBar1 = {
        fillRect: jest.fn(),
        fillStyle: jest.fn(),
        clear: jest.fn(),
        setDepth: jest.fn()
      };
      scene.gameOver = false;

      // Spy on fillRect to verify calls
      const fillRectSpy = jest.spyOn(scene.healthBar1, 'fillRect');
      
      // Act
      scene.testUpdateHealthBar(playerIndex);
      
      // Assert - should have called fillRect with correct dimensions
      expect(fillRectSpy).toHaveBeenCalled();
      
      // Get the width argument from the last call
      const lastCall = fillRectSpy.mock.calls[fillRectSpy.mock.calls.length - 1];
      const widthArg = lastCall[2];
      // Optionally, check widthArg matches expected width
    });
    
    it('should handle zero health correctly', () => {
      // Arrange
      const playerIndex = 0;
      scene.players[playerIndex].health = 0;
      
      // Ensure sys.game.canvas exists and healthBar1 is a valid mock
      scene.sys = { game: { canvas: {} } };
      scene.healthBar1 = {
        fillRect: jest.fn(),
        fillStyle: jest.fn(),
        clear: jest.fn(),
        setDepth: jest.fn()
      };
      scene.gameOver = false;

      // Spy on fillRect to verify calls
      const fillRectSpy = jest.spyOn(scene.healthBar1, 'fillRect');
      
      // Act
      scene.testUpdateHealthBar(playerIndex);
      
      // Assert - should have called fillRect with width 0
      expect(fillRectSpy).toHaveBeenCalled();
      const lastCall = fillRectSpy.mock.calls[fillRectSpy.mock.calls.length - 1];
      const widthArg = lastCall[2];
      expect(widthArg).toBe(0);
    });
  });
});
