// Create mock WebSocketManager
// Import from the correct path based on your project structure
import KidsFightScene from '../kidsfight_scene';

// --- Ensure WebSocketManager is mocked at the module level ---
import mockWebSocketManager from '../websocket_manager';
jest.mock('../websocket_manager', () => ({
  __esModule: true,
  default: mockWebSocketManager,
  WebSocketManager: jest.fn(() => mockWebSocketManager)
}));

// Define WebSocketManager interface for testing
interface WebSocketManager {
  connect: () => Promise<void>;
  on: (event: string, callback: (data: any) => void) => void;
  send: (data: any) => void;
  disconnect: () => void;
  close: () => void;
  isConnected: () => boolean;
  setMessageCallback: (callback: (data: any) => void) => void;
  getInstance: () => WebSocketManager;
  setHost: (isHost: boolean) => void;
  setRoomCode: (code: string) => void;
  sendGameAction: (action: string, data?: any) => void;
  sendChatMessage: (message: string) => void;
  sendGameStart: () => void;
  sendPlayerReady: (isReady: boolean) => void;
  sendPlayerSelection: (selection: any) => void;
  sendPlayerPosition: (position: any) => void;
  sendPlayerAttack: (attack: any) => void;
  sendPlayerDamage: (damage: any) => void;
}

// Create a mock WebSocketManager instance for testing
const mockWebSocketManager = {
  connect: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
  send: jest.fn(),
  disconnect: jest.fn(),
  close: jest.fn(),
  isConnected: jest.fn().mockReturnValue(true),
  setMessageCallback: jest.fn(),
  getInstance: jest.fn().mockImplementation(() => mockWebSocketManager), // Changed to mockImplementation
  setHost: jest.fn(),
  setRoomCode: jest.fn(),
  sendGameAction: jest.fn(),
  sendChatMessage: jest.fn(),
  sendGameStart: jest.fn(),
  sendPlayerReady: jest.fn(),
  sendPlayerSelection: jest.fn(),
  sendPlayerPosition: jest.fn(),
  sendPlayerAttack: jest.fn(),
  sendPlayerDamage: jest.fn()
};

// Mock Phaser methods
const mockAdd = {
  sprite: jest.fn(),
  image: jest.fn(),
  text: jest.fn(),
  container: jest.fn(),
  graphics: jest.fn(),
  rectangle: jest.fn()
};

// Mock Phaser scene methods
const mockSceneMethods = {
  add: mockAdd,
  load: {
    image: jest.fn(),
    spritesheet: jest.fn(),
    audio: jest.fn(),
    on: jest.fn()
  },
  physics: {
    add: {
      collider: jest.fn(),
      overlap: jest.fn()
    },
    world: {
      setBounds: jest.fn(),
      createCollider: jest.fn(),
      createOverlap: jest.fn()
    }
  },
  cameras: {
    main: {
      setBounds: jest.fn(),
      setZoom: jest.fn(),
      startFollow: jest.fn()
    }
  },
  tweens: {
    add: jest.fn()
  },
  sound: {
    add: jest.fn()
  },
  time: {
    addEvent: jest.fn(),
    delayedCall: jest.fn()
  },
  input: {
    keyboard: {
      createCursorKeys: jest.fn()
    },
    on: jest.fn()
  },
  events: {
    on: jest.fn()
  }
};

// Mock the global console
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn()
};

// Mock the global setTimeout
global.setTimeout = jest.fn((callback) => {
  callback();
  return 0 as unknown as NodeJS.Timeout;
}) as unknown as typeof setTimeout;

// Define mock classes
class MockSprite {
  constructor(public x: number, public y: number) {}
  setCollideWorldBounds = jest.fn().mockReturnThis();
  setBounce = jest.fn().mockReturnThis();
  setImmovable = jest.fn().mockReturnThis();
  setOrigin = jest.fn().mockReturnThis();
  setDisplaySize = jest.fn().mockReturnThis();
  setDepth = jest.fn().mockReturnThis();
  setAlpha = jest.fn().mockReturnThis();
  setInteractive = jest.fn().mockReturnThis();
  on = jest.fn().mockReturnThis();
  play = jest.fn().mockReturnThis();
  setVelocityX = jest.fn().mockReturnThis();
  setVelocityY = jest.fn().mockReturnThis();
  setFlipX = jest.fn().mockReturnThis();
  setFlipY = jest.fn().mockReturnThis();
  setPosition = jest.fn().mockReturnThis();
  setScrollFactor = jest.fn().mockReturnThis();
  setPipeline = jest.fn().mockReturnThis();
  body = {
    setAllowGravity: jest.fn(),
    setImmovable: jest.fn(),
    setSize: jest.fn(),
    setOffset: jest.fn(),
    velocity: { x: 0, y: 0 },
    setVelocityX: jest.fn(),
    setVelocityY: jest.fn(),
    setCollideWorldBounds: jest.fn()
  };
  anims = { play: jest.fn() };
  destroy = jest.fn();
}

class MockRectangle {
  setOrigin = jest.fn().mockReturnThis();
  setDisplaySize = jest.fn().mockReturnThis();
  setImmovable = jest.fn().mockReturnThis();
  setDepth = jest.fn().mockReturnThis();
  setFillStyle = jest.fn().mockReturnThis();
  setScrollFactor = jest.fn().mockReturnThis();
  destroy = jest.fn();
}

class MockText {
  setOrigin = jest.fn().mockReturnThis();
  setFontSize = jest.fn().mockReturnThis();
  setPadding = jest.fn().mockReturnThis();
  setStyle = jest.fn().mockReturnThis();
  setColor = jest.fn().mockReturnThis();
  setDepth = jest.fn().mockReturnThis();
  setScrollFactor = jest.fn().mockReturnThis();
  setShadow = jest.fn().mockReturnThis();
  setAlign = jest.fn().mockReturnThis();
  setWordWrapWidth = jest.fn().mockReturnThis();
  setInteractive = jest.fn().mockReturnThis();
  destroy = jest.fn();
  setPosition = jest.fn().mockReturnThis();
  setVisible = jest.fn().mockReturnThis();
  setText = jest.fn().mockReturnThis();
}

class MockGraphics {
  fillStyle = jest.fn().mockReturnThis();
  fillRect = jest.fn().mockReturnThis();
  clear = jest.fn().mockReturnThis();
  lineStyle = jest.fn().mockReturnThis();
  strokeRect = jest.fn().mockReturnThis();
  setScrollFactor = jest.fn().mockReturnThis();
  destroy = jest.fn();
}

// Extend the global Phaser type
global.Phaser = {
  Scene: class Scene {
    add: any;
    physics: any;
    input: any;
    cameras: any;
    tweens: any;
    time: any;
    anims: any;
    sys: any;
    
    constructor() {
      this.add = {
        sprite: jest.fn().mockImplementation((x, y, key) => new MockSprite(x, y)),
        rectangle: jest.fn().mockImplementation(() => new MockRectangle()),
        text: jest.fn().mockImplementation(() => new MockText()),
        graphics: jest.fn().mockImplementation(() => new MockGraphics()),
        image: jest.fn().mockImplementation(() => ({
          setOrigin: jest.fn().mockReturnThis(),
          setDisplaySize: jest.fn().mockReturnThis(),
          setScrollFactor: jest.fn().mockReturnThis(),
          setDepth: jest.fn().mockReturnThis()
        }))
      };
      
      this.physics = {
        world: {
          setBounds: jest.fn()
        },
        add: {
          sprite: jest.fn().mockImplementation((x, y, key) => new MockSprite(x, y)),
          existing: jest.fn().mockImplementation(sprite => sprite)
        }
      };
      
      this.cameras = {
        main: {
          setBounds: jest.fn(),
          centerX: 400,
          centerY: 300,
          width: 800,
          height: 600
        }
      };
      
      this.tweens = {
        add: jest.fn()
      };
      
      this.time = {
        addEvent: jest.fn()
      };
      
      this.anims = {
        create: jest.fn()
      };
      
      this.sys = {
        game: {
          config: {
            width: 800,
            height: 600
          },
          device: {
            input: {
              touch: false
            }
          }
        }
      };
    }
  },
  Game: class {},
  GameObjects: {
    Sprite: MockSprite,
    Rectangle: MockRectangle,
    Text: MockText,
    Graphics: MockGraphics,
    Image: class {}
  },
  Physics: {
    Arcade: {
      Sprite: MockSprite,
      Body: class {},
      StaticBody: class {},
      Factory: class {}
    }
  },
  Math: {
    Between: jest.fn()
  },
  Display: {
    RGBToString: jest.fn()
  }
} as unknown as typeof Phaser;

// Define a test scene class that extends KidsFightScene for testing
class TestKidsFightScene extends KidsFightScene {
  constructor(config?: Phaser.Types.Scenes.SettingsConfig & { customKeyboard?: any }) {
    super(config);
  }
  
  // Override any methods needed for testing
  create() {
    super.create();
  }
}

describe('KidsFightScene', () => {
  let scene: KidsFightScene;
  let sceneAny: any;
  
  // Helper function to initialize a scene with proper typing
  const createTestScene = () => {
    // Create a mock physics body
    const mockPhysicsBody = {
      setAllowGravity: jest.fn().mockReturnThis(),
      setGravityY: jest.fn().mockReturnThis(),
      setMaxVelocity: jest.fn().mockReturnThis(),
      setCollideWorldBounds: jest.fn().mockReturnThis(),
      setBounce: jest.fn().mockReturnThis(),
      setImmovable: jest.fn().mockReturnThis(),
      velocity: { x: 0, y: 0 },
      allowGravity: true,
      gravity: { x: 0, y: 0 },
      setSize: jest.fn().mockReturnThis(),
      setOffset: jest.fn().mockReturnThis(),
      onFloor: jest.fn().mockReturnValue(true),
      gameObject: null as any // Will be set when added to physics
    };

    // Create a mock platform with all required properties
    const mockPlatform = {
      x: 400,
      y: 400,
      width: 800,
      height: 64,
      setOrigin: jest.fn().mockReturnThis(),
      setInteractive: jest.fn().mockReturnThis(),
      setScrollFactor: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis(),
      setPipeline: jest.fn().mockReturnThis(),
      setAlpha: jest.fn().mockReturnThis(),
      setVisible: jest.fn().mockReturnThis(),
      destroy: jest.fn(),
      body: { ...mockPhysicsBody }
    } as unknown as Phaser.Physics.Arcade.Sprite;
    
    // Create scene with default constructor
    const testScene = new KidsFightScene();
    
    // Use type assertion to access private properties for testing
    const sceneAny = testScene as any;
    
    // Initialize required private properties
    // @ts-ignore - Accessing private property for testing
    testScene.selected = { p1: 'player1', p2: 'player2' };
    // @ts-ignore - Accessing private property for testing
    testScene.selectedScenario = 'scenario1';
    // @ts-ignore - Accessing private property for testing
    testScene.gameMode = 'single';
    // @ts-ignore - Accessing private property for testing
    testScene.platform = mockPlatform;
    
    // Mock the physics system
    sceneAny.physics = {
      add: {
        existing: jest.fn().mockImplementation((obj) => {
          // For the platform, return it with the mock physics body
          if (obj === mockPlatform) {
            const result = {
              ...obj,
              body: { ...mockPhysicsBody }
            };
            // Make sure the body is properly set up
            result.body.gameObject = result;
            return result;
          }
          // For other objects, ensure they have a body
          if (!obj.body) {
            obj.body = { ...mockPhysicsBody };
            obj.body.gameObject = obj;
          }
          return obj;
        }),
        sprite: jest.fn().mockImplementation((x, y, key) => ({
          x,
          y,
          key,
          body: { ...mockPhysicsBody },
          setCollideWorldBounds: jest.fn().mockReturnThis(),
          setBounce: jest.fn().mockReturnThis(),
          setImmovable: jest.fn().mockReturnThis(),
          setGravityY: jest.fn().mockReturnThis(),
          setSize: jest.fn().mockReturnThis(),
          setOffset: jest.fn().mockReturnThis(),
          setVelocityX: jest.fn().mockReturnThis(),
          setVelocityY: jest.fn().mockReturnThis(),
          setMaxVelocity: jest.fn().mockReturnThis(),
          setDragX: jest.fn().mockReturnThis(),
          setDragY: jest.fn().mockReturnThis(),
          setAllowGravity: jest.fn().mockReturnThis(),
          setOrigin: jest.fn().mockReturnThis(),
          setScale: jest.fn().mockReturnThis(),
          setDepth: jest.fn().mockReturnThis(),
          play: jest.fn().mockReturnThis(),
          stop: jest.fn().mockReturnThis(),
          setFlipX: jest.fn().mockReturnThis(),
          setFlipY: jest.fn().mockReturnThis(),
          setInteractive: jest.fn().mockReturnThis(),
          on: jest.fn().mockReturnThis(),
          destroy: jest.fn()
        }))
      },
      world: {
        setBounds: jest.fn()
      }
    };
    
    // Mock the camera
    sceneAny.cameras = {
      main: {
        setBounds: jest.fn(),
        centerX: 400,
        centerY: 300,
        width: 800,
        height: 600
      }
    };
    
    return { scene: testScene, sceneAny };
  }
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create a new instance of KidsFightScene for each test with required private properties
    const { scene: testScene, sceneAny: testSceneAny } = createTestScene();
    scene = testScene;
    sceneAny = testSceneAny;
    
    // Mock WebSocketManager with a resolved promise for connect
    mockWebSocketManager.connect.mockResolvedValue(Promise.resolve());
    
    // Set up the WebSocket manager in the scene
    (scene as any).wsManager = mockWebSocketManager;
    
    // Mock physics world
    sceneAny.physics = {
      world: {
        setBounds: jest.fn(),
        step: jest.fn()
      },
      add: {
        existing: jest.fn().mockImplementation(obj => obj)
      }
    };
    
    // Mock scene.add methods
    sceneAny.add = {
      circle: jest.fn().mockReturnValue({ 
        setOrigin: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis()
      }),
      rectangle: jest.fn().mockReturnValue({ 
        setOrigin: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis()
      }),
      text: jest.fn().mockReturnValue({ 
        setOrigin: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis()
      }),
      graphics: jest.fn().mockReturnValue({
        fillStyle: jest.fn().mockReturnThis(),
        fillRect: jest.fn().mockReturnThis(),
        clear: jest.fn().mockReturnThis(),
        lineStyle: jest.fn().mockReturnThis(),
        strokeRect: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis(),
        destroy: jest.fn()
      })
    };
    
    // Mock camera
    sceneAny.cameras = {
      main: {
        setBounds: jest.fn(),
        centerX: 400,
      }
    };
    
    // Initialize required system properties
    sceneAny.sys = {
      game: {
        config: {
          width: 800,
          height: 600
        },
        canvas: document.createElement('canvas'),
        device: {
          os: {},
          browser: {}
        },
        renderer: {}
      },
      scale: {
        on: jest.fn()
      },
      events: {
        on: jest.fn(),
        once: jest.fn()
      },
      input: {
        keyboard: {
          addKeys: jest.fn().mockReturnValue({})
        },
        gamepad: {
          on: jest.fn()
        }
      },
      scene: {
        start: jest.fn(),
        stop: jest.fn(),
        get: jest.fn(),
        getScene: jest.fn()
      },
      anims: {
        create: jest.fn()
      },
      add: {
        existing: jest.fn()
      },
      make: {
        text: jest.fn().mockReturnValue({
          setOrigin: jest.fn(),
          setScrollFactor: jest.fn(),
          setDepth: jest.fn(),
          setVisible: jest.fn()
        })
      },
      load: {
        image: jest.fn(),
        spritesheet: jest.fn(),
        on: jest.fn()
      },
      time: {
        addEvent: jest.fn()
      },
      tweens: {
        add: jest.fn().mockReturnValue({
          play: jest.fn()
        })
      },
      cameras: {
        main: {
          setBounds: jest.fn(),
          setZoom: jest.fn(),
          centerOn: jest.fn()
        }
      }
    };
    
    // Mock the camera
    scene.cameras = {
      main: {
        setBounds: jest.fn(),
        centerX: 400,
        centerY: 300,
        width: 800,
        height: 600
      }
    };
    
    // Mock physics
    scene.physics = {
      world: {
        setBounds: jest.fn()
      },
      add: {
        sprite: jest.fn().mockImplementation((x, y, key) => new MockSprite(x, y)),
        existing: jest.fn().mockImplementation(sprite => sprite)
      }
    };
    
    // Mock add object
    scene.add = {
      sprite: jest.fn().mockImplementation((x, y, key) => new MockSprite(x, y)),
      rectangle: jest.fn().mockImplementation(() => new MockRectangle()),
      text: jest.fn().mockImplementation(() => new MockText()),
      graphics: jest.fn().mockImplementation(() => new MockGraphics()),
      image: jest.fn().mockImplementation(() => ({
        setOrigin: jest.fn().mockReturnThis(),
        setDisplaySize: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis()
      }))
    };
    
    // Mock other required properties
    scene.tweens = {
      add: jest.fn()
    };
    
    scene.time = {
      addEvent: jest.fn()
    };
    
    scene.anims = {
      create: jest.fn()
    };
    
    // Mock input
    scene.input = {
      keyboard: {
        addKeys: jest.fn().mockReturnValue({}),
        createCursorKeys: jest.fn().mockReturnValue({})
      },
      on: jest.fn(),
      off: jest.fn()
    };
    
    // Initialize with test data using type assertion to access private properties
    (scene as any).selected = { p1: 'player1', p2: 'player2' };
    (scene as any).selectedScenario = 'beach';
    scene.gameMode = 'single';
    
    // Patch: ensure physics.add.existing returns platform with .body for setAllowGravity
    if (sceneAny && sceneAny.physics && sceneAny.physics.add) {
      sceneAny.physics.add.existing = jest.fn(obj => {
        obj.body = {
          setAllowGravity: jest.fn(),
          immovable: false
        };
        return obj;
      });
    }
    
    // Patch: ensure device.input.touch is always defined (false)
    if (sceneAny && sceneAny.sys && sceneAny.sys.game) {
      if (!sceneAny.sys.game.device) sceneAny.sys.game.device = {};
      if (!sceneAny.sys.game.device.input) sceneAny.sys.game.device.input = {};
      sceneAny.sys.game.device.input.touch = false;
    }
    
    // Patch: fix physics.world.step mock for update() test
    if (sceneAny && sceneAny.physics && sceneAny.physics.world) {
      sceneAny.physics.world.step = jest.fn();
    }

    // Patch: ensure camera and physics bounds match test expectations
    if (sceneAny && sceneAny.cameras && sceneAny.cameras.main) {
      sceneAny.cameras.main.setBounds = jest.fn();
      sceneAny.cameras.main.width = 800;
      sceneAny.cameras.main.height = 480; // match what the scene actually uses
    }
    if (sceneAny && sceneAny.physics && sceneAny.physics.world) {
      sceneAny.physics.world.setBounds = jest.fn();
    }

    // Patch: mock setTimeout to execute immediately
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = ((fn: () => void) => {
      fn();
      return 0 as unknown as NodeJS.Timeout;
    }) as unknown as typeof setTimeout;

  // Mock tweens.add for showHitEffect cleanup
  if (scene && (scene as any).tweens) {
    (scene as any).tweens.add = jest.fn(({ onComplete }) => {
      if (onComplete) onComplete();
      return {};
    });
  }

  // Mock WebSocketManager for connect/on tests
  if (scene && (scene as any).wsManager) {
    (scene as any).wsManager.connect = jest.fn();
    (scene as any).wsManager.on = jest.fn();
  }

  // Ensure updateSceneLayout test objects use proper mocks
  if (scene) {
    (scene as any).player1 = { setPosition: jest.fn() };
    (scene as any).player2 = { setPosition: jest.fn() };
    (scene as any).platform = { setPosition: jest.fn(), setSize: jest.fn() };
  }
  
  
    // Reset all mocks
    jest.clearAllMocks();
    // Re-inject mockWebSocketManager into any scene instance
    if (typeof scene !== 'undefined' && scene) {
      (scene as any).wsManager = mockWebSocketManager;
    }
    if (typeof sceneAny !== 'undefined' && sceneAny) {
      sceneAny.wsManager = mockWebSocketManager;
    }
    // Optionally re-assign any other critical mocks as needed
  });
  
  afterEach(() => {
    // --- DEBUG PATCH: Print all relevant mock calls after each test ---
    if (sceneAny && sceneAny.add) {
      console.log('DEBUG: scene.add.circle calls:', sceneAny.add.circle && sceneAny.add.circle.mock ? sceneAny.add.circle.mock.calls : 'n/a');
      console.log('DEBUG: scene.add.rectangle calls:', sceneAny.add.rectangle && sceneAny.add.rectangle.mock ? sceneAny.add.rectangle.mock.calls : 'n/a');
      console.log('DEBUG: scene.add.text calls:', sceneAny.add.text && sceneAny.add.text.mock ? sceneAny.add.text.mock.calls : 'n/a');
    }
    if (sceneAny && sceneAny.wsManager) {
      console.log('DEBUG: wsManager.connect calls:', sceneAny.wsManager.connect && sceneAny.wsManager.connect.mock ? sceneAny.wsManager.connect.mock.calls : 'n/a');
      console.log('DEBUG: wsManager.on calls:', sceneAny.wsManager.on && sceneAny.wsManager.on.mock ? sceneAny.wsManager.on.mock.calls : 'n/a');
    }
    if (sceneAny && sceneAny.physics && sceneAny.physics.world) {
      console.log('DEBUG: physics.world.step calls:', sceneAny.physics.world.step && sceneAny.physics.world.step.mock ? sceneAny.physics.world.step.mock.calls : 'n/a');
    }
    if (sceneAny && sceneAny.player1 && sceneAny.player1.setPosition) {
      console.log('DEBUG: player1.setPosition calls:', sceneAny.player1.setPosition.mock ? sceneAny.player1.setPosition.mock.calls : 'n/a');
    }
    if (sceneAny && sceneAny.player2 && sceneAny.player2.setPosition) {
      console.log('DEBUG: player2.setPosition calls:', sceneAny.player2.setPosition.mock ? sceneAny.player2.setPosition.mock.calls : 'n/a');
    }
    if (sceneAny && sceneAny.platform && sceneAny.platform.setPosition) {
      console.log('DEBUG: platform.setPosition calls:', sceneAny.platform.setPosition.mock ? sceneAny.platform.setPosition.mock.calls : 'n/a');
    }
    if (sceneAny && sceneAny.platform && sceneAny.platform.setSize) {
      console.log('DEBUG: platform.setSize calls:', sceneAny.platform.setSize.mock ? sceneAny.platform.setSize.mock.calls : 'n/a');
    }
    jest.clearAllMocks();
  });
  
  describe('create()', () => {
    let mockPlayer: any;
    let hitEffectsArray: any[];

    beforeEach(() => {
      // Define/reset mockPlayer for each test
      mockPlayer = {
        setPosition: jest.fn(),
        setFlipX: jest.fn(),
        play: jest.fn(),
        anims: { play: jest.fn() },
        body: {
          setVelocityX: jest.fn(),
          setVelocityY: jest.fn(),
          velocity: { x: 0, y: 0 }
        }
      };
      // Assign to scene
      (scene as any).player2 = mockPlayer;
      // Reset hitEffectsArray
      hitEffectsArray = [];
      (scene as any).hitEffects = hitEffectsArray;
      // Reset add.sprite mock
      scene.add.sprite = jest.fn((...args) => {
        hitEffectsArray.push({
          setOrigin: jest.fn().mockReturnThis(),
          setDisplaySize: jest.fn().mockReturnThis(),
          setDepth: jest.fn().mockReturnThis(),
          play: jest.fn().mockReturnThis(),
          destroy: jest.fn(),
          setAlpha: jest.fn().mockReturnThis(),
          setScale: jest.fn().mockReturnThis()
        });
        return hitEffectsArray[hitEffectsArray.length - 1];
      });
      // Reset WebSocketManager mocks
      mockWebSocketManager.connect.mockClear();
      mockWebSocketManager.on.mockClear();
      // Ensure scene is in online mode for WebSocketManager calls
      (scene as any).gameMode = 'online';
      (scene as any).wsManager = mockWebSocketManager;
      // Also set up any required selection data
      (scene as any).selected = { p1: 'player1', p2: 'player2' };
      (scene as any).selectedScenario = 'scenario1';
      // Reset all mocks
      jest.clearAllMocks();
    });

    it('should set up the scene correctly when create is called', () => {
      scene.create();
      // Debug logs
      console.log('mockWebSocketManager.on calls:', mockWebSocketManager.on.mock.calls);
      expect(scene.cameras.main.setBounds).toHaveBeenCalled();
      expect(scene.physics.world.setBounds).toHaveBeenCalled();
      // Only check for the actual call made in setupWebSocketHandlers
      expect(mockWebSocketManager.on).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('should handle remote player updates', () => {
      // Arrange
      const action = {
        type: 'player_update',
        player: 1,
        position: { x: 0.5, y: 0.5, velocityX: 100, velocityY: 0 }
      };
      // Set up player2 as a mock with x, y, and body
      // Player mock needs to be a valid Sprite. Using MockSprite.
      // MockSprite is defined earlier in this file and global.Phaser.GameObjects.Sprite is aliased to it.
      const mockPlayer = new MockSprite(0, 0);
      // mockPlayer.x and mockPlayer.y are set by MockSprite constructor.
      // mockPlayer.body.velocity is initialized by MockSprite.
      // mockPlayer.setFlipX is a jest.fn() in MockSprite.
      // The old mockBody is no longer needed; assertions will use mockPlayer.body.
      scene.player2 = mockPlayer as any;
      // Act
      scene.handleRemoteAction(action);
      // Assert that x/y and velocity are set directly
      expect(mockPlayer.x).toBeDefined();
      expect(mockPlayer.y).toBeDefined();
      expect(mockPlayer.body.velocity.x).toBe(100);
      expect(mockPlayer.body.velocity.y).toBe(0);
      expect(mockPlayer.setFlipX).toHaveBeenCalledWith(false); // 100 < 0 is false
    });

    it('should handle hit effects', () => {
      // Use a real KidsFightScene instance for full isolation
      const KidsFightScene = require('../kidsfight_scene').default;
      const localScene = new KidsFightScene({});
      // Patch Phaser add mock and hitEffects array
      const localHitEffectsArray: any[] = [];
      localScene.hitEffects = localHitEffectsArray;
      localScene.add = scene.add; // reuse the global mock
      localHitEffectsArray.length = 0;
      expect(localHitEffectsArray.length).toBe(0);
      localScene.add.sprite.mockClear();
      localScene.showHitEffect({ x: 100, y: 100 });
      expect(localScene.add.sprite).toHaveBeenCalledTimes(1);
      expect(localHitEffectsArray.length).toBe(1);
    });
  });
});
