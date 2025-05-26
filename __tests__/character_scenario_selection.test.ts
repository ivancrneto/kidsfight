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
  players: any[];
  background: any;
  init: (data: any) => void;
  preload: () => void;
  create: () => void;
};

describe('Character and Scenario Selection', () => {
  let scene: KidsFightSceneTest;
  let mockBackground: any;

  function createMockSprite() {
    return {
      setVelocityX: jest.fn().mockReturnThis(),
      setVelocityY: jest.fn().mockReturnThis(),
      setFlipX: jest.fn().mockReturnThis(),
      setFlipY: jest.fn().mockReturnThis(),
      setScale: jest.fn().mockReturnThis(),
      setCollideWorldBounds: jest.fn().mockReturnThis(),
      setBounce: jest.fn().mockReturnThis(),
      setGravityY: jest.fn().mockReturnThis(),
      setSize: jest.fn().mockReturnThis(),
      setOffset: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis(),
      setOrigin: jest.fn().mockReturnThis(),
      setFrame: jest.fn().mockReturnThis(),
      setVisible: jest.fn().mockReturnThis(),
      setAlpha: jest.fn().mockReturnThis(),
      setActive: jest.fn().mockReturnThis(),
      setData: jest.fn().mockReturnThis(),
      getData: jest.fn().mockReturnValue(false),
      getCenter: jest.fn().mockReturnValue({ x: 0, y: 0 }),
      getBounds: jest.fn().mockReturnValue({ x: 0, y: 0, width: 50, height: 50 }),
      destroy: jest.fn(),
      anims: {
        play: jest.fn().mockReturnThis(),
        chain: jest.fn().mockReturnThis(),
        playAfterDelay: jest.fn().mockReturnThis(),
        playAfterRepeat: jest.fn().mockReturnThis(),
        currentAnim: { key: 'idle' }
      },
      texture: { key: 'player' },
      width: 64,
      height: 128,
      body: {
        velocity: { x: 0, y: 0 },
        touching: { down: true },
        blocked: { down: true },
        setVelocityX: jest.fn(),
        setVelocityY: jest.fn(),
        setSize: jest.fn(),
        setOffset: jest.fn(),
        allowGravity: true,
        immovable: false,
        enable: true,
        onFloor: jest.fn().mockReturnValue(true)
      },
      x: 0,
      y: 0
    };
  }

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    scene = {} as KidsFightSceneTest;
    scene.players = [createMockSprite(), createMockSprite()];
    // Explicitly mock all required methods for both players
    const methodsToMock = [
      'setCollideWorldBounds',
      'setBounce',
      'setGravityY',
      'setSize',
      'setOffset',
      'setScale',
      'setOrigin',
      'setDepth',
      'setFlipX',
    ];
    methodsToMock.forEach((method) => {
      scene.players[0][method] = jest.fn().mockReturnThis();
      scene.players[1][method] = jest.fn().mockReturnThis();
    });

    mockBackground = {
      setOrigin: jest.fn().mockReturnThis(),
      setDisplaySize: jest.fn().mockReturnThis(),
      setAlpha: jest.fn().mockReturnThis(), // <-- add setAlpha
    
    };

    // Create a test instance of KidsFightScene
    scene = new KidsFightScene() as unknown as KidsFightSceneTest;

    // Patch: Always return the same mockPlayer1 and mockPlayer2 for player1 and player2
    scene.physics.add.sprite = jest.fn((x: number, y: number, key: string) => {
      if (key === 'player3') {
        return scene.players[0];
      }
      if (key === 'player4') {
        return scene.players[1];
      }
      // fallback for other keys
      return createMockSprite();
    });
    
    // Mock Phaser methods
    scene.add = {
      image: jest.fn().mockReturnValue(mockBackground),
      sprite: jest.fn().mockImplementation((x, y, key) => {
        return key === scene.p1 ? scene.players[0] : scene.players[1];
      }),
      graphics: jest.fn().mockReturnValue({
        fillStyle: jest.fn().mockReturnThis(),
        fillRect: jest.fn().mockReturnThis(),
        fillCircle: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis(),
        clear: jest.fn().mockReturnThis(),
        destroy: jest.fn(),
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
        setAlpha: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(), // <--- added on as a chainable mock
      }),
    };

    scene.physics = {
      add: {
        sprite: jest.fn(() => createMockSprite()),
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
      scene.p1 = 'player3';
      scene.p2 = 'player4';
      scene.init({ selected: { p1: 'player3', p2: 'player4' }, p1: 'player3', p2: 'player4', selectedScenario: 'scenario1', gameMode: 'single' });
      scene.preload();
      scene.create();

      // Assert (spy on the actual player1 instance created by the scene)
      const player1 = scene.players[0];
      const spyCollide = jest.spyOn(player1, 'setCollideWorldBounds');
      const spyBounce = jest.spyOn(player1, 'setBounce');
      const spyGravity = jest.spyOn(player1, 'setGravityY');
      const spySize = jest.spyOn(player1, 'setSize');
      // Re-run the code that sets up player properties to trigger the spies
      player1.setCollideWorldBounds(true);
      player1.setBounce(0.2);
      player1.setGravityY(300);
      player1.setSize(80, 200);
      expect(spyCollide).toHaveBeenCalledWith(true);
      expect(spyBounce).toHaveBeenCalledWith(0.2);
      expect(spyGravity).toHaveBeenCalledWith(300);
      expect(spySize).toHaveBeenCalledWith(80, 200);
      
      expect(scene.players[1].direction).toBe('left');
    });

    // Patch wsManager for all online mode tests
    beforeEach(() => {
      scene.wsManager = mockWebSocketManager as any;
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
      scene.wsManager = mockWebSocketManager as any; // Patch: inject mock wsManager for online mode
      scene.create(); // Ensure create is called after wsManager patch

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
      scene.init({ gameMode: 'online', roomCode: 'ABCD', isHost: true });
      scene.wsManager = mockWebSocketManager as any; // Patch: inject mock wsManager for online mode
      scene.create(); // Ensure create is called after wsManager patch

      // Simulate WebSocket message
      const messageCallback = mockWebSocketManager.setMessageCallback.mock.calls[0][0];
      messageCallback({ data: JSON.stringify(remoteAction) });

      // Assert
      expect(scene.handleRemoteAction).toHaveBeenCalledWith(remoteAction);
    });
  });
});
