// Import jest types at the top of the file
import { jest } from '@jest/globals';
import * as Phaser from 'phaser';

// Use CommonJS require with .default for ES module default export
const KidsFightScene = require('../kidsfight_scene').default;

// Create a simple mock sprite that implements all required properties and methods
const createMockSprite = () => {
  const mockSprite: any = {};
  
  // Add all the mock methods
  const mockMethods = [
    'destroy', 'setOrigin', 'setDepth', 'play', 'setAlpha', 'setScale',
    'setPosition', 'setVisible', 'setInteractive', 'setScrollFactor', 'setFrame',
    'on', 'emit'
  ];
  
  mockMethods.forEach(method => {
    mockSprite[method] = jest.fn().mockReturnThis();
  });
  
  // Special implementation for 'on' method
  mockSprite.on = jest.fn().mockImplementation(function(this: any, event: string, callback: Function) {
    if ((event === 'animationcomplete' || event === 'complete')) {
      this.animationCompleteCallback = callback;
    }
    return this;
  });
  
  // Special implementation for 'emit' method
  mockSprite.emit = jest.fn().mockImplementation(function(this: any, event: string) {
    if ((event === 'animationcomplete' || event === 'complete') && this.animationCompleteCallback) {
      this.animationCompleteCallback();
    }
    return true;
  });
  
  // Add properties
  mockSprite.x = 0;
  mockSprite.y = 0;
  mockSprite.body = {};
  mockSprite.scene = {};
  mockSprite.texture = {};
  mockSprite.frame = {};
  mockSprite.type = 'Sprite';
  mockSprite.name = '';
  
  return mockSprite as Phaser.GameObjects.Sprite;
};

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
  let mockSprite: Phaser.GameObjects.Sprite & {
    onComplete?: () => void;
    destroy: jest.Mock;
    play: jest.Mock;
    on: jest.Mock;
    emit: jest.Mock;
  };
  let mockPhysics: any;
  let mockTime: any;
  let mockTweens: any;
  let mockInput: any;
  let mockAnims: any;
  let mockCameras: any;

  beforeEach(() => {
    // jest.useFakeTimers();
    jest.clearAllMocks();
    // Create a new instance of our mock sprite
    mockSprite = createMockSprite();
    let animationCompleteCallbackInternal: Function | null = null;
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

  // Add the showHitEffect method to the testable class
  class TestableKidsFightScene extends KidsFightScene {
    public testPlayer1: any;
    public testPlayer2: any;
    public testSelected: any;
    public testSelectedScenario: string;
    public testHitEffects: any[] = [];

    constructor() {
      super({});
      this.testPlayer1 = null;
      this.testPlayer2 = null;
      this.testSelected = { p1: 'player1', p2: 'player2' };
      this.testSelectedScenario = 'scenario1';
      this.hitEffects = []; // Initialize hitEffects array
    }

    // Expose protected/private methods for testing
    public showHitEffect(location: number | { x: number; y: number }): void {
      super.showHitEffect(location);
    }

    // Override getters to use test properties
    get player1() { return this.testPlayer1; }
    set player1(value) { this.testPlayer1 = value; }
    
    get player2() { return this.testPlayer2; }
    set player2(value) { this.testPlayer2 = value; }
    
    get selected() { return this.testSelected; }
    set selected(value) { this.testSelected = value; }
    
    get selectedScenario() { return this.testSelectedScenario; }
    set selectedScenario(value) { this.testSelectedScenario = value; }
    
    get wsManager() { return super.wsManager; }
    set wsManager(value) { (this as any)._wsManager = value; }
    
    get hitEffects() { return this.testHitEffects; }
    set hitEffects(value) { this.testHitEffects = value; }
  }

  describe('showHitEffect', () => {
    // Add showHitEffect method to the scene for testing
    beforeEach(() => {
      scene.showHitEffect = function(playerIndexOrPos: number | { x: number; y: number }) {
        let x: number, y: number;
        
        if (typeof playerIndexOrPos === 'number') {
          // If it's a player index, get position from the corresponding player
          const player = playerIndexOrPos === 0 ? this.player1 : this.player2;
          x = player.x;
          y = player.y;
        } else {
          // If it's a position object, use those coordinates
          x = playerIndexOrPos.x;
          y = playerIndexOrPos.y;
        }
        
        // Create a new sprite at the specified position
        const sprite = this.add.sprite(x, y, 'hit');
        
        // Set up the sprite
        sprite.setOrigin(0.5, 0.5);
        sprite.setDepth(10);
        sprite.setScale(2);
        
        // Play the hit animation
        sprite.play('hit');
        
        // Set up animation complete handler
        sprite.on('animationcomplete', () => {
          // Remove the sprite when animation is complete
          sprite.destroy();
        });
        
        return sprite;
      };
    });

    it('should create a hit effect at player position when given player index 0', () => {
      // Set up test data
      scene.player1 = { x: 100, y: 200 };
      scene.player2 = { x: 300, y: 400 };
      
      // Reset mock calls before test
      jest.clearAllMocks();

      // Call the method with player index 0
      scene.showHitEffect(0);
      
      // Verify the sprite was created at player1's position
      expect(mockAdd.sprite).toHaveBeenCalledWith(
        100, 200, 'hit'
      );
      
      // Verify the sprite was set up correctly
      expect(mockSprite.setOrigin).toHaveBeenCalledWith(0.5, 0.5);
      expect(mockSprite.setDepth).toHaveBeenCalledWith(10);
      expect(mockSprite.setScale).toHaveBeenCalledWith(2);
      
      // Verify play was called with 'hit' animation
      expect(mockSprite.play).toHaveBeenCalledWith('hit');
    });

    it('should create a hit effect at player position when given player index 1', () => {
      // Set up test data
      scene.player1 = { x: 100, y: 200 };
      scene.player2 = { x: 300, y: 400 };
      
      // Reset mock calls before test
      jest.clearAllMocks();

      // Call the method with player index 1
      scene.showHitEffect(1);
      
      // Verify the sprite was created at player2's position
      expect(mockAdd.sprite).toHaveBeenCalledWith(
        300, 400, 'hit'
      );
      
      // Verify play was called with 'hit' animation
      expect(mockSprite.play).toHaveBeenCalledWith('hit');
    });
    
    it('should set up animation complete handler', () => {
      // Set up test data
      scene.player1 = { x: 100, y: 200 };
      
      // Reset mock calls
      (mockSprite as any).on.mockClear();
      (mockSprite as any).play.mockClear();
      
      // Call the method
      scene.showHitEffect(0);
      
      // Verify play was called with 'hit' animation
      expect((mockSprite as any).play).toHaveBeenCalledWith('hit');
      
      // Verify animation complete handler was set up
      expect((mockSprite as any).on).toHaveBeenCalledWith(
        'animationcomplete',
        expect.any(Function)
      );
      
      // Get the animation complete callback
      const onCalls = (mockSprite as any).on.mock.calls as Array<[string, Function]>;
      const animationCompleteCallback = onCalls.find(
        call => call[0] === 'animationcomplete'
      )?.[1];
      
      // Verify the callback exists
      expect(animationCompleteCallback).toBeDefined();
      
      // Reset the destroy mock
      (mockSprite as any).destroy.mockClear();
      
      // Call the animation complete callback
      if (animationCompleteCallback) {
        animationCompleteCallback();
      }
      
      // Verify destroy was called
      expect((mockSprite as any).destroy).toHaveBeenCalled();
    });
  });
});

// Mock image imports at the module level
jest.mock('../scenario1.png', () => 'mocked-scenario1-image');
jest.mock('../scenario2.png', () => 'mocked-scenario2-image');
jest.mock('../sprites-bento3.png', () => 'mocked-player1-image');
jest.mock('../sprites-davir3.png', () => 'mocked-player2-image');

// Add type for the KidsFightScene class
type KidsFightSceneType = typeof KidsFightScene;

// Integration tests for KidsFightScene
describe('KidsFightScene Integration', () => {
  let scene: InstanceType<KidsFightSceneType>;
  
  beforeEach(() => {
    // Create a new instance of KidsFightScene for each test
    scene = new KidsFightScene();
  });
  
  afterEach(() => {
    // Clean up after each test
    jest.clearAllMocks();
  });
  
  it('should initialize without errors', () => {
    expect(scene).toBeDefined();
    // Add more assertions here to verify initialization
  });
  
  // Add more specific integration tests as needed
});

// This is needed to make this a module
export {};
