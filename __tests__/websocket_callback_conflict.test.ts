import PlayerSelectScene from '../player_select_scene';
import { WebSocketManager } from '../websocket_manager';

// Mock the WebSocketManager module
jest.mock('../websocket_manager', () => ({
  WebSocketManager: {
    getInstance: jest.fn()
  }
}));

describe('PlayerSelectScene - WebSocket Callback Conflict Prevention', () => {
  let scene: PlayerSelectScene;
  let mockWsManager: any;
  let mockSetMessageCallback: jest.Mock;

  beforeEach(() => {
    // Track calls to setMessageCallback to detect conflicts
    mockSetMessageCallback = jest.fn();
    
    // Mock WebSocket Manager with callback tracking
    mockWsManager = {
      send: jest.fn().mockReturnValue(true),
      setMessageCallback: mockSetMessageCallback,
      setErrorCallback: jest.fn(),
      onClose: jest.fn(),
      setRoomCode: jest.fn(),
      setHost: jest.fn(),
      getInstance: jest.fn().mockReturnValue(mockWsManager),
      isConnected: jest.fn().mockReturnValue(true)
    };

    // Setup the mock to return our mockWsManager
    (WebSocketManager.getInstance as jest.Mock).mockReturnValue(mockWsManager);

    // Create scene for online mode
    scene = new PlayerSelectScene(mockWsManager);
    scene.cameras = { main: { width: 800, height: 600 } } as any;
    scene.scale = { on: jest.fn() } as any;
    scene.add = {
      image: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setDisplaySize: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis()
      }),
      rectangle: jest.fn().mockReturnValue({ setDepth: jest.fn().mockReturnThis() }),
      text: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis(),
        on: jest.fn(),
        displayWidth: 100,
        setText: jest.fn().mockReturnThis(),
        setBackgroundColor: jest.fn().mockReturnThis(),
        disableInteractive: jest.fn().mockReturnThis(),
        setStyle: jest.fn().mockReturnThis()
      }),
      circle: jest.fn().mockReturnValue({
        setVisible: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setStrokeStyle: jest.fn().mockReturnThis()
      }),
      sprite: jest.fn().mockReturnValue({
        setScale: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        setCrop: jest.fn().mockReturnThis(),
        on: jest.fn()
      })
    } as any;
    scene.scene = { start: jest.fn() } as any;
    scene.sys = { game: { config: { width: 800, height: 600 } } } as any;
    
    // Initialize as online host
    scene.init({ mode: 'online', isHost: true, roomCode: 'TEST123' });

    // Setup characters for the scene
    scene.characters = [
      { name: 'Bento', key: 'bento', x: 100, y: 100, scale: 0.5 },
      { name: 'Davi R', key: 'davir', x: 200, y: 100, scale: 0.5 },
      { name: 'José', key: 'jose', x: 300, y: 100, scale: 0.5 }
    ];
  });

  it('should only call setMessageCallback once to prevent callback conflicts', () => {
    // Simulate scene.create() which sets up WebSocket handlers
    scene.create();
    
    // Verify that setMessageCallback was called exactly once
    expect(mockSetMessageCallback).toHaveBeenCalledTimes(1);
    
    // Verify the callback is a function
    expect(mockSetMessageCallback).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should process player_selected messages through the unified handler', () => {
    // Create scene and setup handlers
    scene.create();
    
    // Get the message handler that was registered
    const messageHandler = mockSetMessageCallback.mock.calls[0][0];
    
    // Spy on handlePlayerSelected to verify it gets called
    const handlePlayerSelectedSpy = jest.spyOn(scene as any, 'handlePlayerSelected');
    
    // Simulate receiving a p2 character selection WebSocket message
    const mockMessageEvent = {
      data: JSON.stringify({
        type: 'player_selected',
        player: 'p2',
        character: 'jose',
        roomCode: 'TEST123'
      })
    } as MessageEvent;
    
    // Call the message handler
    messageHandler(mockMessageEvent);
    
    // Verify handlePlayerSelected was called with the correct data
    expect(handlePlayerSelectedSpy).toHaveBeenCalledWith({
      type: 'player_selected',
      player: 'p2',
      character: 'jose',
      roomCode: 'TEST123'
    });
  });

  it('should update selectedP2Index correctly when receiving p2 selection', () => {
    // Create scene and setup handlers
    scene.create();
    
    // Get the message handler that was registered
    const messageHandler = mockSetMessageCallback.mock.calls[0][0];
    
    // Initial state should have p2 index as -1 (not selected)
    expect(scene.selectedP2Index).toBe(-1);
    expect(scene.selected.p2).toBe('');
    
    // Simulate receiving a p2 character selection WebSocket message
    const mockMessageEvent = {
      data: JSON.stringify({
        type: 'player_selected',
        player: 'p2',
        character: 'jose',
        roomCode: 'TEST123'
      })
    } as MessageEvent;
    
    // Call the message handler
    messageHandler(mockMessageEvent);
    
    // Verify the selection was processed correctly
    expect(scene.selectedP2Index).toBe(2); // jose is at index 2
    expect(scene.selected.p2).toBe('jose');
    expect(scene.p2Index).toBe(2);
  });

  it('should include both debug and main handler logging in unified callback', () => {
    // Spy on console.log to verify both types of logging occur
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Create scene and setup handlers
    scene.create();
    
    // Get the message handler that was registered
    const messageHandler = mockSetMessageCallback.mock.calls[0][0];
    
    // Simulate receiving a WebSocket message
    const mockMessageEvent = {
      data: JSON.stringify({
        type: 'player_selected',
        player: 'p1',
        character: 'bento'
      })
    } as MessageEvent;
    
    // Call the message handler
    messageHandler(mockMessageEvent);
    
    // Verify both debug and main handler logs are present
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[DEBUG][PlayerSelectScene] Incoming WebSocket message:',
      expect.objectContaining({
        type: 'player_selected',
        player: 'p1', 
        character: 'bento'
      })
    );
    
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[PlayerSelectScene] MAIN MESSAGE HANDLER - Received message:',
      expect.objectContaining({
        type: 'player_selected',
        player: 'p1',
        character: 'bento'
      })
    );
    
    // Cleanup
    consoleLogSpy.mockRestore();
  });

  it('should prevent the regression where debug handler overwrites main handler', () => {
    // This test specifically prevents the bug where setupWebSocketDebug() 
    // would overwrite setupWebSocketHandlers() callback
    
    // Create scene and setup handlers
    scene.create();
    
    // Verify only one setMessageCallback call occurred (no overwrite)
    expect(mockSetMessageCallback).toHaveBeenCalledTimes(1);
    
    // Get the registered handler
    const messageHandler = mockSetMessageCallback.mock.calls[0][0];
    
    // Verify the handler can process different message types (proving it's the main handler)
    const handlePlayerSelectedSpy = jest.spyOn(scene as any, 'handlePlayerSelected');
    const handlePlayerReadySpy = jest.spyOn(scene as any, 'handlePlayerReady');
    
    // Test player_selected message
    messageHandler({
      data: JSON.stringify({
        type: 'player_selected',
        player: 'p1',
        character: 'bento'
      })
    } as MessageEvent);
    
    // Test playerReady message  
    messageHandler({
      data: JSON.stringify({
        type: 'playerReady',
        player1Ready: true
      })
    } as MessageEvent);
    
    // Verify both handlers were called, proving the main handler is active
    expect(handlePlayerSelectedSpy).toHaveBeenCalled();
    expect(handlePlayerReadySpy).toHaveBeenCalled();
  });

  it('should maintain proper character selection state for game launch validation', () => {
    // This test ensures the fix allows proper game launch validation
    
    // Create scene and setup handlers
    scene.create();
    
    // Get the message handler
    const messageHandler = mockSetMessageCallback.mock.calls[0][0];
    
    // Set up p1 selection (host selection)
    scene.selected.p1 = 'davis';
    scene.selectedP1Index = 3;
    
    // Simulate receiving p2 selection via WebSocket
    messageHandler({
      data: JSON.stringify({
        type: 'player_selected',
        player: 'p2',
        character: 'jose'
      })
    } as MessageEvent);
    
    // Verify both players have valid selections for game launch
    expect(scene.selected.p1).toBe('davis');
    expect(scene.selected.p2).toBe('jose');
    expect(scene.selectedP1Index).toBe(3);
    expect(scene.selectedP2Index).toBe(2);
    
    // Verify the state that would cause game launch validation to pass
    expect(scene.selectedP2Index).not.toBe(-1); // This was the bug - it was -1
    expect(scene.selected.p2).not.toBe(''); // This was the bug - it was empty
  });
});