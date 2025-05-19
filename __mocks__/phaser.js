// __mocks__/phaser.js
console.log('<<<<< UNIQUE MOCK PHASER.JS LOADED >>>>>');

// Mock CanvasFeatures to prevent initialization errors
const CanvasFeatures = {
  checkInverseAlpha: jest.fn(),
  get: jest.fn()
};

// Mock device features
const Device = {
  canvasFeatures: CanvasFeatures,
  canvas: true,
  webGL: true,
  fullscreen: {
    available: true,
    active: false
  }
};

// Mock physics body
const mockBody = {
  setAllowGravity: jest.fn(),
  setGravityY: jest.fn(),
  setMaxVelocity: jest.fn(),
  setCollideWorldBounds: jest.fn(),
  setBounce: jest.fn(),
  setImmovable: jest.fn(),
  velocity: { x: 0, y: 0 },
  allowGravity: true,
  gravity: { x: 0, y: 0 }
};

// Minimal stub for Phaser classes and methods used in KidsFightScene tests
class Scene {
  constructor() {
    this.cameras = {
      main: {
        width: 800,
        height: 600,
        setBounds: jest.fn(),
        startFollow: jest.fn(),
        setZoom: jest.fn(),
        setRoundPixels: jest.fn(),
      }
    };
    this.add = {
      sprite: jest.fn().mockReturnValue({
        setCollideWorldBounds: jest.fn(),
        setBounce: jest.fn(),
        setDepth: jest.fn(),
        setOrigin: jest.fn(),
        setScale: jest.fn(),
        play: jest.fn(),
        setImmovable: jest.fn(),
        setVelocity: jest.fn(),
        setSize: jest.fn(),
        setOffset: jest.fn(),
        setInteractive: jest.fn(),
        on: jest.fn(),
        destroy: jest.fn(),
        body: mockBody,
        x: 0,
        y: 0,
        width: 50,
        height: 100,
        flipX: false,
        setFlipX: jest.fn(function(flip) { this.flipX = flip; return this; }),
        setPosition: jest.fn(function(x, y) { this.x = x; this.y = y; return this; })
      }),
      graphics: jest.fn().mockReturnValue({
        fillRect: jest.fn(),
        fillStyle: jest.fn(),
        clear: jest.fn(),
        lineStyle: jest.fn(),
        strokeRect: jest.fn(),
        destroy: jest.fn(),
        fillCircle: jest.fn(),
        setAlpha: jest.fn()
      }),
      text: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setStyle: jest.fn().mockReturnThis(),
        setText: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        destroy: jest.fn().mockReturnThis(),
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        text: ''
      }),
      rectangle: jest.fn().mockReturnValue({
        setDisplaySize: jest.fn().mockReturnThis(),
        setFillStyle: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setSize: jest.fn().mockReturnThis(),
        setStrokeStyle: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        destroy: jest.fn()
      }),
      circle: jest.fn().mockReturnValue({
        setStrokeStyle: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis(),
      }),
    };
    this.physics = {
      add: {
        sprite: jest.fn().mockReturnValue({
          setCollideWorldBounds: jest.fn(),
          setBounce: jest.fn(),
          setDepth: jest.fn(),
          setOrigin: jest.fn(),
          setScale: jest.fn(),
          play: jest.fn(),
          setImmovable: jest.fn(),
          setVelocity: jest.fn(),
          setSize: jest.fn(),
          setOffset: jest.fn(),
          setInteractive: jest.fn(),
          on: jest.fn(),
          destroy: jest.fn(),
          body: mockBody
        })
      }
    };
    this.anims = {
      create: jest.fn(),
      generateFrameNumbers: jest.fn(),
      play: jest.fn(),
    };
    this.input = {
      keyboard: {
        addKey: jest.fn().mockReturnValue({
          isDown: false,
          reset: jest.fn(),
        }),
        createCursorKeys: jest.fn().mockReturnValue({
          up: {}, down: {}, left: {}, right: {}
        }),
      },
      on: jest.fn(),
    };
    this.sound = {
      add: jest.fn().mockReturnValue({ play: jest.fn() })
    };
    this.time = {
      addEvent: jest.fn()
    };
    this.registry = {
      set: jest.fn(),
      get: jest.fn()
    };
    this.cache = {
      json: {
        get: jest.fn()
      }
    };
    this.sys = {
      events: {
        on: jest.fn(),
        off: jest.fn()
      }
    };
  }
}

// Mock GameObjects
const GameObjects = {
  Sprite: class {},
  Text: class {},
  Graphics: class {},
  Container: class {},
  Image: class {},
  Zone: class {}
};

// Mock Physics
const Physics = {
  Arcade: {
    ArcadePhysics: class {},
    StaticBody: class {},
    Collider: class {},
    Body: class {}
  }
};

// Mock Input
const Input = {
  Keyboard: {
    createCursorKeys: jest.fn()
  }
};

// Mock Time
const Time = {
  addEvent: jest.fn(),
  delayedCall: jest.fn()
};

// Mock Loader
const Loader = {
  image: jest.fn(),
  spritesheet: jest.fn()
};

// Mock Scale Manager
const Scale = {
  RESIZE: 'RESIZE',
  scaleManager: {
    on: jest.fn()
  }
};

// Mock Cameras
const Cameras = {
  Scene2D: {
    Camera: class {}
  }
};

// Mock Events
const Events = {
  EventEmitter: class {}
};

// Main Phaser mock
const Phaser = {
  Scene,
  GameObjects,
  Physics,
  Input,
  Time,
  Loader,
  Scale,
  Cameras,
  Events,
  Device,
  Math: {
    Between: jest.fn()
  },
  Display: {
    Color: {
      RGBToColor: jest.fn()
    }
  },
  Game: class {}
};

// Set up the module exports
module.exports = {
  Scene,
  default: { Scene }
};
