// @ts-nocheck
/* eslint-disable @typescript-eslint/no-empty-function */

// Mock canvas context
const mockContext = {
  // Basic drawing
  fillRect: () => {},
  clearRect: () => {},
  getImageData: () => ({ data: new Uint8ClampedArray() }),
  putImageData: () => {},
  createImageData: () => ({ data: new Uint8ClampedArray() }),
  setTransform: () => {},
  drawImage: () => {},
  save: () => {},
  fillText: () => {},
  restore: () => {},
  beginPath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  closePath: () => {},
  stroke: () => {},
  fill: () => {},
  measureText: () => ({ width: 0 }),
  scale: () => {},
  translate: () => {},
  rotate: () => {},
  arc: () => {},
  rect: () => {},
  clip: () => {},
  
  // Context state
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '',
  textAlign: 'left',
  textBaseline: 'alphabetic',
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
  lineCap: 'butt',
  lineDashOffset: 0,
  lineJoin: 'miter',
  miterLimit: 10,
  shadowBlur: 0,
  shadowColor: 'rgba(0, 0, 0, 0)',
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  filter: 'none',
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'low',
  direction: 'ltr',
  fontKerning: 'auto',
  fontStretch: 'normal',
  fontVariantCaps: 'normal',
  letterSpacing: '0px',
  textRendering: 'auto',
  wordSpacing: '0px',
};

// Mock the CanvasRenderingContext2D
HTMLCanvasElement.prototype.getContext = () => mockContext;

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  constructor(url) {
    this.url = url;
    this.readyState = MockWebSocket.CONNECTING;
    this.onopen = null;
    this.onmessage = null;
    this.onclose = null;
    this.onerror = null;

    // Simulate connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) this.onopen();
    }, 0);
  }


  send(data) {
    // Mock send implementation
  }


  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) this.onclose();
  }
}

// Add WebSocket to global scope
window.WebSocket = MockWebSocket;

// Mock requestAnimationFrame
window.requestAnimationFrame = (callback) => {
  return setTimeout(callback, 0);
};

// Mock cancelAnimationFrame
window.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};

// Mock performance
window.performance = {
  now: () => Date.now(),
  timing: {},
  navigation: {},
  getEntries: () => [],
  mark: () => {},
  measure: () => {},
  clearMarks: () => {},
  clearMeasures: () => {},
  clearResourceTimings: () => {},
};

// Mock matchMedia
window.matchMedia = () => ({
  matches: false,
  addListener: () => {},
  removeListener: () => {},
});

// Mock devicePixelRatio
Object.defineProperty(window, 'devicePixelRatio', {
  value: 1,
  writable: true
});

beforeEach(() => {
  jest.spyOn(global, 'setTimeout');
});

afterEach(() => {
  jest.clearAllMocks();
});
