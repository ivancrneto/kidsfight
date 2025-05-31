/**
 * Improved test utilities for the KidsFight game
 */

// Mock the entire Phaser namespace
const createMockPhaser = () => {
  // Create base mock objects
  const mockGraphics = {
    clear: jest.fn().mockReturnThis(),
    fillStyle: jest.fn().mockReturnThis(),
    fillRect: jest.fn().mockReturnThis(),
    lineStyle: jest.fn().mockReturnThis(),
    strokeRect: jest.fn().mockReturnThis(),
    setVisible: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    setScrollFactor: jest.fn().mockReturnThis(),
  };

  const mockText = {
    setOrigin: jest.fn().mockReturnThis(),
    setVisible: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    setScrollFactor: jest.fn().mockReturnThis(),
    setText: jest.fn().mockReturnThis(),
    setInteractive: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
  };

  const mockSprite = {
    setOrigin: jest.fn().mockReturnThis(),
    setVisible: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    setScrollFactor: jest.fn().mockReturnThis(),
    setScale: jest.fn().mockReturnThis(),
    setTint: jest.fn().mockReturnThis(),
    setAlpha: jest.fn().mockReturnThis(),
    setPosition: jest.fn().mockReturnThis(),
    setFrame: jest.fn().mockReturnThis(),
    play: jest.fn().mockReturnThis(),
    setData: jest.fn(),
    getData: jest.fn(),
    setVelocity: jest.fn(),
    setVelocityX: jest.fn(),
    setVelocityY: jest.fn(),
    setInteractive: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    update: jest.fn(),
  };

  const mockContainer = {
    add: jest.fn().mockReturnThis(),
    setVisible: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    setScrollFactor: jest.fn().mockReturnThis(),
    setPosition: jest.fn().mockReturnThis(),
    setInteractive: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
  };

  // Create the add factory
  const mockAdd = {
    graphics: jest.fn().mockImplementation(() => ({...mockGraphics})),
    text: jest.fn().mockImplementation(() => ({...mockText})),
    sprite: jest.fn().mockImplementation(() => ({...mockSprite})),
    container: jest.fn().mockImplementation(() => ({...mockContainer})),
    image: jest.fn().mockImplementation(() => ({...mockSprite})),
  };

  // Create physics
  const mockPhysics = {
    add: {
      sprite: jest.fn().mockImplementation(() => ({...mockSprite})),
      group: jest.fn().mockReturnValue({
        create: jest.fn().mockImplementation(() => ({...mockSprite})),
        setVelocityY: jest.fn(),
      }),
      collider: jest.fn(),
      overlap: jest.fn(),
    },
    world: {
      setBounds: jest.fn(),
      on: jest.fn(),
    },
    pause: jest.fn(),
    resume: jest.fn(),
  };

  // Create input
  const mockInput = {
    keyboard: {
      createCursorKeys: jest.fn().mockReturnValue({
        left: { isDown: false },
        right: { isDown: false },
        up: { isDown: false },
      }),
      addKey: jest.fn().mockReturnValue({ isDown: false }),
    },
    on: jest.fn(),
  };

  // Create sound 
  const mockSound = {
    play: jest.fn(),
    add: {
      audio: jest.fn().mockReturnValue({
        play: jest.fn(),
        stop: jest.fn(),
        setLoop: jest.fn(),
      }),
    },
  };

  // Create camera
  const mockCameras = {
    main: {
      setZoom: jest.fn(),
      setBounds: jest.fn(),
      startFollow: jest.fn(),
      fadeIn: jest.fn(),
      fadeOut: jest.fn(),
      once: jest.fn(),
      on: jest.fn(),
    }
  };

  // Create anims
  const mockAnims = {
    create: jest.fn(),
    generateFrameNumbers: jest.fn().mockReturnValue([]),
    load: jest.fn(),
  };

  return {
    add: mockAdd,
    physics: mockPhysics,
    input: mockInput,
    sound: mockSound,
    cameras: mockCameras,
    anims: mockAnims,
    time: {
      addEvent: jest.fn().mockReturnValue({
        remove: jest.fn(),
      }),
      delayedCall: jest.fn(),
    },
    scene: {
      pause: jest.fn(),
      resume: jest.fn(),
      restart: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    },
    scale: {
      width: 800,
      height: 600,
    },
    events: {
      on: jest.fn(),
      once: jest.fn(),
      emit: jest.fn(),
    },
    sys: {
      game: {
        device: {
          os: {
            desktop: true,
            mobile: false,
          },
        },
        loop: {
          delay: jest.fn(),
        }
      },
    },
  };
};

/**
 * Comprehensive WebSocket Manager Mock
 * This implements both onMessage and setMessageCallback patterns
 */
export class MockWebSocketManager {
  public isConnected: boolean = true;
  public isHost: boolean = true;
  private messageCallback: ((event: any) => void) | null = null;
  private closeCallback: ((event: any) => void) | null = null;
  private errorCallback: ((event: any) => void) | null = null;
  
  // Methods for WebSocketManager
  connect = jest.fn().mockImplementation(() => Promise.resolve());
  disconnect = jest.fn();
  send = jest.fn().mockReturnValue(true);
  
  // Both methods for setting message callback - the actual WebSocketManager has both
  onMessage = jest.fn().mockImplementation((callback) => {
    this.messageCallback = callback;
  });
  
  setMessageCallback = jest.fn().mockImplementation((callback) => {
    this.messageCallback = callback;
  });
  
  // Handle WebSocketManager 'on' event pattern
  on = jest.fn().mockImplementation((eventType, callback) => {
    if (eventType === 'message') {
      this.messageCallback = callback;
    } else if (eventType === 'close') {
      this.closeCallback = callback;
    } else if (eventType === 'error') {
      this.errorCallback = callback;
    }
  });
  
  // Helper to simulate messages being received
  simulateMessage(message: any) {
    if (this.messageCallback) {
      // Create a MessageEvent-like object
      const event = {
        data: typeof message === 'string' ? message : JSON.stringify(message),
        type: 'message',
        target: this
      };
      this.messageCallback(event);
    }
  }
}

// Setup mock for Phaser scene
export function setupMockScene(scene: any) {
  // Set up basic scene properties
  scene.sys = {
    game: {
      canvas: {
        width: 800,
        height: 600
      }
    },
    settings: {
      physics: {
        arcade: {}
      }
    }
  };
  
  // Create a mock add object for creating game objects
  scene.add = {
    graphics: jest.fn().mockReturnValue({
      fillStyle: jest.fn().mockReturnThis(),
      fillRect: jest.fn().mockReturnThis(),
      clear: jest.fn().mockReturnThis(),
      setPosition: jest.fn().mockReturnThis(),
      setSize: jest.fn().mockReturnThis(),
      setVisible: jest.fn().mockReturnThis(),
      destroy: jest.fn(),
      lineStyle: jest.fn().mockReturnThis(),
      lineBetween: jest.fn().mockReturnThis(),
      strokeRect: jest.fn().mockReturnThis(),
    }),
    sprite: jest.fn().mockReturnValue({
      setOrigin: jest.fn().mockReturnThis(),
      setPosition: jest.fn().mockReturnThis(),
      setScale: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis(),
      setFrame: jest.fn().mockReturnThis(),
      setInteractive: jest.fn().mockReturnThis(),
      setVisible: jest.fn().mockReturnThis(),
      destroy: jest.fn(),
      on: jest.fn().mockImplementation((event, callback) => {
        if (callback) callback();
        return this;
      }),
      play: jest.fn(),
      anims: {
        play: jest.fn()
      }
    }),
    text: jest.fn().mockReturnValue({
      setOrigin: jest.fn().mockReturnThis(),
      setPosition: jest.fn().mockReturnThis(),
      setStyle: jest.fn().mockReturnThis(),
      setText: jest.fn().mockReturnThis(),
      setInteractive: jest.fn().mockReturnThis(),
      setFontSize: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis(),
      setVisible: jest.fn().mockReturnThis(),
      destroy: jest.fn(),
      on: jest.fn().mockImplementation((event, callback) => {
        if (callback) callback();
        return this;
      })
    }),
    image: jest.fn().mockReturnValue({
      setOrigin: jest.fn().mockReturnThis(),
      setPosition: jest.fn().mockReturnThis(),
      setScale: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis(),
      setInteractive: jest.fn().mockReturnThis(),
      setVisible: jest.fn().mockReturnThis(),
      on: jest.fn().mockImplementation((event, callback) => {
        if (callback) callback();
        return this;
      }),
      destroy: jest.fn()
    }),
    tween: jest.fn().mockReturnValue({
      to: jest.fn().mockReturnThis(),
      setEase: jest.fn().mockReturnThis(),
      setCallback: jest.fn().mockReturnThis(),
      start: jest.fn()
    })
  };
  
  // Create a mock physics system
  scene.physics = {
    world: {
      setBounds: jest.fn()
    },
    add: {
      sprite: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setFrame: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        setVelocity: jest.fn().mockReturnThis(),
        setVelocityX: jest.fn().mockReturnThis(),
        setVelocityY: jest.fn().mockReturnThis(),
        setCollideWorldBounds: jest.fn().mockReturnThis(),
        setBounce: jest.fn().mockReturnThis(),
        setData: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis(),
        getData: jest.fn().mockReturnValue(false),
        setSize: jest.fn().mockReturnThis(),
        setOffset: jest.fn().mockReturnThis(),
        destroy: jest.fn(),
        body: {
          velocity: { x: 0, y: 0 },
          blocked: { down: true }
        },
        on: jest.fn().mockImplementation((event, callback) => {
          if (callback) callback();
          return this;
        }),
        anims: {
          play: jest.fn()
        }
      }),
      group: jest.fn().mockReturnValue({
        create: jest.fn().mockReturnValue({
          setOrigin: jest.fn().mockReturnThis(),
          setPosition: jest.fn().mockReturnThis(),
          setScale: jest.fn().mockReturnThis(),
          setDepth: jest.fn().mockReturnThis(),
          setVisible: jest.fn().mockReturnThis(),
          destroy: jest.fn()
        }),
        children: {
          iterate: jest.fn()
        }
      }),
      staticGroup: jest.fn().mockReturnValue({
        create: jest.fn().mockReturnValue({
          setOrigin: jest.fn().mockReturnThis(),
          setPosition: jest.fn().mockReturnThis(),
          setScale: jest.fn().mockReturnThis(),
          setDepth: jest.fn().mockReturnThis(),
          refreshBody: jest.fn(),
          setVisible: jest.fn().mockReturnThis(),
          destroy: jest.fn()
        }),
        children: {
          iterate: jest.fn()
        }
      }),
      collider: jest.fn().mockReturnValue({
        destroy: jest.fn()
      }),
      overlap: jest.fn().mockReturnValue({
        destroy: jest.fn()
      })
    }
  };
  
  // Create a mock input system
  scene.input = {
    keyboard: {
      addKey: jest.fn().mockReturnValue({
        isDown: false,
        on: jest.fn()
      }),
      createCursorKeys: jest.fn().mockReturnValue({
        left: { isDown: false },
        right: { isDown: false },
        up: { isDown: false },
        down: { isDown: false },
        space: { isDown: false }
      })
    },
    on: jest.fn(),
    off: jest.fn(),
    enabled: true
  };
  
  // Create a mock tween system
  scene.tweens = {
    add: jest.fn().mockReturnValue({
      on: jest.fn(),
      play: jest.fn()
    })
  };
  
  // Create a mock sound system
  scene.sound = {
    add: jest.fn().mockReturnValue({
      play: jest.fn().mockReturnThis(),
      stop: jest.fn().mockReturnThis(),
      setVolume: jest.fn().mockReturnThis(),
      setLoop: jest.fn().mockReturnThis(),
      on: jest.fn().mockImplementation((event, callback) => {
        if (callback) callback();
        return this;
      })
    })
  };
  
  // Create a mock camera system
  scene.cameras = {
    main: {
      setBackgroundColor: jest.fn(),
      fadeIn: jest.fn(),
      fadeOut: jest.fn().mockImplementation((duration, r, g, b, callback) => {
        if (callback) callback();
      }),
      on: jest.fn().mockImplementation((event, callback) => {
        if (callback) callback();
      })
    }
  };
  
  // Mock additional scene methods
  scene.scene = {
    pause: jest.fn(),
    resume: jest.fn(),
    restart: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    launch: jest.fn(),
    get: jest.fn()
  };
  
  // Mock events
  scene.events = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn()
  };
  
  // Mock time
  scene.time = {
    addEvent: jest.fn().mockReturnValue({
      remove: jest.fn()
    }),
    delayedCall: jest.fn().mockReturnValue({
      remove: jest.fn()
    })
  };
  
  // Return the scene with all mocks set up
  return scene;
}

// Utility function to create a mock WebSocketManager
export function createMockWebSocketManager() {
  return new MockWebSocketManager();
}

// Helper function to create health bars
export function createMockHealthBars(scene: any) {
  scene.healthBar1 = scene.add.graphics();
  scene.healthBar2 = scene.add.graphics();
  
  scene.healthBar1.clear = jest.fn();
  scene.healthBar1.fillStyle = jest.fn().mockReturnThis();
  scene.healthBar1.fillRect = jest.fn().mockReturnThis();
  scene.healthBar1.lineStyle = jest.fn().mockReturnThis();
  scene.healthBar1.strokeRect = jest.fn().mockReturnThis();
  scene.healthBar1.setPosition = jest.fn().mockReturnThis();
  scene.healthBar1.setSize = jest.fn().mockReturnThis();
  scene.healthBar1.setVisible = jest.fn().mockReturnThis();
  
  scene.healthBar2.clear = jest.fn();
  scene.healthBar2.fillStyle = jest.fn().mockReturnThis();
  scene.healthBar2.fillRect = jest.fn().mockReturnThis();
  scene.healthBar2.lineStyle = jest.fn().mockReturnThis();
  scene.healthBar2.strokeRect = jest.fn().mockReturnThis();
  scene.healthBar2.setPosition = jest.fn().mockReturnThis();
  scene.healthBar2.setSize = jest.fn().mockReturnThis();
  scene.healthBar2.setVisible = jest.fn().mockReturnThis();
  
  return scene;
}
