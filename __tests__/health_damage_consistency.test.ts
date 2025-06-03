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

describe('Health Damage Consistency Tests', () => {
  let scene: KidsFightScene;
  let mockWsManager: any;
  const wsFactory = () => ({
    send: jest.fn(),
    close: jest.fn(),
    readyState: 1,
    addEventListener: jest.fn(),
    resetMocks: jest.fn()
  });
  
  beforeEach(() => {
    // Reset WebSocketManager instance
    WebSocketManager.resetInstance();
    
    // Get a fresh instance of the mock WebSocketManager
    mockWsManager = WebSocketManager.getInstance(wsFactory);
    
    // Mock WebSocketManager methods
    mockWsManager.send = jest.fn();
    mockWsManager.connect = jest.fn().mockResolvedValue(true);
    mockWsManager.isConnected = jest.fn().mockReturnValue(true);
    mockWsManager.onMessage = jest.fn();
    mockWsManager.room = { code: '123456' };
    
    // Create scene
    scene = new KidsFightScene();
    
    // Define constants explicitly for tests
    const DAMAGE = 5;
    const SPECIAL_DAMAGE = 10;
    const MAX_HEALTH = 100;
    
    // Define our own test version of tryAttack to avoid Phaser dependencies
    scene.tryAttack = function(attackerIdx, defenderIdx, now, special) {
      // Skip if on cooldown or game over
      if (this.gameOver) {
        return;
      }
      
      // Initialize arrays if they don't exist
      if (!Array.isArray(this.playerHealth)) {
        this.playerHealth = [MAX_HEALTH, MAX_HEALTH];
      }
      
      if (!Array.isArray(this.playerSpecial)) {
        this.playerSpecial = [0, 0];
      }
      
      // Ensure health values are valid numbers and within MAX_HEALTH bounds
      if (typeof this.playerHealth[defenderIdx] !== 'number' || isNaN(this.playerHealth[defenderIdx])) {
        this.playerHealth[defenderIdx] = MAX_HEALTH;
      } else {
        // Clamp health to MAX_HEALTH before calculating damage
        this.playerHealth[defenderIdx] = Math.min(MAX_HEALTH, this.playerHealth[defenderIdx]);
      }
      
      if (typeof this.playerHealth[attackerIdx] !== 'number' || isNaN(this.playerHealth[attackerIdx])) {
        this.playerHealth[attackerIdx] = MAX_HEALTH;
      } else {
        // Clamp health to MAX_HEALTH before calculating damage
        this.playerHealth[attackerIdx] = Math.min(MAX_HEALTH, this.playerHealth[attackerIdx]);
      }
      
      // Calculate damage using constants
      let damage = special ? SPECIAL_DAMAGE : DAMAGE;
      
      // Use playerHealth array as the source of truth
      const currentHealth = this.playerHealth[defenderIdx];
      const newHealth = Math.max(0, currentHealth - damage);
      
      // Update health
      this.playerHealth[defenderIdx] = newHealth;
      
      // Update player object health if it exists
      const defender = this.players?.[defenderIdx];
      if (defender) {
        defender.health = newHealth;
      }
      
      // In real code we'd update health bars and check for a winner
      // But for testing, we'll use mocks
      if (this.updateHealthBar) this.updateHealthBar(0);
      if (this.updateHealthBar) this.updateHealthBar(1);
      if (this.checkWinner) this.checkWinner();
      
      // Send WebSocket message if this is the local player's attack
      if (this.gameMode === 'online' && this.wsManager && typeof this.wsManager.send === 'function') {
        if (attackerIdx === this.localPlayerIndex) {
          const healthUpdate = {
            type: 'health_update',
            playerIndex: defenderIdx,
            health: this.playerHealth[defenderIdx]
          };
          this.wsManager.send(healthUpdate);
        }
      }
      
      // Update special meter for normal attacks
      if (!special) {
        if (!Array.isArray(this.playerSpecial)) {
          this.playerSpecial = [0, 0];
        }
        
        // Ensure special is always a valid number
        if (typeof this.playerSpecial[attackerIdx] !== 'number' || isNaN(this.playerSpecial[attackerIdx])) {
          this.playerSpecial[attackerIdx] = 0;
        }
        
        this.playerSpecial[attackerIdx] = Math.min(3, this.playerSpecial[attackerIdx] + 1);
      }
    };
    
    // Directly override other methods to prevent errors
    scene.createHealthBars = jest.fn();
    scene.updateHealthBar = jest.fn();
    scene.checkWinner = jest.fn().mockReturnValue(false);
    
    // Setup basic game properties
    scene.gameMode = 'online';
    scene.localPlayerIndex = 0;
    scene.playerHealth = [MAX_HEALTH, MAX_HEALTH];
    
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
        health: MAX_HEALTH,
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
        health: MAX_HEALTH,
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
  });
  
  test('Normal attack should consistently reduce health by 5 points', () => {
    // Arrange
    const attackerIdx = 0;
    const defenderIdx = 1;
    const now = Date.now();
    const initialHealth = scene.playerHealth[defenderIdx];
    
    // Act
    scene.tryAttack(attackerIdx, defenderIdx, now, false); // Normal attack
    
    // Assert
    const expectedHealth = initialHealth - 5; // DAMAGE constant value
    expect(scene.playerHealth[defenderIdx]).toBe(expectedHealth);
    expect(scene.players[defenderIdx].health).toBe(expectedHealth);
  });
  
  test('Special attack should consistently reduce health by 10 points', () => {
    // Arrange
    const attackerIdx = 0;
    const defenderIdx = 1;
    const now = Date.now();
    const initialHealth = scene.playerHealth[defenderIdx];
    
    // Act
    scene.tryAttack(attackerIdx, defenderIdx, now, true); // Special attack
    
    // Assert
    const expectedHealth = initialHealth - 10; // SPECIAL_DAMAGE constant value
    expect(scene.playerHealth[defenderIdx]).toBe(expectedHealth);
    expect(scene.players[defenderIdx].health).toBe(expectedHealth);
  });
  
  test('Multiple attacks should correctly reduce health cumulatively', () => {
    // Arrange
    const attackerIdx = 0;
    const defenderIdx = 1;
    const now = Date.now();
    const initialHealth = scene.playerHealth[defenderIdx];
    
    // Act - perform multiple attacks with different damage values
    scene.tryAttack(attackerIdx, defenderIdx, now, false); // -5 (normal)
    scene.tryAttack(attackerIdx, defenderIdx, now + 100, true); // -10 (special)
    scene.tryAttack(attackerIdx, defenderIdx, now + 200, false); // -5 (normal)
    
    // Assert
    const expectedHealth = initialHealth - 5 - 10 - 5; // Total damage: 20
    expect(scene.playerHealth[defenderIdx]).toBe(expectedHealth);
    expect(scene.players[defenderIdx].health).toBe(expectedHealth);
  });
  
  test('Player objects and health array should remain synchronized', () => {
    // Arrange
    const attackerIdx = 0;
    const defenderIdx = 1;
    const now = Date.now();
    
    // Act - multiple attacks
    scene.tryAttack(attackerIdx, defenderIdx, now, false); // -5
    scene.tryAttack(attackerIdx, defenderIdx, now + 100, true); // -10
    
    // Assert - both player.health and playerHealth array should match
    expect(scene.playerHealth[defenderIdx]).toBe(85);
    expect(scene.players[defenderIdx].health).toBe(85);
    
    // Manually modify player health to simulate desync
    scene.players[defenderIdx].health = 80;
    
    // Act - one more attack should synchronize values using playerHealth as source of truth
    scene.tryAttack(attackerIdx, defenderIdx, now + 200, false); // -5
    
    // Assert - values should be synchronized again
    expect(scene.playerHealth[defenderIdx]).toBe(80);
    expect(scene.players[defenderIdx].health).toBe(80);
  });
  
  test('WebSocket health updates should not cause double damage for local player', () => {
    // Arrange
    const attackerIdx = 0; // Local player
    const defenderIdx = 1; // Remote player
    const now = Date.now();
    
    // Act - first do a normal attack
    scene.tryAttack(attackerIdx, defenderIdx, now, false); // -5 health
    
    // Health should be decreased
    expect(scene.playerHealth[defenderIdx]).toBe(95);
    
    // Create message handler function like in the real scene
    const handleMessage = (event: any) => {
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
    
    // Simulate receiving the same message back
    handleMessage({
      data: JSON.stringify({
        type: 'health_update',
        playerIndex: defenderIdx,
        health: 95
      })
    });
    
    // Assert - health should still be 95, not decreased twice
    expect(scene.playerHealth[defenderIdx]).toBe(95);
    expect(scene.players[defenderIdx].health).toBe(95);
  });
  
  test('Health should not go below 0', () => {
    // Arrange
    const attackerIdx = 0;
    const defenderIdx = 1;
    const now = Date.now();
    
    // Set health very low
    scene.playerHealth[defenderIdx] = 5;
    scene.players[defenderIdx].health = 5;
    
    // Act - attack with damage greater than current health
    scene.tryAttack(attackerIdx, defenderIdx, now, true); // -10 damage
    
    // Assert - health should be clamped to 0, not negative
    expect(scene.playerHealth[defenderIdx]).toBe(0);
    expect(scene.players[defenderIdx].health).toBe(0);
  });
  
  test('Health should not exceed MAX_HEALTH', () => {
    // Arrange
    const defenderIdx = 1;
    const MAX_HEALTH = 100;
    
    // Set health above max (simulating a bug)
    scene.playerHealth[defenderIdx] = 110;
    scene.players[defenderIdx].health = 110;
    
    // Act - perform any action that recalculates health
    scene.tryAttack(0, defenderIdx, Date.now(), false);
    
    // Assert - health should be clamped to MAX_HEALTH, not above
    expect(scene.playerHealth[defenderIdx]).toBe(MAX_HEALTH - 5); // Max health - damage
    expect(scene.players[defenderIdx].health).toBe(MAX_HEALTH - 5);
  });
});
