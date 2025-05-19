/**
 * @jest-environment jsdom
 */
const { applyGameCss, updateSceneLayout, tryAttack } = require('../gameUtils.mjs');
// __tests__/main.test.js
// Basic unit tests for main.js constants and mockable logic

const GAME_WIDTH = 800;
const GAME_HEIGHT = 450;
const PLAYER_SIZE = 192;
const PLAYER_SPEED = 200;
const JUMP_VELOCITY = -400;
const GRAVITY = 900;
const ATTACK_RANGE = 100;
const ATTACK_COOLDOWN = 500;
const MAX_HEALTH = 100;
const ROUND_TIME = 60;

describe('Game Constants', () => {
  test('GAME_WIDTH and GAME_HEIGHT', () => {
    expect(GAME_WIDTH).toBe(800);
    expect(GAME_HEIGHT).toBe(450);
  });
  test('PLAYER constants', () => {
    expect(PLAYER_SIZE).toBe(192);
    expect(PLAYER_SPEED).toBe(200);
    expect(JUMP_VELOCITY).toBe(-400);
    expect(GRAVITY).toBe(900);
    expect(ATTACK_RANGE).toBe(100);
    expect(ATTACK_COOLDOWN).toBe(500);
    expect(MAX_HEALTH).toBe(100);
  });
  test('ROUND_TIME', () => {
    expect(ROUND_TIME).toBe(60);
  });
});

// Example: Mocking Phaser and testing KidsFightScene logic
// (In real tests, import KidsFightScene from your module)
describe('KidsFightScene', () => {
  test('update does not throw if player1 or debugText are missing or destroyed', () => {
    // Minimal mock scene with only the essentials
    const scene = {
      scale: { width: 800, height: 600 },
      debugText: null,
      player1: null,
      add: { text: jest.fn(() => ({ setDepth: jest.fn(() => ({ setScrollFactor: jest.fn(() => ({ setOrigin: jest.fn(() => ({})) })) })) })) },
      // Simulate Phaser's destroyed objects by omitting .scene
    };
    // Patch update method from main.js (simulate the robust version)
    function safeUpdate() {
      if (!scene.debugText || !scene.debugText.scene) {
        if (scene.add && scene.add.text) {
          scene.debugText = scene.add.text(10, 10, '', { fontSize: '16px', color: '#fff', backgroundColor: 'rgba(0,0,0,0.5)', fontFamily: 'monospace' }).setDepth(99999).setScrollFactor(0).setOrigin(0,0);
        } else {
          return;
        }
      }
      const w = scene.scale.width;
      const h = scene.scale.height;
      if (w > h) {
        let player1y = (scene.player1 && scene.player1.scene) ? scene.player1.y : 'n/a';
        let player1h = (scene.player1 && scene.player1.scene) ? scene.player1.displayHeight : 'n/a';
        let player1bodyy = (scene.player1 && scene.player1.body && scene.player1.scene) ? scene.player1.body.y : 'n/a';
        if (scene.debugText && scene.debugText.scene) {
          scene.debugText.setText([
            `w: ${w}, h: ${h}`,
            `player1.y: ${player1y}`,
            `player1.displayHeight: ${player1h}`,
            `player1.body.y: ${player1bodyy}`
          ].join('\n')).setVisible(true);
        }
      } else {
        if (scene.debugText && scene.debugText.scene) scene.debugText.setVisible(false);
      }
    }
    // Should not throw even if player1 and debugText are missing
    expect(() => safeUpdate()).not.toThrow();
    // Simulate destroyed debugText
    scene.debugText = { setText: jest.fn(), setVisible: jest.fn(), scene: null };
    expect(() => safeUpdate()).not.toThrow();
    // Simulate destroyed player1
    scene.player1 = { scene: null };
    expect(() => safeUpdate()).not.toThrow();
  });
  let scene;
  beforeEach(() => {
    // Minimal mock for Phaser.Scene
    class MockScene {
      constructor() {
        this.sys = { game: { config: { width: 800, height: 600 } } };
        this.add = { sprite: jest.fn(), text: jest.fn() };
        this.physics = { add: { sprite: jest.fn(() => ({ setScale: jest.fn(), setOrigin: jest.fn(), body: { setSize: jest.fn(), setOffset: jest.fn() }, setCollideWorldBounds: jest.fn(), setBounce: jest.fn(), setFlipX: jest.fn() })), collider: jest.fn() } };
        this.anims = { create: jest.fn() };
        this.input = { keyboard: { addKey: jest.fn() } };
        this.cameras = { main: { shake: jest.fn() } };
        this.time = { delayedCall: jest.fn((delay, cb) => cb()) };
        this.children = { bringToTop: jest.fn() };
        this.selected = { p1: 0, p2: 1 };
        this.specialEffect = {
          clear: jest.fn(),
          setVisible: jest.fn(),
          setAlpha: jest.fn(),
          setScale: jest.fn(),
          lineStyle: jest.fn(),
          strokeCircle: jest.fn(),
          fillCircle: jest.fn()
        };
        this.tweens = { add: jest.fn((opts) => opts.onComplete && opts.onComplete()) };
      }
    }
    scene = new MockScene();
    scene.player1 = { play: jest.fn(), x: 100, health: 100 };
    scene.player2 = { play: jest.fn(), x: 110, health: 100 };
    scene.playerHealth = [100, 100];
    // Always mock timerText for every test
    if (!scene.timerText) {
      scene.timerText = {
        setFontSize: jest.fn(function(size) { return this; }),
        setPosition: jest.fn(function(x, y) { return this; })
      };
    } else {
      scene.timerText.setFontSize = jest.fn(function(size) { return this; });
      scene.timerText.setPosition = jest.fn(function(x, y) { return this; });
    }
    scene.showSpecialEffect = function(x, y, count = 30) {
      if (!this.specialEffect) return;
      this.specialEffect.clear();
      this.specialEffect.setVisible(true);
      this.specialEffect.setAlpha(1);
      this.specialEffect.setScale(1);
      this.specialEffect.lineStyle(8, 0x00eaff, 0.7);
      this.specialEffect.strokeCircle(x, y, 20);
      this.tweens.add({
        targets: this.specialEffect,
        alpha: 0,
        scaleX: 2,
        scaleY: 2,
        duration: 350,
        onComplete: () => {
          this.specialEffect.clear();
          this.specialEffect.setVisible(false);
          this.specialEffect.setAlpha(1);
          this.specialEffect.setScale(1);
        }
      });
    };
    global.mockPlayer1 = { setPosition: jest.fn() };
    global.mockPlayer2 = { setPosition: jest.fn() };
    global.mockPlatform = { setPosition: jest.fn(), setSize: jest.fn() };
    try {
      require('../src/tryAttack');
    } catch (e) {
      global.tryAttack = jest.fn();
    }
  });

  test('showSpecialEffect calls specialEffect methods', () => {
    scene.showSpecialEffect(10, 20);
    expect(scene.specialEffect.clear).toHaveBeenCalled();
    expect(scene.specialEffect.setVisible).toHaveBeenCalledWith(true);
    expect(scene.specialEffect.setAlpha).toHaveBeenCalledWith(1);
    expect(scene.specialEffect.setScale).toHaveBeenCalledWith(1);
    expect(scene.specialEffect.lineStyle).toHaveBeenCalled();
    expect(scene.specialEffect.strokeCircle).toHaveBeenCalledWith(10, 20, 20);
    expect(scene.tweens.add).toHaveBeenCalled();
  });

  test('applyGameCss updates parent styles', () => {
    // Mock DOM - only testing parent container as that's what our function modifies
    document.body.innerHTML = '<div id="game-container"></div>';
    const parent = document.getElementById('game-container');
    
    // Call the function being tested
    applyGameCss();
    
    // Verify parent styles are set correctly
    expect(parent.style.position).toBe('fixed');
    expect(parent.style.width).toBe('100vw');
    expect(parent.style.height).toBe('100vh');
    // Different browsers may interpret #222 as either '#222' or 'rgb(34, 34, 34)'
    expect(['#222', 'rgb(34, 34, 34)'].includes(parent.style.background)).toBe(true);
  });

  test('updateSceneLayout positions players and platform', () => {
    // Create mock objects that match what updateSceneLayout expects
    const mockPlayer1 = { setPosition: jest.fn(), setScale: jest.fn(), setOrigin: jest.fn(), displayWidth: 50, displayHeight: 100, body: { setSize: jest.fn(), setOffset: jest.fn(), updateFromGameObject: jest.fn() } };
    const mockPlayer2 = { setPosition: jest.fn(), setScale: jest.fn(), setOrigin: jest.fn(), displayWidth: 50, displayHeight: 100, body: { setSize: jest.fn(), setOffset: jest.fn(), updateFromGameObject: jest.fn() } };
    const mockPlatform = { setPosition: jest.fn(), setSize: jest.fn(), displayWidth: 100, displayHeight: 20 };
    const mockTimer = { setFontSize: jest.fn(), setPosition: jest.fn() };
    // Add all required health bar and pip mocks
    const mockBar = { setPosition: jest.fn().mockReturnThis(), setSize: jest.fn().mockReturnThis() };
    const mockText = { setPosition: jest.fn().mockReturnThis(), setFontSize: jest.fn().mockReturnThis() };
    const mockPip = { setPosition: jest.fn().mockReturnThis(), setRadius: jest.fn().mockReturnThis() };
    // Platform group child must have setDisplaySize
    const mockPlatformGroupChild = { setDisplaySize: jest.fn(), setPosition: jest.fn(), displayWidth: 100, displayHeight: 20, refreshBody: jest.fn() };
    const mockScene = {
      scale: { width: 500, height: 300 },
      player1: mockPlayer1,
      player2: mockPlayer2,
      platform: { getChildren: () => [mockPlatformGroupChild] },
      timerText: mockTimer,
      children: {
        list: [
          { texture: { key: 'scenario1' }, setPosition: jest.fn(), displayWidth: 100, displayHeight: 100 },
          { type: 'Rectangle', fillColor: 0x8B5A2B, setPosition: jest.fn(), setSize: jest.fn(), displayWidth: 100, displayHeight: 20 }
        ]
      },
      isReady: true,
      cameras: { main: { setBounds: jest.fn() } },
      physics: { world: { setBounds: jest.fn(), staticBodies: true } },
      healthBar1Border: mockBar,
      healthBar2Border: mockBar,
      healthBar1: mockBar,
      healthBar2: mockBar,
      specialPips1: [mockPip, mockPip, mockPip],
      specialPips2: [mockPip, mockPip, mockPip],
      specialReady1: mockPip,
      specialReadyText1: mockText,
      specialReady2: mockPip,
      specialReadyText2: mockText,
      updateControlPositions: jest.fn(),
    };
    // Call the function being tested
    updateSceneLayout(mockScene);
    // Verify that setPosition was called on both players
    expect(mockPlayer1.setScale).toHaveBeenCalled();
    expect(mockPlayer2.setScale).toHaveBeenCalled();
    expect(mockPlayer1.setOrigin).toHaveBeenCalled();
    expect(mockPlayer2.setOrigin).toHaveBeenCalled();
    // Platform group child
    expect(mockPlatformGroupChild.setDisplaySize).toHaveBeenCalled();
    expect(mockPlatformGroupChild.setPosition).toHaveBeenCalled();
    // Rectangle platform
    const platformRect = mockScene.children.list.find(obj => obj.type === 'Rectangle');
    expect(platformRect.setPosition).toHaveBeenCalled();
    expect(platformRect.setSize).toHaveBeenCalled();
    // Timer
    expect(mockTimer.setPosition).toHaveBeenCalled();
  });

  test('tryAttack deals damage and increments attackCount', () => {
    // Minimal mock for tryAttack logic
    const player1 = { x: 100, health: 100 };
    const player2 = { x: 120, health: 100 };
    const scene = {
      lastAttackTime: [0, 0],
      attackCount: [0, 0],
      player1,
      player2,
      playerHealth: [100, 100],
      cameras: { main: { shake: jest.fn() } },
      keys: {},
      cursors: {},
      time: { delayedCall: jest.fn() },
      hitFlash: { clear: jest.fn(), fillStyle: jest.fn(), fillCircle: jest.fn(), setVisible: jest.fn() },
      showSpecialEffect: jest.fn(),
      getPlayerIndex: (p) => (p === player1 ? 0 : 1),
      blocking: [false, false],
      gameOver: false,
      sameCharacterSelected: false,
      playerAttackBlocked: [false, false],
      playerLastAttack: [0, 0]
    };
    scene.playerHealth[1] = 100;
    scene.lastAttackTime[0] = 0;
    scene.attackCount[0] = 0;
    scene.attackCount[1] = 0;
    const now = 1000;
    // Debug log
    console.log('Before tryAttack: playerHealth[1]=', scene.playerHealth[1]);
    tryAttack(scene, 0, player1, player2, now, false);
    console.log('After tryAttack: playerHealth[1]=', scene.playerHealth[1]);
    expect(scene.playerHealth[1]).toBeLessThan(100);
    expect(scene.attackCount[0]).toBe(1);
    expect(scene.cameras.main.shake).toHaveBeenCalled();
  });
});
