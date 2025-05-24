import Phaser from 'phaser';
import PlayerSelectScene from '../player_select_scene';

// Mock WebSocketManager
class MockWebSocketManager {
  public send = jest.fn();
  public setMessageCallback = jest.fn();
  public disconnect = jest.fn();
  public isConnected = jest.fn().mockReturnValue(true);
}

describe('PlayerSelectScene WebSocket Handling', () => {
  let scene: PlayerSelectScene;
  let wsManager: MockWebSocketManager;
  let startedScene: { key: string; data: any } | null;
  
  beforeEach(() => {
    startedScene = null;
    wsManager = new MockWebSocketManager();
    
    // Create PlayerSelectScene with mock WebSocketManager
    scene = new PlayerSelectScene(wsManager as any);
    
    // Mock Phaser methods
    scene.scene = {
      start: jest.fn((key, data) => { startedScene = { key, data }; })
    } as any;
    
    scene.add = {
      text: jest.fn(() => ({ 
        setOrigin: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        setBackgroundColor: jest.fn().mockReturnThis(),
        setText: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis()
      })),
      rectangle: jest.fn(() => ({})),
      ellipse: jest.fn(() => ({
        setOrigin: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis()
      }))
    } as any;
    
    scene.cameras = { main: { width: 800, height: 600 } } as any;
    
    // Initialize scene with online mode data
    scene['mode'] = 'online';
    scene['roomCode'] = 'TEST123';
    scene['selected'] = { p1: 'player1', p2: 'player2' };
  });
  
  describe('WebSocket Message Sending', () => {
    it('should send player_selected message without double stringification', () => {
      // Call the method that sends player_selected
      scene['sendWebSocketMessage']({
        type: 'player_selected',
        player: 'p1',
        character: 'player1'
      });
      
      // Verify the message was sent as an object, not a stringified JSON
      expect(wsManager.send).toHaveBeenCalledWith(expect.objectContaining({
        type: 'player_selected',
        player: 'p1',
        character: 'player1'
      }));
    });
  });
  
  describe('WebSocket Message Handling', () => {
    it('should handle already parsed objects in message handler', () => {
      // Setup the WebSocket handlers
      scene['setupWebSocketHandlers']();
      
      // Mock handlePlayerSelected method
      scene['handlePlayerSelected'] = jest.fn();
      
      // Get the callback that was registered
      const messageCallback = wsManager.setMessageCallback.mock.calls[0][0];
      
      // Test with an already parsed object (not a string)
      const parsedMessage = {
        data: {
          type: 'player_selected',
          player: 'p1',
          character: 'player1'
        }
      };
      
      // Call the message callback with the parsed object
      messageCallback(parsedMessage);
      
      // Verify handlePlayerSelected was called with the correct data
      expect(scene['handlePlayerSelected']).toHaveBeenCalledWith(parsedMessage.data);
    });
    
    it('should handle both snake_case and camelCase message types', () => {
      // Setup the WebSocket handlers
      scene['setupWebSocketHandlers']();
      
      // Mock handler methods
      scene['handlePlayerSelected'] = jest.fn();
      scene['handleGameStart'] = jest.fn();
      
      // Get the callback that was registered
      const messageCallback = wsManager.setMessageCallback.mock.calls[0][0];
      
      // Test with snake_case message type
      const snakeCaseMessage = {
        data: {
          type: 'player_selected',
          player: 'p1',
          character: 'player1'
        }
      };
      
      // Call the message callback with snake_case message
      messageCallback(snakeCaseMessage);
      
      // Verify handler was called
      expect(scene['handlePlayerSelected']).toHaveBeenCalledWith(snakeCaseMessage.data);
      
      // Reset mocks
      jest.clearAllMocks();
      
      // Test with camelCase message type
      const camelCaseMessage = {
        data: {
          type: 'gameStart',
          p1Char: 'player1',
          p2Char: 'player2'
        }
      };
      
      // Call the same message callback with camelCase message
      messageCallback(camelCaseMessage);
      
      // Verify handler was called
      expect(scene['handleGameStart']).toHaveBeenCalledWith(camelCaseMessage.data);
    });
  });
  
  describe('Scene Transitions', () => {
    it('should pass WebSocketManager to ScenarioSelectScene when host launches game', () => {
      // Setup as host
      scene['isHost'] = true;
      
      // Call launchGame
      scene['launchGame']();
      
      // Verify scene transition with WebSocketManager in data
      expect(startedScene?.key).toBe('ScenarioSelectScene');
      expect(startedScene?.data.wsManager).toBe(wsManager);
    });
    
    it('should set up message handler for game_start when guest launches game', () => {
      // Setup as guest
      scene['isHost'] = false;
      
      // Call launchGame
      scene['launchGame']();
      
      // Verify message callback was set
      expect(wsManager.setMessageCallback).toHaveBeenCalled();
      
      // Get the callback function
      const callback = wsManager.setMessageCallback.mock.calls[0][0];
      
      // Create a game_start message
      const gameStartMessage = {
        data: {
          type: 'game_start',
          p1Char: 'player1',
          p2Char: 'player2',
          scenario: 'scenario1',
          roomCode: 'TEST123'
        }
      };
      
      // Call the callback with the game_start message
      callback(gameStartMessage);
      
      // Verify scene transition to KidsFightScene
      expect(startedScene?.key).toBe('KidsFightScene');
      expect(startedScene?.data.selected).toEqual({ p1: 'player1', p2: 'player2' });
      expect(startedScene?.data.scenario).toBe('scenario1');
    });
  });
});
