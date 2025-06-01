import KidsFightScene from '../kidsfight_scene';

// Constants from the KidsFightScene class
const MAX_HEALTH = 200;

// Create a testable version of KidsFightScene that exposes protected methods
class TestableKidsFightScene extends KidsFightScene {
  // Mock required methods
  public create() {
    // No-op to avoid calling Phaser methods
  }
  
  public update() {
    // No-op
  }
  
  // Expose the protected methods for testing
  public testCreateHealthBars(scaleX: number, scaleY: number) {
    // @ts-ignore - We're intentionally accessing protected member for testing
    return this.createHealthBars(scaleX, scaleY);
  }

  public testUpdateHealthBar(playerIndex: number) {
    // @ts-ignore - We're intentionally accessing protected member for testing
    return this.updateHealthBar(playerIndex);
  }
}

describe('Health Bar Functionality', () => {
  let scene: TestableKidsFightScene;
  let mockPlayer1: any;
  let mockPlayer2: any;
  let mockHealthBar1: any;
  let mockHealthBar2: any;
  let mockHealthBarBg1: any;
  let mockHealthBarBg2: any;

  beforeEach(() => {
    // Create mock players
    mockPlayer1 = {
      health: MAX_HEALTH,
      setVelocityX: jest.fn(),
      setVelocityY: jest.fn(),
      setFlipX: jest.fn(),
      setData: jest.fn(),
      body: {
        blocked: { down: true },
        touching: { down: true },
        velocity: { x: 0, y: 0 }
      }
    };
    
    mockPlayer2 = {
      health: MAX_HEALTH,
      setVelocityX: jest.fn(),
      setVelocityY: jest.fn(),
      setFlipX: jest.fn(),
      setData: jest.fn(),
      body: {
        blocked: { down: true },
        touching: { down: true },
        velocity: { x: 0, y: 0 }
      }
    };
    
    // Create mock health bar graphics
    mockHealthBar1 = {
      clear: jest.fn(),
      fillStyle: jest.fn(),
      fillRect: jest.fn(),
      setScrollFactor: jest.fn(),
      setDepth: jest.fn(),
      setVisible: jest.fn(),
      destroy: jest.fn(),
      dirty: false
    };
    
    mockHealthBar2 = {
      clear: jest.fn(),
      fillStyle: jest.fn(),
      fillRect: jest.fn(),
      setScrollFactor: jest.fn(),
      setDepth: jest.fn(),
      setVisible: jest.fn(),
      destroy: jest.fn(),
      dirty: false
    };
    
    mockHealthBarBg1 = {
      setOrigin: jest.fn(),
      setScrollFactor: jest.fn(),
      setDepth: jest.fn(),
      setVisible: jest.fn(),
      destroy: jest.fn()
    };
    
    mockHealthBarBg2 = {
      setOrigin: jest.fn(),
      setScrollFactor: jest.fn(),
      setDepth: jest.fn(),
      setVisible: jest.fn(),
      destroy: jest.fn()
    };

    // Setup scene
    scene = new TestableKidsFightScene();
    
    // Mock required scene properties
    scene.sys = { 
      game: { 
        canvas: { width: 800, height: 480 },
        device: { os: { android: false, iOS: false } }
      } 
    } as any;
    
    scene.add = {
      graphics: jest.fn(() => mockHealthBar1),
      rectangle: jest.fn(() => mockHealthBarBg1),
    } as any;
    
    // Setup add.rectangle to return the correct background on consecutive calls
    (scene.add.rectangle as jest.Mock).mockImplementationOnce(() => mockHealthBarBg1)
                                      .mockImplementationOnce(() => mockHealthBarBg2);
    
    // Setup add.graphics to return the correct health bar on consecutive calls
    (scene.add.graphics as jest.Mock).mockImplementationOnce(() => mockHealthBar1)
                                     .mockImplementationOnce(() => mockHealthBar2);
    
    // Mock players array
    scene.players = [mockPlayer1, mockPlayer2];
    
    // Initialize health arrays
    scene.playerHealth = [MAX_HEALTH, MAX_HEALTH];
    
    // Set existing health bar references
    scene.healthBar1 = mockHealthBar1;
    scene.healthBar2 = mockHealthBar2;
    scene.healthBarBg1 = mockHealthBarBg1;
    scene.healthBarBg2 = mockHealthBarBg2;
    
    // Mock WebSocket manager for online mode
    scene.wsManager = {
      isHost: true,
      send: jest.fn()
    } as any;
    
    // Set online mode
    (scene as any).gameMode = 'online';
  });

  describe('Health Bar Creation', () => {
    it('should initialize health bars with correct values', () => {
      scene.testCreateHealthBars(1, 1);
      
      // Check that player health values are correctly initialized
      expect(scene.playerHealth[0]).toBe(MAX_HEALTH);
      expect(scene.playerHealth[1]).toBe(MAX_HEALTH);
      expect(scene.players[0].health).toBe(MAX_HEALTH);
      expect(scene.players[1].health).toBe(MAX_HEALTH);
      
      // Check that graphics objects are created
      expect(scene.add.rectangle).toHaveBeenCalledTimes(2);
      expect(scene.add.graphics).toHaveBeenCalledTimes(2);
      
      // Check that health bars are properly configured
      expect(mockHealthBar1.setScrollFactor).toHaveBeenCalledWith(0);
      expect(mockHealthBar1.setDepth).toHaveBeenCalledWith(1000);
      expect(mockHealthBar2.setScrollFactor).toHaveBeenCalledWith(0);
      expect(mockHealthBar2.setDepth).toHaveBeenCalledWith(1000);
      
      // Check that update was called for both players
      expect(mockHealthBar1.clear).toHaveBeenCalled();
      expect(mockHealthBar2.clear).toHaveBeenCalled();
    });
    
    it('should destroy existing health bars before creating new ones', () => {
      scene.testCreateHealthBars(1, 1);
      
      expect(mockHealthBarBg1.destroy).toHaveBeenCalled();
      expect(mockHealthBarBg2.destroy).toHaveBeenCalled();
      expect(mockHealthBar1.destroy).toHaveBeenCalled();
      expect(mockHealthBar2.destroy).toHaveBeenCalled();
    });
  });

  describe('Health Bar Updates', () => {
    it('should update player 1 health bar correctly', () => {
      scene.testUpdateHealthBar(0);
      
      // Check that health bar is cleared and properly filled
      expect(mockHealthBar1.clear).toHaveBeenCalled();
      expect(mockHealthBar1.fillStyle).toHaveBeenCalledWith(0x444444); // Background color
      expect(mockHealthBar1.fillStyle).toHaveBeenLastCalledWith(0x00ff00); // Health color
      expect(mockHealthBar1.fillRect).toHaveBeenCalledTimes(2); // Background and health
      expect(mockHealthBar1.dirty).toBe(true);
    });
    
    it('should update player 2 health bar correctly', () => {
      scene.testUpdateHealthBar(1);
      
      // Check that health bar is cleared and properly filled
      expect(mockHealthBar2.clear).toHaveBeenCalled();
      expect(mockHealthBar2.fillStyle).toHaveBeenCalledWith(0x444444); // Background color
      expect(mockHealthBar2.fillStyle).toHaveBeenLastCalledWith(0xff0000); // Health color (red for player 2)
      expect(mockHealthBar2.fillRect).toHaveBeenCalledTimes(2); // Background and health
      expect(mockHealthBar2.dirty).toBe(true);
    });
    
    it('should handle partial health correctly', () => {
      // Set player 1 to half health
      scene.playerHealth[0] = MAX_HEALTH / 2;
      scene.players[0].health = MAX_HEALTH / 2;
      
      scene.testUpdateHealthBar(0);
      
      // Check that fillRect was called with approximately half width
      expect(mockHealthBar1.fillRect).toHaveBeenCalledTimes(2);
      
      // Extract the width parameter from the last fillRect call
      const lastCallArgs = (mockHealthBar1.fillRect as jest.Mock).mock.calls[1];
      const widthParam = lastCallArgs[2];
      
      // Width should be approximately half of the full width
      // Since we're mocking canvas width as 800, barWidth should be 300,
      // and the health width should be 150 (half of 300)
      expect(widthParam).toBe(300 * 0.5);
    });
    
    it('should fix health if it is missing or zero', () => {
      // Set player 1 health to NaN
      scene.playerHealth[0] = NaN;
      scene.players[0].health = NaN;
      
      scene.testUpdateHealthBar(0);
      
      // Health should be reset to MAX_HEALTH
      expect(scene.playerHealth[0]).toBe(MAX_HEALTH);
      expect(scene.players[0].health).toBe(MAX_HEALTH);
      
      // Health bar should show full health
      expect(mockHealthBar1.fillRect).toHaveBeenCalledTimes(2);
    });
    
    it('should handle missing health bar gracefully', () => {
      // Remove health bar references
      scene.healthBar1 = null;
      scene.healthBar2 = null;
      scene.healthBarBg1 = null;
      scene.healthBarBg2 = null;
      
      // Reset mocks to test recreation
      jest.clearAllMocks();
      (scene.add.rectangle as jest.Mock).mockImplementationOnce(() => mockHealthBarBg1)
                                        .mockImplementationOnce(() => mockHealthBarBg2);
      (scene.add.graphics as jest.Mock).mockImplementationOnce(() => mockHealthBar1)
                                       .mockImplementationOnce(() => mockHealthBar2);
      
      // This should recreate the health bars
      scene.testUpdateHealthBar(0);
      
      // Should have recreated the health bars
      expect(scene.add.rectangle).toHaveBeenCalled();
      expect(scene.add.graphics).toHaveBeenCalled();
    });
  });

  describe('Online Mode Behavior', () => {
    it('should initialize host health correctly in online mode', () => {
      // Set host mode
      scene.wsManager.isHost = true;
      
      // Create health bars in host mode
      scene.testCreateHealthBars(1, 1);
      
      // Host health should be at MAX_HEALTH
      expect(scene.playerHealth[0]).toBe(MAX_HEALTH);
      expect(scene.players[0].health).toBe(MAX_HEALTH);
      
      // Health bars should be updated
      expect(mockHealthBar1.clear).toHaveBeenCalled();
      expect(mockHealthBar1.fillStyle).toHaveBeenCalledWith(expect.any(Number));
    });
    
    it('should initialize guest health correctly in online mode', () => {
      // Set guest mode
      scene.wsManager.isHost = false;
      
      // Create health bars in guest mode
      scene.testCreateHealthBars(1, 1);
      
      // Guest health should be at MAX_HEALTH
      expect(scene.playerHealth[1]).toBe(MAX_HEALTH);
      expect(scene.players[1].health).toBe(MAX_HEALTH);
      
      // Health bars should be updated
      expect(mockHealthBar2.clear).toHaveBeenCalled();
      expect(mockHealthBar2.fillStyle).toHaveBeenCalledWith(expect.any(Number));
    });
  });
});
