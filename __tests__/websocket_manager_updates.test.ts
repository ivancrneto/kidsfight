// --- GLOBAL MOCK SETUP ---
import './setup'; // Ensure the mock is set up before anything else
jest.mock('../websocket_manager');

import { WebSocketManager, mockWebSocket, MockWebSocket } from '../__mocks__/websocket_manager';
import { jest } from '@jest/globals';

// Use a plain object as the mock WebSocket
const wsFactory = () => ({
  send: jest.fn(),
  close: jest.fn(),
  readyState: 1,
  addEventListener: jest.fn(),
  resetMocks: jest.fn()
});

beforeEach(() => {
  WebSocketManager.resetInstance();
  if (mockWebSocket) mockWebSocket.readyState = 1; // Ensure OPEN before each test
  if (mockWebSocket && mockWebSocket.send) mockWebSocket.send.mockClear();
});

describe('WebSocketManager Position and Health Updates', () => {
  let wsManager: WebSocketManager;

  beforeEach(() => {
    WebSocketManager.resetInstance();
    wsManager = WebSocketManager.getInstance(wsFactory);
    if (mockWebSocket) mockWebSocket.readyState = 1;
    if (mockWebSocket && mockWebSocket.send) mockWebSocket.send.mockClear();
  });

  afterEach(() => {
    if (wsManager) wsManager.disconnect();
    WebSocketManager.resetInstance();
    jest.clearAllMocks();
  });

  describe('sendPositionUpdate', () => {
    it('should send player position updates with correct coordinates', () => {
      // Test values that match the fixed player positioning (memory 8827e41a)
      const playerIndex = 0;
      const x = 240; // 30% of screen width 800
      const y = 270; // 45% of screen height 600
      const velocityX = 0;
      const velocityY = 0;
      const flipX = false;
      const frame = 0;
      
      const result = wsManager.sendPositionUpdate(
        playerIndex, x, y, velocityX, velocityY, flipX, frame
      );
      
      expect(result).toBe(true);
      expect(mockWebSocket.send).toHaveBeenCalled();
      
      // Get the last sent message
      const sendCalls = mockWebSocket.send.mock.calls;
      const sentMessage = JSON.parse(sendCalls[sendCalls.length - 1][0]);
      
      // Verify the message content
      expect(sentMessage).toMatchObject({
        type: 'position_update',
        playerIndex,
        x,
        y,
        velocityX,
        velocityY,
        flipX,
        frame
      });
      expect(typeof sentMessage.timestamp).toBe('number');
    });
    
    it('should send position updates for second player at the correct position', () => {
      // Test for player 2 at 70% of screen width
      const playerIndex = 1;
      const x = 560; // 70% of screen width 800
      const y = 270; // 45% of screen height 600
      const velocityX = 0;
      const velocityY = 0;
      const flipX = true; // Player 2 is often facing left (flipped)
      
      const result = wsManager.sendPositionUpdate(
        playerIndex, x, y, velocityX, velocityY, flipX
      );
      
      expect(result).toBe(true);
      
      // Get the last sent message
      const sendCalls = mockWebSocket.send.mock.calls;
      const sentMessage = JSON.parse(sendCalls[sendCalls.length - 1][0]);
      
      // Verify the message content
      expect(sentMessage).toMatchObject({
        type: 'position_update',
        playerIndex,
        x,
        y,
        velocityX,
        velocityY,
        flipX
      });
      // Optional frame parameter should not be included if not provided
      expect(sentMessage.frame).toBeUndefined();
    });
    
    it('should return false if not connected', () => {
      // Disconnect first
      wsManager.disconnect();
      
      const result = wsManager.sendPositionUpdate(
        0, 100, 100, 0, 0, false
      );
      
      expect(result).toBe(false);
      expect(mockWebSocket.send).not.toHaveBeenCalled();
    });
  });

  describe('sendHealthUpdate', () => {
    it('should send player health updates with correct values', () => {
      const playerIndex = 0;
      const health = 80; // Health after taking some damage
      
      const result = wsManager.sendHealthUpdate(playerIndex, health);
      
      expect(result).toBe(true);
      expect(mockWebSocket.send).toHaveBeenCalled();
      
      // Get the last sent message
      const sendCalls = mockWebSocket.send.mock.calls;
      const sentMessage = JSON.parse(sendCalls[sendCalls.length - 1][0]);
      
      // Verify the message content
      expect(sentMessage).toMatchObject({
        type: 'health_update',
        playerIndex,
        health
      });
      expect(typeof sentMessage.timestamp).toBe('number');
    });
    
    it('should return false if not connected', () => {
      // Disconnect first
      wsManager.disconnect();
      
      const result = wsManager.sendHealthUpdate(0, 50);
      
      expect(result).toBe(false);
      expect(mockWebSocket.send).not.toHaveBeenCalled();
    });
  });

  describe('sendReplayRequest and sendReplayResponse', () => {
    it('should send replay request with correct match and player IDs', () => {
      const matchId = 'match-123';
      const playerId = 'player-456';
      const additionalData = { message: 'Want to play again?' };
      
      const result = wsManager.sendReplayRequest(matchId, playerId, additionalData);
      
      expect(result).toBe(true);
      
      // Get the last sent message
      const sendCalls = mockWebSocket.send.mock.calls;
      const sentMessage = JSON.parse(sendCalls[sendCalls.length - 1][0]);
      
      // Verify the message content
      expect(sentMessage).toMatchObject({
        type: 'replay_request',
        matchId,
        playerId,
        message: 'Want to play again?'
      });
      expect(typeof sentMessage.timestamp).toBe('number');
    });
    
    it('should send replay response with acceptance status', () => {
      const matchId = 'match-123';
      const accepted = true;
      
      const result = wsManager.sendReplayResponse(matchId, accepted);
      
      expect(result).toBe(true);
      
      // Get the last sent message
      const sendCalls = mockWebSocket.send.mock.calls;
      const sentMessage = JSON.parse(sendCalls[sendCalls.length - 1][0]);
      
      // Verify the message content
      expect(sentMessage).toMatchObject({
        type: 'replay_response',
        matchId,
        accepted
      });
      expect(typeof sentMessage.timestamp).toBe('number');
    });
  });

  describe('sendGameAction with position data', () => {
    it('should ensure x and y coordinates are numbers', () => {
      // Sometimes x and y might come as strings from form inputs or URL params
      const action = 'move';
      const data = { x: '240', y: '270' };
      
      const result = wsManager.sendGameAction(action, data);
      
      expect(result).toBe(true);
      
      // Get the last sent message
      const sendCalls = mockWebSocket.send.mock.calls;
      const sentMessage = JSON.parse(sendCalls[sendCalls.length - 1][0]);
      
      // Verify the message content - x and y should be converted to numbers
      expect(sentMessage).toMatchObject({
        type: 'game_action',
        action,
        x: 240,
        y: 270
      });
      expect(typeof sentMessage.x).toBe('number');
      expect(typeof sentMessage.y).toBe('number');
    });
  });

  describe('message handling for position updates', () => {
    it('should correctly handle incoming position update messages', () => {
      const messageHandler = jest.fn();
      wsManager.onMessage((event) => {
        messageHandler(JSON.parse(event.data));
      });

      // Simulate receiving a position update message
      wsManager.simulateMessage({ type: 'position_update', playerIndex: 0, x: 240, y: 270 });
      expect(messageHandler).toHaveBeenCalledWith(expect.objectContaining({ type: 'position_update', playerIndex: 0, x: 240, y: 270 }));
    });

    it('should correctly handle incoming health update messages', () => {
      const messageHandler = jest.fn();
      wsManager.onMessage((event) => {
        messageHandler(JSON.parse(event.data));
      });

      // Simulate receiving a health update message
      wsManager.simulateMessage({ type: 'health_update', playerIndex: 1, health: 88 });
      expect(messageHandler).toHaveBeenCalledWith(expect.objectContaining({ type: 'health_update', playerIndex: 1, health: 88 }));
    });
  });

  describe('error handling', () => {
    it('should catch and log errors when sending a position update', () => {
      // Mock console.error to capture the error message
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Force an error in the send method
      mockWebSocket.send.mockImplementationOnce(() => {
        throw new Error('Send failed');
      });
      
      const result = wsManager.sendPositionUpdate(0, 240, 270, 0, 0, false);
      
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[WSM] Error sending position update:',
        expect.any(Error)
      );
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });
});
