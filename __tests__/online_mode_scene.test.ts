// Mock WebSocketManager
const mockConnect = jest.fn().mockResolvedValue({});
const mockSend = jest.fn();
const mockSetMessageCallback = jest.fn();
const mockSetConnectionCallback = jest.fn();
const mockSetHost = jest.fn();
const mockSetRoomCode = jest.fn();
const mockGetRoomCode = jest.fn().mockReturnValue('TEST123');
const mockIsConnected = jest.fn().mockReturnValue(true);

let wsManagerMockInstance: any;

jest.mock('../websocket_manager', () => {
  wsManagerMockInstance = {
    connect: mockConnect,
    disconnect: jest.fn(),
    send: mockSend,
    onOpen: jest.fn(),
    onClose: jest.fn(),
    onError: jest.fn(),
    onMessage: jest.fn(),
    setMessageCallback: mockSetMessageCallback,
    setConnectionCallback: mockSetConnectionCallback,
    setHost: mockSetHost,
    setRoomCode: mockSetRoomCode,
    getRoomCode: mockGetRoomCode,
    isConnected: mockIsConnected,
  };
  return {
    WebSocketManager: {
      getInstance: jest.fn(() => wsManagerMockInstance),
    },
    getWebSocketUrl: jest.fn(() => 'ws://mocked-url'),
  };
});

import OnlineModeScene from '../online_mode_scene';
import { MockText, patchPhaserAddMock } from './test-utils';

let scene: OnlineModeScene;

// Helper to robustly patch an OnlineModeScene instance
function patchOnlineModeScene(scene: any) {
  patchPhaserAddMock(scene);
  jest.spyOn(scene.add, 'text').mockImplementation((...args) => new MockText(...args));
  jest.spyOn(scene.add, 'image').mockImplementation(() => ({
    setOrigin: jest.fn().mockReturnThis(),
    setDisplaySize: jest.fn().mockReturnThis(),
    setAlpha: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    setTexture: jest.fn().mockReturnThis(),
    setScale: jest.fn().mockReturnThis(),
    setInteractive: jest.fn().mockReturnThis(),
    setBackgroundColor: jest.fn().mockReturnThis(),
    setPosition: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    destroy: jest.fn().mockReturnThis(),
  }));
  scene.readyButton = new MockText();
  scene.backButton = new MockText();
  scene.nextButton = new MockText();
}

// Use centralized Phaser add mock for all tests

describe('OnlineModeScene', () => {
  let scene: OnlineModeScene;
  // Removed mockScene in favor of global mockChain
  let messageCallback: (event: any) => void;

  // Create mock classes for Phaser objects
  class MockText {
    setOrigin = jest.fn().mockReturnThis();
    setScrollFactor = jest.fn().mockReturnThis();
    setInteractive = jest.fn().mockReturnThis();
    disableInteractive = jest.fn().mockReturnThis();
    setDepth = jest.fn().mockReturnThis();
    setFontSize = jest.fn().mockReturnThis();
    setColor = jest.fn().mockReturnThis();
    setText = jest.fn().mockReturnThis();
    setX = jest.fn().mockReturnThis();
    setY = jest.fn().mockReturnThis();
    setVisible = jest.fn().mockReturnThis();
    destroy = jest.fn().mockReturnThis();
    on = jest.fn(function(event: string, callback: Function) {
      // Store callback for testing
      this._eventCallbacks = this._eventCallbacks || {};
      this._eventCallbacks[event] = callback;
      return this;
    });
    emit = jest.fn(function(event: string, ...args: any[]) {
      if (this._eventCallbacks && this._eventCallbacks[event]) {
        this._eventCallbacks[event](...args);
      }
      return this;
    });
    setAlpha = jest.fn().mockReturnThis();
    setPadding = jest.fn().mockReturnThis();
    setStyle = jest.fn().mockReturnThis();
    setBackgroundColor = jest.fn().mockReturnThis();
    _eventCallbacks: Record<string, Function> = {};
  }
  
  class MockImage {
    setOrigin = jest.fn().mockReturnThis();
    setDepth = jest.fn().mockReturnThis();
    setScrollFactor = jest.fn().mockReturnThis();
    setAlpha = jest.fn().mockReturnThis();
    setVisible = jest.fn().mockReturnThis();
    setX = jest.fn().mockReturnThis();
    setY = jest.fn().mockReturnThis();
    destroy = jest.fn().mockReturnThis();
    setDisplaySize = jest.fn().mockReturnThis();
    setTexture = jest.fn().mockReturnThis();
    setScale = jest.fn().mockReturnThis();
    setInteractive = jest.fn().mockReturnThis();
    on = jest.fn(function(event: string, callback: Function) {
      this._eventCallbacks = this._eventCallbacks || {};
      this._eventCallbacks[event] = callback;
      return this;
    });
    emit = jest.fn(function(event: string, ...args: any[]) {
      if (this._eventCallbacks && this._eventCallbacks[event]) {
        this._eventCallbacks[event](...args);
      }
      return this;
    });
    _eventCallbacks: Record<string, Function> = {};
  }

  // Add this to mock Phaser's "add" methods for the real scene instance
  function mockPhaserAdd(sceneInstance: any) {
    // Make sure to define the add object first before assigning properties
    sceneInstance.add = {};
    
    // Now add the mock methods
    sceneInstance.add.text = jest.fn(() => new MockText());
    sceneInstance.add.rectangle = jest.fn(() => ({ 
      setOrigin: jest.fn().mockReturnThis(), 
      setDepth: jest.fn().mockReturnThis(), 
      setScrollFactor: jest.fn().mockReturnThis(), 
      setAlpha: jest.fn().mockReturnThis(), 
      setVisible: jest.fn().mockReturnThis(), 
      setX: jest.fn().mockReturnThis(), 
      setY: jest.fn().mockReturnThis(), 
      destroy: jest.fn().mockReturnThis() 
    }));
    sceneInstance.add.circle = jest.fn(() => ({ 
      setOrigin: jest.fn().mockReturnThis(), 
      setDepth: jest.fn().mockReturnThis(), 
      setScrollFactor: jest.fn().mockReturnThis(), 
      setAlpha: jest.fn().mockReturnThis(), 
      setVisible: jest.fn().mockReturnThis(), 
      setX: jest.fn().mockReturnThis(), 
      setY: jest.fn().mockReturnThis(), 
      destroy: jest.fn().mockReturnThis() 
    }));
    sceneInstance.add.sprite = jest.fn(() => ({ 
      setOrigin: jest.fn().mockReturnThis(), 
      setDepth: jest.fn().mockReturnThis(), 
      setScrollFactor: jest.fn().mockReturnThis(), 
      setAlpha: jest.fn().mockReturnThis(), 
      setVisible: jest.fn().mockReturnThis(), 
      setX: jest.fn().mockReturnThis(), 
      setY: jest.fn().mockReturnThis(), 
      destroy: jest.fn().mockReturnThis(), 
      setCrop: jest.fn().mockReturnThis(), 
      setScale: jest.fn().mockReturnThis(), 
      play: jest.fn().mockReturnThis(), 
      setInteractive: jest.fn().mockReturnThis() 
    }));
    sceneInstance.add.image = jest.fn(() => new MockImage());
    sceneInstance.add.graphics = jest.fn(() => ({ 
      setDepth: jest.fn().mockReturnThis(), 
      setScrollFactor: jest.fn().mockReturnThis(), 
      setAlpha: jest.fn().mockReturnThis(), 
      setVisible: jest.fn().mockReturnThis(), 
      setX: jest.fn().mockReturnThis(), 
      setY: jest.fn().mockReturnThis(), 
      destroy: jest.fn().mockReturnThis() 
    }));
    
    sceneInstance.cameras = { main: { width: 1280, height: 720 } };
    sceneInstance.scale = { width: 1280, height: 720, on: jest.fn() };
    sceneInstance.scene = { start: jest.fn() };
  }

  // Helper to robustly patch an OnlineModeScene instance
  function patchOnlineModeScene(scene: any) {
    patchPhaserAddMock(scene);
    jest.spyOn(scene.add, 'text').mockImplementation((...args) => new MockText(...args));
    jest.spyOn(scene.add, 'image').mockImplementation(() => ({
      setOrigin: jest.fn().mockReturnThis(),
      setDisplaySize: jest.fn().mockReturnThis(),
      setAlpha: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis(),
      setTexture: jest.fn().mockReturnThis(),
      setScale: jest.fn().mockReturnThis(),
      setInteractive: jest.fn().mockReturnThis(),
      setBackgroundColor: jest.fn().mockReturnThis(),
      setPosition: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      destroy: jest.fn().mockReturnThis(),
    }));
    scene.readyButton = new MockText();
    scene.backButton = new MockText();
    scene.nextButton = new MockText();
  }

  beforeEach(() => {
    // Create the scene before patching it
    scene = new OnlineModeScene(wsManagerMockInstance as WebSocketManager);
    
    // Now patch it
    patchOnlineModeScene(scene);
    
    // Ensure scene.scale.on is always a jest mock function
    scene.scale = { on: jest.fn(), width: 1280, height: 720 };
    scene.cameras = { main: { width: 1280, height: 720 } };

    jest.clearAllMocks();
    wsManagerMockInstance = {
      connect: mockConnect,
      disconnect: jest.fn(),
      send: mockSend,
      onOpen: jest.fn(),
      onClose: jest.fn(),
      onError: jest.fn(),
      onMessage: jest.fn(),
      setMessageCallback: mockSetMessageCallback,
      setConnectionCallback: mockSetConnectionCallback,
      setHost: mockSetHost,
      setRoomCode: mockSetRoomCode,
      getRoomCode: mockGetRoomCode,
      isConnected: mockIsConnected,
    };
    // Create a fresh mock scene for each test
    // Create the scene under test
    scene = new OnlineModeScene();
    patchOnlineModeScene(scene);
    // Set up the scene's scene property
    scene.scene = { start: jest.fn() };
    // Mock Phaser's add methods for the real scene instance
    mockPhaserAdd(scene);
    // Set up the message callback mock
    mockSetMessageCallback.mockImplementation((cb) => {
      messageCallback = cb;
      return jest.fn();
    });
    // Mock the showError method
    (scene as any).showError = jest.fn();
    // Initialize the scene
    scene.create.call(scene);
  });

  describe('Initialization', () => {
    it('should create an instance of OnlineModeScene', () => {
      expect(scene).toBeInstanceOf(OnlineModeScene);
    });

    it('should set up WebSocket connection on create', () => {
      // Set the mock to return the expected value for this test
      const { getWebSocketUrl } = require('../websocket_manager');
      (getWebSocketUrl as jest.Mock).mockReturnValue('ws://localhost:8081');
      // Re-run scene creation with patching
      scene = new OnlineModeScene();
      patchOnlineModeScene(scene);
      jest.spyOn(scene.add, 'image').mockImplementation(() => ({
        setOrigin: jest.fn().mockReturnThis(),
        setDisplaySize: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setTexture: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        setBackgroundColor: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        destroy: jest.fn().mockReturnThis(),
      }));
      jest.spyOn(scene.add, 'text').mockImplementation((...args) => new MockText(...args));
      scene.create.call(scene);
      expect(mockConnect).toHaveBeenCalledWith('ws://localhost:8081');
      expect(mockSetMessageCallback).toHaveBeenCalled();
      expect(mockSetConnectionCallback).toHaveBeenCalled();
    });
  });

  describe('Room Creation', () => {
    it('should create a room when createGame is called', () => {
      // Call the private method
      (scene as any).createGame();
      expect(mockSetHost).toHaveBeenCalledWith(true);
      expect(mockSend).toHaveBeenCalledWith({ type: 'create_room' });
    });
    it('should handle room_created message', () => {
      const roomCode = 'ABC123';
      // Simulate receiving room_created message as a MessageEvent
      messageCallback({ data: JSON.stringify({ type: 'room_created', roomCode }) });
      expect(mockSetRoomCode).toHaveBeenCalledWith(roomCode);
    });

    it('should handle game_joined message', () => {
      const startGameSpy = jest.spyOn(scene as any, 'startGame');
      // Simulate receiving game_joined message as a MessageEvent WITH roomCode
      messageCallback({ data: JSON.stringify({ type: 'game_joined', roomCode: 'TEST123' }) });
      expect(startGameSpy).toHaveBeenCalledWith({
        roomCode: 'TEST123',
        isHost: false,
      });
    });

    it('should handle player_joined message when host', () => {
      const startGameSpy = jest.spyOn(scene as any, 'startGame');
      // Simulate receiving player_joined message as a MessageEvent WITH roomCode
      messageCallback({ data: JSON.stringify({ type: 'player_joined', roomCode: 'TEST123' }) });
      expect(startGameSpy).toHaveBeenCalledWith({
        roomCode: 'TEST123',
        isHost: true,
      });
    });

    it('should handle error messages', () => {
      const errorMessage = 'Test error message';
      const showErrorSpy = jest.spyOn(scene as any, 'showError');
      // Simulate receiving an error message as a MessageEvent
      messageCallback({ data: JSON.stringify({ type: 'error', message: errorMessage }) });
      expect(showErrorSpy).toHaveBeenCalledWith(errorMessage);
    });
  });

  describe('Connection Handling', () => {
    it('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      mockConnect.mockRejectedValueOnce(error);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      scene = new OnlineModeScene(wsManagerMockInstance as WebSocketManager);
      patchOnlineModeScene(scene);
      scene.cameras = { main: { width: 1280, height: 720 } };
      scene.scale = { on: jest.fn() };
      scene.create.call(scene);
      
      // Wait for the async .catch to run
      await new Promise((r) => setTimeout(r, 0));
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to connect to WebSocket server:'),
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('UI Layout and Interactions', () => {
    beforeEach(() => {
      scene = new OnlineModeScene();
      patchOnlineModeScene(scene);
      scene.create();
    });

    it('should call createGame when createButton is clicked', () => {
      const spy = jest.spyOn(scene as any, 'createGame');
      scene.createButton.emit('pointerdown');
      expect(spy).toHaveBeenCalled();
    });

    it('should call goBack when backButton is clicked', () => {
      const spy = jest.spyOn(scene as any, 'goBack');
      scene.backButton.emit('pointerdown');
      expect(spy).toHaveBeenCalled();
    });
  });
});