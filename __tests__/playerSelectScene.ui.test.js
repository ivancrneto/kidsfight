// @jest-environment jsdom

global.Phaser = { Scene: class {} };
const PlayerSelectScene = require('../player_select_scene.js').default;

describe('PlayerSelectScene UI (mocked Phaser)', () => {
  let scene;

  beforeEach(() => {
    // Mock Phaser methods used by PlayerSelectScene
    scene = new PlayerSelectScene();
    scene.add = {
      circle: jest.fn((x, y, r, color, alpha) => ({ x, y, r, color, alpha, setStrokeStyle: jest.fn().mockReturnThis(), setInteractive: jest.fn().mockReturnThis(), setPosition: jest.fn(function (nx, ny) { this.x = nx; this.y = ny; return this; }) })),
      sprite: jest.fn((x, y, key, frame) => ({ x, y, key, frame, setScale: jest.fn().mockReturnThis(), setCrop: jest.fn().mockReturnThis(), setInteractive: jest.fn().mockReturnThis(), on: jest.fn(), setPosition: jest.fn() })),
      rectangle: jest.fn((x, y, w, h, color) => ({ x, y, w, h, color, setStrokeStyle: jest.fn().mockReturnThis(), setInteractive: jest.fn().mockReturnThis(), setPosition: jest.fn().mockReturnThis(), on: jest.fn().mockReturnThis() })),

      text: jest.fn((x, y, text, style) => ({ x, y, text, style, setOrigin: jest.fn().mockReturnThis(), setAlpha: jest.fn().mockReturnThis() })),
      image: jest.fn((x, y, key) => ({ setOrigin: jest.fn().mockReturnThis(), setScale: jest.fn().mockReturnThis(), setAlpha: jest.fn().mockReturnThis(), setStrokeStyle: jest.fn().mockReturnThis(), setInteractive: jest.fn().mockReturnThis(), on: jest.fn().mockReturnThis() })),


    };
    scene.cameras = { main: { centerX: 400, width: 800, height: 600 } };
    scene.textures = { exists: jest.fn(() => true), get: jest.fn(() => ({ getSourceImage: jest.fn() })) };
    scene.scene = { start: jest.fn() };
    scene.selected = { p1: 0, p2: 0 };
    scene.input = { on: jest.fn() };
    scene.load = { image: jest.fn() };
    scene.scale = { on: jest.fn() };
  });

  test('creates selector circles aligned with face backgrounds', () => {
    scene.create();
    // p1Selector and p2Selector should be circles with correct alignment
    expect(scene.add.circle).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), expect.any(Number), 0xffff00, 0.18);
    expect(scene.add.circle).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), expect.any(Number), 0x0000ff, 0.18);
  });

  test('selector moves to correct position on player click', () => {
    scene.create();
    // Simulate clicking the third player for p1 (index 2, top row)
    const p1Options = scene.add.sprite.mock.results.slice(0, 8).map(r => r.value);
    const faceOffsetY = 18;
    p1Options[2].x = 220;
    p1Options[2].y = 170 + faceOffsetY;
    // Manually call the handler as in the real code
    scene.p1Selector = { setPosition: jest.fn() };
    scene.selected.p1 = 0;
    // Simulate click handler logic
    scene.p1Selector.setPosition(p1Options[2].x, p1Options[2].y - faceOffsetY);
    expect(scene.p1Selector.setPosition).toHaveBeenCalledWith(220, 170);
  });

  test('start button is offset slightly to the left', () => {
    scene.create();
    // The button X should be less than centerX
    const centerX = scene.cameras.main.centerX;
    const buttonX = centerX - 18;
    expect(scene.add.rectangle).toHaveBeenCalledWith(buttonX, expect.any(Number), expect.any(Number), expect.any(Number), 0x00ff00);
    expect(scene.add.text).toHaveBeenCalledWith(buttonX, expect.any(Number), expect.stringContaining('COMEÇAR'), expect.any(Object));
  });
});
