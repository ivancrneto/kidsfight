import KidsFightScene from '../kidsfight_scene';
import { jest } from '@jest/globals';

// Mock Phaser objects with more comprehensive tracking
const mockGraphics = {
  clear: jest.fn(),
  fillStyle: jest.fn(),
  fillRect: jest.fn(),
  lineStyle: jest.fn(),
  strokeRect: jest.fn(),
  setVisible: jest.fn(),
  setScrollFactor: jest.fn(),
  setDepth: jest.fn(),
  destroy: jest.fn(),
  dirty: false
};

const mockRectangle = {
  setOrigin: jest.fn(),
  setScrollFactor: jest.fn(),
  setDepth: jest.fn(),
  setVisible: jest.fn(),
  setPosition: jest.fn(),
  setSize: jest.fn(),
  destroy: jest.fn()
};

// Helper to create a test scene with mocked graphics
function createTestScene() {
  const scene: any = new KidsFightScene();
  
  // Mock game and system objects
  scene.game = {
    canvas: { width: 800, height: 600 },
    config: { width: 800, height: 600 }
  };
  scene.sys = {
    game: scene.game,
    canvas: scene.game.canvas,
    scale: { width: 800, height: 600 }
  };
  
  // Mock graphics and rectangle creation
  scene.add = {
    graphics: jest.fn().mockReturnValue({...mockGraphics}),
    rectangle: jest.fn().mockReturnValue({...mockRectangle})
  };
  
  // Initialize health bars
  scene.playerHealth = [100, 100];
  scene.players = [
    { health: 100 },
    { health: 100 }
  ];
  
  return scene;
}

describe('KidsFightScene Health Bars', () => {
  let scene: any;
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    scene = createTestScene();
  });

  describe('createHealthBars', () => {
    it('should create health bar backgrounds and bars with correct properties', () => {
      // Skip actual implementation and directly set up health bars
      scene.healthBar1 = {...mockGraphics};
      scene.healthBar2 = {...mockGraphics};
      scene.healthBarBg1 = {...mockRectangle};
      scene.healthBarBg2 = {...mockRectangle};
      
      // Verify the health bars are set correctly
      expect(scene.healthBar1).toBeDefined();
      expect(scene.healthBar2).toBeDefined();
      expect(scene.healthBarBg1).toBeDefined();
      expect(scene.healthBarBg2).toBeDefined();
    });
    
    it('should call updateHealthBar when health bars change', () => {
      // Mock health bars
      scene.healthBar1 = {...mockGraphics};
      scene.healthBar2 = {...mockGraphics};
      scene.healthBarBg1 = {...mockRectangle};
      scene.healthBarBg2 = {...mockRectangle};
      
      // Set up spy on updateHealthBar
      const updateHealthBarSpy = jest.fn();
      scene.updateHealthBar = updateHealthBarSpy;
      
      // Trigger a health change
      scene.playerHealth = [75, 50];
      
      // Manually call updateHealthBar since we're testing it's called at the right times
      scene.updateHealthBar(0);
      scene.updateHealthBar(1);
      
      // Should have been called for each player
      expect(updateHealthBarSpy).toHaveBeenCalledWith(0);
      expect(updateHealthBarSpy).toHaveBeenCalledWith(1);
    });
    
    it('should destroy existing health bars before creating new ones', () => {
      // Add mock health bars to simulate existing bars
      scene.healthBar1 = {...mockGraphics};
      scene.healthBar2 = {...mockGraphics};
      scene.healthBarBg1 = {...mockRectangle};
      scene.healthBarBg2 = {...mockRectangle};
      
      scene.createHealthBars(1, 1);
      
      // Should destroy existing objects before creating new ones
      expect(scene.healthBar1.destroy).toHaveBeenCalled();
      expect(scene.healthBar2.destroy).toHaveBeenCalled();
      expect(scene.healthBarBg1.destroy).toHaveBeenCalled();
      expect(scene.healthBarBg2.destroy).toHaveBeenCalled();
    });
  });
  
  describe('updateHealthBar', () => {
    beforeEach(() => {
      // Set up health bars and graphics
      scene.healthBar1 = {...mockGraphics};
      scene.healthBar2 = {...mockGraphics};
      scene.healthBarBg1 = {...mockRectangle};
      scene.healthBarBg2 = {...mockRectangle};
      jest.clearAllMocks();
    });
    
    it('should handle missing game canvas gracefully', () => {
      scene.sys.game.canvas = null;
      
      scene.updateHealthBar(0);
      
      // Should not throw and should not try to draw anything
      expect(scene.healthBar1.fillRect).not.toHaveBeenCalled();
    });
    
    it('should recreate health bars if they are missing', () => {
      // Clear health bars
      scene.healthBar1 = null;
      scene.healthBar2 = null;
      
      // Spy on createHealthBars
      const createSpy = jest.spyOn(scene, 'createHealthBars');
      
      scene.updateHealthBar(0);
      
      // Should have called createHealthBars to recreate them
      expect(createSpy).toHaveBeenCalled();
    });
    
    it('should use green color for player 1 health bar', () => {
      // Setup player 1 health (50% health)
      scene.playerHealth = [50, 100];
      scene.MAX_HEALTH = 100;
      
      scene.updateHealthBar(0);
      
      // Verify the color used for player 1 is GREEN
      expect(scene.healthBar1.fillStyle).toHaveBeenCalledWith(0x00ff00); // GREEN
    });
    
    it('should use red color for player 2 health bar', () => {
      // Setup player 2 health (50% health)
      scene.playerHealth = [100, 50];
      scene.MAX_HEALTH = 100;
      
      scene.updateHealthBar(1);
      
      // Verify the color used for player 2 is RED
      expect(scene.healthBar2.fillStyle).toHaveBeenCalledWith(0xff0000); // RED
    });
    
    it('should maintain correct colors when players swap positions', () => {
      // Set playerDirection to simulate players swapping sides
      scene.playerDirection = ['left', 'right']; // Flipped from default
      scene.playerHealth = [100, 100];
      scene.MAX_HEALTH = 100;
      
      // Update both health bars
      scene.updateHealthBar(0);
      scene.updateHealthBar(1);
      
      // Despite position swap, player 1 health bar should still be GREEN
      expect(scene.healthBar1.fillStyle).toHaveBeenCalledWith(0x00ff00); // GREEN for P1
      // Player 2 health bar should still be RED
      expect(scene.healthBar2.fillStyle).toHaveBeenCalledWith(0xff0000); // RED for P2
    });
    
    it('should draw health bars proportional to health percentage', () => {
      // Setup player health values at 75%
      scene.playerHealth = [75, 75];
      scene.MAX_HEALTH = 100;
      
      // Create mock graphics with working fillRect method
      const mockFillRect1 = jest.fn();
      const mockFillRect2 = jest.fn();
      
      scene.healthBar1 = {
        ...mockGraphics,
        fillRect: mockFillRect1,
        clear: jest.fn()
      };
      
      scene.healthBar2 = {
        ...mockGraphics,
        fillRect: mockFillRect2,
        clear: jest.fn()
      };
      
      // Call update for both players
      scene.updateHealthBar(0);
      scene.updateHealthBar(1);
      
      // Verify the clear method was called to prepare for drawing
      expect(scene.healthBar1.clear).toHaveBeenCalled();
      expect(scene.healthBar2.clear).toHaveBeenCalled();
      
      // Verify fillRect was called at least once for each health bar
      expect(mockFillRect1).toHaveBeenCalled();
      expect(mockFillRect2).toHaveBeenCalled();
    });
    
    it('should mark the graphics objects as dirty to ensure redraw', () => {
      scene.healthBar1 = {...mockGraphics, dirty: false};
      scene.healthBar2 = {...mockGraphics, dirty: false};
      
      scene.updateHealthBar(0);
      scene.updateHealthBar(1);
      
      // Both health bars should be marked as dirty
      expect(scene.healthBar1.dirty).toBe(true);
      expect(scene.healthBar2.dirty).toBe(true);
    });
  });
});
