import PlayerSelectScene from '../player_select_scene';
import wsManager from '../websocket_manager';

describe('PlayerSelectScene Online Character Selection', () => {
  let scene;
  let sentMessages;

  // Mock Phaser and wsManager
  beforeEach(() => {
    sentMessages = [];
    wsManager.send = jest.fn((msg) => sentMessages.push(msg));
    scene = new PlayerSelectScene();
    scene.add = {
      sprite: jest.fn(() => ({
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        setCrop: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(), // <-- THIS IS CRITICAL
        x: 0,
        y: 0,
      })),
      text: jest.fn(() => ({ setOrigin: jest.fn().mockReturnThis(), setAlpha: jest.fn().mockReturnThis() })),
      image: jest.fn(() => {
  console.log('[MOCK] scene.add.image called');
  return {
    setOrigin: jest.fn().mockReturnThis(),
    setScale: jest.fn().mockReturnThis(),
    setAlpha: jest.fn().mockReturnThis(),
    setInteractive: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    setStrokeStyle: jest.fn().mockReturnThis(), // <-- Added for startBtn
  };
}),
      rectangle: jest.fn(() => ({ setPosition: jest.fn().mockReturnThis(), setStrokeStyle: jest.fn().mockReturnThis(), setInteractive: jest.fn().mockReturnThis(), on: jest.fn().mockReturnThis() })),

      circle: jest.fn(() => ({ setPosition: jest.fn().mockReturnThis(), setStrokeStyle: jest.fn().mockReturnThis() }))
    };
    scene.cameras = { main: { width: 800, height: 600, centerX: 400 } };
    // Patch prototype to enforce our mock
    PlayerSelectScene.prototype.add = scene.add;
    scene.scale = { on: jest.fn() };
    scene.textures = {
      exists: jest.fn(() => true),
      get: jest.fn(() => ({ getSourceImage: jest.fn(), frames: { __BASE: {} }, add: jest.fn() })),
      addSpriteSheet: jest.fn()
    };
    scene.faceOffsetY = 18;
    scene.CHARACTER_KEYS = ['player1','player2','player3','player4','player5','player6','player7','player8','player9'];
    scene.selected = { p1: 'player1', p2: 'player2' };
    scene.gameMode = 'online';
    scene.isHost = false; // Simulate client for P2 selection
  });

  it('should select the correct character for Player 2 (no offset bug)', () => {
    scene._p2Callbacks = [];
    let spriteCallCount = 0;
    scene.add.sprite = jest.fn(() => {
      const idx = spriteCallCount++;
      const mock = {
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn(function(event, cb) {
          if (event === 'pointerdown') scene._p2Callbacks[idx] = cb;
          return this;
        }),
        setCrop: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        x: 100 + idx * 10,
        y: 200 + idx * 5
      };
      return mock;
    });
    // Let createScene populate p2Options and register callbacks

    // Set up selectors
    scene.p2Selector = { setPosition: jest.fn() };

    // Simulate createScene to attach pointerdown handlers
    scene.createScene = PlayerSelectScene.prototype.createScene.bind(scene);
    scene.createScene();

    // After createScene, extract pointerdown handlers for each p2Option
    scene._p2Callbacks = [];
    scene.p2Options.forEach((opt, i) => {
      if (opt.on && opt.on.mock && Array.isArray(opt.on.mock.calls)) {
        // Find the pointerdown handler
        const pointerdownCall = opt.on.mock.calls.find(call => call[0] === 'pointerdown');
        if (pointerdownCall) {
          scene._p2Callbacks[i] = pointerdownCall[1];
        } else {
          scene._p2Callbacks[i] = () => {};
        }
      } else {
        scene._p2Callbacks[i] = () => {};
      }
    });
    // Additional diagnostics
    console.log('[TEST] Diagnostics: gameMode =', scene.gameMode, ', isHost =', scene.isHost);
    console.log('[TEST] Initial scene.selected.p2:', scene.selected.p2);
    for (let i = 0; i < scene.p2Options.length; i++) {
      const opt = scene.p2Options[i];
      const onFn = (typeof opt.on === 'function') ? opt.on : undefined;
      let pointerdownListener = typeof scene._p2Callbacks[i] === 'function' ? scene._p2Callbacks[i] : undefined;
      const hasSetAlpha = typeof opt.setAlpha === 'function';
      console.log(`[TEST] p2Options[${i}]: charKey=${scene.CHARACTER_KEYS[i]}, has setAlpha:`, hasSetAlpha, ', pointerdownListener:', pointerdownListener ? 'function' : typeof pointerdownListener, ', opt:', opt);
    }
    console.log('[TEST] scene._p2Callbacks after createScene:', scene._p2Callbacks);
    for (let i = 0; i < scene.CHARACTER_KEYS.length; i++) {
      if (typeof scene._p2Callbacks[i] !== 'function') {
        console.warn(`[TEST] _p2Callbacks[${i}] missing after createScene, filling with noop`);
        scene._p2Callbacks[i] = () => {};
      }
    }
    console.log('[TEST] Final callback mapping:', scene._p2Callbacks.map((cb, idx) => ({
      idx,
      cbType: typeof cb,
      charKey: scene.CHARACTER_KEYS[idx],
      option: scene.p2Options[idx]
    })));
    console.log('[TEST] p2Options after createScene:', scene.p2Options.map((opt, idx) => ({
      idx,
      setAlphaType: typeof opt.setAlpha,
      keys: Object.keys(opt)
    })));
    console.log('[TEST] _p2Callbacks before loop:', scene._p2Callbacks);
    // Simulate Player 2 clicking each character and verify selection
    for (let i = 0; i < scene.CHARACTER_KEYS.length; i++) {
      console.log(`[TEST] Before pointerdown for p2Options[${i}]`, scene.p2Options[i]);
      if (typeof scene._p2Callbacks[i] !== 'function') {
        console.error(`[TEST] _p2Callbacks[${i}] is not a function:`, scene._p2Callbacks[i]);
        throw new Error(`_p2Callbacks[${i}] is not a function`);
      }
      console.log(`[TEST] scene.selected.p2 before pointerdown[${i}]:`, scene.selected.p2);
      scene._p2Callbacks[i]();
      console.log(`[TEST] scene.selected.p2 after pointerdown[${i}]:`, scene.selected.p2);
      expect(scene.selected.p2).toBe(scene.CHARACTER_KEYS[i]);
    }
  });

  it('should send correct character index for Player 2 in online mode', () => {
    scene._p2Callbacks = [];
    let spriteCallCount = 0;
    scene.add.sprite = jest.fn(() => {
      const idx = spriteCallCount++;
      const mock = {
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn(function(event, cb) {
          if (event === 'pointerdown') scene._p2Callbacks[idx] = cb;
          return this;
        }),
        setCrop: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        x: 100 + idx * 10,
        y: 200 + idx * 5
      };
      return mock;
    });
    scene.p2Selector = { setPosition: jest.fn() };
    scene.createScene = PlayerSelectScene.prototype.createScene.bind(scene);
    scene.createScene();
    console.log('[TEST] scene._p2Callbacks after createScene:', scene._p2Callbacks);
    // Fill missing callbacks with noop and log a warning
    for (let i = 0; i < scene.CHARACTER_KEYS.length; i++) {
      if (typeof scene._p2Callbacks[i] !== 'function') {
        console.warn(`[TEST] _p2Callbacks[${i}] missing after createScene, filling with noop`);
        scene._p2Callbacks[i] = () => {};
      }
    }
    // Log mapping of callbacks to character keys and options
    console.log('[TEST] Final callback mapping:', scene._p2Callbacks.map((cb, idx) => ({
      idx,
      cbType: typeof cb,
      charKey: scene.CHARACTER_KEYS[idx],
      option: scene.p2Options[idx]
    })));
    // Debug: Log p2Options after createScene
    console.log('[TEST] p2Options after createScene:', scene.p2Options.map((opt, idx) => ({
      idx,
      setAlphaType: typeof opt.setAlpha,
      keys: Object.keys(opt)
    })));
    console.log('[TEST] Full scene._p2Callbacks before loop:', scene._p2Callbacks);
    for (let i = 0; i < scene.CHARACTER_KEYS.length; i++) {
      // Find and call the registered pointerdown handler for this option
      const pointerdownCall = scene.p2Options[i].on.mock.calls.find(call => call[0] === 'pointerdown');
      if (pointerdownCall) pointerdownCall[1]();
      console.log(`[TEST] sentMessages after pointerdown[${i}]:`, sentMessages);
      console.log(`[TEST] scene.selected.p2 after pointerdown[${i}]:`, scene.selected.p2);
      expect(sentMessages.length).toBe(1);
      const sent = sentMessages[0];
      expect(sent.type).toBe('character_selected');
      expect(sent.playerNum).toBe(2);
      expect(sent.character).toBe(i);
      sentMessages.length = 0;
    }
  });
});
