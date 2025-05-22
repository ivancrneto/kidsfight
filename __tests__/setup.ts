// Test setup file for Jest

// Import global type declarations
/// <reference path="./global.d.ts" />

// Mock requestAnimationFrame and cancelAnimationFrame
if (!global.requestAnimationFrame) {
  global.requestAnimationFrame = (callback: FrameRequestCallback): number => {
    return window.setTimeout(callback, 1000 / 60);
  };
}

if (!global.cancelAnimationFrame) {
  global.cancelAnimationFrame = (id: number): void => {
    clearTimeout(id);
  };
}

// Minimal Phaser mock
type PhaserMock = {
  Scale: {
    NONE: number;
    CENTER_BOTH: number;
  };
  Input: {
    Keyboard: {
      KeyCodes: {
        LEFT: number;
        RIGHT: number;
        UP: number;
        DOWN: number;
        SPACE: number;
        ENTER: number;
      };
    };
  };
  GameObjects: {
    GameObject: {
      prototype: {
        setOrigin: jest.Mock;
        setPosition: jest.Mock;
        setVisible: jest.Mock;
        setTint: jest.Mock;
        setAlpha: jest.Mock;
        setInteractive: jest.Mock;
        on: jest.Mock;
      };
    };
  };
  Math: {
    Between: {
      Between: (min: number, max: number) => number;
    };
  };
};

declare global {
  // Test utilities
  const getMockWebSocketInstances: () => MockWebSocketInstance[];
  const simulateServerMessage: (message: any, instanceIndex?: number) => void;
  const mockWebSocketInstances: MockWebSocketInstance[];
  const mockWebSocketConstructor: any;

  // Extend the global scope
  interface Window {
    Phaser: PhaserMock;
  }

  namespace NodeJS {
    interface Global {
      Phaser: PhaserMock;
      mockWebSocketInstances: MockWebSocketInstance[];
      getMockWebSocketInstances: () => MockWebSocketInstance[];
      simulateServerMessage: (message: any, instanceIndex?: number) => void;
      mockWebSocketConstructor: any;
    }
  }
}

// Initialize Phaser mock
const phaserMock: PhaserMock = {
  Scale: {
    NONE: 0,
    CENTER_BOTH: 1,
  },
  Input: {
    Keyboard: {
      KeyCodes: {
        LEFT: 37,
        RIGHT: 39,
        UP: 38,
        DOWN: 40,
        SPACE: 32,
        ENTER: 13,
      },
    },
  },
  GameObjects: {
    GameObject: {
      prototype: {
        setOrigin: jest.fn(),
        setPosition: jest.fn(),
        setVisible: jest.fn(),
        setTint: jest.fn(),
        setAlpha: jest.fn(),
        setInteractive: jest.fn(),
        on: jest.fn(),
      },
    },
  },
  Math: {
    Between: {
      Between: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min),
    },
  },
};

// Initialize global mocks
const mockWebSocketInstances: MockWebSocketInstance[] = [];

// WebSocket mock implementation
class MockWebSocketImpl implements MockWebSocketInstance {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  url: string;
  readyState: number = MockWebSocketImpl.CONNECTING;
  binaryType: BinaryType = 'blob';
  bufferedAmount: number = 0;
  extensions: string = '';
  protocol: string = '';
  
  onopen: ((this: WebSocket, ev: Event) => any) | null = null;
  onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null = null;
  onerror: ((this: WebSocket, ev: Event) => any) | null = null;
  onclose: ((this: WebSocket, ev: CloseEvent) => any) | null = null;

  private listeners: { [type: string]: Function[] } = {};

  constructor(url: string) {
    this.url = url;
    setTimeout(() => {
      this.readyState = MockWebSocketImpl.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open') as any);
      }
    }, 0);
  }

  send(_data: string | ArrayBuffer | Blob | ArrayBufferView): void {
    // Mock implementation
  }


  close(_code?: number, _reason?: string): void {
    this.readyState = MockWebSocketImpl.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { wasClean: true }) as any);
    }
  }
  
  addEventListener(type: string, listener: EventListenerOrEventListenerObject | null): void {
    if (!listener) return;
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    const handler = typeof listener === 'function' ? listener : listener.handleEvent.bind(listener);
    this.listeners[type].push(handler);
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject | null): void {
    if (!listener || !this.listeners[type]) return;
    const handler = typeof listener === 'function' ? listener : listener.handleEvent.bind(listener);
    const index = this.listeners[type].indexOf(handler);
    if (index !== -1) {
      this.listeners[type].splice(index, 1);
    }
  }

  dispatchEvent(event: Event): boolean {
    const handlers = this.listeners[event.type] || [];
    for (const handler of [...handlers]) {
      handler(event);
    }
    return !event.defaultPrevented;
  }
  
  _triggerMessage(data: any): void {
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    const event = new MessageEvent('message', { data: message });
    
    if (this.onmessage) {
      this.onmessage(event as any);
    }
    
    this.dispatchEvent(event);
  }
}

// Create mock WebSocket constructor
function createMockWebSocket(this: any, url: string): WebSocket {
  const ws = new MockWebSocketImpl(url);
  mockWebSocketInstances.push(ws);
  return ws as unknown as WebSocket;
}

// Add static properties to the mock constructor
const mockWebSocketConstructor = Object.assign(createMockWebSocket, {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
});

// Setup global mocks
if (!('Phaser' in global)) {
  global.Phaser = phaserMock;
}

if (!('WebSocket' in global)) {
  global.WebSocket = mockWebSocketConstructor as any;
}

// Add test utilities to global scope
if (!('mockWebSocketInstances' in global)) {
  global.mockWebSocketInstances = mockWebSocketInstances;
  global.getMockWebSocketInstances = () => mockWebSocketInstances;
  global.simulateServerMessage = (message: any, instanceIndex: number = 0): void => {
    const instance = mockWebSocketInstances[instanceIndex];
    if (instance) {
      instance._triggerMessage(message);
    }
  };
  global.mockWebSocketConstructor = mockWebSocketConstructor;
}

// Set up document body
document.body.innerHTML = '<div id="game"></div>';

// Polyfill PointerEvent
if (typeof global.PointerEvent === 'undefined') {
  // @ts-ignore
  global.PointerEvent = class MockPointerEvent extends Event {
    constructor(type: string, props: any) {
      super(type, props);
      Object.assign(this, props);
    }
  };
}

// Cleanup after tests
afterEach(() => {
  mockWebSocketInstances.length = 0;
  jest.clearAllMocks();
});

// Simple test to make Jest happy
describe('Test setup', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
});
