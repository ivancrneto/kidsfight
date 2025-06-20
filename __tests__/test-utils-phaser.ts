// Centralized Phaser mock factories for all scene and gameplay tests

export function createMockSprite() {
  return {
    setVelocityX: jest.fn().mockReturnThis(),
    setVelocityY: jest.fn().mockReturnThis(),
    setFlipX: jest.fn().mockReturnThis(),
    setFlipY: jest.fn().mockReturnThis(),
    setPosition: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    setOrigin: jest.fn().mockReturnThis(),
    setDisplaySize: jest.fn().mockReturnThis(),
    setImmovable: jest.fn().mockReturnThis(),
    setBounce: jest.fn().mockReturnThis(),
    setCollideWorldBounds: jest.fn().mockReturnThis(),
    setInteractive: jest.fn().mockReturnThis(),
    setScale: jest.fn().mockReturnThis(),
    setFrame: jest.fn().mockReturnThis(),
    setTint: jest.fn().mockReturnThis(),
    play: jest.fn().mockReturnThis(),
    destroy: jest.fn(),
    getData: jest.fn(),
    setData: jest.fn(),
    health: 100,
    special: 0,
    isBlocking: false,
    isAttacking: false,
    body: {
      blocked: { down: true },
      touching: { down: true },
      velocity: { x: 0, y: 0 },
      setAllowGravity: jest.fn(),
      setImmovable: jest.fn(),
      setSize: jest.fn(),
      setOffset: jest.fn(),
      setVelocityX: jest.fn(),
      setVelocityY: jest.fn(),
      setCollideWorldBounds: jest.fn(),
      onFloor: jest.fn().mockReturnValue(true),
    },
    anims: { play: jest.fn() },
    texture: { key: 'player' },
    color: 0xffffff,
  };
}

// Removed local createMockGraphics. Use global MockGraphics from setupTests.ts instead.


export function createMockRectangle(color = 0xffffff) {
  return {
    setInteractive: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    destroy: jest.fn(),
    play: jest.fn().mockReturnThis(),
    color,
  };
}

export function createMockText() {
  return {
    setOrigin: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    setVisible: jest.fn().mockReturnThis(),
    setAlpha: jest.fn().mockReturnThis(),
    setText: jest.fn().mockReturnThis(),
    destroy: jest.fn(),
  };
}

export function patchSceneWithPhaserMocks(scene: any) {
  // Patch Phaser add factory
  scene.add = {
    sprite: jest.fn(() => createMockSprite()),
    graphics: jest.fn(() => ({
      clear: jest.fn(),
      fillStyle: jest.fn().mockReturnThis(),
      fillRect: jest.fn(),
      setDepth: jest.fn().mockReturnThis(),
      setVisible: jest.fn().mockReturnThis(),
      setScrollFactor: jest.fn().mockReturnThis(),
      destroy: jest.fn()
    })),
    rectangle: jest.fn(() => createMockRectangle()),
    text: jest.fn(() => createMockText()),
    image: jest.fn(() => ({
      setOrigin: jest.fn().mockReturnThis(),
      setDisplaySize: jest.fn().mockReturnThis(),
      setScrollFactor: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis(),
      setAlpha: jest.fn().mockReturnThis(),
      destroy: jest.fn(),
    })),
    circle: jest.fn(() => ({
      setOrigin: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis(),
      setInteractive: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      destroy: jest.fn(),
    })),
    container: jest.fn(() => ({
      add: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis(),
      destroy: jest.fn(),
    })),
    existing: jest.fn(obj => obj),
  };
  // Patch physics
  scene.physics = {
    add: {
      sprite: jest.fn(() => createMockSprite()),
      staticGroup: jest.fn(() => ({
        add: jest.fn(),
        setDepth: jest.fn().mockReturnThis(),
        getChildren: jest.fn(() => []),
        destroy: jest.fn(),
      })),
      group: jest.fn(() => ({
        add: jest.fn(),
        setDepth: jest.fn().mockReturnThis(),
        getChildren: jest.fn(() => []),
        destroy: jest.fn(),
      })),
      collider: jest.fn(),
      overlap: jest.fn(),
    },
    world: {
      setBounds: jest.fn(),
      create: jest.fn(),
      enable: jest.fn(),
    },
    pause: jest.fn(),
    resume: jest.fn(),
  };
  // Patch cameras
  scene.cameras = {
    main: {
      width: 800,
      height: 600,
      centerX: 400,
      centerY: 300,
      setBounds: jest.fn(),
      startFollow: jest.fn(),
      setZoom: jest.fn(),
    },
  };
  // Patch tweens, time, anims, events
  scene.tweens = { add: jest.fn(), create: jest.fn() };
  scene.time = { addEvent: jest.fn(), delayedCall: jest.fn(), now: 0 };
  scene.anims = { create: jest.fn() };
  scene.events = { on: jest.fn(), once: jest.fn(), emit: jest.fn() };
  // Patch sys/game/config
  scene.sys = { game: { config: { width: 800, height: 600 }, canvas: { width: 800, height: 600 } } };
  // Patch scale
  scene.scale = { width: 800, height: 600, on: jest.fn() };
  // Patch sound
  scene.sound = { add: jest.fn(() => ({ play: jest.fn(), stop: jest.fn() })) };
  // Patch input
  scene.input = {
    keyboard: {
      createCursorKeys: jest.fn(() => ({ left: {}, right: {}, up: {}, down: {}, space: {} })),
      addKey: jest.fn(),
      addKeys: jest.fn(() => ({ left: {}, right: {}, up: {}, down: {}, space: {} })),
    },
  };
  // Patch scene.scene
  scene.scene = { start: jest.fn(), stop: jest.fn(), get: jest.fn(), pause: jest.fn(), resume: jest.fn(), isActive: jest.fn().mockReturnValue(true) };
}
