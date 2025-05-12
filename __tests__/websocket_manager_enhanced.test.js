// Enhanced tests for WebSocket manager with focus on debugging and message handling
import wsManager from '../websocket_manager';

// Mock WebSocket
const mockWebSocket = jest.fn().mockImplementation((url) => ({
  url,
  send: jest.fn(),
  onopen: null,
  onmessage: null,
  onerror: null,
  onclose: null,
  close: jest.fn(),
  readyState: WebSocket.OPEN
}));

// Mock WebSocket constants
global.WebSocket = {
  OPEN: 1,
  CONNECTING: 0,
  CLOSING: 2,
  CLOSED: 3
};

// Assign the mock to the WebSocket constructor
global.WebSocket = Object.assign(mockWebSocket, global.WebSocket);

// Set DEV to true for testing
jest.mock('../globals.js', () => ({
  DEV: true
}));

describe('Enhanced WebSocket Manager', () => {
  let consoleSpy;
  let consoleErrorSpy;
  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    mockWebSocket.mockClear();
    
    // Reset WebSocketManager instance
    wsManager.ws = null;
    wsManager.isHost = false;
    
    // Spy on console methods
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('Enhanced debugging', () => {
    it('should log detailed information for game_action messages when received', () => {
      // Connect to initialize WebSocket
      const ws = wsManager.connect();
      
      // Create a mock game action message
      const mockGameAction = {
        type: 'game_action',
        action: {
          type: 'move',
          direction: 'right'
        }
      };
      
      // Simulate receiving a message
      ws.onmessage({
        data: JSON.stringify(mockGameAction)
      });
      
      // Check that the enhanced logging captured the action details
      expect(consoleSpy).toHaveBeenCalledWith(
        '[WebSocketManager] Received game action:',
        expect.objectContaining({
          actionType: 'move',
          direction: 'right',
          isHost: wsManager.isHost,
          fullData: mockGameAction
        })
      );
    });
    
    it('should log detailed information for game_action messages when sending', () => {
      // Connect to initialize WebSocket
      const ws = wsManager.connect();
      
      // Set connected state
      ws.readyState = WebSocket.OPEN;
      
      // Create a mock game action message
      const mockGameAction = {
        type: 'game_action',
        action: {
          type: 'attack',
          direction: null
        }
      };
      
      // Send the message
      wsManager.send(mockGameAction);
      
      // Check that the enhanced logging captured the action details
      expect(consoleSpy).toHaveBeenCalledWith(
        '[WebSocketManager] Sending game action:',
        expect.objectContaining({
          actionType: 'attack',
          direction: null,
          isHost: wsManager.isHost
        })
      );
      
      // Check that the message was sent properly
      expect(ws.send).toHaveBeenCalledWith(JSON.stringify(mockGameAction));
    });
    
    it('should log detailed information for replay_request messages', () => {
      // Connect to initialize WebSocket
      const ws = wsManager.connect();
      
      // Set connected state
      ws.readyState = WebSocket.OPEN;
      
      // Create a mock replay request message
      const mockReplayRequest = {
        type: 'replay_request',
        action: 'request_rematch',
        roomCode: 'ABC123',
        timestamp: Date.now()
      };
      
      // Send the message
      wsManager.send(mockReplayRequest);
      
      // Check that the enhanced logging captured the request details
      expect(consoleSpy).toHaveBeenCalledWith(
        '[WebSocketManager] Sending replay request:',
        expect.objectContaining({
          action: 'request_rematch',
          roomCode: 'ABC123',
          isHost: wsManager.isHost
        })
      );
      
      // Check that the message was sent properly
      expect(ws.send).toHaveBeenCalledWith(JSON.stringify(mockReplayRequest));
    });
    
    it('should log detailed information for replay_response messages', () => {
      // Connect to initialize WebSocket
      const ws = wsManager.connect();
      
      // Create a mock replay response message
      const mockReplayResponse = {
        type: 'replay_response',
        action: 'accept_rematch',
        accepted: true
      };
      
      // Simulate receiving a message
      ws.onmessage({
        data: JSON.stringify(mockReplayResponse)
      });
      
      // Check that the enhanced logging captured the response details
      expect(consoleSpy).toHaveBeenCalledWith(
        '[WebSocketManager] Received replay response:',
        expect.objectContaining({
          action: 'accept_rematch',
          accepted: true,
          isHost: wsManager.isHost
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should log error when trying to parse invalid JSON', () => {
      // Connect to initialize WebSocket
      const ws = wsManager.connect();
      
      // Simulate receiving a malformed message
      ws.onmessage({
        data: 'This is not valid JSON'
      });
      
      // Check that the error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[WebSocketManager] Error processing message:',
        expect.any(Error),
        'This is not valid JSON'
      );
    });
    
    it('should handle WebSocket errors', () => {
      // Connect to initialize WebSocket
      const ws = wsManager.connect();
      
      // Simulate a WebSocket error
      const mockError = new Error('Connection failed');
      ws.onerror(mockError);
      
      // Check that the error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[WebSocketManager] WebSocket error:',
        mockError
      );
    });
  });

  describe('Connection status', () => {
    it('should check if connection is established', () => {
      // Connect to initialize WebSocket
      const ws = wsManager.connect();
      
      // Set connected state
      ws.readyState = WebSocket.OPEN;
      
      // Check isConnected method
      expect(wsManager.isConnected()).toBe(true);
      
      // Change to disconnected state
      ws.readyState = WebSocket.CLOSED;
      
      // Check isConnected method again
      expect(wsManager.isConnected()).toBe(false);
    });
  });

  describe('sendGameAction method', () => {
    it('should format and send game actions properly', () => {
      // Connect to initialize WebSocket
      const ws = wsManager.connect();
      
      // Set connected state
      ws.readyState = WebSocket.OPEN;
      
      // Prepare an action
      const action = {
        type: 'move',
        direction: 'right'
      };
      
      // Send game action
      wsManager.sendGameAction(action);
      
      // Check that the action was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        '[WebSocketManager] Sending game action:',
        action
      );
      
      // Check that the message was sent with correct format
      expect(ws.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'game_action',
          action: action
        })
      );
    });
    
    it('should log error when trying to send game action while disconnected', () => {
      // Reset WebSocket
      wsManager.ws = null;
      
      // Prepare an action
      const action = {
        type: 'attack',
        direction: null
      };
      
      // Try to send while disconnected
      wsManager.sendGameAction(action);
      
      // Check that error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[WebSocketManager] Cannot send game action - not connected'
      );
    });
  });
});
