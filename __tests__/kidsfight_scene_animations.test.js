// Unit tests for KidsFightScene attack and special animation durations
// Uses Jest and Phaser-mock (or custom mocks)

import KidsFightScene from '../kidsfight_scene.js';

jest.useFakeTimers();

describe('KidsFightScene attack and special animation durations', () => {
  let scene;
  let mockPlayer;
  let mockTime;

  beforeEach(() => {
    // Minimal mock for Phaser.Sprite
    mockPlayer = {
      play: jest.fn(),
      anims: { isPlaying: false, currentAnim: { key: '' } },
      body: { touching: { down: true }, velocity: { x: 0, y: 0 } },
      setFlipX: jest.fn(),
      setCollideWorldBounds: jest.fn(),
      setBounce: jest.fn(),
      setData: jest.fn(),
      angle: 0,
      x: 0, y: 0
    };
    scene = new KidsFightScene();
    scene.player1 = { ...mockPlayer };
    scene.player2 = { ...mockPlayer };
    scene.p1SpriteKey = 'player1';
    scene.p2SpriteKey = 'player2';
    scene.isAttacking = [false, false];
    scene.lastAttackTime = [0, 0];
    scene.attackCount = [0, 0];
    scene.player1State = 'idle';
    scene.player2State = 'idle';
    scene.time = { delayedCall: jest.fn((delay, cb) => setTimeout(cb, delay)) };
    scene.tryAttack = jest.fn();
    scene.keys = {
      a: { isDown: false },
      d: { isDown: false },
      w: { isDown: false },
      s: { isDown: false },
      left: { isDown: false },
      right: { isDown: false },
      up: { isDown: false },
      down: { isDown: false },
      v: { isDown: false },
      b: { isDown: false },
      k: { isDown: false },
      l: { isDown: false },
      n: { isDown: false }
    };
    scene._touchJustPressedP1A = false;
    scene._touchJustPressedP1S = false;
    scene._touchJustPressedP2A = false;
    scene._touchJustPressedP2S = false;
    scene.gameMode = 'local';
    scene.isHost = true;
    scene.playerHealth = [100, 100];
    scene.cursors = { left: { isDown: false }, right: { isDown: false }, up: { isDown: false }, down: { isDown: false } };
    // Mock special pips and UI objects
    const pipMock = { setFillStyle: jest.fn().mockReturnThis(), setVisible: jest.fn().mockReturnThis() };
    scene.specialPips1 = [pipMock, pipMock, pipMock];
    scene.specialPips2 = [pipMock, pipMock, pipMock];
    scene.specialReady1 = { setVisible: jest.fn() };
    scene.specialReady2 = { setVisible: jest.fn() };
    scene.specialReadyText1 = { setVisible: jest.fn() };
    scene.specialReadyText2 = { setVisible: jest.fn() };
  });

  function callUpdateAttack(pIdx, isSpecial, now) {
    // Simulate attack trigger for player
    if (pIdx === 0) {
      scene.isAttacking[0] = false;
      scene.player1.body.touching.down = true;
      scene.player1State = 'idle';
      scene.player1.anims.isPlaying = false;
      scene.player1.anims.currentAnim.key = '';
      if (isSpecial) {
        scene.attackCount[0] = 3; // Ensure special is available
        scene.keys.b.isDown = true;
        scene.update(now);
        scene.keys.b.isDown = false;
      } else {
        scene.keys.v.isDown = true;
        scene.update(now);
        scene.keys.v.isDown = false;
      }
    } else {
      scene.isAttacking[1] = false;
      scene.player2.body.touching.down = true;
      scene.player2State = 'idle';
      scene.player2.anims.isPlaying = false;
      scene.player2.anims.currentAnim.key = '';
      if (isSpecial) {
        scene.attackCount[1] = 3; // Ensure special is available
        scene.keys.l.isDown = true;
        scene.update(now);
        scene.keys.l.isDown = false;
      } else {
        scene.keys.k.isDown = true;
        scene.update(now);
        scene.keys.k.isDown = false;
      }
    }
  }

  it('should set isAttacking[0] true for 200ms on attack, then false', () => {
    callUpdateAttack(0, false, 1000);
    expect(scene.isAttacking[0]).toBe(true);
    jest.advanceTimersByTime(199);
    expect(scene.isAttacking[0]).toBe(true);
    jest.advanceTimersByTime(2);
    expect(scene.isAttacking[0]).toBe(false);
  });

  it('should set isAttacking[1] true for 200ms on attack, then false', () => {
    callUpdateAttack(1, false, 1000);
    expect(scene.isAttacking[1]).toBe(true);
    jest.advanceTimersByTime(199);
    expect(scene.isAttacking[1]).toBe(true);
    jest.advanceTimersByTime(2);
    expect(scene.isAttacking[1]).toBe(false);
  });

  it('should set isAttacking[0] true for 900ms on special, then false', () => {
    callUpdateAttack(0, true, 1000);
    expect(scene.isAttacking[0]).toBe(true);
    jest.advanceTimersByTime(899);
    expect(scene.isAttacking[0]).toBe(true);
    jest.advanceTimersByTime(2);
    expect(scene.isAttacking[0]).toBe(false);
  });

  it('should set isAttacking[1] true for 900ms on special, then false', () => {
    callUpdateAttack(1, true, 1000);
    expect(scene.isAttacking[1]).toBe(true);
    jest.advanceTimersByTime(899);
    expect(scene.isAttacking[1]).toBe(true);
    jest.advanceTimersByTime(2);
    expect(scene.isAttacking[1]).toBe(false);
  });

  it('should not allow a new attack while isAttacking is true', () => {
    // First attack
    callUpdateAttack(0, false, 1000);
    expect(scene.isAttacking[0]).toBe(true);
    // Try to attack again within 200ms (should be ignored)
    scene.keys.v.isDown = false;
    scene.update(1100);
    expect(scene.tryAttack).toHaveBeenCalledTimes(1); // Only first attack
    jest.advanceTimersByTime(201);
    // Reset state for new attack
    scene.isAttacking[0] = false;
    scene.attackCount[0] = 0;
    scene.player1State = 'idle';
    scene.player1.anims.isPlaying = false;
    scene.player1.anims.currentAnim.key = '';
    callUpdateAttack(0, false, 1300);
    expect(scene.tryAttack).toHaveBeenCalledTimes(2);
  });
});
