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
  };
});

import OnlineModeScene from '../online_mode_scene';

// Mock Phaser components
class MockRectangle {
  setOrigin = jest.fn().mockReturnThis();
  setDisplaySize = jest.fn().mockReturnThis();
  setDepth = jest.fn().mockReturnThis();
  setScrollFactor = jest.fn().mockReturnThis();
}

class MockText {
  setOrigin = jest.fn().mockReturnThis();
  setScrollFactor = jest.fn().mockReturnThis();
  setDepth = jest.fn().mockReturnThis();
  setVisible = jest.fn().mockReturnThis();
  setText = jest.fn().mockReturnThis();
  setInteractive = jest.fn().mockReturnThis();
  on = jest.fn().mockReturnThis();
  destroy = jest.fn();
}

class MockScene {
  add = {
    rectangle: jest.fn().mockImplementation(() => new MockRectangle()),
    text: jest.fn().mockImplementation(() => new MockText() as unknown as Phaser.GameObjects.Text)
  };
  cameras = {
    main: {
      width: 1280,
      height: 720
    }
  };
  scale = {
    on: jest.fn()
  };
  scene = {
    start: jest.fn(),
    launch: jest.fn(),
    manager: { keys: {} }
  };
  input = {
    keyboard: {
      on: jest.fn(),
      createCursorKeys: jest.fn()
    }
  };
}

describe('OnlineModeScene', () => {
  let scene: OnlineModeScene;
  let mockScene: any;
  let messageCallback: (event: any) => void;

  // Add this to mock Phaser's "add" methods for the real scene instance
  function mockPhaserAdd(sceneInstance: any) {
    sceneInstance.add = {
      rectangle: jest.fn(() => ({
        setOrigin: jest.fn().mockReturnThis(),
        setDisplaySize: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis(),
      })),
      text: jest.fn(() => ({
        setOrigin: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis(),
        setText: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        destroy: jest.fn(),
      })),
      // Add more mocks if your scene uses more methods
    };
    // Add scale mock with on method
    sceneInstance.scale = {
      width: 1280,
      height: 720,
      on: jest.fn(),
    };
  }

  beforeEach(() => {
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
    mockScene = new MockScene() as any;
    // Create the scene under test
    scene = new OnlineModeScene();
    // Set up the scene's scene property
    scene.scene = mockScene.scene;
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
  });

  describe('Message Handling', () => {
    it('should handle room_created message', () => {
      const roomCode = 'ABC123';
      // Simulate receiving room_created message as a MessageEvent
      messageCallback({ data: JSON.stringify({ type: 'room_created', roomCode }) });
      expect(mockSetRoomCode).toHaveBeenCalledWith(roomCode);
      expect(mockSetHost).toHaveBeenCalledWith(true);
    });

    it('should handle game_joined message', () => {
      const startGameSpy = jest.spyOn(scene as any, 'startGame');
      // Simulate receiving game_joined message as a MessageEvent
      messageCallback({ data: JSON.stringify({ type: 'game_joined' }) });
      expect(startGameSpy).toHaveBeenCalledWith({
        roomCode: 'TEST123',
        isHost: false
      });
    });

    it('should handle player_joined message when host', () => {
      const startGameSpy = jest.spyOn(scene as any, 'startGame');
      // Simulate receiving player_joined message as a MessageEvent
      messageCallback({ data: JSON.stringify({ type: 'player_joined' }) });
      expect(startGameSpy).toHaveBeenCalledWith({
        roomCode: 'TEST123',
        isHost: true
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

  describe('Error Handling', () => {
    it('should handle connection errors', async () => {
      // Simulate a connection error
      const error = new Error('Connection failed');
      mockConnect.mockRejectedValueOnce(error); // Set up rejection BEFORE scene creation
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const newScene = new OnlineModeScene();
      newScene.wsManager = wsManagerMockInstance;
      // Assign Phaser mock properties
      newScene.add = mockScene.add;
      newScene.cameras = mockScene.cameras;
      newScene.scale = mockScene.scale;
      newScene.create.call(newScene);
      // Wait for the async .catch to run
      await new Promise(r => setTimeout(r, 0));
      // The error should be caught and handled by the scene
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to connect to WebSocket server:'),
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('UI Layout and Interactions', () => {
    it('should create all main UI elements with correct visibility and positioning', () => {
      // Title
      expect(scene.add.text).toHaveBeenCalledWith(
        1280/2,
        720 * 0.3,
        'Modo Online',
        expect.objectContaining({ fontSize: expect.any(String), color: '#fff', align: 'center' })
      );
      // Buttons
      expect(scene.add.text).toHaveBeenCalledWith(
        1280/2,
        720 * 0.45,
        'Criar Jogo',
        expect.any(Object)
      );
      expect(scene.add.text).toHaveBeenCalledWith(
        1280/2,
        720 * 0.55,
        'Entrar em Jogo',
        expect.any(Object)
      );
      expect(scene.add.text).toHaveBeenCalledWith(
        1280/2,
        720 * 0.8,
        'Voltar',
        expect.any(Object)
      );
      // Error text, room code display, join prompt, waiting text are created and hidden by default
      expect(scene.errorText.setVisible).toHaveBeenCalledWith(false);
      expect(scene.roomCodeDisplay.setVisible).toHaveBeenCalledWith(false);
      expect(scene.roomCodeText.setVisible).toHaveBeenCalledWith(false);
      expect(scene.joinPromptText.setVisible).toHaveBeenCalledWith(false);
      expect(scene.waitingText.setVisible).toHaveBeenCalledWith(false);
    });

    it('should show join prompt and input when joinButton is clicked', () => {
      scene.showJoinPrompt();
      expect(scene.joinPromptText.setVisible).toHaveBeenCalledWith(true);
      expect(scene.roomCodeInput.style.display).toBe('block');
      expect(document.activeElement).toBe(scene.roomCodeInput);
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

    it('should set up resize event handler for responsive layout', () => {
      expect(scene.scale.on).toHaveBeenCalledWith('resize', scene.updateLayout, scene);
    });
  });
});
