// Mock Phaser globally
global.Phaser = require('../__mocks__/phaser').default;
// Mock Phaser globally for all tests
global.Phaser = { 
  Scene: class {}, 
  AUTO: 0,
  Scale: { 
    RESIZE: 0,
    CENTER_BOTH: 0
  },
  Game: class {} 
};

// Mock missing DOM APIs
if (typeof window !== 'undefined') {
  if (!window.matchMedia) {
    window.matchMedia = (query) => ({
      matches: false,
      addListener: () => {},
      removeListener: () => {}
    });
  }
}

// Set up some basic mocks for canvas
if (typeof window !== 'undefined') {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  
  if (!window.ResizeObserver) {
    window.ResizeObserver = ResizeObserver;
  }
}

// Mock filenames for images
jest.mock('../scenario1.png', () => 'mocked-scenario1.png', { virtual: true });
jest.mock('../scenario2.png', () => 'mocked-scenario2.png', { virtual: true });
jest.mock('../sprites-bento3.png', () => 'mocked-player1.png', { virtual: true });
jest.mock('../sprites-davir3.png', () => 'mocked-player2.png', { virtual: true });
jest.mock('../sprites-jose3.png', () => 'mocked-player3.png', { virtual: true });
jest.mock('../sprites-davis3.png', () => 'mocked-player4.png', { virtual: true });
jest.mock('../sprites-carol3.png', () => 'mocked-player5.png', { virtual: true });
jest.mock('../sprites-roni3.png', () => 'mocked-player6.png', { virtual: true });
jest.mock('../sprites-jacqueline3.png', () => 'mocked-player7.png', { virtual: true });
jest.mock('../sprites-ivan3.png', () => 'mocked-player8.png', { virtual: true });
// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  send: jest.fn(),
  close: jest.fn()
}));

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};
// Mock Phaser globally for tests
global.Phaser = {
  Scene: class {},
  Geom: {
    Rectangle: class {
      constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
      }
    }
  },
  Input: {
    Keyboard: {
      JustDown: jest.fn()
    }
  }
};
// Create a minimal mock for Phaser if it's not available
if (typeof global.Phaser === 'undefined') {
  global.Phaser = {
    Scene: class {},
    Scale: {
      RESIZE: 'resize',
      CENTER_BOTH: 'center-both'
    },
    AUTO: 'auto',
    Input: {
      Keyboard: {
        KeyCodes: {
          W: 'W',
          A: 'A',
          S: 'S',
          D: 'D',
          F: 'F',
          G: 'G',
          SPACE: 'SPACE',
          UP: 'UP',
          DOWN: 'DOWN',
          LEFT: 'LEFT',
          RIGHT: 'RIGHT'
        }
      }
    }
  };
}

// Mock canvas if needed
if (typeof HTMLCanvasElement !== 'undefined' && !HTMLCanvasElement.prototype.getContext) {
  HTMLCanvasElement.prototype.getContext = () => ({
    fillRect: () => {},
    clearRect: () => {},
    getImageData: (x, y, w, h) => ({
      data: new Array(w * h * 4)
    }),
    putImageData: () => {},
    createImageData: () => ([]),
    setTransform: () => {},
    drawImage: () => {},
    save: () => {},
    restore: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    stroke: () => {},
    translate: () => {},
    scale: () => {},
    rotate: () => {},
    arc: () => {},
    fill: () => {},
    measureText: () => ({ width: 0 }),
    transform: () => {},
    rect: () => {},
    clip: () => {},
  });
}

// Mock requestAnimationFrame
global.requestAnimationFrame = callback => setTimeout(callback, 0);
// Mock for constants used in KidsFightScene
global.MAX_HEALTH = 100;
global.ATTACK_DAMAGE = 10;
global.SPECIAL_DAMAGE = 20;
