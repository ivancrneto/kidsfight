// Minimal Phaser mock for Jest
module.exports = {
  Scene: class {},
  GameObjects: {
    Rectangle: class {},
    Circle: class {},
    Text: class {}
  },
  Math: {},
  Structs: {
    Size: class {}
  }
};
// Mocked Phaser implementation
class MockScene {
  constructor(config) {
    Object.assign(this, config);
    this.sys = {
      game: { config: { width: 800, height: 600 } },
      settings: { 
        physics: {
          arcade: { gravity: { y: 1000 }, debug: false }
        } 
      },
      events: { 
        on: jest.fn(), 
        once: jest.fn(),
        emit: jest.fn()
      }
    };
    this.scene = { 
      start: jest.fn(),
      launch: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      stop: jest.fn(),
      manager: { keys: {} }
    };
    this.physics = {
      add: {
        sprite: jest.fn().mockReturnValue({
          setCollideWorldBounds: jest.fn().mockReturnThis(),
          setBounce: jest.fn().mockReturnThis(),
          setGravityY: jest.fn().mockReturnThis(),
          setScale: jest.fn().mockReturnThis(),
          setOrigin: jest.fn().mockReturnThis(),
          setVelocity: jest.fn().mockReturnThis(),
          setDrag: jest.fn().mockReturnThis(),
          setDepth: jest.fn().mockReturnThis(),
          setPosition: jest.fn().mockReturnThis(),
          setImmovable: jest.fn().mockReturnThis(),
          setInteractive: jest.fn().mockReturnThis(),
          anims: { play: jest.fn().mockReturnThis() },
          body: { onFloor: jest.fn().mockReturnValue(true) }
        })
      },
      world: {
        setBounds: jest.fn(),
        on: jest.fn()
      }
    };
    this.anims = {
      create: jest.fn(),
      generateFrameNumbers: jest.fn().mockReturnValue([]),
      generateFrameNames: jest.fn().mockReturnValue([])
    };
    this.add = {
      sprite: jest.fn().mockReturnValue({
        setScale: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        setFrame: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        anims: { play: jest.fn().mockReturnThis() }
      }),
      image: jest.fn().mockReturnValue({
        setScale: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis()
      }),
      text: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setText: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis()
      }),
      tileSprite: jest.fn().mockReturnValue({
        setScale: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis()
      }),
      particles: jest.fn().mockReturnValue({
        createEmitter: jest.fn().mockReturnValue({
          setPosition: jest.fn().mockReturnThis(),
          setScale: jest.fn().mockReturnThis(),
          setSpeed: jest.fn().mockReturnThis(),
          setBlendMode: jest.fn().mockReturnThis()
        })
      })
    };
    this.cameras = {
      main: { 
        width: 800, 
        height: 600,
        setBounds: jest.fn(),
        startFollow: jest.fn()
      }
    };
    this.input = {
      keyboard: {
        createCursorKeys: jest.fn().mockReturnValue({
          up: { isDown: false },
          down: { isDown: false },
          left: { isDown: false },
          right: { isDown: false }
        }),
        addKey: jest.fn().mockReturnValue({ isDown: false })
      },
      on: jest.fn()
    };
    this.tweens = {
      add: jest.fn().mockReturnValue({
        on: jest.fn()
      })
    };
    this.time = {
      delayedCall: jest.fn().mockReturnValue({
        destroy: jest.fn()
      }),
      addEvent: jest.fn().mockReturnValue({
        destroy: jest.fn()
      })
    };
    this.sound = {
      add: jest.fn().mockReturnValue({
        play: jest.fn()
      })
    };
    this.data = {
      set: jest.fn(),
      get: jest.fn()
    };
    this.load = {
      image: jest.fn(),
      spritesheet: jest.fn(),
      atlas: jest.fn(),
      audio: jest.fn(),
      tilemapTiledJSON: jest.fn()
    };
  }

  create() {}
  update() {}
  preload() {}
  init() {}
}

// Mock Phaser module
const phaser = {
  Game: jest.fn().mockImplementation(() => ({
    destroy: jest.fn()
  })),
  Scene: MockScene,
  GameObjects: {
    Sprite: jest.fn(),
    Image: jest.fn(),
    Text: jest.fn(),
    TileSprite: jest.fn(),
    Graphics: jest.fn().mockImplementation(() => ({
      fillStyle: jest.fn().mockReturnThis(),
      fillRect: jest.fn().mockReturnThis(),
      lineStyle: jest.fn().mockReturnThis(),
      strokeRect: jest.fn().mockReturnThis(),
      lineBetween: jest.fn().mockReturnThis(),
      clear: jest.fn().mockReturnThis()
    }))
  },
  Physics: {
    Arcade: {
      Sprite: jest.fn(),
      World: jest.fn(),
      Group: jest.fn().mockImplementation(() => ({
        add: jest.fn()
      }))
    }
  },
  Input: {
    Keyboard: {
      KeyCodes: {
        W: 87,
        A: 65,
        S: 83,
        D: 68,
        SPACE: 32,
        ENTER: 13,
        UP: 38,
        DOWN: 40,
        LEFT: 37,
        RIGHT: 39
      }
    }
  },
  AUTO: 0,
  CANVAS: 1,
  WEBGL: 2,
  Scale: {
    FIT: 'FIT',
    NONE: 'NONE'
  },
  BlendModes: {
    NORMAL: 0,
    ADD: 1
  }
};

module.exports = phaser;
module.exports.default = phaser;