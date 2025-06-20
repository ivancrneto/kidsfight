// TOP OF FILE: Mock WebSocketManager as a named export class with static getInstance before any imports
let mockWsInstance: any = null;
jest.doMock('../websocket_manager', () => {
  class MockWsManager {
    connect = jest.fn();
    on = jest.fn();
    send = jest.fn();
    disconnect = jest.fn();
    close = jest.fn();
    isConnected = jest.fn();
    setMessageCallback = jest.fn();
    setHost = jest.fn();
    setRoomCode = jest.fn();
    sendGameAction = jest.fn();
    sendChatMessage = jest.fn();
    sendGameStart = jest.fn();
    sendPlayerReady = jest.fn();
    sendPlayerSelection = jest.fn();
    sendPlayerPosition = jest.fn();
    sendPlayerAttack = jest.fn();
    sendPlayerDamage = jest.fn();
  }
  (MockWsManager as any).getInstance = jest.fn(() => {
    if (!mockWsInstance) mockWsInstance = new MockWsManager();
    return mockWsInstance;
  });
  return { WebSocketManager: MockWsManager };
});

import * as Phaser from 'phaser';
import KidsFightScene from '../kidsfight_scene';

// Define a simple mock sprite interface for testing
interface MockSprite {
  health: number;
  x: number;
  y: number;
  setVelocityX: jest.Mock;
  setVelocityY: jest.Mock;
  setPosition: jest.Mock;
  setOrigin: jest.Mock;
  setScale: jest.Mock;
  body: {
    velocity: { x: number; y: number };
    setVelocityX: jest.Mock;
    setVelocityY: jest.Mock;
  };
  destroy: jest.Mock;
}

// Mock Phaser and other dependencies
jest.mock('phaser', () => ({
  Scene: class {
    add = {
      sprite: jest.fn(),
      text: jest.fn(),
      graphics: jest.fn(),
      image: jest.fn(),
      container: jest.fn()
    };
    physics = {
      add: {
        sprite: jest.fn(),
        staticGroup: jest.fn(),
        collider: jest.fn(),
        overlap: jest.fn()
      }
    };
    time = {
      addEvent: jest.fn(),
      now: Date.now(),
      removeAllEvents: jest.fn()
    };
    input = {
      keyboard: {
        addKeys: jest.fn()
      }
    };
    sound = {
      add: jest.fn().mockReturnValue({
        play: jest.fn(),
        setVolume: jest.fn()
      })
    };
    tweens = {
      add: jest.fn()
    };
    cameras = {
      main: {
        setBackgroundColor: jest.fn(),
        setBounds: jest.fn(),
        centerOn: jest.fn()
      }
    };
    load = {
      image: jest.fn(),
      audio: jest.fn(),
      spritesheet: jest.fn()
    };
    scene = {
      start: jest.fn(),
      stop: jest.fn()
    };
    events = {
      on: jest.fn(),
      once: jest.fn()
    };
  },
  GameObjects: {
    Sprite: class {},
    Text: class {},
    Graphics: class {}
  }
}));

// Mock WebSocketManager
jest.mock('../websocket_manager', () => ({
  default: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    send: jest.fn(),
    disconnect: jest.fn(),
    close: jest.fn(),
    isConnected: jest.fn().mockReturnValue(true),
    setMessageCallback: jest.fn(),
    getInstance: jest.fn().mockReturnThis(),
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
  })),
  __esModule: true
}));

// Test interface to access private members
interface ITestKidsFightScene extends Omit<KidsFightScene, 'players'> {
  _timeLimit: number;
  _roundStartTime: number;
  _gameOver: boolean;
  _playerHealth: number[];
  _playerSpecial: number[];
  _playerDirection: string[];
  _player1: MockSprite;
  _player2: MockSprite;
  players: [MockSprite, MockSprite];
  time: {
    now: number;
    addEvent: jest.Mock;
    removeAllEvents: jest.Mock;
  };
  testEndGameCalled?: { winnerIndex: number; message: string };
}

// Type assertion helper
function asTestScene(scene: KidsFightScene): ITestKidsFightScene {
  return scene as unknown as ITestKidsFightScene;
}

// Mock endGame on prototype for all tests
const mockEndGame = jest.fn((...args) => {
  console.log('[MOCK endGame CALLED]', ...args);
});
beforeAll(() => {
  KidsFightScene.prototype.endGame = mockEndGame;
});
afterEach(() => {
  mockEndGame.mockClear();
});

describe('Health and Win Conditions', () => {
  let scene: ITestKidsFightScene;
  const originalConsoleWarn = console.warn;

  beforeEach(() => {
    // Mock console.warn
    console.warn = jest.fn();
    
    // Create a new scene instance with minimal config
    const testScene = new KidsFightScene();
    scene = asTestScene(testScene);
    
    // Mock required Phaser methods and properties
    scene.scene = {
      start: jest.fn(),
      stop: jest.fn()
    } as any;
    
    scene.add = {
      sprite: jest.fn().mockReturnValue({
        setOrigin: jest.fn(),
        setScale: jest.fn(),
        setCollideWorldBounds: jest.fn(),
        setBounce: jest.fn(),
        setGravityY: jest.fn(),
        setVelocityX: jest.fn(),
        setVelocityY: jest.fn(),
        setImmovable: jest.fn(),
        body: {
          setAllowGravity: jest.fn(),
          setCollideWorldBounds: jest.fn(),
          velocity: { x: 0, y: 0 }
        }
      }),
      text: jest.fn().mockReturnValue({
        setOrigin: jest.fn(),
        setScrollFactor: jest.fn(),
        setDepth: jest.fn()
      }),
      graphics: jest.fn().mockReturnValue({
        fillStyle: jest.fn().mockReturnThis(),
        fillRect: jest.fn().mockReturnThis(),
        lineStyle: jest.fn().mockReturnThis(),
        strokeRect: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis()
      }),
      image: jest.fn().mockReturnValue({
        setDepth: jest.fn(),
        setScrollFactor: jest.fn()
      }),
      container: jest.fn().mockReturnValue({
        add: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis()
      })
    } as any;
    
    // Reset all mock functions on mockWsInstance before each test
    if (mockWsInstance) {
      Object.values(mockWsInstance).forEach(mockFn => {
        if (typeof mockFn === 'function' && 'mockClear' in mockFn) {
          mockFn.mockClear();
        }
      });
    }
    
    // Initialize required properties
    scene.time = {
      now: Date.now(),
      addEvent: jest.fn(),
      removeAllEvents: jest.fn()
    };
    
    // Mock players as a tuple with exactly 2 elements
    const createMockSprite = (): MockSprite => ({
      health: 100,
      x: 0,
      y: 0,
      setVelocityX: jest.fn().mockReturnThis(),
      setVelocityY: jest.fn().mockReturnThis(),
      setPosition: jest.fn().mockImplementation(function(this: MockSprite, x: number, y: number) {
        this.x = x;
        this.y = y !== undefined ? y : this.y;
        return this;
      }),
      setOrigin: jest.fn().mockReturnThis(),
      setScale: jest.fn().mockReturnThis(),
      body: {
        velocity: { x: 0, y: 0 },
        setVelocityX: jest.fn(),
        setVelocityY: jest.fn()
      },
      destroy: jest.fn()
    });
    
    scene._player1 = createMockSprite();
    scene._player2 = createMockSprite();
    
    // Cast to tuple to match the expected type
    scene.players = [scene._player1, scene._player2];
    
    // Initialize game state
    scene._timeLimit = 60;
    scene._roundStartTime = Date.now();
    scene._gameOver = false;
    scene._playerHealth = [100, 100];
    scene._playerSpecial = [0, 0];
    scene._playerDirection = ['right', 'left'];
  });

  afterEach(() => {
    jest.clearAllMocks();
    console.warn = originalConsoleWarn;
  });

  describe('checkWinner', () => {
    beforeEach(() => {
      // Reset health and time
      scene.playerHealth = [100, 100];
      scene.timeLeft = 60;
      // Mock endGame
      scene.endGame = mockEndGame;
      // Mock player methods
      scene.players = [
        {
          setFrame: jest.fn(),
          setAngle: jest.fn(),
          setVelocityX: jest.fn(),
          setVelocityY: jest.fn(),
          body: {
            setVelocityX: jest.fn(),
            setVelocityY: jest.fn(),
            velocity: { x: 0, y: 0 }
          }
        },
        {
          setFrame: jest.fn(),
          setAngle: jest.fn(),
          setVelocityX: jest.fn(),
          setVelocityY: jest.fn(),
          body: {
            setVelocityX: jest.fn(),
            setVelocityY: jest.fn(),
            velocity: { x: 0, y: 0 }
          }
        }
      ];
    });

    it('should call endGame when player1 health reaches 0', () => {
      // Setup
      scene._playerHealth = [0, 100];
      scene.playerHealth = [0, 100];
      
      // Execute
      (scene as any).checkWinner();
      
      // Verify
      expect(mockEndGame).toHaveBeenCalledWith(1, 'Davi R Venceu!');
    });

    it('should call endGame when player2 health reaches 0', () => {
      // Setup
      scene._playerHealth = [100, 0];
      scene.playerHealth = [100, 0];
      
      // Execute
      (scene as any).checkWinner();
      
      // Verify
      expect(mockEndGame).toHaveBeenCalledWith(0, 'Bento Venceu!');
    });

    it('should declare player1 as winner when time runs out and player1 has more health', () => {
      // Setup
      scene._playerHealth = [70, 30];
      scene.playerHealth = [70, 30];
      scene.endGame = mockEndGame;
      scene._roundStartTime = 0;
      scene._timeLimit = 60;
      scene.time = { now: () => 61000, addEvent: jest.fn(), removeAllEvents: jest.fn() };
      scene._gameOver = false;
      scene.gameOver = false;
      Object.defineProperty(scene, 'roundStartTime', { get: () => 0 });
      Object.defineProperty(scene, 'timeLimit', { get: () => 60 });
      scene.timeLeft = 0;
      // Debug before
      const now = typeof scene.time?.now === 'function' ? scene.time.now() : (scene.time?.now ?? Date.now());
      const roundStartTime = typeof scene.roundStartTime === 'function' ? scene.roundStartTime() : scene.roundStartTime;
      const timeElapsed = Math.floor((now - roundStartTime) / 1000);
      const timeLimit = typeof scene.timeLimit === 'function' ? scene.timeLimit() : scene.timeLimit;
      const timeLeft = Math.max(0, timeLimit - timeElapsed);
      console.log('[TEST DEBUG BEFORE]', { now, roundStartTime, timeElapsed, timeLimit, timeLeft, playerHealth: scene.playerHealth });
      (scene as any).checkWinner();
      // Debug after
      console.log('[TEST DEBUG AFTER]', { gameOver: scene.gameOver });
      console.log('DEBUG:', {
        _roundStartTime: scene._roundStartTime,
        _timeLimit: scene._timeLimit,
        time: scene.time,
        _playerHealth: scene._playerHealth,
        _gameOver: scene._gameOver
      });
      // Verify
      expect(mockEndGame).toHaveBeenCalledWith(0, 'Bento Venceu!');
    });

    it('should declare player2 as winner when time runs out and player2 has more health', () => {
      // Setup
      scene._playerHealth = [30, 70];
      scene.playerHealth = [30, 70];
      scene.endGame = mockEndGame;
      scene._roundStartTime = 0;
      scene._timeLimit = 60;
      scene.time = { now: () => 61000, addEvent: jest.fn(), removeAllEvents: jest.fn() };
      scene._gameOver = false;
      scene.gameOver = false;
      Object.defineProperty(scene, 'roundStartTime', { get: () => 0 });
      Object.defineProperty(scene, 'timeLimit', { get: () => 60 });
      scene.timeLeft = 0;
      // Debug before
      const now = typeof scene.time?.now === 'function' ? scene.time.now() : (scene.time?.now ?? Date.now());
      const roundStartTime = typeof scene.roundStartTime === 'function' ? scene.roundStartTime() : scene.roundStartTime;
      const timeElapsed = Math.floor((now - roundStartTime) / 1000);
      const timeLimit = typeof scene.timeLimit === 'function' ? scene.timeLimit() : scene.timeLimit;
      const timeLeft = Math.max(0, timeLimit - timeElapsed);
      console.log('[TEST DEBUG BEFORE]', { now, roundStartTime, timeElapsed, timeLimit, timeLeft, playerHealth: scene.playerHealth });
      (scene as any).checkWinner();
      // Debug after
      console.log('[TEST DEBUG AFTER]', { gameOver: scene.gameOver });
      console.log('DEBUG:', {
        _roundStartTime: scene._roundStartTime,
        _timeLimit: scene._timeLimit,
        time: scene.time,
        _playerHealth: scene._playerHealth,
        _gameOver: scene._gameOver
      });
      // Verify
      expect(mockEndGame).toHaveBeenCalledWith(1, 'Davi R Venceu!');
    });

    it('should declare a draw when time runs out and health is equal', () => {
      // Setup
      scene._playerHealth = [50, 50];
      scene.playerHealth = [50, 50];
      scene.endGame = mockEndGame;
      scene._roundStartTime = 0;
      scene._timeLimit = 60;
      scene.time = { now: () => 61000, addEvent: jest.fn(), removeAllEvents: jest.fn() };
      scene._gameOver = false;
      scene.gameOver = false;
      Object.defineProperty(scene, 'roundStartTime', { get: () => 0 });
      Object.defineProperty(scene, 'timeLimit', { get: () => 60 });
      scene.timeLeft = 0;
      // Debug before
      const now = typeof scene.time?.now === 'function' ? scene.time.now() : (scene.time?.now ?? Date.now());
      const roundStartTime = typeof scene.roundStartTime === 'function' ? scene.roundStartTime() : scene.roundStartTime;
      const timeElapsed = Math.floor((now - roundStartTime) / 1000);
      const timeLimit = typeof scene.timeLimit === 'function' ? scene.timeLimit() : scene.timeLimit;
      const timeLeft = Math.max(0, timeLimit - timeElapsed);
      console.log('[TEST DEBUG BEFORE]', { now, roundStartTime, timeElapsed, timeLimit, timeLeft, playerHealth: scene.playerHealth });
      (scene as any).checkWinner();
      // Debug after
      console.log('[TEST DEBUG AFTER]', { gameOver: scene.gameOver });
      console.log('DEBUG:', {
        _roundStartTime: scene._roundStartTime,
        _timeLimit: scene._timeLimit,
        time: scene.time,
        _playerHealth: scene._playerHealth,
        _gameOver: scene._gameOver
      });
      // Verify
      expect(mockEndGame).toHaveBeenCalledWith(-1, 'Empate!');
    });
  });

  describe('updateHealthBar', () => {
    it('should not throw when canvas is not available', () => {
      // Setup - simulate canvas not being available
      const originalCreateElement = global.document.createElement;
      global.document.createElement = jest.fn().mockImplementation((tagName) => {
        if (tagName === 'canvas') {
          return {} as HTMLCanvasElement;
        }
        return originalCreateElement.call(document, tagName);
      });
      
      // Execute - should not throw
      expect(() => (scene as any).updateHealthBar(0)).not.toThrow();
      
      // Cleanup
      global.document.createElement = originalCreateElement;
    });
  });
});
