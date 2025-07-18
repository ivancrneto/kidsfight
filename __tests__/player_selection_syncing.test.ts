import PlayerSelectScene from '../player_select_scene';
import { WebSocketManager } from '../websocket_manager';

// Mock the WebSocketManager module
jest.mock('../websocket_manager', () => ({
  WebSocketManager: {
    getInstance: jest.fn()
  }
}));

describe('PlayerSelectScene - Player Selection Syncing', () => {
  let hostScene: PlayerSelectScene;
  let guestScene: PlayerSelectScene;
  let mockWsManager: any;

  beforeEach(() => {
    // Mock WebSocket Manager
    mockWsManager = {
      send: jest.fn().mockReturnValue(true),
      setMessageCallback: jest.fn(),
      setErrorCallback: jest.fn(),
      onClose: jest.fn(),
      setRoomCode: jest.fn(),
      setHost: jest.fn(),
      getInstance: jest.fn().mockReturnValue(mockWsManager),
      isConnected: jest.fn().mockReturnValue(true)
    };

    // Setup the mock to return our mockWsManager
    (WebSocketManager.getInstance as jest.Mock).mockReturnValue(mockWsManager);

    // Create host scene
    hostScene = new PlayerSelectScene(mockWsManager);
    hostScene.cameras = { main: { width: 800, height: 600 } } as any;
    hostScene.scale = { on: jest.fn() } as any;
    hostScene.add = {
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
    hostScene.scene = { start: jest.fn() } as any;
    hostScene.sys = { game: { config: { width: 800, height: 600 } } } as any;
    
    // Initialize host
    hostScene.init({ mode: 'online', isHost: true, roomCode: 'TEST123' });

    // Create guest scene
    guestScene = new PlayerSelectScene(mockWsManager);
    guestScene.cameras = { main: { width: 800, height: 600 } } as any;
    guestScene.scale = { on: jest.fn() } as any;
    guestScene.add = hostScene.add;
    guestScene.scene = { start: jest.fn() } as any;
    guestScene.sys = { game: { config: { width: 800, height: 600 } } } as any;
    
    // Initialize guest
    guestScene.init({ mode: 'online', isHost: false, roomCode: 'TEST123' });

    // Setup characters for both scenes
    hostScene.characters = [
      { name: 'Bento', key: 'bento', x: 100, y: 100, scale: 0.5 },
      { name: 'Davi R', key: 'davir', x: 200, y: 100, scale: 0.5 },
      { name: 'José', key: 'jose', x: 300, y: 100, scale: 0.5 }
    ];
    guestScene.characters = [...hostScene.characters];
  });

  it('should initialize host with p1 selection and empty p2', () => {
    expect(hostScene.isHost).toBe(true);
    expect(hostScene.selected.p1).toBe('bento'); // Host defaults to bento for p1
    expect(hostScene.selected.p2).toBe(''); // Empty, guest will select
    expect(hostScene.selectedP1Index).toBe(0);
    expect(hostScene.selectedP2Index).toBe(-1); // Invalid index, guest will set
  });

  it('should initialize guest with empty selections waiting for host', () => {
    expect(guestScene.isHost).toBe(false);
    expect(guestScene.selected.p1).toBe(''); // Will be set by host
    expect(guestScene.selected.p2).toBe(''); // Will be set by guest
    expect(guestScene.selectedP1Index).toBe(-1);
    expect(guestScene.selectedP2Index).toBe(-1);
  });

  it('should allow host to select for player 1 only', () => {
    // Host tries to select for player 1 (should work)
    hostScene.setSelectorToCharacter(1, 1); // Select davir for p1
    expect(hostScene.selected.p1).toBe('davir');
    expect(hostScene.selectedP1Index).toBe(1);
    expect(mockWsManager.send).toHaveBeenCalledWith({
      type: 'player_selected',
      player: 'p1',
      character: 'davir'
    });

    // Host tries to select for player 2 (should be ignored)
    mockWsManager.send.mockClear();
    hostScene.setSelectorToCharacter(2, 2); // Try to select jose for p2
    expect(hostScene.selected.p2).toBe(''); // Should remain empty
    expect(hostScene.selectedP2Index).toBe(-1); // Should remain invalid
    expect(mockWsManager.send).not.toHaveBeenCalled(); // Should not send message
  });

  it('should allow guest to select for player 2 only', () => {
    // Guest tries to select for player 2 (should work)
    guestScene.setSelectorToCharacter(2, 2); // Select jose for p2
    expect(guestScene.selected.p2).toBe('jose');
    expect(guestScene.selectedP2Index).toBe(2);
    expect(mockWsManager.send).toHaveBeenCalledWith({
      type: 'player_selected',
      player: 'p2',
      character: 'jose'
    });

    // Guest tries to select for player 1 (should be ignored)
    mockWsManager.send.mockClear();
    guestScene.setSelectorToCharacter(1, 1); // Try to select davir for p1
    expect(guestScene.selected.p1).toBe(''); // Should remain empty
    expect(guestScene.selectedP1Index).toBe(-1); // Should remain invalid
    expect(mockWsManager.send).not.toHaveBeenCalled(); // Should not send message
  });

  it('should properly sync p1 selection from host to guest', () => {
    // Simulate host sending p1 selection to guest
    const p1SelectMessage = {
      type: 'player_selected' as const,
      player: 'p1' as const,
      character: 'davir'
    };
    
    // Guest receives the message
    guestScene['handlePlayerSelected'](p1SelectMessage);
    
    expect(guestScene.selected.p1).toBe('davir');
    expect(guestScene.selectedP1Index).toBe(1);
    expect(guestScene.p1Index).toBe(1);
  });

  it('should properly sync p2 selection from guest to host', () => {
    // Simulate guest sending p2 selection to host
    const p2SelectMessage = {
      type: 'player_selected' as const,
      player: 'p2' as const,
      character: 'jose'
    };
    
    // Host receives the message
    hostScene['handlePlayerSelected'](p2SelectMessage);
    
    expect(hostScene.selected.p2).toBe('jose');
    expect(hostScene.selectedP2Index).toBe(2);
    expect(hostScene.p2Index).toBe(2);
  });

  it('should not have DaviR as default for p2 when host initializes', () => {
    // This test ensures the regression fix - DaviR should not be auto-selected for p2
    expect(hostScene.selected.p2).toBe(''); // Should be empty, not 'davir'
    expect(hostScene.selectedP2Index).toBe(-1); // Should be invalid, not 1
  });

  it('should maintain separate control: host controls p1, guest controls p2', () => {
    // Host selects for p1
    hostScene.setSelectorToCharacter(1, 2); // Select jose for p1
    expect(hostScene.selected.p1).toBe('jose');
    
    // Guest selects for p2
    guestScene.setSelectorToCharacter(2, 1); // Select davir for p2
    expect(guestScene.selected.p2).toBe('davir');
    
    // Verify they don't interfere with each other
    expect(hostScene.selected.p2).toBe(''); // Host p2 should remain empty
    expect(guestScene.selected.p1).toBe(''); // Guest p1 should remain empty
  });
});