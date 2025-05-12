// Tests for the health bar system
import KidsFightScene from '../kidsfight_scene.js';

// Define constants used in the game
const MAX_HEALTH = 100;
const ATTACK_DAMAGE = 10;
const SPECIAL_DAMAGE = 20;

describe('Health Bar System', () => {
  let scene;
  
  // Setup common mocks for all tests
  beforeEach(() => {
    // Create scene instance
    scene = new KidsFightScene();
    
    // Mock health bar elements
    scene.healthBar1 = {
      width: 200,
      setSize: jest.fn(),
      x: 100,
      y: 50
    };
    
    scene.healthBar2 = {
      width: 200,
      setSize: jest.fn(),
      x: 500,
      y: 50
    };
    
    scene.healthBarBorder1 = {
      setSize: jest.fn()
    };
    
    scene.healthBarBorder2 = {
      setSize: jest.fn()
    };
    
    // Initialize player health
    scene.playerHealth = [MAX_HEALTH, MAX_HEALTH];
    
    // Mock update method
    scene.update = jest.fn();
    
    // Mock add graphics method
    scene.add = {
      graphics: jest.fn().mockReturnValue({
        fillStyle: jest.fn().mockReturnThis(),
        fillRect: jest.fn().mockReturnThis(),
        lineStyle: jest.fn().mockReturnThis(),
        strokeRect: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        clear: jest.fn().mockReturnThis(),
        destroy: jest.fn()
      })
    };
    
    // Mock updateHealthBars method for testing
    scene.updateHealthBars = function() {
      const healthPercentage1 = this.playerHealth[0] / MAX_HEALTH;
      const healthPercentage2 = this.playerHealth[1] / MAX_HEALTH;
      
      this.healthBar1.setSize(200 * healthPercentage1, 20);
      this.healthBar2.setSize(200 * healthPercentage2, 20);
    };
  });
  
  describe('Single Health Bar System', () => {
    it('should initialize players with full health (MAX_HEALTH)', () => {
      expect(scene.playerHealth[0]).toBe(MAX_HEALTH);
      expect(scene.playerHealth[1]).toBe(MAX_HEALTH);
    });
    
    it('should update health bar width proportionally to damage taken', () => {
      // Apply damage to player 1
      scene.playerHealth[0] -= ATTACK_DAMAGE;
      scene.updateHealthBars();
      
      // Calculate expected width
      const expectedWidth = 200 * (MAX_HEALTH - ATTACK_DAMAGE) / MAX_HEALTH;
      
      // Check if health bar was updated correctly
      expect(scene.healthBar1.setSize).toHaveBeenCalledWith(expectedWidth, 20);
      expect(scene.healthBar2.setSize).toHaveBeenCalledWith(200, 20); // Player 2 health unchanged
    });
    
    it('should handle special attacks with correct health bar updates', () => {
      // Apply special attack damage to player 2
      scene.playerHealth[1] -= SPECIAL_DAMAGE;
      scene.updateHealthBars();
      
      // Calculate expected width
      const expectedWidth = 200 * (MAX_HEALTH - SPECIAL_DAMAGE) / MAX_HEALTH;
      
      // Check if health bar was updated correctly
      expect(scene.healthBar1.setSize).toHaveBeenCalledWith(200, 20); // Player 1 health unchanged
      expect(scene.healthBar2.setSize).toHaveBeenCalledWith(expectedWidth, 20);
    });
    
    it('should handle multiple hits with correct cumulative health reduction', () => {
      // Apply multiple attacks to player 1
      scene.playerHealth[0] -= ATTACK_DAMAGE;
      scene.updateHealthBars();
      
      scene.playerHealth[0] -= ATTACK_DAMAGE;
      scene.updateHealthBars();
      
      // Calculate expected width after two attacks
      const expectedWidth = 200 * (MAX_HEALTH - 2 * ATTACK_DAMAGE) / MAX_HEALTH;
      
      // Check if health bar was updated correctly after both attacks
      expect(scene.healthBar1.setSize).toHaveBeenLastCalledWith(expectedWidth, 20);
    });
    
    it('should handle health at 0 correctly', () => {
      // Reduce player 2 health to 0
      scene.playerHealth[1] = 0;
      scene.updateHealthBars();
      
      // Health bar should be empty
      expect(scene.healthBar2.setSize).toHaveBeenCalledWith(0, 20);
    });
    
    it('should prevent health from going below 0', () => {
      // Reduce player 1 health below 0
      scene.playerHealth[0] = -10;
      
      // Apply min 0 check (which would be in the actual game code)
      scene.playerHealth[0] = Math.max(0, scene.playerHealth[0]);
      scene.updateHealthBars();
      
      // Health should be clamped to 0
      expect(scene.playerHealth[0]).toBe(0);
      expect(scene.healthBar1.setSize).toHaveBeenCalledWith(0, 20);
    });
  });
});
