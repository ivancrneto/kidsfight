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

// Enhanced Phaser mock to cover all test requirements
// Add all GameObject, Sprite, Graphics, Text, Rectangle, Physics, and Scene methods used in tests

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
        SHIFT: number;
        CTRL: number;
      };
      createCursorKeys: jest.Mock;
      addKey: jest.Mock;
    };
  };
  GameObjects: {
    GameObject: {
      prototype: any;
    };
    Sprite: {
      prototype: any;
    };
    Text: {
      prototype: any;
    };
    Rectangle: {
      prototype: any;
    };
    Graphics: {
      prototype: any;
    };
  };
  Math: {
    Between: {
      Between: (min: number, max: number) => number;
    };
  };
  Physics: {
    Arcade: {
      Sprite: any;
      Group: any;
      Body: any;
    };
  };
  Scene: any;
};

// Helper to generate a mock object with all common methods
function createPhaserMockObject() {
  return {
    setOrigin: jest.fn().mockReturnThis(),
    setPosition: jest.fn().mockReturnThis(),
    setVisible: jest.fn().mockReturnThis(),
    setTint: jest.fn().mockReturnThis(),
    setAlpha: jest.fn().mockReturnThis(),
    setInteractive: jest.fn().mockReturnThis(),
    setCrop: jest.fn().mockReturnThis(),
    setFrame: jest.fn().mockReturnThis(),
    setScale: jest.fn().mockReturnThis(),
    setBounce: jest.fn().mockReturnThis(),
    setCollideWorldBounds: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    setDisplaySize: jest.fn().mockReturnThis(),
    setStrokeStyle: jest.fn().mockReturnThis(),
    setAllowGravity: jest.fn().mockReturnThis(),
    setImmovable: jest.fn().mockReturnThis(),
    setSize: jest.fn().mockReturnThis(),
    setOffset: jest.fn().mockReturnThis(),
    setFlipX: jest.fn().mockReturnThis(),
    setFlipY: jest.fn().mockReturnThis(),
    play: jest.fn().mockReturnThis(),
    destroy: jest.fn().mockReturnThis(),
    clear: jest.fn().mockReturnThis(),
    fillStyle: jest.fn().mockReturnThis(),
    fillRect: jest.fn().mockReturnThis(),
    setScrollFactor: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    group: jest.fn().mockReturnThis(),
    collider: jest.fn().mockReturnThis(),
    overlap: jest.fn().mockReturnThis(),
    // Add a mock body with blocked.down for physics-based tests
    body: { blocked: { down: true } },
  };
}

// Assign the enhanced mock to global.Phaser in the setup file after type declaration (see below for initialization)



// Initialize Phaser mock
const phaserMock: PhaserMock = {
  Scale: {
    NONE: 0,
    CENTER_BOTH: 1
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
        SHIFT: 16,
        CTRL: 17
      },
      createCursorKeys: jest.fn(() => ({ left: {}, right: {}, up: {} })),
      addKey: jest.fn()
    }
  },
  GameObjects: {
    GameObject: { prototype: createPhaserMockObject() },
    Sprite: { prototype: {
      ...createPhaserMockObject(),
      setFlipX: jest.fn().mockReturnThis(),
      setInteractive: jest.fn().mockReturnThis(),
      body: { blocked: { down: true } },
    } },
    Text: { prototype: {
      ...createPhaserMockObject(),
      setFlipX: jest.fn().mockReturnThis(),
      setInteractive: jest.fn().mockReturnThis(),
      body: { blocked: { down: true } },
    } },
    Rectangle: { prototype: createPhaserMockObject() },
    Graphics: { prototype: createPhaserMockObject() }
  },
  Math: {
    Between: {
      Between: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
    }
  },
  Physics: {
    Arcade: {
      Sprite: createPhaserMockObject(),
      Group: createPhaserMockObject(),
      Body: createPhaserMockObject()
    }
  },
  Scene: createPhaserMockObject()
};

// Assign to global for test files
(global as any).Phaser = phaserMock;

// Patch commonly used scene/physics/add methods globally for all tests
beforeEach(() => {
  // Patch scene.add
  const addMock = {
    rectangle: jest.fn(() => ({
      ...createPhaserMockObject(),
      destroy: jest.fn()
    })),
    text: jest.fn(() => ({
      ...createPhaserMockObject(),
      destroy: jest.fn(),
      setOrigin: jest.fn().mockReturnThis(),
      setInteractive: jest.fn().mockReturnThis(),
      setFlipX: jest.fn().mockReturnThis(),
      body: { blocked: { down: true } },
    })),
    image: jest.fn(() => ({
      ...createPhaserMockObject(),
      destroy: jest.fn()
    })),
    circle: jest.fn(() => ({
      ...createPhaserMockObject(),
      destroy: jest.fn()
    })),
    graphics: jest.fn(() => ({
      ...createPhaserMockObject(),
      destroy: jest.fn()
    })),
    sprite: jest.fn(() => ({
      ...createPhaserMockObject(),
      destroy: jest.fn(),
      setFlipX: jest.fn().mockReturnThis(),
      body: { blocked: { down: true } },
    })),
  };
  // Patch scene.physics.add
  const staticGroupMock = () => ({
    create: jest.fn(() => ({
      ...createPhaserMockObject(),
      setDisplaySize: jest.fn().mockReturnThis(),
      setVisible: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis(),
      setAlpha: jest.fn().mockReturnThis(),
      refreshBody: jest.fn().mockReturnThis(),
      destroy: jest.fn(),
      setFlipX: jest.fn().mockReturnThis(),
      setInteractive: jest.fn().mockReturnThis(),
      body: { blocked: { down: true } },
    }))
  });
  const physicsAddMock = {
    sprite: jest.fn(() => ({ ...createPhaserMockObject(), destroy: jest.fn() })),
    staticGroup: jest.fn(staticGroupMock),
    group: jest.fn(() => ({ add: jest.fn() })),
    collider: jest.fn(),
    overlap: jest.fn()
  };
  // Patch scene.physics
  const physicsMock = {
    add: physicsAddMock,
    world: { setBounds: jest.fn() },
    pause: jest.fn().mockReturnThis(), // Make pause chainable
  };
  // Patch scene.scene
  const sceneSceneMock = {
    start: jest.fn(),
    pause: jest.fn(),
    stop: jest.fn(),
    resume: jest.fn(),
    isActive: jest.fn().mockReturnValue(true),
    isPaused: jest.fn().mockReturnValue(false),
    isSleeping: jest.fn().mockReturnValue(false),
    isVisible: jest.fn().mockReturnValue(true)
  };
  // Patch scene
  (global as any).mockScene = {
    add: addMock,
    physics: physicsMock,
    scene: sceneSceneMock,
    cameras: { main: { width: 800, height: 600 } },
    scale: { width: 800, height: 600, on: jest.fn() },
    sys: { game: { config: { width: 800, height: 600 }, canvas: { width: 800, height: 600 }, device: { os: { android: false, iOS: false } } } },
    input: { keyboard: { createCursorKeys: jest.fn(() => ({ left: {}, right: {}, up: {} })), addKey: jest.fn() } },
    time: { delayedCall: jest.fn(), addEvent: jest.fn() },
    anims: { create: jest.fn(), play: jest.fn() },
    player1: undefined,
    player2: undefined,
    playerDirection: ['right', 'left'],
    playerBlocking: [false, false],
    playerHealth: [100, 100],
    TOTAL_HEALTH: 100
  };
});

// Initialize global mocks
const mockWebSocketInstances: MockWebSocketInstance[] = [];

// WebSocket mock implementation
class MockWebSocketImpl implements MockWebSocketInstance {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  CONNECTING = 0;
  OPEN = 1;
  CLOSING = 2;
  CLOSED = 3;

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

  send(data: string | ArrayBuffer | Blob | ArrayBufferView): void {
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

const mockWebSocketConstructor = createMockWebSocket;

// --- Test WebSocket Mock Types ---
interface MockWebSocketInstance {
  url: string;
  readyState: number;
  CONNECTING: number;
  OPEN: number;
  CLOSING: number;
  CLOSED: number;
  binaryType: string;
  bufferedAmount: number;
  extensions: string;
}

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
