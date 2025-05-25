import PlayerSelectScene from '../player_select_scene';
import { WebSocketManager } from '../websocket_manager';

// Mock WebSocketManager
const mockWebSocketManager = {
  send: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  isConnected: jest.fn().mockReturnValue(true),
  isHost: jest.fn().mockReturnValue(false),
  getRoomCode: jest.fn().mockReturnValue('TEST123'),
  setRoomCode: jest.fn(),
  setHost: jest.fn()
};

// Mock Phaser components
const mockScene = {
  add: {
    text: jest.fn().mockReturnValue({
      setOrigin: jest.fn(),
      setScrollFactor: jest.fn(),
      setDepth: jest.fn(),
      setVisible: jest.fn(),
      setText: jest.fn(),
      setInteractive: jest.fn(),
      on: jest.fn()
    }),
    circle: jest.fn().mockReturnValue({
      setOrigin: jest.fn(),
      setStrokeStyle: jest.fn(),
      setInteractive: jest.fn(),
      setScale: jest.fn(),
      setTint: jest.fn(),
      setAlpha: jest.fn(),
      setPosition: jest.fn(),
      on: jest.fn(),
      setVisible: jest.fn()
    }),
    rectangle: jest.fn().mockReturnValue({
      setOrigin: jest.fn(),
      setDisplaySize: jest.fn(),
      setDepth: jest.fn(),
      setScrollFactor: jest.fn(),
      setStrokeStyle: jest.fn(),
      setInteractive: jest.fn(),
      on: jest.fn()
    }),
    sprite: jest.fn().mockReturnValue({
      setOrigin: jest.fn(),
      setScale: jest.fn(),
      setCrop: jest.fn(),
      setInteractive: jest.fn(),
      on: jest.fn()
    })
  },
  scale: {
    on: jest.fn(),
    width: 800,
    height: 600
  },
  cameras: {
    main: {
      width: 800,
      height: 600
    }
  },
  sys: {
    game: {
      config: {
        width: 800,
        height: 600
      }
    }
  },
  physics: {}
};

describe('Player Selection Behaviour', () => {
  let scene: PlayerSelectScene;

  beforeEach(() => {
    // Create a fresh instance for each test
    scene = new PlayerSelectScene(mockWebSocketManager as unknown as WebSocketManager);
    
    // Mock the scene properties
    Object.assign(scene, mockScene);
    
    // Setup test environment
    scene.init({ mode: 'local' });
    scene.create();
    
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Character Selection', () => {
    it('should allow player 1 to select a character in local mode', () => {
      // Simulate clicking on the first character
      const firstChar = scene.characters[0];
      const clickHandler = firstChar.bgCircle?.on.mock.calls.find(
        (call: any) => call[0] === 'pointerdown'
      )?.[1];
      
      // Trigger the click
      clickHandler?.();
      
      // Verify player 1 selection was updated
      expect(scene.selected.p1).toBe(firstChar.key);
      expect(scene.p1Index).toBe(0);
    });

    it('should alternate between players in local mode', () => {
      // First click should select for player 1
      const firstChar = scene.characters[0];
      const clickHandler = firstChar.bgCircle?.on.mock.calls.find(
        (call: any) => call[0] === 'pointerdown'
      )?.[1];
      
      // First click - player 1
      clickHandler?.();
      expect(scene.selected.p1).toBe(firstChar.key);
      
      // Second click - should select for player 2
      const secondChar = scene.characters[1];
      const secondClickHandler = secondChar.bgCircle?.on.mock.calls.find(
        (call: any) => call[0] === 'pointerdown'
      )?.[1];
      
      secondClickHandler?.();
      expect(scene.selected.p2).toBe(secondChar.key);
    });

    it('should only allow player 1 to select in online mode', () => {
      // Set up online mode
      scene.init({ mode: 'online', roomCode: 'TEST123', isHost: true });
      scene.create();
      
      // Try to select with player 2 (should be ignored)
      const firstChar = scene.characters[0];
      const clickHandler = firstChar.bgCircle?.on.mock.calls.find(
        (call: any) => call[0] === 'pointerdown'
      )?.[1];
      
      // Simulate click (should be for player 1 only)
      clickHandler?.();
      
      // Only player 1 should be updated
      expect(scene.selected.p1).toBe(firstChar.key);
      expect(scene.selected.p2).not.toBe(firstChar.key);
    });
  });

  describe('WebSocket Integration', () => {
    it('should send player selection to WebSocket in online mode', () => {
      // Set up online mode
      scene.init({ mode: 'online', roomCode: 'TEST123', isHost: true });
      scene.create();
      
      // Simulate character selection
      const firstChar = scene.characters[0];
      const clickHandler = firstChar.bgCircle?.on.mock.calls.find(
        (call: any) => call[0] === 'pointerdown'
      )?.[1];
      
      clickHandler?.();
      
      // Verify WebSocket message was sent
      expect(mockWebSocketManager.send).toHaveBeenCalledWith({
        type: 'playerSelected',
        player: 'p1',
        character: firstChar.key
      });
    });
  });

  describe('Selection Indicators', () => {
    it('should update selection indicators when characters are selected', () => {
      // Spy on updateSelectionIndicators
      const updateSpy = jest.spyOn(scene as any, 'updateSelectionIndicators');
      
      // Simulate character selection
      const firstChar = scene.characters[0];
      const clickHandler = firstChar.bgCircle?.on.mock.calls.find(
        (call: any) => call[0] === 'pointerdown'
      )?.[1];
      
      clickHandler?.();
      
      // Verify indicators were updated
      expect(updateSpy).toHaveBeenCalled();
      expect(scene.p1SelectorCircle.setPosition).toHaveBeenCalledWith(
        firstChar.x,
        firstChar.y + (firstChar.bgCircleOffsetY || 0)
      );
    });
  });
});
