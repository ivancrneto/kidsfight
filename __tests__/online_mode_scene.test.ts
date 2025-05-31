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

// --- Unified Phaser GameObject Mocking for all tests ---
// Patch Phaser.Scene.prototype.add to use mockChain for all GameObject factories
const mockChain = () => ({
  setVisible: jest.fn().mockReturnThis(),
  setStrokeStyle: jest.fn().mockReturnThis(),
  setOrigin: jest.fn().mockReturnThis(),
  setCrop: jest.fn().mockReturnThis(),
  setScale: jest.fn().mockReturnThis(),
  setInteractive: jest.fn().mockReturnThis(),
  setX: jest.fn().mockReturnThis(),
  setY: jest.fn().mockReturnThis(),
  setDepth: jest.fn().mockReturnThis(),
  setAlpha: jest.fn().mockReturnThis(),
  setScrollFactor: jest.fn().mockReturnThis(),
  setBlendMode: jest.fn().mockReturnThis(),
  setFrame: jest.fn().mockReturnThis(),
  play: jest.fn().mockReturnThis(),
  on: jest.fn().mockReturnThis(),
  destroy: jest.fn().mockReturnThis(),
  setText: jest.fn().mockReturnThis(),
  setFontSize: jest.fn().mockReturnThis(),
  setColor: jest.fn().mockReturnThis(),
  setPadding: jest.fn().mockReturnThis(),
  setBackgroundColor: jest.fn().mockReturnThis(),
  emit: jest.fn().mockReturnThis(),
  setSize: jest.fn().mockReturnThis(),
  setPosition: jest.fn().mockReturnThis(),
  setRotation: jest.fn().mockReturnThis(),
  setAngle: jest.fn().mockReturnThis(),
  setFlip: jest.fn().mockReturnThis(),
  setMask: jest.fn().mockReturnThis(),
  clearMask: jest.fn().mockReturnThis(),
  setTint: jest.fn().mockReturnThis(),
  setTintTopLeft: jest.fn().mockReturnThis(),
  setTintTopRight: jest.fn().mockReturnThis(),
  setTintBottomLeft: jest.fn().mockReturnThis(),
  setTintBottomRight: jest.fn().mockReturnThis(),
  clearTint: jest.fn().mockReturnThis(),
  setTexture: jest.fn().mockReturnThis(),
  setDisplaySize: jest.fn().mockReturnThis(),
  setDisplayOrigin: jest.fn().mockReturnThis(),
  updateDisplayOrigin: jest.fn().mockReturnThis(),
  updateDisplaySize: jest.fn().mockReturnThis(),
});

const sceneProto = require('phaser').Scene?.prototype || {};
sceneProto.add = {
  circle: jest.fn(mockChain),
  rectangle: jest.fn(mockChain),
  text: jest.fn(mockChain),
  sprite: jest.fn(mockChain),
  image: jest.fn(mockChain),
  graphics: jest.fn(mockChain),
};

describe('OnlineModeScene', () => {
  let scene: OnlineModeScene;
  // Removed mockScene in favor of global mockChain
  let messageCallback: (event: any) => void;

  // Add this to mock Phaser's "add" methods for the real scene instance
  function mockPhaserAdd(sceneInstance: any) {
  sceneInstance.cameras = { main: { width: 1280, height: 720 } };
    sceneInstance.add = {
      text: jest.fn(() => ({ setOrigin: jest.fn().mockReturnThis(), setInteractive: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        setFontSize: jest.fn().mockReturnThis(),
        setColor: jest.fn().mockReturnThis(),
        setText: jest.fn().mockReturnThis(),
        setX: jest.fn().mockReturnThis(),
        setY: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis(),
        destroy: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setPadding: jest.fn().mockReturnThis(),
      })),
      rectangle: jest.fn(() => ({ setOrigin: jest.fn().mockReturnThis(), setDepth: jest.fn().mockReturnThis(), setScrollFactor: jest.fn().mockReturnThis(), setAlpha: jest.fn().mockReturnThis(), setVisible: jest.fn().mockReturnThis(), setX: jest.fn().mockReturnThis(), setY: jest.fn().mockReturnThis(), destroy: jest.fn().mockReturnThis() })),
      circle: jest.fn(() => ({ setOrigin: jest.fn().mockReturnThis(), setDepth: jest.fn().mockReturnThis(), setScrollFactor: jest.fn().mockReturnThis(), setAlpha: jest.fn().mockReturnThis(), setVisible: jest.fn().mockReturnThis(), setX: jest.fn().mockReturnThis(), setY: jest.fn().mockReturnThis(), destroy: jest.fn().mockReturnThis() })),
      sprite: jest.fn(() => ({ setOrigin: jest.fn().mockReturnThis(), setDepth: jest.fn().mockReturnThis(), setScrollFactor: jest.fn().mockReturnThis(), setAlpha: jest.fn().mockReturnThis(), setVisible: jest.fn().mockReturnThis(), setX: jest.fn().mockReturnThis(), setY: jest.fn().mockReturnThis(), destroy: jest.fn().mockReturnThis(), setCrop: jest.fn().mockReturnThis(), setScale: jest.fn().mockReturnThis(), play: jest.fn().mockReturnThis(), setInteractive: jest.fn().mockReturnThis() })),
      image: jest.fn(() => ({ setOrigin: jest.fn().mockReturnThis(), setDepth: jest.fn().mockReturnThis(), setScrollFactor: jest.fn().mockReturnThis(), setAlpha: jest.fn().mockReturnThis(), setVisible: jest.fn().mockReturnThis(), setX: jest.fn().mockReturnThis(), setY: jest.fn().mockReturnThis(), destroy: jest.fn().mockReturnThis() })),
      graphics: jest.fn(() => ({ setDepth: jest.fn().mockReturnThis(), setScrollFactor: jest.fn().mockReturnThis(), setAlpha: jest.fn().mockReturnThis(), setVisible: jest.fn().mockReturnThis(), setX: jest.fn().mockReturnThis(), setY: jest.fn().mockReturnThis(), destroy: jest.fn().mockReturnThis() }))
    };
    sceneInstance.cameras = { main: { width: 1280, height: 720 } };
    sceneInstance.scale = { width: 1280, height: 720, on: jest.fn() };
    sceneInstance.scene = { start: jest.fn() };
  }

  beforeEach(() => {
    // Ensure scene.scale.on is always a jest mock function
    if (scene) scene.scale = { on: jest.fn() };

  if (scene) scene.cameras = { main: { width: 1280, height: 720 } };

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

  describe('Error Handling', () => {
    describe('showError', () => {
      let scene: OnlineModeScene;
      let errorTextMock: any;
      let originalSetTimeout: any;
      beforeEach(() => {
        scene = new OnlineModeScene();
        mockPhaserAdd(scene);
        scene.scene = { start: jest.fn() };
        errorTextMock = {
          setText: jest.fn().mockReturnThis(),
          setVisible: jest.fn().mockReturnThis(),
          destroyed: false,
        };
        (scene as any).errorText = errorTextMock;
        (scene as any).showMainButtons = jest.fn();
        (scene as any).waitingText = { setVisible: jest.fn() };
        (scene as any).roomCodeText = { setVisible: jest.fn() };
        (scene as any).roomCodeDisplay = { setVisible: jest.fn() };
        jest.useFakeTimers();
      });
      afterEach(() => {
        jest.useRealTimers();
      });
      it('shows error when errorText is present and not destroyed', () => {
        (scene as any).showError('Test error');
        expect(errorTextMock.setText).toHaveBeenCalledWith('Test error');
        expect(errorTextMock.setVisible).toHaveBeenCalledWith(true);
      });
      it('warns and does not throw if errorText is missing', () => {
        delete (scene as any).errorText;
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
        expect(() => (scene as any).showError('No errorText')).not.toThrow();
        expect(warnSpy).toHaveBeenCalledWith('[OnlineModeScene] Tried to show error but errorText is missing or destroyed');
        warnSpy.mockRestore();
      });
      it('warns and does not throw if errorText is destroyed', () => {
        (scene as any).errorText.destroyed = true;
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
        expect(() => (scene as any).showError('Destroyed errorText')).not.toThrow();
        expect(warnSpy).toHaveBeenCalledWith('[OnlineModeScene] Tried to show error but errorText is missing or destroyed');
        warnSpy.mockRestore();
      });
      it('guards canvas drawing if errorCanvas context is null', () => {
        (scene as any).errorCanvas = {
          getContext: jest.fn().mockReturnValue(null)
        };
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
        (scene as any).showError('Canvas context null');
        expect((scene as any).errorCanvas.getContext).toHaveBeenCalledWith('2d');
        expect(warnSpy).toHaveBeenCalledWith('[OnlineModeScene] showError: Canvas context is null!');
        warnSpy.mockRestore();
      });
      it('does not warn if errorCanvas context is valid', () => {
        const ctxMock = { drawImage: jest.fn() };
        (scene as any).errorCanvas = {
          getContext: jest.fn().mockReturnValue(ctxMock)
        };
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
        (scene as any).showError('Canvas context ok');
        expect((scene as any).errorCanvas.getContext).toHaveBeenCalledWith('2d');
        expect(warnSpy).not.toHaveBeenCalledWith('[OnlineModeScene] showError: Canvas context is null!');
        warnSpy.mockRestore();
      });
      it('hides errorText after timeout if not destroyed', () => {
        (scene as any).showError('Timeout test');
        expect(errorTextMock.setVisible).toHaveBeenCalledWith(true);
        jest.advanceTimersByTime(3000);
        expect(errorTextMock.setVisible).toHaveBeenCalledWith(false);
      });
      it('does not throw if errorText destroyed before timeout', () => {
        (scene as any).showError('Timeout destroy test');
        (scene as any).errorText.destroyed = true;
        jest.advanceTimersByTime(3000);
        // Should not throw
        expect(errorTextMock.setVisible).toHaveBeenCalledWith(true);
      });
    });
    it('should handle connection errors', async () => {
      // Simulate a connection error
      const error = new Error('Connection failed');
      mockConnect.mockRejectedValueOnce(error); // Set up rejection BEFORE scene creation
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const newScene = new OnlineModeScene();
      newScene.wsManager = wsManagerMockInstance;
      // Assign Phaser mock properties
      const mockChain = () => ({
        setOrigin: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis(),
        setText: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setX: jest.fn().mockReturnThis(),
        setY: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
      });
      newScene.add = {
        rectangle: jest.fn(mockChain),
        text: jest.fn(mockChain),
      };
      newScene.cameras = { main: { width: 1280, height: 720 } };
      newScene.scale = { on: jest.fn() };
      newScene.create.call(newScene);
      // Wait for the async .catch to run
      await new Promise((r) => setTimeout(r, 0));
      // The error should be caught and handled by the scene
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to connect to WebSocket server:'),
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });

    it('should not throw if showError is called before errorText is initialized', () => {
      // Simulate missing errorText and other UI elements
      scene.errorText = null;
      scene.waitingText = null;
      scene.roomCodeText = null;
      scene.roomCodeDisplay = null;
      scene.showMainButtons = undefined;
      
      // Spy on console.warn to verify warning is logged
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Call the actual showError method (not the mock)
      const originalShowError = OnlineModeScene.prototype.showError;
      scene.showError = originalShowError;
      scene.showError('Room is full');
      
      // Verify warning was logged
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[OnlineModeScene] Tried to show error but errorText is missing or destroyed'
      );
      consoleWarnSpy.mockRestore();
    });

    it('should display error message if errorText exists (isolated test)', () => {
      // Isolated test for showError logic
      const testScene: any = {};
      testScene.errorText = {
        setText: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis(),
        destroyed: false
      };
      testScene.roomCodeDisplay = null;
      testScene.showError = OnlineModeScene.prototype['showError'];
      testScene.showError.call(testScene, 'Room is full');
      expect(testScene.errorText.setText).toHaveBeenCalledWith('Room is full');
      expect(testScene.errorText.setVisible).toHaveBeenCalledWith(true);
    });
    
    it('should not update errorText if it has been destroyed', () => {
      // Isolated test for destroyed errorText
      const testScene: any = {};
      testScene.errorText = {
        setText: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis(),
        destroyed: true
      };
      
      // Spy on console.warn to verify warning is logged
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      testScene.showError = OnlineModeScene.prototype['showError'];
      testScene.showError.call(testScene, 'Room is full');
      
      // Verify setText and setVisible were NOT called
      expect(testScene.errorText.setText).not.toHaveBeenCalled();
      expect(testScene.errorText.setVisible).not.toHaveBeenCalled();
      
      // Verify warning was logged
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[OnlineModeScene] Tried to show error but errorText is missing or destroyed'
      );
      consoleWarnSpy.mockRestore();
    });
    
    it('should hide error message after timeout only if errorText exists and is not destroyed', () => {
      jest.useFakeTimers();
      
      // Isolated test for setTimeout behavior
      const testScene: any = {};
      testScene.errorText = {
        setText: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis(),
        destroyed: false
      };
      
      testScene.showError = OnlineModeScene.prototype['showError'];
      testScene.showError.call(testScene, 'Room is full');
      
      // Verify initial state
      expect(testScene.errorText.setVisible).toHaveBeenCalledWith(true);
      testScene.errorText.setVisible.mockClear();
      
      // Fast-forward timer
      jest.advanceTimersByTime(3000);
      
      // Verify errorText is hidden after timeout
      expect(testScene.errorText.setVisible).toHaveBeenCalledWith(false);
      
      jest.useRealTimers();
    });
    
    it('should not attempt to hide error message after timeout if errorText has been destroyed', () => {
      jest.useFakeTimers();
      
      // Isolated test for setTimeout behavior with destroyed errorText
      const testScene: any = {};
      testScene.errorText = {
        setText: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis(),
        destroyed: false
      };
      
      testScene.showError = OnlineModeScene.prototype['showError'];
      testScene.showError.call(testScene, 'Room is full');
      
      // Simulate errorText being destroyed during the timeout period
      testScene.errorText.destroyed = true;
      testScene.errorText.setVisible.mockClear();
      
      // Fast-forward timer
      jest.advanceTimersByTime(3000);
      
      // Verify setVisible was NOT called since errorText is now destroyed
      expect(testScene.errorText.setVisible).not.toHaveBeenCalled();
      
      jest.useRealTimers();
    });
  });

  describe('UI Layout and Interactions', () => {
    it('should create all main UI elements with correct visibility and positioning', () => {
      // Title
      expect(scene.add.text).toHaveBeenCalledWith(
        640,
        251.99999999999997,
        'Modo Online',
        expect.objectContaining({ fontSize: expect.any(String), color: '#fff', align: 'center' })
      );
      // Buttons
      expect(scene.add.text).toHaveBeenCalledWith(
        640,
        324,
        'Criar Jogo',
        expect.any(Object)
      );
      expect(scene.add.text).toHaveBeenCalledWith(
        640,
        396.00000000000006,
        'Entrar em Jogo',
        expect.any(Object)
      );
      expect(scene.add.text).toHaveBeenCalledWith(
        640,
        576,
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
