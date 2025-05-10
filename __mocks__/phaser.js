// Mock Phaser for tests
const Phaser = {
  Scene: class {
    constructor(config) {
      this.config = config;
      this.add = {
        text: jest.fn().mockReturnValue({
          setOrigin: jest.fn().mockReturnThis(),
          setColor: jest.fn().mockReturnThis(),
          setText: jest.fn().mockReturnThis(),
          setAlpha: jest.fn().mockReturnThis(),
          setStyle: jest.fn().mockReturnThis(),
          setPosition: jest.fn().mockReturnThis(),
          setDepth: jest.fn().mockReturnThis(),
          setVisible: jest.fn().mockReturnThis(),
          setScrollFactor: jest.fn().mockReturnThis(),
        }),
        sprite: jest.fn().mockReturnValue({
          setInteractive: jest.fn().mockReturnThis(),
          on: jest.fn().mockReturnThis(),
          setScale: jest.fn().mockReturnThis(),
          setCrop: jest.fn().mockReturnThis(),
          setAlpha: jest.fn().mockReturnThis(),
          setOrigin: jest.fn().mockReturnThis(),
          setPosition: jest.fn().mockReturnThis(),
          setDepth: jest.fn().mockReturnThis(),
          setVisible: jest.fn().mockReturnThis(),
          setScrollFactor: jest.fn().mockReturnThis(),
        }),
        image: jest.fn().mockReturnValue({
          setOrigin: jest.fn().mockReturnThis(),
          setScale: jest.fn().mockReturnThis(),
          setAlpha: jest.fn().mockReturnThis(),
          setPosition: jest.fn().mockReturnThis(),
          setDepth: jest.fn().mockReturnThis(),
          setVisible: jest.fn().mockReturnThis(),
          setScrollFactor: jest.fn().mockReturnThis(),
        }),
        rectangle: jest.fn().mockReturnValue({
          setStrokeStyle: jest.fn().mockReturnThis(),
          setOrigin: jest.fn().mockReturnThis(),
          setPosition: jest.fn().mockReturnThis(),
          setDepth: jest.fn().mockReturnThis(),
          setVisible: jest.fn().mockReturnThis(),
          setScrollFactor: jest.fn().mockReturnThis(),
        }),
        circle: jest.fn().mockReturnValue({
          setStrokeStyle: jest.fn().mockReturnThis(),
          setPosition: jest.fn().mockReturnThis(),
          setOrigin: jest.fn().mockReturnThis(),
          setDepth: jest.fn().mockReturnThis(),
          setVisible: jest.fn().mockReturnThis(),
          setScrollFactor: jest.fn().mockReturnThis(),
        })
      };
      this.cameras = {
        main: {
          width: 800,
          height: 600,
          centerX: 400,
          centerY: 300
        }
      };
      this.scene = {
        start: jest.fn(),
        stop: jest.fn(),
        pause: jest.fn(),
        resume: jest.fn(),
      };
      this.time = {
        delayedCall: jest.fn((delay, callback) => callback())
      };
      this.scale = {
        on: jest.fn()
      };
      this.textures = {
        exists: jest.fn().mockReturnValue(true),
        get: jest.fn().mockReturnValue({
          getSourceImage: jest.fn(),
          frames: { __BASE: {} },
          add: jest.fn()
        }),
        addSpriteSheet: jest.fn()
      };
    }
  },
  Game: class {
    constructor(config) {
      this.config = config;
    }
  },
  GameObjects: {
    Sprite: class {
      constructor() {}
      setInteractive() { return this; }
      on() { return this; }
      setScale() { return this; }
      setCrop() { return this; }
      setAlpha() { return this; }
    },
    Image: class {
      constructor() {}
      setOrigin() { return this; }
      setScale() { return this; }
      setAlpha() { return this; }
    },
    Text: class {
      constructor() {}
      setOrigin() { return this; }
      setColor() { return this; }
      setText() { return this; }
      setAlpha() { return this; }
    },
    Rectangle: class {
      constructor() {}
      setStrokeStyle() { return this; }
    },
    Circle: class {
      constructor() {}
      setStrokeStyle() { return this; }
      setPosition() { return this; }
    }
  }
};

export default Phaser;
