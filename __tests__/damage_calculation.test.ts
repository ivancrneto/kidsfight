jest.mock('../websocket_manager');

import KidsFightScene from '../kidsfight_scene';
import { setupMockScene } from './test-utils-fix';

// Test constants - must match the actual game constants for the tests to be valid
const MAX_HEALTH = 100;
const ATTACK_DAMAGE = 5;
const SPECIAL_DAMAGE = 10;

describe('KidsFightScene - Damage Calculation', () => {
  let scene: KidsFightScene;
  let now: number;

  beforeEach(() => {
    // Create a new scene with minimal mocking
    scene = new KidsFightScene({});
    setupMockScene(scene);
    
    // Initialize health with the correct MAX_HEALTH value
    scene.playerHealth = [MAX_HEALTH, MAX_HEALTH];
    scene.playerSpecial = [0, 0];
    scene.players = [
      { x: 100, y: 100, width: 50, height: 100, setData: jest.fn(), getData: jest.fn().mockReturnValue(false), health: MAX_HEALTH },
      { x: 120, y: 100, width: 50, height: 100, health: MAX_HEALTH }
    ];
    now = Date.now();
    
    // Mock health bars and UI update methods
    scene.healthBar1 = scene.add.graphics();
    scene.healthBar2 = scene.add.graphics();
    scene.updateHealthBar = jest.fn();
    scene.updateSpecialPips = jest.fn();
    scene.checkWinner = jest.fn();
  });

  it('should decrease defender health by ATTACK_DAMAGE (10) on normal attack', () => {
    scene.tryAttack(0, 1, now, false);
    expect(scene.playerHealth[1]).toBe(MAX_HEALTH - ATTACK_DAMAGE);
    expect(scene.players[1].health).toBe(MAX_HEALTH - ATTACK_DAMAGE);
  });

  it('should decrease defender health by SPECIAL_DAMAGE (20) on special attack', () => {
    scene.tryAttack(0, 1, now, true);
    expect(scene.playerHealth[1]).toBe(MAX_HEALTH - SPECIAL_DAMAGE);
    expect(scene.players[1].health).toBe(MAX_HEALTH - SPECIAL_DAMAGE);
  });

  it('should take exactly 20 normal attacks to defeat an opponent', () => {
    // The number of hits required should be MAX_HEALTH / ATTACK_DAMAGE
    const expectedHits = MAX_HEALTH / ATTACK_DAMAGE; // Should be 20
    
    // Verify the calculation is correct
    expect(expectedHits).toBe(20);
    
    // Apply damage multiple times and check health
    for (let i = 1; i <= expectedHits; i++) {
      scene.tryAttack(0, 1, now + i, false);
      
      // Expected health after each hit
      const expectedHealth = Math.max(0, MAX_HEALTH - (i * ATTACK_DAMAGE));
      
      // Verify health matches expected value
      expect(scene.playerHealth[1]).toBe(expectedHealth);
      expect(scene.players[1].health).toBe(expectedHealth);
      
      // Check if player is defeated
      if (i < expectedHits) {
        expect(expectedHealth).toBeGreaterThan(0);
      } else {
        expect(expectedHealth).toBe(0);
      }
    }
  });

  it('should take exactly 10 special attacks to defeat an opponent', () => {
    // The number of hits required should be MAX_HEALTH / SPECIAL_DAMAGE
    const expectedHits = MAX_HEALTH / SPECIAL_DAMAGE; // Should be 10
    
    // Verify the calculation is correct
    expect(expectedHits).toBe(10);
    
    // Apply special damage multiple times and check health
    for (let i = 1; i <= expectedHits; i++) {
      scene.tryAttack(0, 1, now + i, true);
      
      // Expected health after each hit
      const expectedHealth = Math.max(0, MAX_HEALTH - (i * SPECIAL_DAMAGE));
      
      // Verify health matches expected value
      expect(scene.playerHealth[1]).toBe(expectedHealth);
      expect(scene.players[1].health).toBe(expectedHealth);
      
      // Check if player is defeated
      if (i < expectedHits) {
        expect(expectedHealth).toBeGreaterThan(0);
      } else {
        expect(expectedHealth).toBe(0);
      }
    }
  });

  it('should sync player object health with playerHealth array', () => {
    // Verify initial sync
    expect(scene.playerHealth[0]).toBe(scene.players[0].health);
    expect(scene.playerHealth[1]).toBe(scene.players[1].health);
    
    // Apply damage and verify both values change together
    scene.tryAttack(0, 1, now, false);
    expect(scene.playerHealth[1]).toBe(MAX_HEALTH - ATTACK_DAMAGE);
    expect(scene.players[1].health).toBe(MAX_HEALTH - ATTACK_DAMAGE);
    
    // Verify the values remain in sync after multiple hits
    scene.tryAttack(0, 1, now + 1, false);
    expect(scene.playerHealth[1]).toBe(MAX_HEALTH - (ATTACK_DAMAGE * 2));
    expect(scene.players[1].health).toBe(MAX_HEALTH - (ATTACK_DAMAGE * 2));
  });

  it('should never allow health to go below zero', () => {
    // Set health to just above zero
    scene.playerHealth[1] = ATTACK_DAMAGE - 1;
    scene.players[1].health = ATTACK_DAMAGE - 1;
    
    // Apply damage that would normally take health below zero
    scene.tryAttack(0, 1, now, false);
    
    // Verify health is clamped at zero
    expect(scene.playerHealth[1]).toBe(0);
    expect(scene.players[1].health).toBe(0);
  });

  it('should enforce a hard cap on damage values', () => {
    // This test verifies the damage capping logic in tryAttack
    // Mock an extreme damage value by temporarily modifying the scene's DAMAGE field
    const originalDamage = (scene as any).DAMAGE;
    (scene as any).DAMAGE = 9999;
    
    scene.tryAttack(0, 1, now, false);
    
    // Damage should be capped at 10 (value from tryAttack method)
    // So health should be MAX_HEALTH - 10 instead of MAX_HEALTH - 9999
    expect(scene.playerHealth[1]).toBe(MAX_HEALTH - 10);
    
    // Restore original damage value
    (scene as any).DAMAGE = originalDamage;
  });
});
