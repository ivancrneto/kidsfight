// --- GLOBAL MOCK SETUP ---
import '../__tests__/setup'; // Ensure the mock is set up before anything else

// Always initialize the global WebSocket mock at the very top for this test context
if (!global.mockWebSocketInstances) global.mockWebSocketInstances = [];

function createMockWebSocket(url: string) {
  const listeners: Record<string, Function[]> = {
    open: [],
    message: [],
    close: [],
    error: []
  };
  
  const mockWebSocket: any = {
    url,
    readyState: WebSocket.CONNECTING,
    CONNECTING: WebSocket.CONNECTING,
    OPEN: WebSocket.OPEN,
    CLOSING: WebSocket.CLOSING,
    CLOSED: WebSocket.CLOSED,
    binaryType: 'arraybuffer' as const,
    bufferedAmount: 0,
    extensions: '',
    protocol: '',
    onopen: null,
    onclose: null,
    onerror: null,
    onmessage: null,
    _listeners: { ...listeners },
    _trigger: function(event: 'open' | 'message' | 'error' | 'close', data?: any) {
      if (event === 'open') {
        this.readyState = this.OPEN;
        const openEvent = new Event('open');
        if (this.onopen) this.onopen(openEvent);
        (this._listeners['open'] || []).forEach((cb: Function) => cb(openEvent));
      } else if (event === 'message') {
        // Simulate real WebSocket: .data is string, parse if needed
        let messageData = data;
        if (typeof data !== 'string') messageData = JSON.stringify(data);
        const messageEvent = new MessageEvent('message', { data: messageData });
        if (this.onmessage) this.onmessage(messageEvent);
        (this._listeners['message'] || []).forEach((cb: Function) => cb(messageEvent));
      } else if (event === 'close') {
        this.readyState = this.CLOSED;
        const closeEvent = new CloseEvent('close', {
          code: data?.code || 1000,
          reason: data?.reason || '',
          wasClean: true
        });
        if (this.onclose) this.onclose(closeEvent);
        (this._listeners['close'] || []).forEach((cb: Function) => cb(closeEvent));
      } else if (event === 'error') {
        const errorEvent = new Event('error');
        if (this.onerror) this.onerror(errorEvent);
        (this._listeners['error'] || []).forEach((cb: Function) => cb(errorEvent));
      }
    },
    send: jest.fn(function (data: string) {
      if (this.readyState !== this.OPEN) {
        throw new Error('WebSocket not open');
      }
      // Store the last sent message for testing
      this.lastSentMessage = JSON.parse(data);
    }),
    close: jest.fn(function(this: any, code?: number, reason?: string) {
      if (this.readyState === this.CLOSED) return;
      this.readyState = this.CLOSING;
      this._trigger('close', { code, reason });
    }),
    addEventListener: jest.fn(function(this: any, type: string, cb: Function) {
      if (!this._listeners[type]) this._listeners[type] = [];
      this._listeners[type].push(cb);
      return this;
    }),
    removeEventListener: jest.fn(function(this: any, type: string, cb: Function) {
      if (!this._listeners[type]) return;
      this._listeners[type] = this._listeners[type].filter((fn: Function) => fn !== cb);
      return this;
    }),
    dispatchEvent: jest.fn(function(this: any, eventObj: any) {
      const type = eventObj.type;
      (this._listeners[type] || []).forEach((cb: Function) => cb(eventObj));
    })
  };
  global.mockWebSocketInstances.push(mockWebSocket);
  return mockWebSocket;
}

global.mockWebSocketConstructor = jest.fn(createMockWebSocket) as unknown as typeof WebSocket;
global.WebSocket = global.mockWebSocketConstructor;

import { jest } from '@jest/globals';

// Helper types
type WebSocketEvent = 'open' | 'message' | 'error' | 'close';

// Define a type for the mock WebSocket implementation
interface MockWebSocket extends WebSocket {
  _trigger: (event: WebSocketEvent, data?: any) => void;
  _listeners: Record<string, Function[]>;
  _readyState: number;
  send: jest.MockedFunction<WebSocket['send']>;
  close: jest.MockedFunction<WebSocket['close']>;
  addEventListener: jest.MockedFunction<WebSocket['addEventListener']>;
  removeEventListener: jest.MockedFunction<WebSocket['removeEventListener']>;
  dispatchEvent: jest.MockedFunction<WebSocket['dispatchEvent']>;
  url: string;
  onopen: ((this: WebSocket, ev: Event) => any) | null;
  onclose: ((this: WebSocket, ev: CloseEvent) => any) | null;
  onerror: ((this: WebSocket, ev: Event) => any) | null;
  onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null;
}

let WebSocketManager: any;

beforeAll(() => {
  // Import the manager only after the global mock is set up
  WebSocketManager = require('../websocket_manager').WebSocketManager;
});

beforeEach(() => {
  WebSocketManager.resetInstance();
  jest.clearAllMocks();
});

// Increase timeout for WebSocket tests
jest.setTimeout(10000);

// Mock timers for better control
beforeAll(() => {
  jest.useRealTimers();
});

// Add WebSocket to global namespace for Node.js environment
declare global {
  interface Window {
    WebSocket: typeof WebSocket;
  }
  var WebSocket: typeof globalThis.WebSocket;
}

describe('WebSocketManager', () => {
  let wsManager: WebSocketManager;

  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    global.mockWebSocketInstances.length = 0;
    wsManager = WebSocketManager.getInstance(global.mockWebSocketConstructor);
  });

  afterEach(() => {
    wsManager.disconnect();
    WebSocketManager.resetInstance();
    jest.clearAllMocks();
    global.mockWebSocketInstances.length = 0;
  });

  it('should connect to the WebSocket server', async () => {
    const url = 'ws://test-server';
    const connectPromise = wsManager.connect(url);
    const mockWebSocket = wsManager._ws;
    mockWebSocket._trigger('open');
    await connectPromise;
    expect(global.mockWebSocketConstructor).toHaveBeenCalledWith(url);
    expect(wsManager.isConnected()).toBe(true);
  });

  it('should resolve when connection is established', async () => {
    const connectPromise = wsManager.connect('ws://test-server');
    const mockWebSocket = wsManager._ws;
    mockWebSocket._trigger('open');
    await connectPromise;
    expect(wsManager.isConnected()).toBe(true);
  });

  it('should send a message through the WebSocket', async () => {
    const connectPromise = wsManager.connect('ws://test-server');
    const mockWebSocket = wsManager._ws;
    mockWebSocket._trigger('open');
    await connectPromise;
    const testMessage = { type: 'test', data: 'hello' };
    const result = wsManager.send(testMessage);
    expect(result).toBe(true);
    expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(testMessage));
  });

  it('should call the message handler when a message is received', async () => {
    const connectPromise = wsManager.connect('ws://test-server');
    const mockWebSocket = wsManager._ws;
    mockWebSocket._trigger('open');
    await connectPromise;
    const messageHandler = jest.fn();
    wsManager.setMessageCallback((event) => {
      messageHandler(JSON.parse(event.data));
    });
    const testData = { type: 'test', data: 'test data' };
    mockWebSocket._trigger('message', testData);
    expect(messageHandler).toHaveBeenCalledWith(testData);
  });

  it('should track connection status correctly', async () => {
    expect(wsManager.isConnected()).toBe(false);
    const connectPromise = wsManager.connect('ws://test-server');
    const mockWebSocket = wsManager._ws;
    mockWebSocket._trigger('open');
    await connectPromise;
    expect(wsManager.isConnected()).toBe(true);
    mockWebSocket._trigger('close');
    expect(wsManager.isConnected()).toBe(false);
  });

  it('should send a game action message', async () => {
    const connectPromise = wsManager.connect('ws://test-server');
    const mockWebSocket = wsManager._ws;
    mockWebSocket._trigger('open');
    await connectPromise;
    const action = 'move';
    const data = { x: 10, y: 20 };
    const result = wsManager.sendGameAction(action, data);
    expect(result).toBe(true);
    const sendCalls = mockWebSocket.send.mock.calls;
    const sentMessage = JSON.parse(sendCalls[sendCalls.length - 1][0]);
    expect(sentMessage).toMatchObject({
      type: 'game_action',
      action,
      x: 10,
      y: 20
    });
    expect(typeof sentMessage.timestamp).toBe('number');
  });

  it('should handle connection close correctly', async () => {
    const connectPromise = wsManager.connect('ws://test-server');
    const mockWebSocket = wsManager._ws;
    mockWebSocket._trigger('open');
    await connectPromise;
    const closeCallback = jest.fn();
    wsManager.onClose(closeCallback);
    mockWebSocket._trigger('close');
    expect(closeCallback).toHaveBeenCalled();
    expect(wsManager.isConnected()).toBe(false);
  });

  it('should reconnect after disconnection', async () => {
    const firstUrl = 'ws://test-server-1';
    const connectPromise1 = wsManager.connect(firstUrl);
    const mockWebSocket1 = wsManager._ws;
    mockWebSocket1._trigger('open');
    await connectPromise1;
    expect(wsManager.isConnected()).toBe(true);
    wsManager.disconnect();
    expect(wsManager.isConnected()).toBe(false);
    const secondUrl = 'ws://test-server-2';
    const connectPromise2 = wsManager.connect(secondUrl);
    const mockWebSocket2 = wsManager._ws;
    mockWebSocket2._trigger('open');
    await connectPromise2;
    expect(wsManager.isConnected()).toBe(true);
    expect(global.mockWebSocketConstructor).toHaveBeenCalledWith(secondUrl);
  });

  it('should handle multiple message callbacks', async () => {
    // Create mock message handlers
    const messageHandler1 = jest.fn();
    const messageHandler2 = jest.fn();
    
    // Set up a single message callback that calls both handlers
    // This must be done before connecting to ensure the WebSocketManager sets up the event listener
    wsManager.onMessage((event) => {
      // The WebSocketManager will have already parsed the message data for us
      messageHandler1(event.data);
      messageHandler2(event.data);
    });
    
    // Now set up the WebSocket connection
    const connectPromise = wsManager.connect('ws://test-server');
    const mockWebSocket = wsManager._ws;
    
    // Trigger the open event after setting up the message callback
    mockWebSocket._trigger('open');
    await connectPromise;

    // Create a test message
    const testData = { type: 'test', data: 'test' };
    
    // Use the mock's _trigger method to simulate a message event
    // This will go through the WebSocketManager's internal message handling
    mockWebSocket._trigger('message', testData);
    
    // Verify the message handlers were called with the expected data
    expect(messageHandler1).toHaveBeenCalledWith(expect.objectContaining({
      type: 'test',
      data: 'test'
    }));
    
    expect(messageHandler2).toHaveBeenCalledWith(expect.objectContaining({
      type: 'test',
      data: 'test'
    }));
    
    // Also verify the handlers were called exactly once each
    expect(messageHandler1).toHaveBeenCalledTimes(1);
    expect(messageHandler2).toHaveBeenCalledTimes(1);
  });

  it('should set and get host status', async () => {
    const connectPromise = wsManager.connect('ws://test');
    const mockWebSocket = wsManager._ws;
    mockWebSocket._trigger('open');
    await connectPromise;
    mockWebSocket.send.mockClear();
    wsManager.setHost(true);
    expect(mockWebSocket.send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'host_status', isHost: true })
    );
  });

  it('should set and get room code', async () => {
    const roomCode = 'TEST123';
    const connectPromise = wsManager.connect('ws://test');
    const mockWebSocket = wsManager._ws;
    mockWebSocket._trigger('open');
    await connectPromise;
    mockWebSocket.send.mockClear();
    wsManager.setRoomCode(roomCode);
    expect(mockWebSocket.send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'room_code', roomCode })
    );
  });
});

describe('message handling', () => {
  let wsManager: WebSocketManager;

  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    global.mockWebSocketInstances.length = 0;
    wsManager = WebSocketManager.getInstance(global.mockWebSocketConstructor);
  });

  afterEach(() => {
    wsManager.disconnect();
    jest.clearAllMocks();
    global.mockWebSocketInstances.length = 0;
  });

  it('should handle incoming messages', async () => {
    const testMessage = { type: 'test', data: 'test' };
    const connectPromise = wsManager.connect('ws://test');
    const mockWebSocket = wsManager._ws;
    mockWebSocket._trigger('open');
    await connectPromise;
    const handler = jest.fn();
    wsManager.setMessageCallback((event) => {
      handler(JSON.parse(event.data));
    });
    mockWebSocket._trigger('message', testMessage);
    expect(handler).toHaveBeenCalledWith(testMessage);
  });

  it('should send messages', async () => {
    const testMessage = { type: 'test', data: 'test' };
    const connectPromise = wsManager.connect('ws://test');
    const mockWebSocket = wsManager._ws;
    mockWebSocket._trigger('open');
    await connectPromise;
    mockWebSocket.send.mockClear();
    const result = wsManager.send(testMessage);
    expect(result).toBe(true);
    expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(testMessage));
  });
});

describe('host and room code', () => {
  let wsManager: WebSocketManager;

  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    global.mockWebSocketInstances.length = 0;
    wsManager = WebSocketManager.getInstance(global.mockWebSocketConstructor);
  });

  afterEach(() => {
    wsManager.disconnect();
    jest.clearAllMocks();
    global.mockWebSocketInstances.length = 0;
  });

  it('should set and get host status', async () => {
    const connectPromise = wsManager.connect('ws://test');
    const mockWebSocket = wsManager._ws;
    mockWebSocket._trigger('open');
    await connectPromise;
    mockWebSocket.send.mockClear();
    wsManager.setHost(true);
    expect(mockWebSocket.send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'host_status', isHost: true })
    );
  });

  it('should set and get room code', async () => {
    const roomCode = 'TEST123';
    const connectPromise = wsManager.connect('ws://test');
    const mockWebSocket = wsManager._ws;
    mockWebSocket._trigger('open');
    await connectPromise;
    mockWebSocket.send.mockClear();
    wsManager.setRoomCode(roomCode);
    expect(mockWebSocket.send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'room_code', roomCode })
    );
  });
});
