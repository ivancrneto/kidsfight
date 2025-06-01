import KidsFightScene from '../kidsfight_scene';
import { jest } from '@jest/globals';

// Mock Phaser objects
const mockGraphics = {
  clear: jest.fn(),
  fillStyle: jest.fn(),
  fillRect: jest.fn(),
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
    graphics: jest.fn().mockReturnValue(mockGraphics),
    rectangle: jest.fn().mockReturnValue(mockRectangle)
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
      // Call the method
      scene.createHealthBars(1, 1);
      
      // Verify rectangle creation for backgrounds
      expect(scene.add.rectangle).toHaveBeenCalledTimes(2);
      expect(scene.add.rectangle).toHaveBeenCalledWith(210, 20, 300, 24, 0x222222);
      expect(scene.add.rectangle).toHaveBeenCalledWith(590, 20, 300, 24, 0x222222);
      
      // Verify graphics creation for health bars
      expect(scene.add.graphics).toHaveBeenCalledTimes(2);
      
      // Verify background properties
      expect(mockRectangle.setOrigin).toHaveBeenCalledWith(0.5, 0.5);
      expect(mockRectangle.setScrollFactor).toHaveBeenCalledWith(0);
      expect(mockRectangle.setDepth).toHaveBeenCalledWith(999);
      
      // Verify health bar properties
      expect(mockGraphics.setScrollFactor).toHaveBeenCalledWith(0);
      expect(mockGraphics.setDepth).toHaveBeenCalledWith(1000);
    });
    
    it('should initialize player health to MAX_HEALTH', () => {
      const MAX_HEALTH = 100; // Should match the constant in your code
      scene.createHealthBars(1, 1);
      
      expect(scene.playerHealth).toEqual([MAX_HEALTH, MAX_HEALTH]);
      if (scene.players[0]) {
        expect(scene.players[0].health).toBe(MAX_HEALTH);
      }
      if (scene.players[1]) {
        expect(scene.players[1].health).toBe(MAX_HEALTH);
      }
    });
    
    it('should destroy existing health bars before creating new ones', () => {
      // First creation
      scene.createHealthBars(1, 1);
      
      // Reset mocks to track second creation
      jest.clearAllMocks();
      
      // Create again
      scene.createHealthBars(1, 1);
      
      // Should have destroyed previous bars
      expect(mockGraphics.destroy).toHaveBeenCalledTimes(2);
      expect(mockRectangle.destroy).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('updateHealthBar', () => {
    beforeEach(() => {
      // Initialize health bars before each test
      scene.createHealthBars(1, 1);
      jest.clearAllMocks();
    });
    
    it('should handle missing game canvas gracefully', () => {
      scene.sys.game.canvas = null;
      
      scene.updateHealthBar(0);
      
      // Should not throw and should not try to draw anything
      expect(mockGraphics.fillRect).not.toHaveBeenCalled();
    });
    
    it('should recreate health bars if they are missing', () => {
      // Clear health bars
      scene.healthBar1 = null;
      scene.healthBar2 = null;
      scene.healthBarBg1 = null;
      scene.healthBarBg2 = null;
      
      // Spy on createHealthBars
      const createSpy = jest.spyOn(scene, 'createHealthBars');
      
      scene.updateHealthBar(0);
      
      // Should have recreated health bars
      expect(createSpy).toHaveBeenCalled();
    });
    
    it('should draw player 1 health bar correctly', () => {
      scene.playerHealth = [150, 100]; // 75% health (150/200)
      scene.players[0].health = 150;
      
      scene.updateHealthBar(0);
      
      // Should draw background (gray)
      expect(mockGraphics.fillStyle).toHaveBeenCalledWith(0x444444);
      expect(mockGraphics.fillRect.mock.calls).toEqual(
        expect.arrayContaining([
          [60, 8, 300, 24], // background
          [60, 8, 225, 24], // foreground (75% of 300)
        ])
      );
    });
    
    it('should draw player 2 health bar correctly', () => {
      scene.playerHealth = [100, 150]; // 75% health (150/200)
      scene.players[1].health = 150;
      
      scene.updateHealthBar(1);
      
      // Should draw background (gray)
      expect(mockGraphics.fillStyle).toHaveBeenCalledWith(0x444444);
      expect(mockGraphics.fillRect.mock.calls).toEqual(
        expect.arrayContaining([
          [440, 8, 300, 24], // background
          [440, 8, 225, 24], // foreground (75% of 300)
        ])
      );
    });
    
    it('should handle zero health correctly', () => {
      scene.playerHealth = [0, 100];
      
      scene.updateHealthBar(0);
      
      // Should only draw background, no health bar
      expect(mockGraphics.fillStyle).toHaveBeenCalledWith(0x444444);
      expect(mockGraphics.fillRect.mock.calls).toEqual(
        expect.arrayContaining([
          [60, 8, 300, 24], // background
        ])
      );
    });
    
    it('should handle full health correctly', () => {
      scene.playerHealth = [100, 100];
      
      scene.updateHealthBar(0);
      
      // Should draw full health bar
      expect(mockGraphics.fillStyle).toHaveBeenCalledWith(0x00ff00);
      expect(mockGraphics.fillRect.mock.calls).toEqual(
        expect.arrayContaining([
          [60, 8, 300, 24], // background
          [60, 8, 300, 24], // foreground
        ])
      );
    });
    
    it('should handle scaling correctly', () => {
      // Test with a different scale
      scene.game.canvas.width = 1600;
      scene.game.canvas.height = 1200;
      
      scene.updateHealthBar(0);
      
      // Should use scaled dimensions
      const expectedX = 120; // 60 * 2 (scaleX = 2)
      const expectedWidth = 600; // 300 * 2
      
      expect(mockGraphics.fillRect.mock.calls).toEqual(
        expect.arrayContaining([
          [expectedX, expect.any(Number), expectedWidth, expect.any(Number)],
          [expectedX, expect.any(Number), expectedWidth, expect.any(Number)],
        ])
      );
    });
  });
});
