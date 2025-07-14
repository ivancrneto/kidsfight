/**
 * @jest-environment jsdom
 */

import KidsFightScene from '../kidsfight_scene';

// Mock WebSocket manager with sendMessage method
const mockWsManager = {
  sendMessage: jest.fn().mockReturnValue(true),
  send: jest.fn().mockReturnValue(true),
  isConnected: jest.fn().mockReturnValue(true),
  connect: jest.fn(),
  setMessageCallback: jest.fn(),
  getRoomCode: jest.fn().mockReturnValue('test-room'),
  sendReplayRequest: jest.fn().mockReturnValue(true),
};

// Mock scene methods
const mockScene = {
  start: jest.fn(),
  restart: jest.fn()
};

// Mock add methods for UI creation
const mockAdd = {
  text: jest.fn().mockImplementation(() => ({
    setOrigin: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    setScrollFactor: jest.fn().mockReturnThis(),
    setText: jest.fn().mockReturnThis(),
    setColor: jest.fn().mockReturnThis(),
  })),
  graphics: jest.fn().mockReturnValue({
    fillStyle: jest.fn().mockReturnThis(),
    fillRect: jest.fn().mockReturnThis(),
    fillCircle: jest.fn().mockReturnThis(),
    clear: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    setScrollFactor: jest.fn().mockReturnThis(),
    setX: jest.fn().mockReturnThis(),
    setY: jest.fn().mockReturnThis(),
    lineStyle: jest.fn().mockReturnThis(),
    strokeRect: jest.fn().mockReturnThis(),
    destroy: jest.fn()
  }),
  circle: jest.fn().mockImplementation(() => ({
    setDepth: jest.fn().mockReturnThis(),
    setOrigin: jest.fn().mockReturnThis(),
    setInteractive: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    x: 0,
    y: 0
  })),
  sprite: jest.fn().mockImplementation(() => ({
    setOrigin: jest.fn().mockReturnThis(),
    setScale: jest.fn().mockReturnThis(),
    setBounce: jest.fn().mockReturnThis(),
    setCollideWorldBounds: jest.fn().mockReturnThis(),
    setSize: jest.fn().mockReturnThis(),
    body: {
      setGravityY: jest.fn(),
      touching: { down: false }
    },
    health: 100,
    x: 200,
    y: 300
  })),
  rectangle: jest.fn().mockImplementation(() => ({
    setOrigin: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    setScrollFactor: jest.fn().mockReturnThis(),
    destroy: jest.fn()
  }))
};

// Mock time system
const mockTime = {
  addEvent: jest.fn()
};

// Mock sys for canvas dimensions
const mockSys = {
  game: {
    canvas: {
      width: 800,
      height: 600
    }
  }
};

describe('Rematch Fixes Tests', () => {
  let scene: KidsFightScene;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create scene instance
    scene = new KidsFightScene();
    
    // Setup basic mocks
    scene.add = mockAdd as any;
    scene.scene = mockScene as any;
    scene.time = mockTime as any;
    scene.sys = mockSys as any;
    scene.wsManager = mockWsManager as any;
    
    // Mock physics
    scene.physics = {
      add: {
        sprite: jest.fn().mockImplementation(() => mockAdd.sprite()),
        existing: jest.fn(),
        collider: jest.fn()
      }
    } as any;
    
    // Mock textures
    scene.textures = {
      exists: jest.fn().mockReturnValue(false),
      get: jest.fn().mockReturnValue({
        getSourceImage: jest.fn().mockReturnValue({}),
        add: jest.fn()
      }),
      remove: jest.fn(),
      addImage: jest.fn()
    } as any;
    
    // Mock load
    scene.load = {
      image: jest.fn()
    } as any;
    
    // Mock anims
    scene.anims = {
      exists: jest.fn().mockReturnValue(false),
      create: jest.fn(),
      generateFrameNumbers: jest.fn().mockReturnValue([])
    } as any;
    
    // Initialize required properties
    (scene as any).gameMode = 'online';
    (scene as any).isHost = false;
    (scene as any).timeLeft = 60;
    (scene as any).playerHealth = [100, 100];
    (scene as any).playerSpecial = [0, 0];
    (scene as any).players = [
      { health: 100, x: 200, y: 300 },
      { health: 100, x: 600, y: 300 }
    ];
    (scene as any).selected = { p1: 'bento', p2: 'davir' };
    (scene as any).selectedScenario = 'scenario1';
  });

  describe('Timer Synchronization After Rematch', () => {
    it('should call updateTimerDisplay for guest after scene create', () => {
      // Setup guest player in online mode
      (scene as any).gameMode = 'online';
      (scene as any).isHost = false;
      (scene as any).timeLeft = 45;
      
      // Mock updateTimerDisplay method
      const updateTimerDisplaySpy = jest.spyOn(scene as any, 'updateTimerDisplay').mockImplementation();
      
      // Call create method (simulates scene restart)
      scene.create({});
      
      // Verify updateTimerDisplay was called for guest
      expect(updateTimerDisplaySpy).toHaveBeenCalled();
      
      updateTimerDisplaySpy.mockRestore();
    });

    it('should not call updateTimerDisplay for host after scene create', () => {
      // Setup host player in online mode
      (scene as any).gameMode = 'online';
      (scene as any).isHost = true;
      (scene as any).timeLeft = 45;
      
      // Mock updateTimerDisplay method
      const updateTimerDisplaySpy = jest.spyOn(scene as any, 'updateTimerDisplay').mockImplementation();
      
      // Call create method (simulates scene restart)
      scene.create({});
      
      // Host should not call updateTimerDisplay (they control the timer)
      expect(updateTimerDisplaySpy).not.toHaveBeenCalled();
      
      updateTimerDisplaySpy.mockRestore();
    });

    it('should not call updateTimerDisplay in local mode', () => {
      // Setup local mode
      (scene as any).gameMode = 'local';
      (scene as any).timeLeft = 45;
      
      // Mock updateTimerDisplay method
      const updateTimerDisplaySpy = jest.spyOn(scene as any, 'updateTimerDisplay').mockImplementation();
      
      // Call create method (simulates scene restart)
      scene.create({});
      
      // Local mode should not call updateTimerDisplay (not needed)
      expect(updateTimerDisplaySpy).not.toHaveBeenCalled();
      
      updateTimerDisplaySpy.mockRestore();
    });

    it('should handle timer update message from host to guest', () => {
      // Setup guest player - must not be host and game not over
      (scene as any).isHost = false;
      (scene as any).timeLeft = 60;
      (scene as any).gameOver = false; // Ensure game is not over
      
      // Mock updateTimerDisplay method
      const updateTimerDisplaySpy = jest.spyOn(scene as any, 'updateTimerDisplay').mockImplementation();
      
      // Simulate receiving timer update from host
      const timerUpdateAction = {
        type: 'timer_update',
        timeLeft: 45
      };
      
      scene.handleRemoteAction(timerUpdateAction);
      
      // Verify timer was updated and display was refreshed
      expect((scene as any).timeLeft).toBe(45);
      expect(updateTimerDisplaySpy).toHaveBeenCalled();
      
      updateTimerDisplaySpy.mockRestore();
    });

    it('should ignore timer update message from guest (only host controls timer)', () => {
      // Setup host player
      (scene as any).isHost = true;
      (scene as any).timeLeft = 60;
      
      // Mock updateTimerDisplay method
      const updateTimerDisplaySpy = jest.spyOn(scene as any, 'updateTimerDisplay').mockImplementation();
      
      // Simulate receiving timer update (should be ignored by host)
      const timerUpdateAction = {
        type: 'timer_update',
        timeLeft: 45
      };
      
      scene.handleRemoteAction(timerUpdateAction);
      
      // Host should ignore timer updates and keep original time
      expect((scene as any).timeLeft).toBe(60);
      expect(updateTimerDisplaySpy).not.toHaveBeenCalled();
      
      updateTimerDisplaySpy.mockRestore();
    });
  });

  describe('Health Bar Updates After Rematch', () => {
    it('should call updateHealthBar for both players after scene create', () => {
      // Mock updateHealthBar method
      const updateHealthBarSpy = jest.spyOn(scene, 'updateHealthBar').mockImplementation();
      
      // Call create method (simulates scene restart)
      scene.create({});
      
      // Verify updateHealthBar was called for both players
      expect(updateHealthBarSpy).toHaveBeenCalledWith(0);
      expect(updateHealthBarSpy).toHaveBeenCalledWith(1);
      
      updateHealthBarSpy.mockRestore();
    });

    it('should sync player sprite health with playerHealth array after create', () => {
      // Mock createHealthBars to prevent it from interfering
      const createHealthBarsSpy = jest.spyOn(scene, 'createHealthBars').mockImplementation();
      const updateHealthBarSpy = jest.spyOn(scene, 'updateHealthBar').mockImplementation();
      
      // Setup players with complete Phaser sprite mock including all required methods
      const mockPlayers = [
        { 
          health: 80, 
          x: 200, 
          y: 300,
          setOrigin: jest.fn().mockReturnThis(),
          setScale: jest.fn().mockReturnThis(),
          setBounce: jest.fn().mockReturnThis(),
          setCollideWorldBounds: jest.fn().mockReturnThis(),
          setSize: jest.fn().mockReturnThis(),
          body: {
            setGravityY: jest.fn(),
            touching: { down: false }
          }
        },
        { 
          health: 60, 
          x: 600, 
          y: 300,
          setOrigin: jest.fn().mockReturnThis(),
          setScale: jest.fn().mockReturnThis(),
          setBounce: jest.fn().mockReturnThis(),
          setCollideWorldBounds: jest.fn().mockReturnThis(),
          setSize: jest.fn().mockReturnThis(),
          body: {
            setGravityY: jest.fn(),
            touching: { down: false }
          }
        }
      ];
      
      // Mock physics add to return our custom players
      scene.physics = {
        add: {
          sprite: jest.fn()
            .mockReturnValueOnce(mockPlayers[0])
            .mockReturnValueOnce(mockPlayers[1]),
          existing: jest.fn(),
          collider: jest.fn()
        }
      } as any;
      
      // Call create method
      scene.create({});
      
      // After create, the playerHealth should be reset and synced to players
      const players = (scene as any).players;
      expect(players[0].health).toBe(100);
      expect(players[1].health).toBe(100);
      
      createHealthBarsSpy.mockRestore();
      updateHealthBarSpy.mockRestore();
    });

    it('should recreate health bars if missing', () => {
      // Mock createHealthBars method
      const createHealthBarsSpy = jest.spyOn(scene, 'createHealthBars').mockImplementation();
      
      // Call create method
      scene.create({});
      
      // Verify createHealthBars was called
      expect(createHealthBarsSpy).toHaveBeenCalled();
      
      createHealthBarsSpy.mockRestore();
    });
  });

  describe('Health Synchronization via WebSocket', () => {
    it('should send health_update message when player takes damage in online mode', () => {
      // Setup online mode
      (scene as any).gameMode = 'online';
      (scene as any).playerHealth = [100, 100];
      
      // Mock players
      const mockPlayers = [
        { health: 100, x: 200, y: 300 },
        { health: 100, x: 220, y: 300 } // Close enough for damage
      ];
      (scene as any).players = mockPlayers;
      
      // Mock updateHealthBar to avoid UI calls
      const updateHealthBarSpy = jest.spyOn(scene, 'updateHealthBar').mockImplementation();
      
      // Simulate attack that deals damage
      scene.tryAttack(0, 1, Date.now(), false);
      
      // Verify health_update message was sent
      expect(mockWsManager.sendMessage).toHaveBeenCalledWith({
        type: 'health_update',
        playerIndex: 1,
        health: 95 // 100 - 5 damage
      });
      
      // Verify health bar was updated
      expect(updateHealthBarSpy).toHaveBeenCalledWith(1);
      
      updateHealthBarSpy.mockRestore();
    });

    it('should not send health_update message in local mode', () => {
      // Setup local mode
      (scene as any).gameMode = 'local';
      (scene as any).playerHealth = [100, 100];
      
      // Mock players
      const mockPlayers = [
        { health: 100, x: 200, y: 300 },
        { health: 100, x: 220, y: 300 } // Close enough for damage
      ];
      (scene as any).players = mockPlayers;
      
      // Mock updateHealthBar to avoid UI calls
      const updateHealthBarSpy = jest.spyOn(scene, 'updateHealthBar').mockImplementation();
      
      // Simulate attack that deals damage
      scene.tryAttack(0, 1, Date.now(), false);
      
      // Verify health_update message was NOT sent in local mode
      expect(mockWsManager.sendMessage).not.toHaveBeenCalled();
      
      // Verify health bar was still updated locally
      expect(updateHealthBarSpy).toHaveBeenCalledWith(1);
      
      updateHealthBarSpy.mockRestore();
    });

    it('should handle health_update message from remote player', () => {
      // Setup initial health
      (scene as any).playerHealth = [100, 100];
      const mockPlayers = [
        { health: 100, x: 200, y: 300 },
        { health: 100, x: 600, y: 300 }
      ];
      (scene as any).players = mockPlayers;
      
      // Mock updateHealthBar method
      const updateHealthBarSpy = jest.spyOn(scene, 'updateHealthBar').mockImplementation();
      
      // Simulate receiving health update from remote player
      const healthUpdateAction = {
        type: 'health_update',
        playerIndex: 1,
        health: 75
      };
      
      scene.handleRemoteAction(healthUpdateAction);
      
      // Verify health was updated
      expect((scene as any).playerHealth[1]).toBe(75);
      expect(mockPlayers[1].health).toBe(75);
      
      // Verify health bar was updated
      expect(updateHealthBarSpy).toHaveBeenCalledWith(1);
      
      updateHealthBarSpy.mockRestore();
    });

    it('should send health_update for special attacks', () => {
      // Setup online mode
      (scene as any).gameMode = 'online';
      (scene as any).playerHealth = [100, 100];
      (scene as any).playerSpecial = [3, 0]; // Player 0 has enough special pips
      
      // Mock players
      const mockPlayers = [
        { health: 100, x: 200, y: 300 },
        { health: 100, x: 220, y: 300 } // Close enough for damage
      ];
      (scene as any).players = mockPlayers;
      
      // Mock updateHealthBar and updateSpecialPips to avoid UI calls
      const updateHealthBarSpy = jest.spyOn(scene, 'updateHealthBar').mockImplementation();
      const updateSpecialPipsSpy = jest.spyOn(scene, 'updateSpecialPips').mockImplementation();
      
      // Simulate special attack that deals damage
      scene.tryAttack(0, 1, Date.now(), true);
      
      // Verify health_update message was sent with special damage
      expect(mockWsManager.sendMessage).toHaveBeenCalledWith({
        type: 'health_update',
        playerIndex: 1,
        health: 90 // 100 - 10 special damage
      });
      
      updateHealthBarSpy.mockRestore();
      updateSpecialPipsSpy.mockRestore();
    });

    it('should handle missing wsManager gracefully', () => {
      // Remove wsManager
      (scene as any).wsManager = undefined;
      (scene as any).gameMode = 'online';
      (scene as any).playerHealth = [100, 100];
      
      // Mock players
      const mockPlayers = [
        { health: 100, x: 200, y: 300 },
        { health: 100, x: 220, y: 300 }
      ];
      (scene as any).players = mockPlayers;
      
      // Mock updateHealthBar to avoid UI calls
      const updateHealthBarSpy = jest.spyOn(scene, 'updateHealthBar').mockImplementation();
      
      // Should not throw error when trying to send health update
      expect(() => {
        scene.tryAttack(0, 1, Date.now(), false);
      }).not.toThrow();
      
      // Health should still be updated locally
      expect((scene as any).playerHealth[1]).toBe(95);
      expect(updateHealthBarSpy).toHaveBeenCalledWith(1);
      
      updateHealthBarSpy.mockRestore();
    });
  });

  describe('Integration Tests', () => {
    it('should properly reset and synchronize all game state after rematch', () => {
      // Setup online game state before rematch
      (scene as any).gameMode = 'online';
      (scene as any).isHost = false;
      (scene as any).gameOver = true;
      (scene as any).timeLeft = 10;
      (scene as any).playerHealth = [25, 50];
      (scene as any).playerSpecial = [2, 1];
      
      // Mock methods to track calls
      const updateTimerDisplaySpy = jest.spyOn(scene as any, 'updateTimerDisplay').mockImplementation();
      const updateHealthBarSpy = jest.spyOn(scene, 'updateHealthBar').mockImplementation();
      const createHealthBarsSpy = jest.spyOn(scene, 'createHealthBars').mockImplementation();
      
      // Simulate scene restart (rematch)
      scene.create({});
      
      // Verify game state was reset
      expect((scene as any).gameOver).toBe(false);
      expect((scene as any).timeLeft).toBe(60);
      expect((scene as any).playerHealth).toEqual([100, 100]);
      expect((scene as any).playerSpecial).toEqual([0, 0]);
      
      // Verify UI was recreated and updated
      expect(createHealthBarsSpy).toHaveBeenCalled();
      expect(updateHealthBarSpy).toHaveBeenCalledWith(0);
      expect(updateHealthBarSpy).toHaveBeenCalledWith(1);
      expect(updateTimerDisplaySpy).toHaveBeenCalled(); // Guest should update timer display
      
      updateTimerDisplaySpy.mockRestore();
      updateHealthBarSpy.mockRestore();
      createHealthBarsSpy.mockRestore();
    });

    it('should maintain synchronization after multiple attacks during rematch', () => {
      // Setup online mode
      (scene as any).gameMode = 'online';
      (scene as any).playerHealth = [100, 100];
      
      // Mock players close enough for attacks
      const mockPlayers = [
        { health: 100, x: 200, y: 300 },
        { health: 100, x: 220, y: 300 }
      ];
      (scene as any).players = mockPlayers;
      
      // Mock updateHealthBar to avoid UI calls
      const updateHealthBarSpy = jest.spyOn(scene, 'updateHealthBar').mockImplementation();
      
      // Simulate multiple attacks
      scene.tryAttack(0, 1, Date.now(), false); // Player 1: 100 -> 95
      scene.tryAttack(1, 0, Date.now(), false); // Player 0: 100 -> 95
      scene.tryAttack(0, 1, Date.now(), false); // Player 1: 95 -> 90
      
      // Verify multiple health_update messages were sent
      expect(mockWsManager.sendMessage).toHaveBeenCalledTimes(3);
      expect(mockWsManager.sendMessage).toHaveBeenNthCalledWith(1, {
        type: 'health_update',
        playerIndex: 1,
        health: 95
      });
      expect(mockWsManager.sendMessage).toHaveBeenNthCalledWith(2, {
        type: 'health_update',
        playerIndex: 0,
        health: 95
      });
      expect(mockWsManager.sendMessage).toHaveBeenNthCalledWith(3, {
        type: 'health_update',
        playerIndex: 1,
        health: 90
      });
      
      // Verify final health values
      expect((scene as any).playerHealth).toEqual([95, 90]);
      expect(mockPlayers[0].health).toBe(95);
      expect(mockPlayers[1].health).toBe(90);
      
      updateHealthBarSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle timer update with undefined timeLeft gracefully', () => {
      (scene as any).isHost = false;
      
      const timerUpdateAction = {
        type: 'timer_update',
        // timeLeft is undefined
      };
      
      // Should not throw error
      expect(() => {
        scene.handleRemoteAction(timerUpdateAction);
      }).not.toThrow();
    });

    it('should handle health update with invalid playerIndex gracefully', () => {
      const healthUpdateAction = {
        type: 'health_update',
        playerIndex: 5, // Invalid index
        health: 50
      };
      
      // Should not throw error
      expect(() => {
        scene.handleRemoteAction(healthUpdateAction);
      }).not.toThrow();
    });

    it('should handle health update with undefined health gracefully', () => {
      const healthUpdateAction = {
        type: 'health_update',
        playerIndex: 1,
        // health is undefined
      };
      
      // Should not throw error
      expect(() => {
        scene.handleRemoteAction(healthUpdateAction);
      }).not.toThrow();
    });
  });
});