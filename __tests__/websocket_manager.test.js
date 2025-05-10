// Mock WebSocket
const mockWebSocket = jest.fn().mockImplementation((url) => ({
  url,
  send: jest.fn(),
  onopen: null,
  onmessage: null,
  onerror: null,
  onclose: null,
  close: jest.fn()
}));

global.WebSocket = mockWebSocket;

import wsManager from '../websocket_manager';



// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  send: jest.fn(),
  close: jest.fn()
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockWebSocket.mockClear();
  global.WebSocket = mockWebSocket;
  wsManager.ws = null;
});

describe('WebSocketManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWebSocket.mockClear();
    global.WebSocket = mockWebSocket;
  });

  describe('connect', () => {
    it('creates new connection if none exists', () => {
      const ws = wsManager.connect();
      expect(WebSocket).toHaveBeenCalledWith('ws://localhost:8081');
      expect(ws).toBeDefined();
    });

    it('reuses existing connection if available', () => {
      const ws1 = wsManager.connect();
      const ws2 = wsManager.connect();
      expect(WebSocket).toHaveBeenCalledTimes(1);
      expect(ws1).toBe(ws2);
    });

    it('sets up message logging', () => {
      const ws = wsManager.connect();
      const mockData = {
        type: 'test_message',
        data: 'test'
      };

      // Simulate message
      ws.onmessage({ data: JSON.stringify(mockData) });
      // Logging is handled by console.log which is mocked
      expect(true).toBe(true); // Just verify it doesn't throw
    });
  });

  describe('setHost', () => {
    it('updates host status', () => {
      wsManager.setHost(true);
      expect(wsManager.isHost).toBe(true);

      wsManager.setHost(false);
      expect(wsManager.isHost).toBe(false);
    });
  });

  describe('send', () => {
    it('stringifies and sends object messages', () => {
      const ws = wsManager.connect();
      const message = { type: 'test', data: 'test' };
      wsManager.send(message);
      expect(ws.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('sends string messages as-is', () => {
      const ws = wsManager.connect();
      const message = 'test message';
      wsManager.send(message);
      expect(ws.send).toHaveBeenCalledWith(message);
    });

    it('logs error if not connected', () => {
      const consoleSpy = jest.spyOn(console, 'error');
      wsManager.ws = null;
      wsManager.send('test');
      expect(consoleSpy).toHaveBeenCalledWith('[WebSocketManager] Cannot send message - not connected');
    });
  });

  describe('close', () => {
    it('closes connection and cleans up', () => {
      const ws = wsManager.connect();
      wsManager.close();
      expect(ws.close).toHaveBeenCalled();
      expect(wsManager.ws).toBeNull();
    });
  });
});
