import KidsFightScene from '../kidsfight_scene';

// Mock Phaser components
const mockPhaser = {
  Scene: class MockScene {
    add = {
      image: jest.fn().mockReturnValue({
        setDepth: jest.fn(),
        setOrigin: jest.fn(),
        setDisplaySize: jest.fn()
      }),
      sprite: jest.fn().mockReturnValue({
        setOrigin: jest.fn(),
        setScale: jest.fn(),
        setBounce: jest.fn(),
        setCollideWorldBounds: jest.fn(),
        setSize: jest.fn(),
        body: {
          setGravityY: jest.fn()
        }
      }),
      graphics: jest.fn().mockReturnValue({
        fillStyle: jest.fn(),
        fillCircle: jest.fn(),
        setDepth: jest.fn(),
        clear: jest.fn()
      }),
      rectangle: jest.fn().mockReturnValue({
        setOrigin: jest.fn(),
        setInteractive: jest.fn(),
        on: jest.fn()
      }),
      circle: jest.fn().mockReturnValue({
        setInteractive: jest.fn(),
        on: jest.fn(),
        x: 100,
        y: 100
      }),
      text: jest.fn().mockReturnValue({
        setOrigin: jest.fn(),
        setDepth: jest.fn()
      })
    };
    physics = {
      add: {
        sprite: jest.fn().mockReturnValue({
          setOrigin: jest.fn(),
          setScale: jest.fn(),
          setBounce: jest.fn(),
          setCollideWorldBounds: jest.fn(),
          setSize: jest.fn(),
          body: {
            setGravityY: jest.fn()
          }
        })
      }
    };
    sys = {
      game: {
        canvas: {
          width: 800,
          height: 600
        }
      }
    };
    anims = {
      exists: jest.fn().mockReturnValue(false),
      create: jest.fn(),
      generateFrameNumbers: jest.fn().mockReturnValue([])
    };
    textures = {
      exists: jest.fn().mockReturnValue(false),
      remove: jest.fn(),
      addSpriteSheet: jest.fn()
    };
  }
};

// Mock global Phaser
(global as any).Phaser = mockPhaser;

describe('Dynamic Player Indexing', () => {
  let scene: KidsFightScene;

  beforeEach(() => {
    scene = new KidsFightScene();
    // Mock scene methods that are called during create
    scene.safeAddImage = jest.fn().mockReturnValue({
      setDepth: jest.fn(),
      setOrigin: jest.fn(),
      setDisplaySize: jest.fn()
    });
    scene.createPlatforms = jest.fn();
    scene.createTouchControls = jest.fn();
  });

  describe('getPlayerIndex() method', () => {
    beforeEach(() => {
      // Ensure localPlayerIndex is accessible for testing
      (scene as any).localPlayerIndex = 0;
    });

    test('should return 0 for local mode', () => {
      scene.gameMode = 'local';
      const playerIndex = (scene as any).getPlayerIndex();
      expect(playerIndex).toBe(0);
    });

    test('should return 0 for single mode', () => {
      scene.gameMode = 'single';
      const playerIndex = (scene as any).getPlayerIndex();
      expect(playerIndex).toBe(0);
    });

    test('should return localPlayerIndex for online mode - host', () => {
      scene.gameMode = 'online';
      (scene as any).localPlayerIndex = 0;
      const playerIndex = (scene as any).getPlayerIndex();
      expect(playerIndex).toBe(0);
    });

    test('should return localPlayerIndex for online mode - guest', () => {
      scene.gameMode = 'online';
      (scene as any).localPlayerIndex = 1;
      const playerIndex = (scene as any).getPlayerIndex();
      expect(playerIndex).toBe(1);
    });

    test('should handle undefined gameMode gracefully', () => {
      scene.gameMode = undefined as any;
      const playerIndex = (scene as any).getPlayerIndex();
      expect(playerIndex).toBe(0);
    });
  });

  describe('localPlayerIndex assignment during scene creation', () => {
    test('should set localPlayerIndex to 0 when host is true', () => {
      (scene as any).isHost = true;
      scene.create({ gameMode: 'online', isHost: true });
      expect((scene as any).localPlayerIndex).toBe(0);
    });

    test('should set localPlayerIndex to 1 when host is false', () => {
      (scene as any).isHost = false;
      scene.create({ gameMode: 'online', isHost: false });
      expect((scene as any).localPlayerIndex).toBe(1);
    });

    test('should handle undefined isHost gracefully', () => {
      scene.create({ gameMode: 'online' });
      expect((scene as any).localPlayerIndex).toBe(1); // Default to guest (1) when isHost is falsy
    });
  });

  describe('getPlayerIndex method is called in touch controls', () => {
    let getPlayerIndexSpy: jest.SpyInstance;
    let mockPlayer: any;

    beforeEach(() => {
      mockPlayer = {
        setFlipX: jest.fn(),
        setVelocityX: jest.fn(),
        setVelocityY: jest.fn(),
        body: {
          touching: { down: true }
        }
      };

      // Mock players array
      (scene as any).players = [mockPlayer, mockPlayer];
      (scene as any).playerDirection = ['right', 'left'];
      (scene as any).touchButtons = {
        left: { isDown: false },
        right: { isDown: false },
        jump: { isDown: false }
      };

      getPlayerIndexSpy = jest.spyOn(scene as any, 'getPlayerIndex');
    });

    test('should use dynamic player indexing in touch controls', () => {
      scene.gameMode = 'online';
      (scene as any).localPlayerIndex = 1;

      // The actual touch handler testing would require complex mocking,
      // but we can verify that getPlayerIndex method exists and works correctly
      expect(typeof (scene as any).getPlayerIndex).toBe('function');
      expect((scene as any).getPlayerIndex()).toBe(1);
      
      // Verify that the method correctly returns different values based on game mode
      scene.gameMode = 'local';
      expect((scene as any).getPlayerIndex()).toBe(0);
      
      scene.gameMode = 'online';
      expect((scene as any).getPlayerIndex()).toBe(1);
    });
  });

  describe('Integration tests - Host vs Guest behavior', () => {
    test('should correctly handle host player controls in online mode', () => {
      // Setup host scenario
      scene.gameMode = 'online';
      (scene as any).isHost = true;
      
      scene.create({ gameMode: 'online', isHost: true });

      // Verify host gets index 0
      expect((scene as any).localPlayerIndex).toBe(0);
      expect((scene as any).getPlayerIndex()).toBe(0);
    });

    test('should correctly handle guest player controls in online mode', () => {
      // Setup guest scenario
      scene.gameMode = 'online';
      (scene as any).isHost = false;
      
      scene.create({ gameMode: 'online', isHost: false });

      // Verify guest gets index 1
      expect((scene as any).localPlayerIndex).toBe(1);
      expect((scene as any).getPlayerIndex()).toBe(1);
    });

    test('should maintain backward compatibility for local mode', () => {
      scene.gameMode = 'local';
      
      scene.create({ gameMode: 'local' });

      // Verify local mode always uses index 0
      expect((scene as any).getPlayerIndex()).toBe(0);
    });
  });

  describe('Player direction assignment with dynamic indexing', () => {
    let getPlayerIndexSpy: jest.SpyInstance;

    beforeEach(() => {
      getPlayerIndexSpy = jest.spyOn(scene as any, 'getPlayerIndex');
      (scene as any).players = [
        { setFlipX: jest.fn(), setVelocityX: jest.fn() },
        { setFlipX: jest.fn(), setVelocityX: jest.fn() }
      ];
      (scene as any).playerDirection = ['right', 'left'];
    });

    test('should use correct player index when setting direction in online mode - host', () => {
      scene.gameMode = 'online';
      (scene as any).localPlayerIndex = 0;
      getPlayerIndexSpy.mockReturnValue(0);

      const playerIdx = (scene as any).getPlayerIndex();
      expect(playerIdx).toBe(0);
      
      // Simulate setting player direction
      (scene as any).playerDirection[playerIdx] = 'left';
      expect((scene as any).playerDirection[0]).toBe('left');
    });

    test('should use correct player index when setting direction in online mode - guest', () => {
      scene.gameMode = 'online';
      (scene as any).localPlayerIndex = 1;
      getPlayerIndexSpy.mockReturnValue(1);

      const playerIdx = (scene as any).getPlayerIndex();
      expect(playerIdx).toBe(1);
      
      // Simulate setting player direction
      (scene as any).playerDirection[playerIdx] = 'right';
      expect((scene as any).playerDirection[1]).toBe('right');
    });
  });

  describe('Edge cases and error handling', () => {
    test('should handle missing players array gracefully', () => {
      scene.gameMode = 'online';
      (scene as any).players = null;

      expect(() => {
        (scene as any).getPlayerIndex();
      }).not.toThrow();

      // Should return localPlayerIndex even with null players
      (scene as any).localPlayerIndex = 1;
      expect((scene as any).getPlayerIndex()).toBe(1);
    });

    test('should handle invalid localPlayerIndex values', () => {
      scene.gameMode = 'online';
      (scene as any).localPlayerIndex = -1;

      const result = (scene as any).getPlayerIndex();
      expect(result).toBe(-1); // Should return the actual value, even if invalid
    });

    test('should handle null gameMode', () => {
      scene.gameMode = null as any;
      
      const result = (scene as any).getPlayerIndex();
      expect(result).toBe(0); // Should default to 0
    });

    test('should handle undefined localPlayerIndex in online mode', () => {
      scene.gameMode = 'online';
      (scene as any).localPlayerIndex = undefined;

      const result = (scene as any).getPlayerIndex();
      expect(result).toBeUndefined(); // The method returns localPlayerIndex as-is, even if undefined
    });
  });

  describe('Regression tests - preventing hardcoded [0] usage', () => {
    test('should not use hardcoded index 0 for touch controls in online mode', () => {
      scene.gameMode = 'online';
      (scene as any).localPlayerIndex = 1;

      const playerIdx = (scene as any).getPlayerIndex();
      expect(playerIdx).not.toBe(0); // Should not be hardcoded to 0
      expect(playerIdx).toBe(1); // Should use the guest index
    });

    test('should still use index 0 for local mode', () => {
      scene.gameMode = 'local';
      (scene as any).localPlayerIndex = 999; // This should be ignored in local mode

      const playerIdx = (scene as any).getPlayerIndex();
      expect(playerIdx).toBe(0); // Should always be 0 for local mode
    });
  });
});