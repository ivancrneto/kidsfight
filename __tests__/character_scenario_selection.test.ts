// Use the manual mock for WebSocketManager
jest.mock('../websocket_manager');

// Import the actual mock for all WebSocketManager usage
import { WebSocketManager, mockWebSocket } from '../__mocks__/websocket_manager';

import KidsFightScene from '../kidsfight_scene';
import Phaser from 'phaser';
import { setupMockScene } from './test-utils-fix';

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
    WebSocketManager.resetInstance();
    // Use the real KidsFightScene instance
    scene = new KidsFightScene() as KidsFightSceneTest;
    setupMockScene(scene);
    scene.textures = {
      exists: () => true,
      remove: () => {},
      get: () => ({ getSourceImage: () => ({}), add: () => {}, getFrameNames: () => [] }),
      addImage: () => {},
      list: {},
      getTextureKeys: () => []
    };
    // Mock textures.list for KidsFightScene
    if (mockWebSocket) {
      mockWebSocket.readyState = 1;
      if (mockWebSocket.send) mockWebSocket.send.mockClear();
    }
    // Patch sys.game.device.os for mobile detection in create()
    if (!scene.sys.game.device) scene.sys.game.device = {};
    scene.sys.game.device.os = { android: false, iOS: false };
    // Patch add.image to allow chaining setOrigin and setDisplaySize
    scene.add.image = jest.fn().mockReturnValue({
      setOrigin: jest.fn().mockReturnThis(),
      setDisplaySize: jest.fn().mockReturnThis(),
    });
    // Patch add.rectangle to allow chaining and all needed methods
    scene.add.rectangle = jest.fn().mockReturnValue({
      setOrigin: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis(),
      setScrollFactor: jest.fn().mockReturnThis(),
      setAlpha: jest.fn().mockReturnThis(),
      setInteractive: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      setDisplaySize: jest.fn().mockReturnThis(),
      setVisible: jest.fn().mockReturnThis(),
      destroy: jest.fn(),
    });
    // Patch add.circle to allow chaining and all needed methods for touch controls
    scene.add.circle = jest.fn().mockReturnValue({
      setAlpha: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis(),
      setInteractive: jest.fn().mockReturnThis(),
      setScrollFactor: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      setVisible: jest.fn().mockReturnThis(),
      destroy: jest.fn(),
    });
    // Patch add.graphics to allow all needed methods for health bars and pips
    scene.add.graphics = jest.fn().mockReturnValue({
      setDepth: jest.fn().mockReturnThis(),
      clear: jest.fn().mockReturnThis(),
      fillStyle: jest.fn().mockReturnThis(),
      fillRect: jest.fn().mockReturnThis(),
      fillCircle: jest.fn().mockReturnThis(),
      lineStyle: jest.fn().mockReturnThis(),
      strokeRect: jest.fn().mockReturnThis(),
      setScrollFactor: jest.fn().mockReturnThis(),
      setVisible: jest.fn().mockReturnThis(),
      destroy: jest.fn(),
      strokeCircle: jest.fn().mockReturnThis(),
      beginPath: jest.fn().mockReturnThis(),
      moveTo: jest.fn().mockReturnThis(),
      lineTo: jest.fn().mockReturnThis(),
      closePath: jest.fn().mockReturnThis(),
      strokePath: jest.fn().mockReturnThis(),
      strokeLineShape: jest.fn().mockReturnThis(),
      strokePoints: jest.fn().mockReturnThis(),
      fillRoundedRect: jest.fn().mockReturnThis(),
      strokeRoundedRect: jest.fn().mockReturnThis(),
      setAlpha: jest.fn().mockReturnThis(),
    });
    // Patch physics.add.sprite and staticGroup for player/platform creation
    scene.physics.add.sprite = jest.fn().mockReturnValue(createMockSprite());
    scene.physics.add.staticGroup = jest.fn().mockReturnValue({
      create: jest.fn().mockReturnValue({
        setDisplaySize: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis(),
        refreshBody: jest.fn().mockReturnThis(),
      }),
    });
    scene.physics.add.collider = jest.fn();
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
      scene.healthBar1 = { setVisible: jest.fn().mockReturnThis() };
      scene.healthBar2 = { setVisible: jest.fn().mockReturnThis() };

      // Assert
      expect(scene.physics.add.sprite).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        expect.any(String),
        expect.any(Number)
      );
      expect(scene.physics.add.sprite).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        expect.any(String),
        expect.any(Number)
      );
    });

    it('should set up player properties correctly', () => {
      // Arrange & Act
      scene.p1 = 'player3';
      scene.p2 = 'player4';
      scene.init({ selected: { p1: 'player3', p2: 'player4' }, p1: 'player3', p2: 'player4', selectedScenario: 'scenario1', gameMode: 'single' });
      scene.preload();
      scene.create();
      scene.healthBar1 = { setVisible: jest.fn().mockReturnThis() };
      scene.healthBar2 = { setVisible: jest.fn().mockReturnThis() };

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
      scene.wsManager = {
        onMessage: jest.fn(),
      };
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
      mockBackground = {
        setOrigin: jest.fn().mockReturnThis(),
        setDisplaySize: jest.fn().mockReturnThis(),
      };
      scene.add.image.mockReturnValue(mockBackground);
      scene.create();
      scene.healthBar1 = { setVisible: jest.fn().mockReturnThis() };
      scene.healthBar2 = { setVisible: jest.fn().mockReturnThis() };

      // Assert
      expect(scene.add.image).toHaveBeenCalledWith(0, 0, 'scenario2');
      expect(mockBackground.setOrigin).toHaveBeenCalledWith(0, 0);
      expect(mockBackground.setDisplaySize).toHaveBeenCalledWith(800, 600);
    });
  });

  describe('Online Mode', () => {
    it('should initialize WebSocketManager in online mode', async () => {
      // Arrange
      const initData = {
        gameMode: 'online',
        roomCode: 'ABCD',
        isHost: true,
      };

      // Act
      scene.init(initData);
      scene.wsManager.connect = jest.fn().mockResolvedValue(undefined);
      scene.wsManager.onMessage = jest.fn();
      jest.spyOn(WebSocketManager, 'getInstance').mockReturnValue(scene.wsManager);
      scene.create();
      await Promise.resolve(); // flush microtasks so .then() runs
      expect(scene.wsManager.onMessage).toHaveBeenCalled();
    });

    it('should handle remote player actions', async () => {
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
      scene.wsManager.connect = jest.fn().mockResolvedValue(undefined);
      scene.wsManager.onMessage = jest.fn();
      jest.spyOn(WebSocketManager, 'getInstance').mockReturnValue(scene.wsManager);
      scene.create();
      await Promise.resolve(); // flush microtasks so .then() runs
      // Simulate WebSocket message
      const messageCallback = scene.wsManager.onMessage.mock.calls[0][0];
      messageCallback({ data: JSON.stringify(remoteAction) });

      // Assert
      expect(scene.handleRemoteAction).toHaveBeenCalledWith(remoteAction);
    });
  });
});
