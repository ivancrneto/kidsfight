/**
 * @jest-environment jsdom
 */

import { WebSocketManager } from '../websocket_manager';

// Mock WebSocket
class MockWebSocket {
  public send = jest.fn();
  public close = jest.fn();
  public readyState = WebSocket.OPEN;
  public addEventListener = jest.fn();
  public removeEventListener = jest.fn();
  
  constructor(public url: string) {}
}

// Add WebSocket constants to the mock
MockWebSocket.OPEN = 1;
MockWebSocket.CLOSED = 3;
MockWebSocket.CLOSING = 2;
MockWebSocket.CONNECTING = 0;

// Mock global WebSocket
(global as any).WebSocket = MockWebSocket;

describe('WebSocket Rematch Tests', () => {
  let wsManager: WebSocketManager;
  let mockWebSocket: MockWebSocket;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create fresh WebSocket manager instance
    wsManager = WebSocketManager.getInstance();
    
    // Connect to initialize WebSocket
    wsManager.connect('test-room');
    
    // Get the mock WebSocket instance
    mockWebSocket = (wsManager as any)._ws as MockWebSocket;
  });

  afterEach(() => {
    // Clean up singleton instance
    (WebSocketManager as any).instance = null;
  });

  describe('sendReplayRequest Method', () => {
    it('should send replay request with correct parameters', () => {
      const matchId = 'room-123';
      const playerId = '0'; // localPlayerIndex as string
      const additionalData = {
        gameMode: 'online',
        isHost: true,
        selectedScenario: 'scenario1',
        selected: { p1: 'bento', p2: 'davir' }
      };

      const result = wsManager.sendReplayRequest(matchId, playerId, additionalData);

      expect(result).toBe(true);
      expect(mockWebSocket.send).toHaveBeenCalledTimes(1);

      // Parse the sent message
      const sentMessage = JSON.parse(mockWebSocket.send.mock.calls[0][0]);
      
      expect(sentMessage).toEqual({
        type: 'replay_request',
        matchId: 'room-123',
        playerId: '0',
        roomCode: 'room-123',
        gameMode: 'online',
        isHost: true,
        selectedScenario: 'scenario1',
        selected: { p1: 'bento', p2: 'davir' },
        timestamp: expect.any(Number)
      });

      // Verify timestamp is recent
      const now = Date.now();
      expect(sentMessage.timestamp).toBeGreaterThan(now - 1000);
      expect(sentMessage.timestamp).toBeLessThanOrEqual(now);
    });

    it('should send replay request without additional data', () => {
      const matchId = 'room-456';
      const playerId = '1';

      const result = wsManager.sendReplayRequest(matchId, playerId);

      expect(result).toBe(true);
      expect(mockWebSocket.send).toHaveBeenCalledTimes(1);

      // Parse the sent message
      const sentMessage = JSON.parse(mockWebSocket.send.mock.calls[0][0]);
      
      expect(sentMessage).toEqual({
        type: 'replay_request',
        matchId: 'room-456',
        playerId: '1',
        roomCode: 'room-456',
        timestamp: expect.any(Number)
      });
    });

    it('should handle empty additional data object', () => {
      const matchId = 'room-789';
      const playerId = '0';
      const additionalData = {};

      const result = wsManager.sendReplayRequest(matchId, playerId, additionalData);

      expect(result).toBe(true);
      expect(mockWebSocket.send).toHaveBeenCalledTimes(1);

      // Parse the sent message
      const sentMessage = JSON.parse(mockWebSocket.send.mock.calls[0][0]);
      
      expect(sentMessage).toEqual({
        type: 'replay_request',
        matchId: 'room-789',
        playerId: '0',
        roomCode: 'room-789',
        timestamp: expect.any(Number)
      });
    });

    it('should return false when WebSocket is not connected', () => {
      // Simulate disconnected state
      mockWebSocket.readyState = WebSocket.CLOSED;
      
      // Spy on console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = wsManager.sendReplayRequest('room-123', '0');

      expect(result).toBe(false);
      expect(mockWebSocket.send).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('[WSM] Cannot send replay request - not connected');

      consoleSpy.mockRestore();
    });

    it('should return false when WebSocket send throws error', () => {
      // Make send throw an error
      mockWebSocket.send.mockImplementation(() => {
        throw new Error('Send failed');
      });
      
      // Spy on console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = wsManager.sendReplayRequest('room-123', '0');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('[WSM] Error sending message:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle null or undefined WebSocket gracefully', () => {
      // Remove WebSocket instance
      (wsManager as any)._ws = null;
      
      // Spy on console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = wsManager.sendReplayRequest('room-123', '0');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('[WSM] Cannot send replay request - not connected');

      consoleSpy.mockRestore();
    });
  });

  describe('Connection State Validation', () => {
    it('should correctly identify connected state', () => {
      mockWebSocket.readyState = WebSocket.OPEN;
      expect(wsManager.isConnected()).toBe(true);
    });

    it('should correctly identify disconnected states', () => {
      // Test various disconnected states
      const disconnectedStates = [WebSocket.CLOSED, WebSocket.CLOSING, WebSocket.CONNECTING];
      
      disconnectedStates.forEach(state => {
        mockWebSocket.readyState = state;
        expect(wsManager.isConnected()).toBe(false);
      });
    });
  });

  describe('Message Format Validation', () => {
    it('should always include required fields in replay request', () => {
      wsManager.sendReplayRequest('test-room', 'player-1');
      
      const sentMessage = JSON.parse(mockWebSocket.send.mock.calls[0][0]);
      
      // Verify required fields
      expect(sentMessage).toHaveProperty('type', 'replay_request');
      expect(sentMessage).toHaveProperty('matchId', 'test-room');
      expect(sentMessage).toHaveProperty('playerId', 'player-1');
      expect(sentMessage).toHaveProperty('timestamp');
      expect(typeof sentMessage.timestamp).toBe('number');
    });

    it('should properly merge additional data without overriding core fields', () => {
      const additionalData = {
        type: 'should_not_override', // Should not override the core type
        matchId: 'should_not_override', // Should not override the core matchId
        playerId: 'should_not_override', // Should not override the core playerId
        customField: 'custom_value',
        gameMode: 'online'
      };

      wsManager.sendReplayRequest('correct-room', 'correct-player', additionalData);
      
      const sentMessage = JSON.parse(mockWebSocket.send.mock.calls[0][0]);
      
      // Verify core fields are not overridden
      expect(sentMessage.type).toBe('replay_request');
      expect(sentMessage.matchId).toBe('correct-room');
      expect(sentMessage.playerId).toBe('correct-player');
      
      // Verify additional data is included
      expect(sentMessage.customField).toBe('custom_value');
      expect(sentMessage.gameMode).toBe('online');
    });

    it('should handle complex nested additional data', () => {
      const complexData = {
        selected: {
          p1: 'bento',
          p2: 'davir'
        },
        settings: {
          difficulty: 'normal',
          roundTime: 60
        },
        metadata: {
          version: '1.0.0',
          features: ['rematch', 'spectate']
        }
      };

      wsManager.sendReplayRequest('room-complex', 'player-complex', complexData);
      
      const sentMessage = JSON.parse(mockWebSocket.send.mock.calls[0][0]);
      
      // Verify complex data is preserved
      expect(sentMessage.selected).toEqual({ p1: 'bento', p2: 'davir' });
      expect(sentMessage.settings).toEqual({ difficulty: 'normal', roundTime: 60 });
      expect(sentMessage.metadata).toEqual({ version: '1.0.0', features: ['rematch', 'spectate'] });
    });
  });

  describe('Integration with Game Scene Parameters', () => {
    it('should handle typical game scene rematch request', () => {
      // Simulate the exact call pattern from KidsFightScene
      const roomCode = 'game-room-abc123';
      const localPlayerIndex = '1';
      const gameData = {
        gameMode: 'online',
        isHost: false,
        selectedScenario: 'scenario2',
        selected: {
          p1: 'jose',
          p2: 'carol'
        }
      };

      const result = wsManager.sendReplayRequest(roomCode, localPlayerIndex, gameData);

      expect(result).toBe(true);
      
      const sentMessage = JSON.parse(mockWebSocket.send.mock.calls[0][0]);
      
      expect(sentMessage).toEqual({
        type: 'replay_request',
        matchId: 'game-room-abc123',
        playerId: '1',
        roomCode: 'game-room-abc123',
        gameMode: 'online',
        isHost: false,
        selectedScenario: 'scenario2',
        selected: {
          p1: 'jose',
          p2: 'carol'
        },
        timestamp: expect.any(Number)
      });
    });

    it('should handle host player rematch request', () => {
      const gameData = {
        gameMode: 'online',
        isHost: true,
        selectedScenario: 'scenario1',
        selected: {
          p1: 'ivan',
          p2: 'd_isa'
        }
      };

      wsManager.sendReplayRequest('host-room', '0', gameData);
      
      const sentMessage = JSON.parse(mockWebSocket.send.mock.calls[0][0]);
      
      expect(sentMessage.isHost).toBe(true);
      expect(sentMessage.playerId).toBe('0');
      expect(sentMessage.selected).toEqual({ p1: 'ivan', p2: 'd_isa' });
    });
  });
});