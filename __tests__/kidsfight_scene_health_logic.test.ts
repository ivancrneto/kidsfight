import KidsFightScene from '../kidsfight_scene';
import { jest } from '@jest/globals';

// Helper to create a fresh scene with mock players
function createTestScene() {
  const scene: any = new KidsFightScene();
  
  // Mock Phaser sys and game objects
  scene.sys = {
    game: {
      canvas: { width: 800, height: 600 },
      device: { os: { android: false, iOS: false } }
    },
    displayList: {
      depthSort: jest.fn()
    }
  };
  
  // Mock health bar methods
  scene.createHealthBars = jest.fn();
  scene.updateHealthBar = jest.fn();
  scene.updateSpecialPips = jest.fn();
  scene.checkWinner = jest.fn();
  
  // Mock WebSocket manager
  scene.wsManager = { 
    send: jest.fn(),
    isHost: true
  };
  
  // Initialize player properties
  scene.playerHealth = [100, 100];
  scene.playerSpecial = [0, 0];
  scene.players = [
    { 
      health: 100, 
      setData: jest.fn(), 
      getData: jest.fn(), 
      setFrame: jest.fn(),
      body: { velocity: { x: 0, y: 0 } }
    },
    { 
      health: 100, 
      setData: jest.fn(), 
      getData: jest.fn(), 
      setFrame: jest.fn(),
      body: { velocity: { x: 0, y: 0 } }
    },
  ];
  
  scene.gameMode = 'single';
  scene.gameOver = false;
  
  return scene;
}

describe('KidsFightScene Health & Damage Logic', () => {
  it('should require 20 normal hits to KO a player', () => {
    const scene: any = createTestScene();
    const now = Date.now();
    // Each attack needs to be at least 500ms apart due to cooldown
    for (let i = 0; i < 20; i++) {
      scene.tryAttack(0, 1, now + (i * 600), false);
    }
    expect(scene.players[1].health).toBe(0);
    expect(scene.playerHealth[1]).toBe(0);
  });

  it('should require 10 special hits to KO a player', () => {
    const scene: any = createTestScene();
    for (let i = 0; i < 10; i++) {
      scene.tryAttack(0, 1, Date.now(), true); // special attack
    }
    expect(scene.players[1].health).toBe(0);
    expect(scene.playerHealth[1]).toBe(0);
  });

  it('should allow mixed attacks to KO a player', () => {
    const scene: any = createTestScene();
    // 5 special (10*5=50), 10 normal (5*10=50)
    for (let i = 0; i < 5; i++) scene.tryAttack(0, 1, Date.now(), true);
    for (let i = 0; i < 10; i++) scene.tryAttack(0, 1, Date.now(), false);
    expect(scene.players[1].health).toBe(0);
    expect(scene.playerHealth[1]).toBe(0);
  });

  it('should not reduce health below 0', () => {
    const scene: any = createTestScene();
    for (let i = 0; i < 25; i++) scene.tryAttack(0, 1, Date.now(), false);
    expect(scene.players[1].health).toBe(0);
    expect(scene.playerHealth[1]).toBe(0);
  });

  it('should apply correct damage for normal and special attacks', () => {
    const scene: any = createTestScene();
    const now = Date.now();
    
    // Set up players and game state
    scene.players = [
      { health: 100, setData: jest.fn(), body: { blocked: { down: false } }, x: 100 },
      { health: 100, setData: jest.fn(), body: { blocked: { down: false } }, x: 140 } // 40px apart, within range
    ];
    scene.playerHealth = [100, 100];
    (scene as any).playerSpecial = [3, 0]; // Full special meter
    (scene as any).playersReady = true;
    scene.gameOver = false;
    
    // Mock getTime to control timing
    jest.spyOn(scene, 'getTime').mockReturnValue(now);
    
    // First attack (normal)
    scene['tryAction'](0, 'attack', false);
    expect(scene.playerHealth[1]).toBe(95);
    
    // Update time for cooldown
    const newTime = now + 1000;
    (scene.getTime as jest.Mock).mockReturnValue(newTime);
    
    // Second attack (special)
    scene['tryAction'](0, 'special', true);
    expect(scene.playerHealth[1]).toBe(85);
  });
});
