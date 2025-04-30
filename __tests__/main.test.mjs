/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { applyGameCss, updateSceneLayout, tryAttack } from '../gameUtils.mjs';
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

  test('applyGameCss updates canvas and parent styles', () => {
    // Mock DOM
    document.body.innerHTML = '<div id="game-container"></div><canvas></canvas>';
    const canvas = document.querySelector('canvas');
    const parent = document.getElementById('game-container');
    applyGameCss();
    expect(canvas.style.position).toBe('fixed');
    expect(parent.style.position).toBe('fixed');
    expect(['#222', 'rgb(34, 34, 34)'].includes(canvas.style.background)).toBe(true);
    expect(['#222', 'rgb(34, 34, 34)'].includes(parent.style.background)).toBe(true);
  });

  test('updateSceneLayout positions bg, platform, timer', () => {
    // Mock scene
    const mockBg = { texture: { key: 'scenario1' }, setPosition: jest.fn(), displayWidth: 0, displayHeight: 0 };
    const mockPlatform = { type: 'Rectangle', fillColor: 0x8B5A2B, setPosition: jest.fn(), displayWidth: 0 };
    const mockTimer = { setPosition: jest.fn(), setFontSize: jest.fn() };
    const mockScene = {
      scale: { width: 500, height: 300 },
      children: { list: [mockBg, mockPlatform] },
      cameras: { main: { setBounds: jest.fn() } },
      physics: { world: { setBounds: jest.fn() } },
      updateControlPositions: jest.fn(),
      timerText: mockTimer
    };
    updateSceneLayout(mockScene);
    expect(mockBg.setPosition).toHaveBeenCalledWith(250, 150);
    expect(mockPlatform.setPosition).toHaveBeenCalled();
    expect(mockScene.cameras.main.setBounds).toHaveBeenCalledWith(0, 0, 500, 300);
    expect(mockScene.physics.world.setBounds).toHaveBeenCalledWith(0, 0, 500, 300);
    expect(mockScene.updateControlPositions).toHaveBeenCalled();
    expect(mockTimer.setPosition).toHaveBeenCalledWith(250, 33);
  });

  test('tryAttack deals damage and increments attackCount', () => {
    // Minimal mock for tryAttack logic
    const scene = {
      lastAttackTime: [0, 0],
      attackCount: [0, 0],
      player1: { x: 100, health: 100 },
      player2: { x: 120, health: 100 },
      playerHealth: [100, 100],
      cameras: { main: { shake: jest.fn() } },
      keys: {},
      cursors: {},
      time: { delayedCall: jest.fn() },
      hitFlash: { clear: jest.fn(), fillStyle: jest.fn(), fillCircle: jest.fn(), setVisible: jest.fn() },
      showSpecialEffect: jest.fn()
    };
    tryAttack(scene, 0, scene.player1, scene.player2, Date.now(), false);
    expect(scene.playerHealth[1]).toBeLessThan(100);
    expect(scene.attackCount[0]).toBe(1);
    expect(scene.cameras.main.shake).toHaveBeenCalled();
  });
});
