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
    
    // Initialize necessary properties
    scene.playerHealth = [MAX_HEALTH, MAX_HEALTH];
    scene.attackCount = [0, 0];
    scene.lastAttackTime = [0, 0];
    scene.healthBar1 = { width: 200 };
    scene.healthBar2 = { width: 200 };
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
