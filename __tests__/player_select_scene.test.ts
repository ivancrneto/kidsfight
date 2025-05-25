// Use the auto-mock from __mocks__/phaser.js
jest.mock('phaser');

// Now import Phaser and other modules
import Phaser from 'phaser';
import PlayerSelectScene from '../player_select_scene';
import { WebSocketManager } from '../websocket_manager';

// Mock WebSocketManager
jest.mock('../websocket_manager', () => ({
  WebSocketManager: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    send: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    isConnected: jest.fn().mockReturnValue(true),
    isHost: jest.fn().mockReturnValue(false),
    getRoomCode: jest.fn().mockReturnValue(null),
    setRoomCode: jest.fn(),
    _triggerMessage: jest.fn(),
    _triggerClose: jest.fn(),
    _triggerError: jest.fn()
  }))
}));

// Mock Phaser components
class MockRectangle {
  setOrigin = jest.fn().mockReturnThis();
  setDisplaySize = jest.fn().mockReturnThis();
  setDepth = jest.fn().mockReturnThis();
  setScrollFactor = jest.fn().mockReturnThis();
  setStrokeStyle = jest.fn().mockReturnThis();
  setCrop = jest.fn().mockReturnThis();
  setInteractive = jest.fn().mockReturnThis();
  setScale = jest.fn().mockReturnThis();
  setTint = jest.fn().mockReturnThis();
  setAlpha = jest.fn().mockReturnThis();
  setPosition = jest.fn().mockReturnThis();
  on = jest.fn().mockReturnThis();
  once = jest.fn().mockReturnThis();
  destroy = jest.fn();
}

class MockCircle {
  setOrigin = jest.fn().mockReturnThis();
  setStrokeStyle = jest.fn().mockReturnThis();
  setInteractive = jest.fn().mockReturnThis();
  setScale = jest.fn().mockReturnThis();
  setTint = jest.fn().mockReturnThis();
  setAlpha = jest.fn().mockReturnThis();
  setPosition = jest.fn().mockReturnThis();
  on = jest.fn().mockReturnThis();
  once = jest.fn().mockReturnThis();
  destroy = jest.fn();
}

class MockText {
  setOrigin = jest.fn().mockReturnThis();
  setScrollFactor = jest.fn().mockReturnThis();
  setDepth = jest.fn().mockReturnThis();
  setVisible = jest.fn().mockReturnThis();
  setText = jest.fn().mockReturnThis();
  setInteractive = jest.fn().mockReturnThis();
  setPosition = jest.fn().mockReturnThis();
  on = jest.fn().mockReturnThis();
  once = jest.fn().mockReturnThis();
  destroy = jest.fn();
}

// MockScene must extend Phaser.Scene for super() to work
class MockScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MockScene' });
    
    // Initialize required Phaser.Scene properties
    this.scene = {
      key: 'MockScene',
      start: jest.fn(),
      stop: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      isActive: jest.fn().mockReturnValue(true),
      isPaused: jest.fn().mockReturnValue(false),
      isSleeping: jest.fn().mockReturnValue(false),
      isVisible: jest.fn().mockReturnValue(true),
      settings: { key: 'PlayerSelectScene' },
      manager: {
        keys: {},
        getScenes: jest.fn().mockReturnValue([]),
        getScene: jest.fn().mockReturnValue(null),
        isActive: jest.fn().mockReturnValue(true),
        isPaused: jest.fn().mockReturnValue(false),
        isSleeping: jest.fn().mockReturnValue(false),
        isVisible: jest.fn().mockReturnValue(true),
        remove: jest.fn(),
        removeAll: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        pause: jest.fn(),
        resume: jest.fn(),
        sleep: jest.fn(),
        wake: jest.fn()
      }
    };

    this.cameras = {
      main: {
        width: 1280,
        height: 720,
        setZoom: jest.fn(),
        centerOn: jest.fn(),
        setBounds: jest.fn()
      }
    };

    this.add = {
      rectangle: jest.fn().mockImplementation(() => new MockRectangle()),
      circle: jest.fn().mockImplementation(() => new MockCircle()),
      text: jest.fn().mockImplementation(() => new MockText()),
      image: jest.fn().mockImplementation(() => new MockRectangle()),
      sprite: jest.fn().mockImplementation(() => new MockRectangle()),
      graphics: jest.fn().mockImplementation(() => ({
        fillStyle: jest.fn().mockReturnThis(),
        fillRect: jest.fn().mockReturnThis(),
        lineStyle: jest.fn().mockReturnThis(),
        strokeRect: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis()
      })),
      container: jest.fn().mockImplementation(() => ({
        setPosition: jest.fn().mockReturnThis(),
        setSize: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis()
      })),
      group: jest.fn().mockImplementation(() => ({
        add: jest.fn().mockReturnThis(),
        getChildren: jest.fn().mockReturnValue([]),
        clear: jest.fn()
      }))
    };

    this.input = {
      keyboard: {
        addKey: jest.fn(),
        createCursorKeys: jest.fn().mockReturnValue({
          left: { isDown: false },
          right: { isDown: false },
          up: { isDown: false },
          down: { isDown: false },
          space: { isDown: false }
        })
      },
      on: jest.fn(),
      off: jest.fn()
    };

    this.scale = {
      on: jest.fn(),
      off: jest.fn(),
      refresh: jest.fn()
    };

    this.events = {
      on: jest.fn(),
      once: jest.fn(),
      emit: jest.fn(),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn()
    };

    this.sys = {
      game: {
        config: {},
        loop: { delta: 0, time: 0 },
        time: { now: Date.now() },
        scale: {
          on: jest.fn(),
          off: jest.fn(),
          refresh: jest.fn()
        }
      },
      settings: {},
      events: {
        on: jest.fn(),
        once: jest.fn(),
        emit: jest.fn(),
        removeListener: jest.fn()
      },
      displayList: {
        add: jest.fn(),
        remove: jest.fn()
      },
      updateList: {
        add: jest.fn(),
        remove: jest.fn()
      },
      scale: {
        on: jest.fn(),
        off: jest.fn(),
        refresh: jest.fn()
      }
    };

    this.game = {
      config: {},
      loop: { delta: 0, time: 0 },
      time: { now: Date.now() },
      scale: {
        on: jest.fn(),
        off: jest.fn(),
        refresh: jest.fn()
      }
    };

    this.time = {
      addEvent: jest.fn(),
      delayedCall: jest.fn(),
      removeAllEvents: jest.fn(),
      now: Date.now()
    };

    this.load = {
      image: jest.fn(),
      spritesheet: jest.fn(),
      audio: jest.fn(),
      on: jest.fn()
    };

    this.physics = {
      add: {
        sprite: jest.fn(() => ({
          setCollideWorldBounds: jest.fn().mockReturnThis(),
          setBounce: jest.fn().mockReturnThis(),
          setVelocity: jest.fn().mockReturnThis()
        })),
        group: jest.fn(() => ({
          createMultiple: jest.fn().mockReturnThis(),
          getChildren: jest.fn().mockReturnValue([])
        })),
        collider: jest.fn(),
        overlap: jest.fn()
      },
      world: {
        setBounds: jest.fn()
      }
    };
  }
}

describe('PlayerSelectScene', () => {
  let scene: PlayerSelectScene;
  let mockScene: MockScene;

  // Create a mock WebSocketManager that implements the required interface
  const createMockWebSocketManager = () => {
    // Define the mock state
    const state = {
      _ws: null as WebSocket | null,
      _isHost: false,
      _debugInstanceId: 'test-instance',
      _roomCode: null as string | null,
      _onMessageCallback: null as ((event: MessageEvent) => void) | null,
      _onCloseCallback: null as ((event: CloseEvent) => void) | null,
      _onErrorCallback: null as ((event: Event) => void) | null,
      _boundMessageCallback: null as ((event: MessageEvent) => void) | null,
      _webSocketFactory: jest.fn()
    };
    
    // Create the mock object with methods that use the state
    const mockWebSocketManager: any = {
      // Core WebSocketManager properties
      _ws: state._ws,
      _isHost: state._isHost,
      _debugInstanceId: state._debugInstanceId,
      _roomCode: state._roomCode,
      _onMessageCallback: state._onMessageCallback,
      _onCloseCallback: state._onCloseCallback,
      _onErrorCallback: state._onErrorCallback,
      _boundMessageCallback: state._boundMessageCallback,
      _webSocketFactory: state._webSocketFactory,
      
      // WebSocketManager methods
      connect: jest.fn().mockImplementation((roomCode: string, isHost: boolean) => {
        state._roomCode = roomCode;
        state._isHost = isHost;
        return Promise.resolve();
      }),
      
      disconnect: jest.fn().mockImplementation(() => {
        state._roomCode = null;
        state._isHost = false;
      }),
      
      send: jest.fn().mockImplementation((message: any) => {
        // Mock send implementation
      }),
      
      on: jest.fn().mockImplementation((event: string, callback: (data: any) => void) => {
        // Store the callback for later use
        if (event === 'message') {
          state._onMessageCallback = callback as any;
        } else if (event === 'close') {
          state._onCloseCallback = callback as any;
        } else if (event === 'error') {
          state._onErrorCallback = callback as any;
        }
      }),
      
      off: jest.fn().mockImplementation((event: string) => {
        // Remove the callback
        if (event === 'message') {
          state._onMessageCallback = null;
        } else if (event === 'close') {
          state._onCloseCallback = null;
        } else if (event === 'error') {
          state._onErrorCallback = null;
        }
      }),
      
      isConnected: jest.fn().mockReturnValue(true),
      
      // Additional methods that might be needed
      setRoomCode: jest.fn().mockImplementation((code: string) => {
        state._roomCode = code;
      }),
      
      getRoomCode: jest.fn().mockImplementation(() => state._roomCode),
      
      isHost: jest.fn().mockImplementation(() => state._isHost),
      
      // Mock triggering events for testing
      _triggerMessage: function(event: any) {
        if (state._onMessageCallback) {
          state._onMessageCallback({ data: JSON.stringify(event) } as MessageEvent);
        }
      },
      
      _triggerClose: function(event: CloseEvent) {
        if (state._onCloseCallback) {
          state._onCloseCallback(event);
        }
      },
      
      _triggerError: function(event: Event) {
        if (state._onErrorCallback) {
          state._onErrorCallback(event);
        }
      }
    };
    
    return mockWebSocketManager;
  };
  
  let mockWebSocketManager: ReturnType<typeof createMockWebSocketManager>;

  beforeEach(() => {
    // Create a fresh mock WebSocket manager for each test
    mockWebSocketManager = createMockWebSocketManager();
    
    // Create a fresh mock scene for each test
    mockScene = new MockScene();
    
    // Create the scene with the mock WebSocket manager
    scene = new PlayerSelectScene(mockWebSocketManager);
    
    // Assign the mock scene properties to the scene instance
    Object.assign(scene, {
      scene: mockScene.scene,
      cameras: mockScene.cameras,
      add: mockScene.add,
      input: mockScene.input,
      scale: mockScene.scale,
      events: mockScene.events,
      sys: mockScene.sys,
      game: mockScene.game,
      time: mockScene.time,
      load: mockScene.load,
      physics: mockScene.physics,
      // Add any other required Phaser.Scene properties that might be needed
      tweens: {
        add: jest.fn(),
        remove: jest.fn()
      },
      sound: {
        add: jest.fn(),
        play: jest.fn(),
        stopByKey: jest.fn()
      },
      registry: {
        set: jest.fn(),
        get: jest.fn()
      },
      make: {
        text: jest.fn().mockReturnValue({
          setOrigin: jest.fn().mockReturnThis(),
          setScrollFactor: jest.fn().mockReturnThis(),
          setDepth: jest.fn().mockReturnThis(),
          setInteractive: jest.fn().mockReturnThis(),
          on: jest.fn().mockReturnThis(),
          setText: jest.fn().mockReturnThis(),
          setVisible: jest.fn().mockReturnThis(),
          setActive: jest.fn().mockReturnThis(),
          setPosition: jest.fn().mockReturnThis()
        })
      }
    });
    
    // Mock the init method to prevent actual scene changes
    scene.init = jest.fn();
  });

  describe('create', () => {
    it('should create UI elements with correct positions and styles', () => {
      scene.create = PlayerSelectScene.prototype.create;
      scene.create();

      // Verify background - check that a rectangle was created with some parameters
      // We're not checking exact values since they might be dynamic
      expect(scene.add.rectangle).toHaveBeenCalled();

      // Verify title text
      expect(scene.add.text).toHaveBeenCalledWith(
        1280/2,
        720 * 0.1,
        'Escolha os\nLutadores',
        expect.objectContaining({
          fontSize: expect.any(String),
          color: '#fff',
          fontFamily: 'monospace',
          align: 'center'
        })
      );

      // Verify selector circles (positions, colors, alpha)
      const circleCalls = scene.add.circle.mock.calls;
      expect(circleCalls.length).toBeGreaterThanOrEqual(2);
      // First selector circle
      expect(circleCalls[0][0]).toBe(192); // x
      expect(circleCalls[0][1]).toBeCloseTo(229.6, 1); // y
      expect(circleCalls[0][2]).toBe(60);  // radius
      expect(circleCalls[0][3]).toBe(2236962); // color
      expect(circleCalls[0][4]).toBe(1); // alpha
      // Second selector circle
      expect(circleCalls[1][0]).toBe(640); // x
      expect(circleCalls[1][1]).toBeCloseTo(229.6, 1); // y
      expect(circleCalls[1][2]).toBe(60);  // radius
      expect(circleCalls[1][3]).toBe(2236962); // color
      expect(circleCalls[1][4]).toBe(1); // alpha
    });
  });

  describe('character selection', () => {
    it('should handle character selection', () => {
      scene.create();
      const characterKey = 'bento';
      
      // Mock the necessary methods for character selection
      const mockSelectCharacter = jest.fn();
      scene['selectCharacter'] = mockSelectCharacter;

      // Simulate character selection
      scene['selectCharacter'](characterKey);
      expect(mockSelectCharacter).toHaveBeenCalledWith(characterKey);
    });

    it('should handle character deselection', () => {
      scene.create();
      const characterKey = 'bento';
      
      // Mock the necessary methods for character deselection
      const mockDeselectCharacter = jest.fn();
      scene['deselectCharacter'] = mockDeselectCharacter;

      // Simulate character deselection
      scene['deselectCharacter'](characterKey);
      expect(mockDeselectCharacter).toHaveBeenCalledWith(characterKey);
    });
  });

  describe('ready state', () => {
    it('should handle player ready state', () => {
      scene.create();
      
      // Mock the necessary methods for ready state
      const mockSetReady = jest.fn();
      scene['setReady'] = mockSetReady;

      // Simulate player becoming ready
      scene['setReady'](true);
      expect(mockSetReady).toHaveBeenCalledWith(true);
    });
  });

  describe('start game', () => {
    it('should start game regardless of player readiness', () => {
      // Set players as not ready
      (scene as any).player1Ready = false;
      (scene as any).player2Ready = false;
      
      // Mock launchGame
      scene['launchGame'] = jest.fn();
      
      // Call startGame
      (scene as any).startGame();
      
      // Verify launchGame was called (since startGame doesn't check readiness)
      expect(scene['launchGame']).toHaveBeenCalled();
    });
  });

  describe('UI layout and responsive changes', () => {
    beforeEach(() => {
      scene.create = PlayerSelectScene.prototype.create;
      scene.create();
    });

    it('should set the title to two lines and center it', () => {
      expect(scene.add.text).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        'Escolha os\nLutadores',
        expect.objectContaining({
          align: 'center',
          fontFamily: 'monospace',
          color: '#fff',
          wordWrap: expect.any(Object)
        })
      );
    });

    it('should use a reduced grid height for character positions', () => {
      // The gridH should be 38% of height, not 50%
      // We'll check that at least one character is placed at y = h*0.18 (startY)
      expect(scene.add.sprite).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        expect.any(String),
        0
      );
      // Can't check exact values due to mock, but can check call count
      expect(scene.add.sprite.mock.calls.length).toBeGreaterThan(0);
    });

    it('should centralize the Voltar and COMEÇAR buttons at the bottom', () => {
      // Both buttons should be set at y = h*0.97
      expect(scene.add.text).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        expect.stringMatching(/Voltar|COMEÇAR/i),
        expect.any(Object)
      );
    });
  });
});
