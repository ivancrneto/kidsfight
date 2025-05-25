// Mock WebSocketManager
const mockWebSocketManager = {
  connect: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
  sendGameAction: jest.fn(),
  sendPlayerDamage: jest.fn(),
  isConnected: () => true,
  setMessageCallback: jest.fn(),
  getInstance: jest.fn().mockReturnThis(),
};

jest.mock('../websocket_manager', () => ({
  __esModule: true,
  default: mockWebSocketManager,
  WebSocketManager: Object.assign(
    jest.fn(() => mockWebSocketManager),
    { getInstance: jest.fn(() => mockWebSocketManager) }
  )
}));

import KidsFightScene from '../kidsfight_scene';
import Phaser from 'phaser';

type KidsFightSceneTest = {
  [K in keyof KidsFightScene]: KidsFightScene[K];
} & {
  isHost: boolean;
  gameMode: 'single' | 'online';
  selected: { p1: string; p2: string };
  selectedScenario: string;
  p1: string;
  p2: string;
  player1: any;
  player2: any;
  background: any;
  init: (data: any) => void;
  preload: () => void;
  create: () => void;
};

describe('Character and Scenario Selection', () => {
  let scene: KidsFightSceneTest;
  let mockPlayer1: any;
  let mockPlayer2: any;
  let mockBackground: any;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Create mock players and background
    mockPlayer1 = {
      setCollideWorldBounds: jest.fn(),
      setBounce: jest.fn(),
      setGravityY: jest.fn(),
      setSize: jest.fn(),
      setOffset: jest.fn(),
      setScale: jest.fn(),
      setDepth: jest.fn(),
      body: {
        setSize: jest.fn(),
        setOffset: jest.fn(),
        setAllowGravity: jest.fn(),
      },
      health: 100,
      special: 0,
      isBlocking: false,
      isAttacking: false,
      direction: 'right',
    };

    mockPlayer2 = {
      ...mockPlayer1,
      direction: 'left',
    };

    mockBackground = {
      setOrigin: jest.fn().mockReturnThis(),
      setDisplaySize: jest.fn().mockReturnThis(),
    };

    // Create a test instance of KidsFightScene
    scene = new KidsFightScene() as unknown as KidsFightSceneTest;
    
    // Mock Phaser methods
    scene.add = {
      image: jest.fn().mockReturnValue(mockBackground),
      sprite: jest.fn().mockImplementation((x, y, key) => {
        return key === scene.p1 ? mockPlayer1 : mockPlayer2;
      }),
      graphics: jest.fn().mockReturnValue({
        fillStyle: jest.fn().mockReturnThis(),
        fillRect: jest.fn().mockReturnThis(),
        clear: jest.fn().mockReturnThis(),
      }),
      text: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setFontSize: jest.fn().mockReturnThis(),
        setPadding: jest.fn().mockReturnThis(),
        setStyle: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
      }),
      rectangle: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis(),
      }),
    };

    scene.physics = {
      add: {
        sprite: jest.fn().mockImplementation((x, y, key) => {
          return key === scene.p1 ? mockPlayer1 : mockPlayer2;
        }),
        staticGroup: jest.fn().mockReturnValue({
          create: jest.fn().mockReturnValue({
            setDisplaySize: jest.fn().mockReturnThis(),
            setVisible: jest.fn().mockReturnThis(),
            refreshBody: jest.fn().mockReturnThis(),
          }),
        }),
        collider: jest.fn(),
      },
      world: {
        setBounds: jest.fn(),
      },
    };

    scene.input = {
      keyboard: {
        addKey: jest.fn().mockReturnValue({ on: jest.fn() }),
      },
    };

    scene.sys = {
      game: {
        canvas: { width: 800, height: 600 },
        device: { os: { android: false, iOS: false } },
      },
    };

    scene.cameras = {
      main: {
        setBounds: jest.fn(),
      },
    };

    // Initialize with default values
    scene.selected = { p1: 'player1', p2: 'player2' };
    scene.selectedScenario = 'scenario1';
    scene.gameMode = 'single';
    scene.isHost = true;
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      // Arrange
      const initData = {};

      // Act
      scene.init(initData);

      // Assert
      expect(scene.selected).toEqual({ p1: 'player1', p2: 'player2' });
      expect(scene.selectedScenario).toBe('scenario1');
      expect(scene.gameMode).toBe('single');
    });

    it('should initialize with provided values', () => {
      // Arrange
      const initData = {
        selected: { p1: 'player3', p2: 'player4' },
        selectedScenario: 'scenario2',
        gameMode: 'online',
        isHost: true,
        roomCode: 'ABCD',
      };

      // Act
      scene.init(initData);

      // Assert
      expect(scene.selected).toEqual({ p1: 'player3', p2: 'player4' });
      expect(scene.selectedScenario).toBe('scenario2');
      expect(scene.gameMode).toBe('online');
      expect(scene.isHost).toBe(true);
      expect(scene.roomCode).toBe('ABCD');
    });
  });

  describe('Character Selection', () => {
    it('should create players with selected character sprites', () => {
      // Arrange
      const initData = {
        selected: { p1: 'player3', p2: 'player4' },
        p1: 'player3',
        p2: 'player4',
        selectedScenario: 'scenario1',
        gameMode: 'single',
      };

      // Act
      scene.init(initData);
      scene.preload();
      scene.create();

      // Assert
      expect(scene.physics.add.sprite).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        'player3'
      );
      expect(scene.physics.add.sprite).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        'player4'
      );
    });

    it('should set up player properties correctly', () => {
      // Arrange & Act
      scene.init({});
      scene.preload();
      scene.create();

      // Assert
      expect(mockPlayer1.setCollideWorldBounds).toHaveBeenCalledWith(true);
      expect(mockPlayer1.setBounce).toHaveBeenCalledWith(0.2);
      expect(mockPlayer1.setGravityY).toHaveBeenCalledWith(300);
      expect(mockPlayer1.setSize).toHaveBeenCalledWith(80, 200);
      expect(mockPlayer1.setOffset).toHaveBeenCalledWith(92, 32);
      expect(mockPlayer1.setScale).toHaveBeenCalledWith(0.4);
      expect(mockPlayer1.direction).toBe('right');
      
      expect(mockPlayer2.direction).toBe('left');
    });
  });

  describe('Scenario Selection', () => {
    it('should set the background to the selected scenario', () => {
      // Arrange
      const initData = {
        selectedScenario: 'scenario2',
        gameMode: 'single',
      };

      // Act
      scene.init(initData);
      scene.preload();
      scene.create();

      // Assert
      expect(scene.add.image).toHaveBeenCalledWith(0, 0, 'scenario2');
      expect(mockBackground.setOrigin).toHaveBeenCalledWith(0, 0);
      expect(mockBackground.setDisplaySize).toHaveBeenCalledWith(800, 600);
    });
  });

  describe('Online Mode', () => {
    it('should initialize WebSocketManager in online mode', () => {
      // Arrange
      const initData = {
        gameMode: 'online',
        roomCode: 'ABCD',
        isHost: true,
      };

      // Act
      scene.init(initData);

      // Assert
      expect(mockWebSocketManager.setMessageCallback).toHaveBeenCalled();
    });

    it('should handle remote player actions', () => {
      // Arrange
      const remoteAction = {
        type: 'move',
        playerIndex: 1,
        direction: 1,
        active: true,
      };

      // Mock the handleRemoteAction method
      scene.handleRemoteAction = jest.fn();

      // Simulate WebSocket message
      const messageCallback = mockWebSocketManager.setMessageCallback.mock.calls[0][0];
      messageCallback({ data: JSON.stringify(remoteAction) });

      // Assert
      expect(scene.handleRemoteAction).toHaveBeenCalledWith(remoteAction);
    });
  });
});
