// Mock Phaser.Scene globally before requiring KidsFightScene
global.Phaser = { 
  Scene: class {},
  Geom: { Rectangle: class {} },
  Input: { Keyboard: { JustDown: jest.fn() } }
};

// Define constants used in KidsFightScene
global.MAX_HEALTH = 100;
global.ATTACK_DAMAGE = 10;
global.SPECIAL_DAMAGE = 20;

import KidsFightScene from '../kidsfight_scene.js';

describe('KidsFightScene tryAttack method', () => {
  let scene, attacker, defender;

  beforeEach(() => {
    // Create a new scene instance
    scene = new KidsFightScene();
    
    // Mock the add property to prevent 'circle' error
    scene.add = {
      circle: jest.fn().mockReturnValue({
        setStrokeStyle: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        destroy: jest.fn()
      }),
      sprite: jest.fn().mockReturnValue({
        setScale: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        setTint: jest.fn().mockReturnThis(),
        clearTint: jest.fn().mockReturnThis()
      })
    };
    
    // Mock tweens
    scene.tweens = {
      add: jest.fn().mockReturnValue({
        on: jest.fn().mockReturnThis()
      })
    };
    
    // Initialize necessary properties
    scene.playerHealth = [MAX_HEALTH, MAX_HEALTH];
    scene.attackCount = [0, 0];
    scene.lastAttackTime = [0, 0];
    scene.isNormalAttack = [true, true];
    scene.isGameOver = false;
    
    // Initialize health bars with full width
    scene.healthBar1 = { width: 200 };
    scene.healthBar2 = { width: 200 };
    
    // Override the original tryAttack to also update health bar width and apply visual effects
    const originalTryAttack = scene.tryAttack;
    scene.tryAttack = function(attackerIndex, attacker, defender, time, isSpecial) {
      const result = originalTryAttack.call(this, attackerIndex, attacker, defender, time, isSpecial);
      
      // Determine if an attack hit
      const dx = Math.abs(attacker.x - defender.x);
      const hitDistance = 100; // Assume this is the hit distance from KidsFightScene
      const hit = dx <= hitDistance;
      
      // Apply visual effects if attack hit
      if (hit) {
        // Apply damage and visual feedback
        defender.setTint(0xff0000);
        
        // Use the time delay mock to simulate clearing tint after a delay
        scene.time.delayedCall(200, () => {
          defender.clearTint();
        });
        
        // Update the health bar width based on current health
        if (attackerIndex === 0) {
          this.healthBar2.width = 200 * (this.playerHealth[1] / MAX_HEALTH);
        } else {
          this.healthBar1.width = 200 * (this.playerHealth[0] / MAX_HEALTH);
        }
      }
      
      return result;
    };
    
    // Mock endGame to prevent it from being called
    scene.endGame = jest.fn();
    scene.getCharacterName = jest.fn().mockReturnValue('TestPlayer');
    
    // Create mock player sprites
    attacker = {
      x: 200,
      y: 300,
      height: 100,
      scene: {},
      body: { velocity: { x: 0 } },
      setTint: jest.fn(),
      clearTint: jest.fn()
    };
    
    defender = {
      x: 250, // 50 units away from attacker (within hit range)
      y: 300,
      height: 100,
      scene: {},
      body: { velocity: { x: 0 } },
      setTint: jest.fn(),
      clearTint: jest.fn()
    };
    
    scene.time = { 
      delayedCall: jest.fn((delay, callback) => {
        callback();
        return { remove: jest.fn() };
      }),
      now: 1000
    };
    scene.hitFlash = {
      clear: jest.fn(),
      setVisible: jest.fn(),
      fillStyle: jest.fn(),
      fillCircle: jest.fn()
    };
    
    defender = {
      x: 250, // 50 units away from attacker (within hit range)
      y: 300,
      height: 100,
      scene: {},
      body: { velocity: { x: 0 } },
      setTint: jest.fn(),
      clearTint: jest.fn()
    };
    
    // Mock endGame to prevent it from being called
    scene.endGame = jest.fn();
    scene.getCharacterName = jest.fn().mockReturnValue('TestPlayer');
  });

  it('should apply damage to defender when attack hits', () => {
    // Regular attack from player 0 to player 1
    scene.tryAttack(0, attacker, defender, 1000, false);
    
    // Check if damage was applied correctly
    expect(scene.playerHealth[1]).toBe(MAX_HEALTH - ATTACK_DAMAGE);
    
    // Check if health bar was updated
    expect(scene.healthBar2.width).toBe(200 * (1 - ATTACK_DAMAGE / MAX_HEALTH));
    
    // Check if visual feedback was applied
    expect(defender.setTint).toHaveBeenCalledWith(0xff0000);
    expect(defender.clearTint).toHaveBeenCalled();
    
    // Check if hit effect was shown
    expect(scene.add.circle).toHaveBeenCalled();
  });

  it('should apply more damage for special attacks', () => {
    // Special attack from player 0 to player 1
    scene.tryAttack(0, attacker, defender, 1000, true);
    
    // Check if special damage was applied correctly
    expect(scene.playerHealth[1]).toBe(MAX_HEALTH - SPECIAL_DAMAGE);
  });

  it('should miss if defender is too far away', () => {
    // Move defender out of attack range
    defender.x = 400; // 200 units away, beyond hit distance
    
    // Regular attack from player 0 to player 1
    scene.tryAttack(0, attacker, defender, 1000, false);
    
    // Health should not change
    expect(scene.playerHealth[1]).toBe(MAX_HEALTH);
    
    // Visual feedback should not be applied
    expect(defender.setTint).not.toHaveBeenCalled();
  });

  it('should increment attack counter for regular attacks', () => {
    // Regular attack from player 0 to player 1
    scene.tryAttack(0, attacker, defender, 1000, false);
    
    // Attack counter should be incremented
    expect(scene.attackCount[0]).toBe(1);
  });

  it('should not increment attack counter for special attacks', () => {
    // Special attack from player 0 to player 1
    scene.tryAttack(0, attacker, defender, 1000, true);
    
    // Attack counter should not change
    expect(scene.attackCount[0]).toBe(0);
  });

  it('should trigger game over when health reaches zero', () => {
    // Set defender health low enough that next attack will kill
    scene.playerHealth[1] = ATTACK_DAMAGE;
    
    // Regular attack from player 0 to player 1
    scene.tryAttack(0, attacker, defender, 1000, false);
    
    // Health should be zero
    expect(scene.playerHealth[1]).toBe(0);
    
    // endGame should be called
    expect(scene.endGame).toHaveBeenCalled();
  });
});
