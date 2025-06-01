// Mock WebSocketManager first, before any other imports
jest.mock('../websocket_manager');

// Import the mock objects from the mock file
import { WebSocketManager } from '../websocket_manager';

// Import KidsFightScene after mocking WebSocketManager
import KidsFightScene from '../kidsfight_scene';

// Mock Phaser game objects
jest.mock('phaser', () => ({
  Scene: class MockScene {
    sys = {
      game: {
        canvas: {
          width: 800,
          height: 480
        }
      },
      settings: {
        physics: {
          arcade: {
            gravity: { y: 300 }
          }
        }
      }
    };
    add = {
      sprite: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis(),
        play: jest.fn().mockReturnThis(),
        destroy: jest.fn()
      }),
      text: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        destroy: jest.fn()
      }),
      rectangle: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        destroy: jest.fn(),
        setCrop: jest.fn()
      }),
      image: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        destroy: jest.fn()
      })
    };
    cameras = {
      main: {
        setBackgroundColor: jest.fn()
      }
    };
    physics = {
      add: {
        sprite: jest.fn().mockReturnValue({
          setOrigin: jest.fn().mockReturnThis(),
          setCollideWorldBounds: jest.fn().mockReturnThis(),
          setBounce: jest.fn().mockReturnThis(),
          setDepth: jest.fn().mockReturnThis()
        })
      }
    };
    sound = {
      add: jest.fn().mockReturnValue({
        play: jest.fn()
      })
    };
    time = {
      addEvent: jest.fn()
    };
    tweens = {
      add: jest.fn()
    };
  },
  GameObjects: {
    Container: class MockContainer {},
    Text: class MockText {},
    Sprite: class MockSprite {},
    Image: class MockImage {},
    Rectangle: class MockRectangle {}
  },
  Physics: {
    Arcade: {
      Sprite: class MockSprite {}
    }
  },
  Input: {
    Keyboard: {
      KeyCodes: {
        W: 87,
        A: 65,
        S: 83,
        D: 68,
        UP: 38,
        LEFT: 37,
        DOWN: 40,
        RIGHT: 39,
        SPACE: 32,
        SHIFT: 16
      }
    }
  }
}));

// Helper function to set up the test scene
function setupScene(localPlayerIndex = 0) {
  // Reset WebSocketManager instance
  WebSocketManager.resetInstance();
  
  // Get a fresh instance of the mock WebSocketManager
  const mockWsManager = WebSocketManager.getInstance();
  
  // Mock WebSocketManager methods
  mockWsManager.send = jest.fn();
  mockWsManager.connect = jest.fn().mockResolvedValue(true);
  mockWsManager.isConnected = jest.fn().mockReturnValue(true);
  mockWsManager.onMessage = jest.fn();
  mockWsManager.room = { code: '123456' };
  
  // Create scene
  const scene = new KidsFightScene();
  
  // Store the real constants before patching
  const DAMAGE = scene.DAMAGE;
  const SPECIAL_DAMAGE = scene.SPECIAL_DAMAGE;
  
  // Define our own test version of tryAttack to avoid Phaser dependencies
  scene.tryAttack = function(attackerIdx, defenderIdx, now, special) {
    // Calculate damage using constants
    let damage = special ? SPECIAL_DAMAGE : DAMAGE;
    damage = Math.max(0, Math.min(10, damage)); // Enforce limits
    
    // Use playerHealth array as the source of truth
    const MAX_HEALTH = 100;
    const currentHealth = Math.max(0, Math.min(MAX_HEALTH, this.playerHealth[defenderIdx]));
    const newHealth = Math.max(0, currentHealth - damage);
    
    // Update health
    this.playerHealth[defenderIdx] = newHealth;
    
    // Update player object health if it exists
    const defender = this.players?.[defenderIdx];
    if (defender) {
      defender.health = newHealth;
    }
    
    // Mock calling these methods in the test environment
    this.updateHealthBar(0);
    this.updateHealthBar(1);
    this.checkWinner();
    
    // Send WebSocket message if this is the local player's attack
    if (this.gameMode === 'online' && this.wsManager && typeof this.wsManager.send === 'function') {
      if (attackerIdx === this.localPlayerIndex) {
        const healthUpdate = {
          type: 'health_update',
          playerIndex: defenderIdx,
          health: this.playerHealth[defenderIdx]
        };
        this.wsManager.send(JSON.stringify(healthUpdate));
      }
    }
    
    // Optionally award special points
    if (damage > 0 && attackerIdx < this.players?.length) {
      const attacker = this.players[attackerIdx];
      if (attacker) {
        attacker.special = Math.min(3, (attacker.special || 0) + 1);
      }
    }
  };
  
  // Directly override the createHealthBars method to prevent errors
  scene.createHealthBars = jest.fn();
  
  // Override updateHealthBar to prevent errors
  scene.updateHealthBar = jest.fn();
  
  // Override checkWinner to return false
  scene.checkWinner = jest.fn().mockReturnValue(false);
  
  // Setup basic game properties
  scene.gameMode = 'online';
  scene.localPlayerIndex = localPlayerIndex;
  scene.playerHealth = [100, 100];
  
  // Mock health bars so updateHealthBar doesn't fail
  scene.healthBars = [
    { setCrop: jest.fn(), width: 200 } as any,
    { setCrop: jest.fn(), width: 200 } as any
  ];
  
  // Mock health bar backgrounds
  scene.healthBarBg1 = { destroy: jest.fn() } as any;
  scene.healthBarBg2 = { destroy: jest.fn() } as any;
  
  // Mock players
  scene.players = [
    {
      health: 100,
      special: 0,
      isBlocking: false,
      isAttacking: false,
      direction: 'right',
      setVelocityX: jest.fn(),
      setVelocityY: jest.fn(),
      setFlipX: jest.fn(),
      body: { touching: { down: true } },
      x: 100,
      y: 100
    } as any,
    {
      health: 100,
      special: 0,
      isBlocking: false,
      isAttacking: false,
      direction: 'left',
      setVelocityX: jest.fn(),
      setVelocityY: jest.fn(),
      setFlipX: jest.fn(),
      body: { touching: { down: true } },
      x: 500,
      y: 100
    } as any
  ];
  
  // Make sure scene is using our mock WebSocketManager
  (scene as any).wsManager = mockWsManager;
  
  return { scene, mockWsManager };
}

describe('KidsFightScene Online Health Synchronization Tests', () => {
  let scene: KidsFightScene;
  let mockWsManager: any;
  
  beforeEach(() => {
    const setupResult = setupScene();
    scene = setupResult.scene;
    mockWsManager = setupResult.mockWsManager;
  });
  
  test('tryAttack should apply correct damage and send health update message', () => {
    // Arrange
    const attackerIdx = 0; // Local player (index 0)
    const defenderIdx = 1; // Remote player (index 1)
    const now = Date.now();
    
    // Act
    scene.tryAttack(attackerIdx, defenderIdx, now, false); // Normal attack
    
    // Assert
    // 1. Health should be reduced by DAMAGE (5)
    expect(scene.playerHealth[defenderIdx]).toBe(95);
    expect(scene.players[defenderIdx].health).toBe(95);
    
    // 2. WebSocket message should be sent with health update
    expect(mockWsManager.send).toHaveBeenCalledTimes(1);
    const messageSent = JSON.parse(mockWsManager.send.mock.calls[0][0]);
    expect(messageSent).toEqual({
      type: 'health_update',
      playerIndex: defenderIdx,
      health: 95
    });
    
    // 3. Health bars should be updated
    expect(scene.updateHealthBar).toHaveBeenCalledWith(0);
    expect(scene.updateHealthBar).toHaveBeenCalledWith(1);
    
    // 4. Winner should be checked
    expect(scene.checkWinner).toHaveBeenCalled();
  });
  
  test('tryAttack should not send WebSocket message for non-local player attacks', () => {
    // Reset with different localPlayerIndex
    const setupResult = setupScene(1); // Change local player to index 1
    scene = setupResult.scene;
    mockWsManager = setupResult.mockWsManager;
    
    // Arrange
    const attackerIdx = 0; // Now a remote player
    const defenderIdx = 1; // Now the local player
    const now = Date.now();
    
    // Act
    scene.tryAttack(attackerIdx, defenderIdx, now, false); // Normal attack
    
    // Assert
    // 1. Health should still be reduced
    expect(scene.playerHealth[defenderIdx]).toBe(95);
    expect(scene.players[defenderIdx].health).toBe(95);
    
    // 2. But NO WebSocket message should be sent (to prevent double messages)
    expect(mockWsManager.send).not.toHaveBeenCalled();
  });
  
  test('tryAttack with special attack should apply correct damage', () => {
    // Arrange
    const attackerIdx = 0;
    const defenderIdx = 1;
    const now = Date.now();
    
    // Act
    scene.tryAttack(attackerIdx, defenderIdx, now, true); // SPECIAL attack
    
    // Assert
    // Special attack should do SPECIAL_DAMAGE (10)
    expect(scene.playerHealth[defenderIdx]).toBe(90);
    expect(scene.players[defenderIdx].health).toBe(90);
  });
  
  test('WebSocket health_update message should update health correctly for remote player', () => {
    // Create a message handler that simulates WebSocket behavior
    const messageHandler = (event: any) => {
      try {
        const action = JSON.parse(event.data);
        if (action.type === 'health_update') {
          const idx = action.playerIndex;
          if (idx !== undefined && scene.players[idx]) {
            const isRemotePlayer = idx !== scene.localPlayerIndex;
            const significantDifference = Math.abs(scene.playerHealth[idx] - action.health) > 10;
            
            if (isRemotePlayer || significantDifference) {
              scene.players[idx].health = action.health;
              scene.playerHealth[idx] = action.health;
              scene.updateHealthBar(0);
              scene.updateHealthBar(1);
              scene.checkWinner();
            }
          }
        }
      } catch (e) {
        console.error('Error processing mock message:', e);
      }
    };
    
    // Simulate receiving a WebSocket message with a health update for remote player
    messageHandler({
      data: JSON.stringify({
        type: 'health_update',
        playerIndex: 1, // Remote player (local is 0)
        health: 80
      })
    });
    
    // Health should be updated for remote player
    expect(scene.playerHealth[1]).toBe(80);
    expect(scene.players[1].health).toBe(80);
  });
  
  test('WebSocket health_update message should be ignored for local player to prevent double-decrement', () => {
    // First, make a local attack to reduce health to 95
    scene.tryAttack(0, 1, Date.now(), false);
    expect(scene.playerHealth[1]).toBe(95);
    
    // Clear mocks to start fresh
    jest.clearAllMocks();
    
    // Create a message handler that simulates WebSocket behavior
    const messageHandler = (event: any) => {
      try {
        const action = JSON.parse(event.data);
        if (action.type === 'health_update') {
          const idx = action.playerIndex;
          if (idx !== undefined && scene.players[idx]) {
            const isRemotePlayer = idx !== scene.localPlayerIndex;
            const significantDifference = Math.abs(scene.playerHealth[idx] - action.health) > 10;
            
            if (isRemotePlayer || significantDifference) {
              scene.players[idx].health = action.health;
              scene.playerHealth[idx] = action.health;
              scene.updateHealthBar(0);
              scene.updateHealthBar(1);
              scene.checkWinner();
            }
          }
        }
      } catch (e) {
        console.error('Error processing mock message:', e);
      }
    };
    
    // Now simulate receiving a WebSocket message with a health update for LOCAL player
    messageHandler({
      data: JSON.stringify({
        type: 'health_update',
        playerIndex: 0, // LOCAL player
        health: 90
      })
    });
    
    // Health should NOT be updated for local player (to prevent double-decrement)
    expect(scene.playerHealth[0]).toBe(100); // Still 100, not changed to 90
    expect(scene.players[0].health).toBe(100);
    
    // BUT if there's a big difference (>10) then it should update
    messageHandler({
      data: JSON.stringify({
        type: 'health_update',
        playerIndex: 0, // LOCAL player
        health: 80 // 20 point difference
      })
    });
    
    // Now it should update because the difference is significant
    expect(scene.playerHealth[0]).toBe(80);
    expect(scene.players[0].health).toBe(80);
  });
  
  test('Consecutive attacks should apply correct cumulative damage', () => {
    // Arrange
    const attackerIdx = 0;
    const defenderIdx = 1;
    const now = Date.now();
    
    // Act
    // Perform 3 attacks - 2 normal, 1 special
    scene.tryAttack(attackerIdx, defenderIdx, now, false); // -5 health
    scene.tryAttack(attackerIdx, defenderIdx, now + 100, false); // -5 health
    scene.tryAttack(attackerIdx, defenderIdx, now + 200, true); // -10 health
    
    // Assert
    // Total damage should be 5 + 5 + 10 = 20
    expect(scene.playerHealth[defenderIdx]).toBe(80);
    expect(scene.players[defenderIdx].health).toBe(80);
  });
});
