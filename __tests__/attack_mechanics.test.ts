// @ts-nocheck
import KidsFightScene from '../kidsfight_scene';
import { createMockPlayer } from './createMockPlayer';

describe('Attack Mechanics', () => {
  let scene: KidsFightScene;
  let mockPlayer1: any;
  let mockPlayer2: any;

  beforeEach(() => {
    scene = new KidsFightScene();
    
    // Create mock players with all required properties
    mockPlayer1 = createMockPlayer(1, 'bento', 100, 100, 100, 100);
    mockPlayer2 = createMockPlayer(2, 'davir', 700, 100, 100, 100);
    
    // Set up players array
    scene.players = [mockPlayer1, mockPlayer2];
    
    // Initialize player health and special arrays
    scene.playerHealth = [100, 100];
    scene.playerSpecial = [0, 0];
    
    // Mock methods
    scene.updateSpecialPips = jest.fn();
    scene.updateHealthBar = jest.fn();
    scene.checkWinner = jest.fn();
    
    // Mock WebSocket manager
    scene.wsManager = {
      isConnected: jest.fn().mockReturnValue(false),
      sendGameAction: jest.fn()
    };
  });

  describe('Attack Animation Behavior', () => {
    test('should play attack animation regardless of distance', () => {
      // Set players very far apart (much farther than attack range)
      mockPlayer1.x = 100;
      mockPlayer2.x = 700; // 600px apart, well beyond attack range
      
      // Call tryAction for normal attack
      scene.tryAction(0, 'attack', false);
      
      // Verify attack animation is triggered
      expect(mockPlayer1.isAttacking).toBe(true);
      expect(mockPlayer1.setData).toHaveBeenCalledWith('isAttacking', true);
    });

    test('should play special attack animation regardless of distance', () => {
      // Set players very far apart
      mockPlayer1.x = 100;
      mockPlayer2.x = 700; // 600px apart
      scene.playerSpecial[0] = 3; // Set special pips to 3
      
      // Call tryAction for special attack
      scene.tryAction(0, 'special', true);
      
      // Verify special attack animation is triggered
      expect(mockPlayer1.isAttacking).toBe(true);
      expect(mockPlayer1.isSpecialAttacking).toBe(true);
      expect(mockPlayer1.setData).toHaveBeenCalledWith('isAttacking', true);
      expect(mockPlayer1.setData).toHaveBeenCalledWith('isSpecialAttacking', true);
    });

    test('should not play special attack if special meter is not full', () => {
      scene.playerSpecial[0] = 2; // Not enough pips
      
      scene.tryAction(0, 'special', true);
      
      // Should not trigger special attack - the method should exit early
      expect(mockPlayer1.isSpecialAttacking).toBeUndefined();
      expect(mockPlayer1.setData).not.toHaveBeenCalledWith('isSpecialAttacking', true);
    });
  });

  describe('Damage Application Based on Distance', () => {
    test('should apply damage when players are within normal attack range', () => {
      // Set players within normal attack range (80px)
      mockPlayer1.x = 100;
      mockPlayer2.x = 150; // 50px apart, within 80px range
      
      const initialHealth = scene.playerHealth[1];
      
      scene.tryAction(0, 'attack', false);
      
      // Verify damage is applied
      expect(scene.playerHealth[1]).toBe(initialHealth - 5);
      expect(mockPlayer2.health).toBe(initialHealth - 5);
    });

    test('should apply damage when players are within special attack range', () => {
      // Set players within special attack range (120px)
      mockPlayer1.x = 100;
      mockPlayer2.x = 200; // 100px apart, within 120px range
      scene.playerSpecial[0] = 3; // Set special pips to 3
      
      const initialHealth = scene.playerHealth[1];
      
      scene.tryAction(0, 'special', true);
      
      // Verify special damage is applied
      expect(scene.playerHealth[1]).toBe(initialHealth - 10);
      expect(mockPlayer2.health).toBe(initialHealth - 10);
      expect(scene.playerSpecial[0]).toBe(0); // Special meter should reset
    });

    test('should not apply damage when players are beyond normal attack range', () => {
      // Set players beyond normal attack range (80px)
      mockPlayer1.x = 100;
      mockPlayer2.x = 200; // 100px apart, beyond 80px range
      
      const initialHealth = scene.playerHealth[1];
      
      scene.tryAction(0, 'attack', false);
      
      // Verify no damage is applied - only check scene health array
      expect(scene.playerHealth[1]).toBe(initialHealth);
      // Verify animation still plays
      expect(mockPlayer1.isAttacking).toBe(true);
    });

    test('should not apply damage when players are beyond special attack range', () => {
      // Set players beyond special attack range (120px)
      mockPlayer1.x = 100;
      mockPlayer2.x = 250; // 150px apart, beyond 120px range
      scene.playerSpecial[0] = 3; // Set special pips to 3
      
      const initialHealth = scene.playerHealth[1];
      
      scene.tryAction(0, 'special', true);
      
      // Verify no damage is applied (but special meter should still reset due to animation)
      expect(scene.playerHealth[1]).toBe(initialHealth);
      // Verify animation still plays
      expect(mockPlayer1.isAttacking).toBe(true);
      expect(mockPlayer1.isSpecialAttacking).toBe(true);
      expect(scene.playerSpecial[0]).toBe(0); // Special meter should reset
    });
  });

  describe('Animation Reset Behavior', () => {
    test('should reset normal attack state with setTimeout', () => {
      // Mock setTimeout to capture the callback
      const originalSetTimeout = global.setTimeout;
      const timeoutCallbacks = [];
      global.setTimeout = jest.fn((callback, delay) => {
        timeoutCallbacks.push({ callback, delay });
        return 1;
      });
      
      scene.tryAction(0, 'attack', false);
      
      // Verify attack animation is triggered
      expect(mockPlayer1.isAttacking).toBe(true);
      
      // Execute the timeout callback
      if (timeoutCallbacks.length > 0) {
        timeoutCallbacks[0].callback();
      }
      
      // Verify attack state is reset
      expect(mockPlayer1.setData).toHaveBeenCalledWith('isAttacking', false);
      expect(mockPlayer1.isAttacking).toBe(false);
      
      global.setTimeout = originalSetTimeout;
    });

    test('should reset special attack state with setTimeout', () => {
      // Mock setTimeout to capture the callback
      const originalSetTimeout = global.setTimeout;
      const timeoutCallbacks = [];
      global.setTimeout = jest.fn((callback, delay) => {
        timeoutCallbacks.push({ callback, delay });
        return 1;
      });
      
      scene.playerSpecial[0] = 3; // Set special pips to 3
      
      scene.tryAction(0, 'special', true);
      
      // Verify special attack animation is triggered
      expect(mockPlayer1.isSpecialAttacking).toBe(true);
      
      // Execute the timeout callback
      if (timeoutCallbacks.length > 0) {
        timeoutCallbacks[0].callback();
      }
      
      // Verify special attack state is reset
      expect(mockPlayer1.setData).toHaveBeenCalledWith('isSpecialAttacking', false);
      
      global.setTimeout = originalSetTimeout;
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing getData/setData methods gracefully', () => {
      // Remove getData/setData methods
      mockPlayer1.getData = undefined;
      mockPlayer1.setData = undefined;
      
      expect(() => {
        scene.tryAction(0, 'attack', false);
      }).not.toThrow();
    });

    test('should handle zero health defender', () => {
      mockPlayer2.health = 0;
      scene.playerHealth[1] = 0;
      
      scene.tryAction(0, 'attack', false);
      
      // Should still play animation but not apply damage
      expect(mockPlayer1.isAttacking).toBe(true);
      expect(mockPlayer2.health).toBe(0); // Health should remain 0
    });

    test('should handle missing players array gracefully', () => {
      scene.players = null;
      
      expect(() => {
        scene.tryAction(0, 'attack', false);
      }).not.toThrow();
    });
  });
});