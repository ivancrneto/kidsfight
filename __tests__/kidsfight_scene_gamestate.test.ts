// Mock Phaser global for test environment
declare global {
  namespace NodeJS {
    interface Global {
      Phaser: any;
    }
  }
}

global.Phaser = {
  WEBGL: 1,
  Scale: {
    ScaleModes: {
      RESIZE: 3
    }
  },
  GameObjects: {
    Text: class {}
  },
  Time: {
    TimerEvent: class {}
  }
};

const KidsFightScene = require('../kidsfight_scene').default || require('../kidsfight_scene');

// Patch graphics mock for every test to ensure setScrollFactor and setDepth exist
beforeEach(() => {
  if (global.Phaser && global.Phaser.Scene && global.Phaser.Scene.prototype) {
    global.Phaser.Scene.prototype.add = global.Phaser.Scene.prototype.add || {};
    global.Phaser.Scene.prototype.add.graphics = jest.fn(() => new (global.MockGraphics || require('./setupTests').MockGraphics)());
  }
});

const Phaser = require('phaser');

let mockScene;

// Helper to call endGame in tests
function testEndGame(scene: any, winnerIndex: number, message: string) {
  if (typeof scene.endGame === 'function') {
    scene.endGame(winnerIndex, message);
  }
}

// Inline PlayerProps for test compatibility (not exported from main file)
type PlayerProps = {
  isAttacking: boolean;
  isBlocking: boolean;
  health: number;
  special: number;
  direction: 'left' | 'right';
  walkAnimData?: {
    frameTime: number;
    currentFrame: number;
    frameDelay: number;
  };
  playerIndex: 0 | 1;
};

// Import MockTime and MockText from test-utils
import { MockTime, MockText } from './test-utils';
// Import createMockPlayer for player mocks
import { createMockPlayer } from './createMockPlayer';

// Mock the Localization class
class Localization {
  get = jest.fn().mockImplementation((key: string) => key);
  translate = jest.fn().mockImplementation((key: string) => key);
}

// Mock TimerEvent class for testing
class MockTimerEvent implements Phaser.Time.TimerEvent {
  remove = jest.fn();
  destroy = jest.fn();
  callback: Function;
  callbackScope: any;
  args: any[];
  delay: number;
  elapsed: number;
  loop: boolean;
  paused: boolean;
  timeScale: number;
  startAt: number;
  index: number = 0;
  repeat: number = 0;
  repeatCount: number = 0;
  pendingDelete: boolean = false;
  active: boolean = true;

  // constructor(config?: Phaser.Types.Time.TimerEventConfig) {
  //   this.callback = config?.callback || (() => {});
  //   this.delay = config?.delay || 0;
  //   this.callbackScope = config?.callbackScope || null;
  //   this.args = config?.args || [];
  //   this.loop = !!config?.loop;
  //   this.elapsed = 0;
  //   this.paused = false;
  //   this.timeScale = 1;
  //   this.startAt = 0;
  //   this.repeat = config?.repeat || 0;
  // }

  reset(config?: Phaser.Types.Time.TimerEventConfig): Phaser.Time.TimerEvent {
    if (config) {
      if (config.delay !== undefined) this.delay = config.delay;
      if (config.callback !== undefined) this.callback = config.callback;
      if (config.callbackScope !== undefined) this.callbackScope = config.callbackScope;
      if (config.args !== undefined) this.args = config.args;
      if (config.loop !== undefined) this.loop = config.loop;
      if (config.repeat !== undefined) this.repeat = config.repeat;
    }
    this.elapsed = 0;
    this.paused = false;
    this.repeatCount = 0;
    return this;
  }

  getElapsed(): number {
    return this.elapsed;
  }

  getElapsedSeconds(): number {
    return this.elapsed / 1000;
  }

  getOverallProgress(): number {
    return this.elapsed / this.delay;
  }

  getProgress(): number {
    return this.elapsed / this.delay;
  }

  getRepeatCount(): number {
    return this.repeatCount;
  }

  getTimerEvent(): Phaser.Time.TimerEvent {
    return this;
  }


  constructor(config?: {
    delay?: number;
    callback?: () => void;
    callbackScope?: any;
    args?: any[];
    loop?: boolean;
  }) {
    if (config) {
      if (config.delay !== undefined) this.delay = config.delay;
      if (config.callback !== undefined) this.callback = config.callback;
      if (config.callbackScope !== undefined) this.callbackScope = config.callbackScope;
      if (config.args !== undefined) this.args = config.args;
      if (config.loop !== undefined) this.loop = config.loop;
    }
  }
  hasDispatched: boolean = false;
  timeScale: number = 1;
  events: any[] = [];
  now: number = 0;

  // Mock methods
  add = jest.fn();
  delayedCall = jest.fn();
  clearPendingEvents = jest.fn();
  removeAllEvents = jest.fn();
  getElapsed = jest.fn().mockReturnValue(0);
  getElapsedSeconds = jest.fn().mockReturnValue(0);
  getDuration = jest.fn().mockReturnValue(0);
  getProgress = jest.fn().mockReturnValue(0);
  getOverallProgress = jest.fn().mockReturnValue(0);
  getRepeatCount = jest.fn().mockReturnValue(0);
  getTotalElapsed = jest.fn().mockReturnValue(0);
  resetAll = jest.fn();
  resetRepeat = jest.fn();

  setLoop = jest.fn((loop: boolean) => {
    this.loop = loop;
    return this;
  });

  setPaused = jest.fn((paused: boolean) => {
    this.isPaused = paused;
    return this;
  });

  setRepeatCount = jest.fn().mockReturnThis();

  setTimeScale = jest.fn((timeScale: number) => {
    this.timeScale = timeScale;
    return this;
  });

  // Static methods
  static now = Date.now;

  // constructor(config?: { delay?: number; callback?: () => void; args?: any[]; loop?: boolean; callbackScope?: any }) {
  //   this.callback = config?.callback ?? (() => {});
  //   this.delay = config?.delay ?? 0;
  //   this.callbackScope = config?.callbackScope;
  //   this.args = config?.args || [];
  //   this.loop = config?.loop || false;
  // }
}


  // Mock Phaser.Time.Clock
  class MockClock {
  now: number = 0;
  addEvent = jest.fn().mockImplementation((config) => new MockTimerEvent(config));
  delayedCall = jest.fn().mockImplementation((delay, callback, args, scope) =>
    new MockTimerEvent({ delay, callback, args, callbackScope: scope }));
  removeAllEvents = jest.fn();
  }

  // Mock scene
  class MockScene {
    sys: any = {
      events: {
        on: jest.fn(),
        once: jest.fn(),
        off: jest.fn(),
        emit: jest.fn()
      },
      game: {
        events: {
          on: jest.fn(),
          once: jest.fn(),
          off: jest.fn(),
          emit: jest.fn()
        }
      }
    };
    time: MockClock = new MockClock();
    add: any = {
      existing: jest.fn(),
      zone: jest.fn().mockReturnValue({
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis()
      })
    };
    input: any = {
      keyboard: {
        addKey: jest.fn().mockReturnValue({
          on: jest.fn(),
          isDown: false
        })
      },
      on: jest.fn()
    };
    events: any = {
      on: jest.fn(),
      once: jest.fn(),
      off: jest.fn(),
      emit: jest.fn()
    };
    sound: any = {
      add: jest.fn().mockReturnValue({
        play: jest.fn()
      })
    };
    cameras: any = {
      main: {
        setBackgroundColor: jest.fn()
      }
    };
    tweens: any = {
      add: jest.fn().mockReturnValue({
        on: jest.fn().mockReturnThis()
      })
    };
    data: any = {
      get: jest.fn(),
      set: jest.fn()
    };

    restart = jest.fn();
    start = jest.fn();
    }


    describe('KidsFightScene Game State Tests', () => {
  let scene: TestKidsFightScene;

  beforeEach(() => {
    jest.clearAllMocks();
    scene = new TestKidsFightScene();
    scene.safeAddGraphics = jest.fn(() => new (global.MockGraphics)());
    scene.add = scene.add || {};
    scene.add.graphics = scene.safeAddGraphics;
    // Mock add.rectangle to prevent errors in create()
    scene.add.rectangle = jest.fn(() => ({
      setOrigin: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis()
    }));
  });

  test('should handle game state transitions correctly', () => {
    // Simulate game start
    scene.gameOver = false;
    scene.winningPlayer = null;

    // Verify initial state
    expect(scene.gameOver).toBe(false);
    expect(scene.winningPlayer).toBeNull();

    // Simulate game over
    scene.gameOver = true;
    scene.winningPlayer = 1;

    // Verify game over state
    expect(scene.gameOver).toBe(true);
    expect(scene.winningPlayer).toBe(1);
  });

  test('should handle pause state correctly', () => {
    // Initial state
    scene.isPaused = false;
    expect(scene.isPaused).toBe(false);

    // Pause the game
    scene.isPaused = true;
    expect(scene.isPaused).toBe(true);

    // Unpause the game
    scene.isPaused = false;
    expect(scene.isPaused).toBe(false);
  });

  it('maps all player keys to correct display names', () => {
    const getDisplayName = (key: string) => {
      const nameMap: {[key: string]: string} = {
        player1: 'Bento',
        player2: 'Davi R',
        player3: 'José',
        player4: 'Davi S',
        player5: 'Carol',
        player6: 'Roni',
        player7: 'Jacqueline',
        player8: 'Ivan',
        player9: 'D. Isa',
      };
      return nameMap[key] || key;
    };
    
    expect(getDisplayName('player1')).toBe('Bento');
    expect(getDisplayName('player2')).toBe('Davi R');
    expect(getDisplayName('player3')).toBe('José');
    expect(getDisplayName('player4')).toBe('Davi S');
    expect(getDisplayName('player5')).toBe('Carol');
    expect(getDisplayName('player6')).toBe('Roni');
    expect(getDisplayName('player7')).toBe('Jacqueline');
    expect(getDisplayName('player8')).toBe('Ivan');
    expect(getDisplayName('player9')).toBe('D. Isa');
  });
});






// Mock Text class with all required Phaser.GameObjects.Text properties and methods

class MockText {
  // Core properties
  text: string = '';
  x: number = 0;
  y: number = 0;
  width: number = 0;
  height: number = 0;
  visible: boolean = true;
  alpha: number = 1;
  depth: number = 0;
  originX: number = 0;
  originY: number = 0;
  displayOriginX: number = 0;
  displayOriginY: number = 0;
  scrollFactorX: number = 0;
  scrollFactorY: number = 0;
  scaleX: number = 1;
  scaleY: number = 1;
  angle: number = 0;
  rotation: number = 0;
  flipX: boolean = false;
  flipY: boolean = false;
  active: boolean = true;
  mask: any = null;
  parentContainer: any = null;

  // Mock methods
  setText = jest.fn().mockImplementation((text: string) => {
    this.text = text;
    return this;
  });

  setVisible = jest.fn().mockImplementation((visible: boolean) => {
    this.visible = visible;
    return this;
  });

  setTextOrigin = jest.fn().mockImplementation((x: number, y?: number) => {
    this.originX = x;
    this.originY = y !== undefined ? y : x;
    return this;
  });

  setScrollFactor = jest.fn().mockImplementation((x: number, y?: number) => {
    this.scrollFactorX = x;
    this.scrollFactorY = y !== undefined ? y : x;
    return this;
  });

  setDepth = jest.fn().mockImplementation((depth: number) => {
    this.depth = depth;
    return this;
  });

  setFontSize = jest.fn().mockReturnThis();
  setColor = jest.fn().mockReturnThis();
  setShadow = jest.fn().mockReturnThis();
  setOrigin = jest.fn().mockImplementation((x: number, y?: number) => {
    this.originX = x;
    this.originY = y !== undefined ? y : x;
    return this;
  });

  setX = jest.fn().mockImplementation((x: number) => {
    this.x = x;
    return this;
  });

  setY = jest.fn().mockImplementation((y: number) => {
    this.y = y;
    return this;
  });

  setPosition = jest.fn().mockImplementation((x: number, y: number) => {
    this.x = x;
    this.y = y !== undefined ? y : x;
    return this;
  });

  setAlpha = jest.fn().mockImplementation((alpha: number) => {
    this.alpha = alpha;
    return this;
  });

  setInteractive = jest.fn().mockReturnThis();
  on = jest.fn().mockReturnThis();
  off = jest.fn().mockReturnThis();
  removeInteractive = jest.fn().mockReturnThis();
  destroy = jest.fn();

  getCenter = jest.fn().mockImplementation(() => ({
    x: this.x + this.width / 2,
    y: this.y + this.height / 2
  }));

  setTestString = jest.fn().mockImplementation((text: string) => {
    this.text = text;
    return this;
  });
}

// Helper type to access private members
type PrivateAccess<T> = {
  [K in keyof T]: T[K];
};

// Type for the private members we need to access in tests
type KidsFightScenePrivate = PrivateAccess<{
  gameOver: boolean;
  playerHealth: number[];
  playerSpecial: number[];
  specialPips1: any[];
  specialPips2: any[];
  localization: Localization;
  createPlayerAnimations: () => void;
  createPlatforms: () => void;
  createBackground: () => void;
  createHealthBars: () => void;
  createSpecialBars: () => void;
  createPlayerNames: () => void;
  createTouchControls: () => void;
  updateHealthBar: (playerIndex: number) => void;
  updateSpecialPips: (playerIndex: number) => void;
  checkWinner: () => boolean;
  endGame: (winnerIndex: number, message?: string) => Promise<void>;
}>;

// Extended mock for Text class with all required properties
class MockPhaserText extends Phaser.GameObjects.Text {
  static RENDER_MASK = 1;

constructor(scene: Phaser.Scene, x: number, y: number, text: string, style: Phaser.Types.GameObjects.Text.TextStyle) {
super(scene, x, y, text, style);
}

setText = jest.fn().mockImplementation((x, y, text, style) => ({
x,
y,
text,
style,
setOrigin: jest.fn().mockReturnThis(),
setStroke: jest.fn().mockReturnThis(),
setStyle: jest.fn().mockReturnThis(),
on: jest.fn().mockReturnThis(),
setInteractive: jest.fn().mockReturnThis(),
setDepth: jest.fn().mockReturnThis(),
setPosition: jest.fn().mockReturnThis(),
setVisible: jest.fn().mockReturnThis()
}));
setAlpha = jest.fn().mockReturnThis();
setTint = jest.fn().mockReturnThis();
setInteractive = jest.fn().mockReturnThis();
}

// Simple mock for TimerEvent (do not extend Phaser.Time.TimerEvent)
class MockPhaserTimerEvent {
  remove = jest.fn();
  destroy = jest.fn();

  // Add all required methods to match Phaser's TimerEvent
  getProgress = jest.fn().mockReturnValue(0);
  getOverallProgress = jest.fn().mockReturnValue(0);
  getRepeatCount = jest.fn().mockReturnValue(0);
  getElapsed = jest.fn().mockReturnValue(0);
  getElapsedSeconds = jest.fn().mockReturnValue(0);
  getRemaining = jest.fn().mockReturnValue(0);
  getRemainingSeconds = jest.fn().mockReturnValue(0);
  reset = jest.fn().mockReturnThis();

  // Add state properties
  paused = false;
  hasDispatched = false;
  loop = false;
  repeat = 0;
  repeatCount = 0;
  startAt = 0;
  delay = 0;
  elapsed = 0;
  timeScale = 1;

  // Add control methods
  pause() { this.paused = true; return this; }
  resume() { this.paused = false; return this; }
}

// Extended mock for Time class with all required properties
class MockTimeExtended {
  now = 0;
  addEvent = jest.fn().mockReturnValue(new MockPhaserTimerEvent());
  delayedCall = jest.fn();
  removeAllEvents = jest.fn();
  removeAllEventsAfter = jest.fn();
}

// Create a mock Phaser Sprite class that implements both Sprite and PlayerProps
class MockSprite extends Phaser.Physics.Arcade.Sprite {
  public isAttacking: boolean = false;
  public isBlocking: boolean = false;
  public health: number = 100;
  public special: number = 0;
  public direction: 'left' | 'right' = 'right';
  public walkAnimData?: { frameTime: number; currentFrame: number; frameDelay: number };
  public body: Phaser.Physics.Arcade.Body;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number) {
    super(scene, x, y, texture, frame);
    this.body = new Phaser.Physics.Arcade.Body(scene.physics.world, this);
  }

  setHealth(value: number): this {
    this.health = value;
    return this;
  }

  setSpecial(value: number): this {
    this.special = value;
    return this;
  }

  // Mock Phaser.Sprite methods
  setPosition(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  setVelocityX(x: number): this {
    if (this.body) this.body.velocity.x = x;
    return this;
  }

  setVelocityY(y: number): this {
    if (this.body) this.body.velocity.y = y;
    return this;
  }

  setVelocity(x: number, y: number): this {
    if (this.body) {
      this.body.velocity.x = x;
      this.body.velocity.y = y;
    }
    return this;
  }

  setBounce(x: number, y: number): this {
    if (this.body) {
      this.body.bounce.x = x;
      this.body.bounce.y = y;
    }
    return this;
  }


  setCollideWorldBounds(value: boolean): this {
    if (this.body) this.body.collideWorldBounds = value;
    return this;
  }

  setGravityY(value: number): this {
    if (this.body) this.body.gravity.y = value;
    return this;
  }

  setSize(width: number, height: number, center: boolean = true): this {
    if (this.body) this.body.setSize(width, height, center);
    return this;
  }

  setOffset(x: number, y: number): this {
    if (this.body) this.body.setOffset(x, y);
    return this;
  }
}

// Create a mock for the game object factory
const createMockGameObjectFactory = () => ({
  text: jest.fn().mockReturnValue({
    setText: jest.fn(),
    setVisible: jest.fn(),
    setColor: jest.fn(),
    setAlpha: jest.fn(),
    setOrigin: jest.fn(),
    setPosition: jest.fn(),
    setScrollFactor: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis()
  }),
  image: jest.fn().mockReturnValue({
    setOrigin: jest.fn(),
    setPosition: jest.fn(),
    setScrollFactor: jest.fn(),
    setDepth: jest.fn(),
    setAlpha: jest.fn(),
    setVisible: jest.fn()
  }),
  rectangle: jest.fn().mockReturnValue({
    setOrigin: jest.fn(),
    setPosition: jest.fn(),
    setSize: jest.fn(),
    setScrollFactor: jest.fn().mockReturnThis(),
    setFillStyle: jest.fn(),
    setDepth: jest.fn().mockReturnThis(),
    setAlpha: jest.fn(),
    setInteractive: jest.fn(),
    on: jest.fn(),
    setVisible: jest.fn()
  }),
  sprite: jest.fn().mockImplementation((x, y, key) => {
    return new MockSprite({} as Phaser.Scene, x, y, key);
  }),
  graphics: jest.fn().mockReturnValue({
    fillStyle: jest.fn(),
    fillRect: jest.fn(),
    clear: jest.fn(),
    setPosition: jest.fn(),
    setScrollFactor: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis()
  }),
  container: jest.fn().mockReturnValue({
    add: jest.fn(),
    setPosition: jest.fn(),
    setScrollFactor: jest.fn(),
    setDepth: jest.fn(),
    setVisible: jest.fn()
  }),
  zone: jest.fn().mockReturnValue({
    setInteractive: jest.fn(),
    on: jest.fn()
  })
});

// Create a mock for the scene
const createMockScene = () => ({
  add: createMockGameObjectFactory(),
  physics: {
    add: {
      staticGroup: jest.fn().mockReturnValue({
        add: jest.fn()
      }),
      group: jest.fn().mockReturnValue({
        add: jest.fn(),
        getChildren: jest.fn().mockReturnValue([])
      }),
      collider: jest.fn(),
      overlap: jest.fn()
    },
    world: {
      setBounds: jest.fn(),
      enable: jest.fn()
    },
    arcade: {
      setGravityY: jest.fn()
    }
  },
  input: {
    keyboard: {
      createCursorKeys: jest.fn().mockReturnValue({
        left: { isDown: false },
        right: { isDown: false },
        up: { isDown: false },
        down: { isDown: false },
        space: { isDown: false }
      }),
      addKey: jest.fn().mockReturnValue({
        on: jest.fn()
      })
    },
    on: jest.fn(),
    off: jest.fn()
  },
  time: {
    addEvent: jest.fn(),
    removeAllEvents: jest.fn()
  },
  tweens: {
    add: jest.fn()
  },
  sound: {
    add: jest.fn().mockReturnValue({
      play: jest.fn()
    })
  },
  cameras: {
    main: {
      setBounds: jest.fn(),
      setZoom: jest.fn(),
      centerOn: jest.fn(),
      width: 800,
      height: 600,
      scrollX: 0,
      scrollY: 0
    },
    add: jest.fn().mockReturnValue({
      setBounds: jest.fn(),
      setZoom: jest.fn(),
      centerOn: jest.fn()
    })
  },
  scene: {
    get: jest.fn()
  },
  load: {
    image: jest.fn(),
    spritesheet: jest.fn(),
    audio: jest.fn()
  },
  events: {
    on: jest.fn(),
    removeListener: jest.fn()
  },
  game: {
    config: {
      width: 800,
      height: 600,
      parent: 'game-container'
    },
    canvas: {
      width: 800,
      height: 600
    },
    scale: {
      on: jest.fn(),
      off: jest.fn()
    }
  },
  sys: {
    game: {
      config: {
        width: 800,
        height: 600,
        parent: 'game-container'
      },
      canvas: {
        width: 800,
        height: 600
      },
      scale: {
        on: jest.fn(),
        off: jest.fn()
      }
    },
    settings: {
      status: 0
    },
    settings: {
      status: 0
    },
    scale: {
      on: jest.fn(),
      off: jest.fn()
    }
  },
  registry: {
    set: jest.fn(),
    get: jest.fn()
  },
  make: {
    text: jest.fn().mockReturnValue({
      setText: jest.fn(),
      setOrigin: jest.fn(),
      setPosition: jest.fn(),
      setScrollFactor: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis(),
      setVisible: jest.fn()
    })
  },
  data: {
    set: jest.fn(),
    get: jest.fn()
  },
  anims: {
    create: jest.fn(),
    generateFrameNumbers: jest.fn().mockReturnValue([])
  },
  tweens: {
    add: jest.fn(),
    create: jest.fn()
  },
  add: createMockGameObjectFactory()
});

class TestKidsFightScene extends KidsFightScene {
  public players = [
    {
      setVelocityX: jest.fn(),
      setVelocityY: jest.fn(),
      setFrame: jest.fn(),
      setAngle: jest.fn(),
      body: {
        setVelocityX: jest.fn(),
        setVelocityY: jest.fn(),
      },
    },
    {
      setVelocityX: jest.fn(),
      setVelocityY: jest.fn(),
      setFrame: jest.fn(),
      setAngle: jest.fn(),
      body: {
        setVelocityX: jest.fn(),
        setVelocityY: jest.fn(),
      },
    }
  ];
  public add = {
    text: jest.fn().mockImplementation((x: number, y: number, text: string, style: any) => {
      const txt = new MockText();
      txt.setText(text);
      return txt;
    })
  };
  public cameras = { main: { width: 800, height: 600 } };
  public tweens = { add: jest.fn().mockReturnValue({}) };
  public input = {
    once: jest.fn(),
    keyboard: { once: jest.fn() }
  };
  public scene = { restart: jest.fn() };
  public gameMode = 'single';
  public wsManager = { send: jest.fn() };
  public time = { now: Date.now() };
  public gameOver = false;
  public roundEndTime = undefined;

  constructor() {
    super({ key: 'TestKidsFightScene' });
  }

  // Helper methods for tests
  public setGameOver(value: boolean): void {
    this.privateAccess._gameOver = value;
  }

  public setPlayerHealth(health: number[]): void {
    this.privateAccess._playerHealth = [...health];
  }

  public setPlayerSpecial(special: number[]): void {
    this.privateAccess._playerSpecial = [...special];
  }

  public setSpecialPips(pips1: any[], pips2: any[]): void {
    this.privateAccess._specialPips1 = [...pips1];
    this.privateAccess._specialPips2 = [...pips2];
  }

  // Public methods for testing
  public init(data?: any): void {
    super.init(data);
    // Initialize time mock
    this.time = {
      addEvent: jest.fn().mockImplementation((config) => {
        this.testGameTimer = new MockTimerEvent();
        return this.testGameTimer;
      }),
      now: 0,
      delayedCall: jest.fn(),
      removeAllEvents: jest.fn(),
      removeAllEventsAfter: jest.fn(),
      clearPendingEvents: jest.fn()
    };
    // Initialize other mocks
    this.cameras = {
      main: {
        setBackgroundColor: jest.fn(),
        setBounds: jest.fn(),
        startFollow: jest.fn(),
        setZoom: jest.fn()
      }
    };
    this.physics = {
      add: {
        collider: jest.fn(),
        overlap: jest.fn()
      },
      world: {
        setBounds: jest.fn()
      }
    };
    this.scale = {
      on: jest.fn(),
      setMode: jest.fn(),
      setGameSize: jest.fn(),
      refresh: jest.fn(),
      getViewPort: jest.fn().mockReturnValue({ x: 0, y: 0, width: 800, height: 600 }),
      getParentBounds: jest.fn().mockReturnValue({ width: 800, height: 600 })
    };
    this.gameTimer = this.testGameTimer;
  }

  // Override create method for testing
  public create(): void {
    // Set up test-specific behavior
    this.winnerText = this.add.text(0, 0, '');
    this.gameTimer = this.testTime.addEvent({
      delay: 1000,
      callback: () => {
      },
      callbackScope: this,
      loop: true
    });

  }
}

describe('KidsFightScene - Game State, Create, and CheckWinner', () => {
  let scene: TestKidsFightScene;
  type SceneData = {
    selected: { p1: string; p2: string };
    p1: string;
    p2: string;
    player1Char?: string;
    player2Char?: string;
    selectedScenario: string;
    gameMode: 'single' | 'online';
    roomCode?: string;
    isHost?: boolean;
  };

  // Define mockDataForCreate for test scene initialization
  const mockDataForCreate = {
    selected: {p1: 'bento', p2: 'Davi R'},
    p1: 'bento',
    p2: 'Davi R',
    player1Char: 'bento',
    player2Char: 'Davi R',
    selectedScenario: 'dojo',
    gameMode: 'single',
    roomCode: 'TEST123',
    isHost: true
  };

  // Helper function to create a test scene
  function createTestScene(): TestKidsFightScene {
    const testScene = new TestKidsFightScene();

    // Initialize with test data
    const testData = {...mockDataForCreate};

    // Initialize required properties
    const mockTime = new MockTimerEvent();
    const mockText = new MockText();

    // Initialize scene with mock data
    testScene.init(testData);

    // Set up test-specific properties
    testScene.time = mockTime;
    testScene.testGameTimer = mockTime;
    testScene.testWinnerText = mockText;
    testScene.winnerText = mockText;
    testScene.players = [
      {
        ...createMockPlayer(),
        isAttacking: false,
        isBlocking: false,
        direction: 'right',
        walkAnimData: undefined,
        health: 100,
        special: 0,
        body: {}, // minimal Sprite field
        playerIndex: 0,
      } as any,
      {
        ...createMockPlayer(),
        isAttacking: false,
        isBlocking: false,
        direction: 'left',
        walkAnimData: undefined,
        health: 100,
        special: 0,
        body: {}, // minimal Sprite field
        playerIndex: 1,
      } as any
    ];
    testScene.gameOver = false;
    testScene.timeRemaining = 99;
    // testScene.specialPips1 = [];
    // testScene.specialPips2 = [];

    // Protected methods should be mocked by subclassing, not by assignment here.

    return testScene;
  }

  // Test cases for checkWinner
  describe('checkWinner', () => {
    let scene: TestKidsFightScene;

    beforeEach(() => {
      scene = createTestScene();
      scene.players = [
        {
          health: 100,
          special: 0,
          isAttacking: false,
          isBlocking: false,
          direction: 'right',
          walkAnimData: undefined,
          destroy: jest.fn(),
          body: {},
          playerIndex: 0,
        } as any,
        {
          health: 100,
          special: 0,
          isAttacking: false,
          isBlocking: false,
          direction: 'left',
          walkAnimData: undefined,
          destroy: jest.fn(),
          body: {},
          playerIndex: 1,
        } as any
      ];
    });

    it('should return -1 when no player has won', () => {
      scene.playerHealth = [100, 100];
      expect(scene.testCheckWinner()).toBe(-1);
    });

    it('should return 0 when player 1 wins', () => {
      scene.playerHealth = [100, 0];
      expect(scene.testCheckWinner()).toBe(0);
    });

    it('should return 1 when player 2 wins', () => {
      scene.playerHealth = [0, 100];
      expect(scene.testCheckWinner()).toBe(1);
    });
  });
  describe('KidsFightScene endGame visual and message logic', () => {
    // TODO: Add tests for endGame visuals and messages here
  });

  describe('KidsFightScene Game State Tests', () => {
    let kidsFightScene: KidsFightScene;

    beforeEach(() => {
      // Use the real scene and its lifecycle
      kidsFightScene = new KidsFightScene();
      // Patch graphics mocks for health bars
      kidsFightScene.safeAddGraphics = jest.fn(() => new (global.MockGraphics)());
      kidsFightScene.add = kidsFightScene.add || {};
      kidsFightScene.add.graphics = kidsFightScene.safeAddGraphics;
      // Mock add.rectangle to prevent errors in create()
      kidsFightScene.add.rectangle = jest.fn(() => ({
        setOrigin: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis()
      }));
      // Mock add.text for endGame functionality
      kidsFightScene.add.text = jest.fn(() => ({
        setOrigin: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        setStyle: jest.fn().mockReturnThis(),
        setText: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        destroy: jest.fn().mockReturnThis()
      }));
      // Provide minimal init/create data if needed
      kidsFightScene.init({});
      kidsFightScene.create({});
      // Spy on player methods after creation if needed
      if (kidsFightScene.players && kidsFightScene.players.length >= 2) {
        const mockPlayer = {
          setFrame: jest.fn(),
          setAngle: jest.fn(),
          setVelocityX: jest.fn(),
          setVelocityY: jest.fn(),
          body: {
            setVelocityX: jest.fn(),
            setVelocityY: jest.fn()
          }
        };
        kidsFightScene.players = [mockPlayer, mockPlayer];
        jest.spyOn(kidsFightScene.players[0], 'setFrame');
        jest.spyOn(kidsFightScene.players[0], 'setAngle');
        jest.spyOn(kidsFightScene.players[0], 'setVelocityX');
        jest.spyOn(kidsFightScene.players[0], 'setVelocityY');
        jest.spyOn(kidsFightScene.players[0].body, 'setVelocityX');
        jest.spyOn(kidsFightScene.players[0].body, 'setVelocityY');
        jest.spyOn(kidsFightScene.players[1], 'setFrame');
        jest.spyOn(kidsFightScene.players[1], 'setAngle');
        jest.spyOn(kidsFightScene.players[1], 'setVelocityX');
        jest.spyOn(kidsFightScene.players[1], 'setVelocityY');
        jest.spyOn(kidsFightScene.players[1].body, 'setVelocityX');
        jest.spyOn(kidsFightScene.players[1].body, 'setVelocityY');
      }
      // Spy on text creation
      jest.spyOn(kidsFightScene.add, 'text');
    });

    it('should handle player 1 win correctly', () => {
      kidsFightScene.players = [
        {
          setFrame: jest.fn(),
          setAngle: jest.fn(),
          setVelocityX: jest.fn(),
          setVelocityY: jest.fn(),
          body: {
            setVelocityX: jest.fn(),
            setVelocityY: jest.fn(),
            velocity: { x: 0, y: 0 }
          }
        },
        {
          setFrame: jest.fn(),
          setAngle: jest.fn(),
          setVelocityX: jest.fn(),
          setVelocityY: jest.fn(),
          body: {
            setVelocityX: jest.fn(),
            setVelocityY: jest.fn(),
            velocity: { x: 0, y: 0 }
          }
        }
      ];
      testEndGame(kidsFightScene, 0, 'Bento Venceu!');
      expect(kidsFightScene.players[0].setFrame).toHaveBeenCalledWith(3);
      expect(kidsFightScene.players[1].setAngle).toHaveBeenCalledWith(90);
      expect(kidsFightScene.gameOver).toBe(true);
    });

    it('should handle player 2 win correctly', () => {
      kidsFightScene.players = [
        {
          setFrame: jest.fn(),
          setAngle: jest.fn(),
          setVelocityX: jest.fn(),
          setVelocityY: jest.fn(),
          body: {
            setVelocityX: jest.fn(),
            setVelocityY: jest.fn(),
            velocity: { x: 0, y: 0 }
          }
        },
        {
          setFrame: jest.fn(),
          setAngle: jest.fn(),
          setVelocityX: jest.fn(),
          setVelocityY: jest.fn(),
          body: {
            setVelocityX: jest.fn(),
            setVelocityY: jest.fn(),
            velocity: { x: 0, y: 0 }
          }
        }
      ];
      testEndGame(kidsFightScene, 1, 'Davi R Venceu!');
      expect(kidsFightScene.players[1].setFrame).toHaveBeenCalledWith(3);
      expect(kidsFightScene.players[0].setAngle).toHaveBeenCalledWith(90);
      expect(kidsFightScene.gameOver).toBe(true);
    });

    it('should handle draw correctly', () => {
      kidsFightScene.players = [
        {
          setFrame: jest.fn(),
          setAngle: jest.fn(),
          setVelocityX: jest.fn(),
          setVelocityY: jest.fn(),
          body: {
            setVelocityX: jest.fn(),
            setVelocityY: jest.fn(),
            velocity: { x: 0, y: 0 }
          }
        },
        {
          setFrame: jest.fn(),
          setAngle: jest.fn(),
          setVelocityX: jest.fn(),
          setVelocityY: jest.fn(),
          body: {
            setVelocityX: jest.fn(),
            setVelocityY: jest.fn(),
            velocity: { x: 0, y: 0 }
          }
        }
      ];
      testEndGame(kidsFightScene, -1, 'Empate!');
      expect(kidsFightScene.players[0].setFrame).not.toHaveBeenCalled();
      expect(kidsFightScene.players[1].setFrame).not.toHaveBeenCalled();
      expect(kidsFightScene.players[0].setAngle).not.toHaveBeenCalled();
      expect(kidsFightScene.players[1].setAngle).not.toHaveBeenCalled();
      expect(kidsFightScene.gameOver).toBe(true);
    });

    it('should reset player velocities on game over', () => {
      kidsFightScene.players = [
        {
          setFrame: jest.fn(),
          setAngle: jest.fn(),
          setVelocityX: jest.fn(),
          setVelocityY: jest.fn(),
          body: {
            setVelocityX: jest.fn(),
            setVelocityY: jest.fn(),
            velocity: { x: 100, y: 0 }
          }
        },
        {
          setFrame: jest.fn(),
          setAngle: jest.fn(),
          setVelocityX: jest.fn(),
          setVelocityY: jest.fn(),
          body: {
            setVelocityX: jest.fn(),
            setVelocityY: jest.fn(),
            velocity: { x: -50, y: 10 }
          }
        }
      ];
      testEndGame(kidsFightScene, 0, 'Bento Venceu!');
      expect(kidsFightScene.players[0].setVelocityX).toHaveBeenCalledWith(0);
      expect(kidsFightScene.players[0].setVelocityY).toHaveBeenCalledWith(0);
      expect(kidsFightScene.players[0].body.setVelocityX).toHaveBeenCalledWith(0);
      expect(kidsFightScene.players[0].body.setVelocityY).toHaveBeenCalledWith(0);
      expect(kidsFightScene.players[1].setVelocityX).toHaveBeenCalledWith(0);
      expect(kidsFightScene.players[1].setVelocityY).toHaveBeenCalledWith(0);
      expect(kidsFightScene.players[1].body.setVelocityX).toHaveBeenCalledWith(0);
      expect(kidsFightScene.players[1].body.setVelocityY).toHaveBeenCalledWith(0);
    });

    it('should display correct message for draw', () => {
      testEndGame(kidsFightScene, -1, 'Empate!');
      expect(kidsFightScene.add.text).toHaveBeenCalledWith(
          expect.any(Number),
          expect.any(Number),
          'Empate!',
          expect.objectContaining({
            fontSize: '48px',
            color: '#fff',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 6
          })
      );

      jest.clearAllMocks();
      mockScene = new MockScene();
      if (!mockScene.textures) {
        mockScene.textures = {
          exists: () => true,
          remove: () => {
          },
          get: () => ({
            getSourceImage: () => ({}), add: () => {
            }, getFrameNames: () => []
          }),
          addImage: () => {
          },
          list: {},
          getTextureKeys: () => []
        };
      }


      // Always define kidsFightScene before patching its textures property
      kidsFightScene = {
        scene: mockScene,
        time: mockScene.time,
        sys: mockScene.sys,
        events: mockScene.events,
        gameState: {
          isGameOver: false,
          isPaused: false,
          winningPlayer: null,
        },
        startRoundTimer: jest.fn(),
        endRound: jest.fn(),
        resetRound: jest.fn(),
        handleGameOver: jest.fn()
      };
      if (!kidsFightScene.textures) {
        kidsFightScene.textures = {
          exists: () => true,
          remove: () => {
          },
          get: () => ({
            getSourceImage: () => ({}), add: () => {
            }, getFrameNames: () => []
          }),
          addImage: () => {
          },
          list: {},
          getTextureKeys: () => []
        };
      }

    });

    describe('GameState object', () => {
      let kidsFightScene: any;
      beforeEach(() => {
        const mockScene = new MockScene();
        if (!mockScene.textures) {
          mockScene.textures = {
            exists: () => true,
            remove: () => {
            },
            get: () => ({
              getSourceImage: () => ({}), add: () => {
              }, getFrameNames: () => []
            }),
            addImage: () => {
            },
            list: {},
            getTextureKeys: () => []
          };
        }
        kidsFightScene = {
          scene: mockScene,
          time: mockScene.time,
          sys: mockScene.sys,
          events: mockScene.events,
          gameState: {
            isGameOver: false,
            isPaused: false,
            winningPlayer: null,
          },
          startRoundTimer: jest.fn(),
          endRound: jest.fn(),
          resetRound: jest.fn(),
          handleGameOver: jest.fn(),
          add: {
            rectangle: jest.fn(() => ({
              setOrigin: jest.fn().mockReturnThis(),
              setDepth: jest.fn().mockReturnThis()
            })),
            graphics: jest.fn(() => new (global.MockGraphics)())
          },
          safeAddGraphics: jest.fn(() => new (global.MockGraphics)())
        };
        if (!kidsFightScene.textures) {
          kidsFightScene.textures = {
            exists: () => true,
            remove: () => {
            },
            get: () => ({
              getSourceImage: () => ({}), add: () => {
              }, getFrameNames: () => []
            }),
            addImage: () => {
            },
            list: {},
            getTextureKeys: () => []
          };
        }
      });

      test('should handle game state transitions correctly', () => {
        // Simulate game start
        kidsFightScene.gameState.isGameOver = false;

        // Verify initial state
        expect(kidsFightScene.gameState.isGameOver).toBe(false);
        expect(kidsFightScene.gameState.winningPlayer).toBeNull();

        // Simulate game over
        kidsFightScene.gameState.isGameOver = true;
        kidsFightScene.gameState.winningPlayer = 1;

        // Verify game over state
        expect(kidsFightScene.gameState.isGameOver).toBe(true);
        expect(kidsFightScene.gameState.winningPlayer).toBe(1);
      });

      test('should handle pause state correctly', () => {
        // Initial state
        kidsFightScene.gameState.isPaused = false;
        expect(kidsFightScene.gameState.isPaused).toBe(false);

        // Pause the game
        kidsFightScene.gameState.isPaused = true;
        expect(kidsFightScene.gameState.isPaused).toBe(true);

        // Unpause the game
        kidsFightScene.gameState.isPaused = false;
        expect(kidsFightScene.gameState.isPaused).toBe(false);
      });
    });

  });

  it('should call setScrollFactor and setDepth on both health bars when created', () => {
    const KidsFightScene = require('../kidsfight_scene').default || require('../kidsfight_scene');
    const getMockGraphics = () => new (global.MockGraphics || require('./setupTests').MockGraphics)();
    const scene = new KidsFightScene();
    scene.add = scene.add || {};
    scene.add.graphics = jest.fn(getMockGraphics);
    scene.add.rectangle = jest.fn(() => ({
      setOrigin: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis()
    }));
    scene.safeAddGraphics = jest.fn(getMockGraphics);
    // Mock health bars before calling createHealthBars
    scene.healthBar1 = { setScrollFactor: jest.fn(), setDepth: jest.fn() };
    scene.healthBar2 = { setScrollFactor: jest.fn(), setDepth: jest.fn() };

    // Patch scene.add.graphics to always return a new MockGraphics
    class MockGraphics {
      fillStyle = jest.fn().mockReturnThis();
      fillRect = jest.fn().mockReturnThis();
      clear = jest.fn().mockReturnThis();
      setScrollFactor = jest.fn().mockReturnThis();
      setDepth = jest.fn().mockReturnThis();
      destroy = jest.fn();
    }



    scene.createHealthBars();
    expect(scene.healthBar1.setScrollFactor).toHaveBeenCalledWith(0, 0);
    expect(scene.healthBar1.setDepth).toHaveBeenCalledWith(2);
    expect(scene.healthBar2.setScrollFactor).toHaveBeenCalledWith(0, 0);
    expect(scene.healthBar2.setDepth).toHaveBeenCalledWith(2);
  });

});
