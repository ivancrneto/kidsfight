// Import jest types at the top of the file
import { jest } from '@jest/globals';
// import { KidsFightScene } from '../src/scenes/kidsfight_scene';
import KidsFightScene from '../kidsfight_scene';

// Mock setTimeout with proper TypeScript types
declare global {
  interface Window {
    setTimeout: typeof global.setTimeout;
  }
}

describe('KidsFightScene', () => {
  let scene: any;
  let mockGame: any;
  let mockAdd: any;
  let mockSprite: any;
  let mockPhysics: any;
  let mockTime: any;
  let mockTweens: any;
  let mockInput: any;
  let mockAnims: any;
  let mockCameras: any;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    // Create a mock sprite and add
    let animationCompleteCallbackInternal: Function | null = null;
    mockSprite = {
      destroy: jest.fn(),
      setOrigin: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis(),
      play: jest.fn().mockReturnThis(),
      setAlpha: jest.fn().mockReturnThis(),
      setScale: jest.fn().mockReturnThis(),
      on: jest.fn((eventName, callback) => {
        if (eventName === 'animationcomplete') {
          animationCompleteCallbackInternal = callback as Function;
        }
        return mockSprite; // For chaining
      }),
      emit: jest.fn((eventName) => {
        if (eventName === 'animationcomplete' && animationCompleteCallbackInternal) {
          animationCompleteCallbackInternal();
        }
        return mockSprite; // For chaining
      })
    };
    mockAdd = {
      sprite: jest.fn(() => mockSprite),
      graphics: jest.fn().mockReturnThis(),
      rectangle: jest.fn().mockReturnThis(),
      image: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      container: jest.fn().mockReturnThis(),
      existing: jest.fn().mockReturnThis(),
      setOrigin: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis(),
      setScrollFactor: jest.fn().mockReturnThis(),
      setInteractive: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      setScale: jest.fn().mockReturnThis(),
      setAlpha: jest.fn().mockReturnThis(),
      setTint: jest.fn().mockReturnThis(),
      play: jest.fn().mockReturnThis(),
      setBounce: jest.fn().mockReturnThis(),
      setCollideWorldBounds: jest.fn().mockReturnThis(),
      setImmovable: jest.fn().mockReturnThis(),
      setSize: jest.fn().mockReturnThis(),
      setOffset: jest.fn().mockReturnThis(),
      setVelocity: jest.fn().mockReturnThis(),
      setVelocityX: jest.fn().mockReturnThis(),
      setVelocityY: jest.fn().mockReturnThis(),
      setGravityY: jest.fn().mockReturnThis(),
      setFrictionX: jest.fn().mockReturnThis(),
      setFrictionY: jest.fn().mockReturnThis(),
      refreshBody: jest.fn().mockReturnThis(),
      destroy: jest.fn().mockReturnThis(),
      fillStyle: jest.fn().mockReturnThis(),
      fillRect: jest.fn().mockReturnThis(),
      lineStyle: jest.fn().mockReturnThis(),
      strokeRect: jest.fn().mockReturnThis(),
      setPosition: jest.fn().mockReturnThis(),
      setVisible: jest.fn().mockReturnThis(),
      setText: jest.fn().mockReturnThis(),
      setColor: jest.fn().mockReturnThis(),
      setFontSize: jest.fn().mockReturnThis(),
      setAlign: jest.fn().mockReturnThis(),
      setPadding: jest.fn().mockReturnThis(),
      setShadow: jest.fn().mockReturnThis(),
      setStroke: jest.fn().mockReturnThis(),
      setBackgroundColor: jest.fn().mockReturnThis(),
      setFixedSize: jest.fn().mockReturnThis(),
      setWordWrapWidth: jest.fn().mockReturnThis(),
      setLineSpacing: jest.fn().mockReturnThis(),
      setFont: jest.fn().mockReturnThis(),
      setFontFamily: jest.fn().mockReturnThis(),
      setFontStyle: jest.fn().mockReturnThis(),
      setFontWeight: jest.fn().mockReturnThis(),
      setMaxLines: jest.fn().mockReturnThis(),
      setWordWrapCallback: jest.fn().mockReturnThis()
    };
    mockPhysics = {
      add: {
        sprite: jest.fn().mockReturnThis(),
        staticGroup: jest.fn().mockReturnThis(),
        group: jest.fn().mockReturnThis(),
        collider: jest.fn().mockReturnThis(),
        overlap: jest.fn().mockReturnThis()
      },
      world: {
        setBounds: jest.fn(),
        create: jest.fn(),
        enable: jest.fn().mockReturnThis()
      }
    };
    mockTime = {
      addEvent: jest.fn(),
      delayedCall: jest.fn(),
      now: 0
    };
    mockTweens = {
      add: jest.fn()
    };
    mockInput = {
      keyboard: {
        createCursorKeys: jest.fn().mockReturnValue({
          left: { isDown: false },
          right: { isDown: false },
          up: { isDown: false },
          down: { isDown: false },
          space: { isDown: false }
        }),
        addKeys: jest.fn().mockReturnValue({
          left: { isDown: false },
          right: { isDown: false },
          up: { isDown: false },
          down: { isDown: false },
          space: { isDown: false }
        })
      }
    };
    mockAnims = {
      create: jest.fn()
    };
    mockCameras = {
      main: {
        setBounds: jest.fn(),
        startFollow: jest.fn(),
        setZoom: jest.fn()
      }
    };
    // Create a new instance of the testable scene
    // @ts-expect-error - TestableKidsFightScene intentionally exposes private/protected members for testing
    scene = new (class TestableKidsFightScene extends KidsFightScene {
      public testPlayer1: any;
      public testPlayer2: any;
      public testSelected: any;
      public testSelectedScenario: string;
      public testWsManager: any;
      public testHitEffects: any[] = [];
      constructor() {
        super();
        this.testPlayer1 = null;
        this.testPlayer2 = null;
        this.testSelected = { p1: 'player1', p2: 'player2' };
        this.testSelectedScenario = 'scenario1';
        this.testWsManager = null;
      }
      get player1() { return this.testPlayer1; }
      set player1(value) { this.testPlayer1 = value; }
      get player2() { return this.testPlayer2; }
      set player2(value) { this.testPlayer2 = value; }
      get selected() { return this.testSelected; }
      set selected(value) { this.testSelected = value; }
      get selectedScenario() { return this.testSelectedScenario; }
      set selectedScenario(value) { this.testSelectedScenario = value; }
      get wsManager() { return this.testWsManager; }
      set wsManager(value) { this.testWsManager = value; }
      get hitEffects() { return this.testHitEffects; }
      set hitEffects(value) { this.testHitEffects = value; }
    })();
    // Assign mocks
    scene.add = mockAdd;
    scene.physics = mockPhysics;
    scene.game = mockGame;
    scene.time = mockTime;
    scene.tweens = mockTweens;
    scene.input = mockInput;
    scene.anims = mockAnims;
    scene.cameras = mockCameras;
    scene.sys = {
      game: mockGame,
      scale: {
        on: jest.fn()
      },
      events: {
        on: jest.fn(),
        off: jest.fn()
      }
    };
  });

  describe('showHitEffect', () => {
    it('should create a hit effect at player position when given player index 0', () => {
      // Setup player 1
      const mockPlayer = {
        x: 100,
        y: 200,
        body: {
          velocity: { x: 0, y: 0 }
        }
      };
      scene.testPlayer1 = mockPlayer;

      // Call the method with player index 0
      scene.showHitEffect(0);
      
      // Verify the sprite was created at player1's position
      expect(mockAdd.sprite).toHaveBeenCalledWith(
        100, 200, 'hit'
      );
    });

    it('should create a hit effect at player position when given player index 1', () => {
      // Setup player 2
      const mockPlayer = {
        x: 300,
        y: 400,
        body: {
          velocity: { x: 0, y: 0 }
        }
      };
      scene.testPlayer2 = mockPlayer;

      // Call the method with player index 1
      scene.showHitEffect(1);
      
      // Verify the sprite was created at player2's position
      expect(mockAdd.sprite).toHaveBeenCalledWith(
        300, 400, 'hit'
      );
    });

    it('should create a hit effect at specified coordinates', () => {
      // Call the method with coordinates
      const x = 150;
      const y = 250;
      scene.showHitEffect({ x, y });
      
      // Verify the sprite was created at the specified coordinates
      expect(mockAdd.sprite).toHaveBeenCalledWith(
        x, y, 'hit'
      );
    });

    it('should clean up the hit effect after animation completes', () => {
      // Mock global.setTimeout to interact with it
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn((callback: TimerHandler, timeout?: number) => {
        // In our case, the important callback is the first one for animation emit
        if ((global.setTimeout as unknown as jest.Mock).mock.calls.length === 1) {
          // Store it or call it directly if appropriate for the test flow
          // For this test, we'll grab it later
        }
        // Return a dummy timer ID
        return originalSetTimeout(callback, timeout || 0) as unknown as NodeJS.Timeout;
      }) as any; // Use 'as any' to satisfy complex jest.fn typing with setTimeout specifics

      scene.showHitEffect({ x: 100, y: 200 });

      // The sprite should be pushed to hitEffects
      expect(scene.hitEffects.length).toBe(1);
      expect(scene.hitEffects[0]).toBe(mockSprite);

      // Expect setTimeout to have been called (at least for the animation emit)
      expect(global.setTimeout).toHaveBeenCalled();

      // Get the first callback passed to setTimeout (the one that emits 'animationcomplete')
      // This relies on the implementation detail from showHitEffectAtCoordinates
      const animationEmitCallback = (global.setTimeout as unknown as jest.Mock).mock.calls[0][0];
      
      // Call the callback to simulate the timeout and trigger 'animationcomplete'
      (animationEmitCallback as Function)();

      // After animation completes, the sprite should be removed from hitEffects and destroyed
      expect(scene.hitEffects.length).toBe(0);
      expect(mockSprite.destroy).toHaveBeenCalledTimes(1);

      // Restore original setTimeout
      global.setTimeout = originalSetTimeout;
    });
  });
});
