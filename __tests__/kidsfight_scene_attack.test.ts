import KidsFightScene from '../kidsfight_scene';
import Phaser from 'phaser';

describe('KidsFightScene - Attack and Health', () => {
  let scene: KidsFightScene;
  let now: number;

  beforeEach(() => {
    // Minimal mock for Phaser.Scene
    scene = new KidsFightScene({});
    scene.playerHealth = [100, 100];
    scene.playerSpecial = [0, 0];
    scene.players = [
      { x: 100, y: 100, width: 50, height: 100, setData: jest.fn(), getData: jest.fn().mockReturnValue(false), health: 100 },
      { x: 120, y: 100, width: 50, height: 100, health: 100 }
    ];
    now = Date.now();
    // Mock UI update methods and game logic checks
    scene.updateHealthBar = jest.fn();
    scene.updateSpecialPips = jest.fn();
    scene.checkWinner = jest.fn();
  });

  it('should decrease defender health by 10 on normal attack', () => {
    // attackerIdx = 0, defenderIdx = 1
    scene.tryAttack(0, 1, now, false);
    expect(scene.playerHealth[1]).toBe(90);
    expect(scene.updateHealthBar).toHaveBeenCalledWith(1);
  });

  it('should not decrease below zero', () => {
    scene.playerHealth[1] = 5;
    scene.tryAttack(0, 1, now, false);
    expect(scene.playerHealth[1]).toBe(0);
  });

  it('should decrease defender health by 30 on special attack', () => {
    scene.playerHealth[1] = 100;
    scene.tryAttack(0, 1, now, true);
    expect(scene.playerHealth[1]).toBe(70);
  });

  it('should do nothing if attacker or defender is missing', () => {
    scene.tryAttack(undefined, 1, now, false);
    expect(scene.playerHealth[1]).toBe(100);
    scene.tryAttack(0, undefined, now, false);
    expect(scene.playerHealth[1]).toBe(100);
  });

  it('should do nothing if indices are not 0 or 1', () => {
    scene.tryAttack(0, 2, now, false);
    expect(scene.playerHealth[1]).toBe(100);
    expect(scene.players[0].health).toBe(100);
  });

  it('should award 1 special point to player 0 on successful normal attack', () => {
    scene.tryAttack(0, 1, now, false);
    expect(scene.playerSpecial[0]).toBe(1);
    expect(scene.playerSpecial[1]).toBe(0);
  });

  it('should award 1 special point to player 1 on successful normal attack', () => {
    scene.tryAttack(1, 0, now, false);
    expect(scene.playerSpecial[1]).toBe(1);
    expect(scene.playerSpecial[0]).toBe(0);
  });

  it('should not award special points on a special attack', () => {
    scene.tryAttack(0, 1, now, true);
    expect(scene.playerSpecial[0]).toBe(0);
    expect(scene.playerSpecial[1]).toBe(0);
  });

  it('should not award more than 3 special points', () => {
    scene.playerSpecial[0] = 2;
    scene.tryAttack(0, 1, now, false);
    expect(scene.playerSpecial[0]).toBe(3);
    scene.tryAttack(0, 1, now, false);
    expect(scene.playerSpecial[0]).toBe(3);
  });

  it('should call updateSpecialPips after an attack', () => {
    scene.tryAttack(0, 1, now, false);
    expect(scene.updateSpecialPips).toHaveBeenCalled();
  });

  it('should call checkWinner after an attack', () => {
    scene.tryAttack(0, 1, now, false);
    expect(scene.checkWinner).toHaveBeenCalled();
  });

  it('should sync defender health object with playerHealth array (defender is player1)', () => {
    scene.playerHealth[0] = 100;
    scene.players[0].health = 100;
    scene.tryAttack(1, 0, now, false);
    expect(scene.playerHealth[0]).toBe(90);
    expect(scene.players[0].health).toBe(90);
  });

  it('should sync defender health object with playerHealth array (defender is player2)', () => {
    scene.playerHealth[1] = 100;
    scene.players[1].health = 100;
    scene.tryAttack(0, 1, now, false);
    expect(scene.playerHealth[1]).toBe(90);
    expect(scene.players[1].health).toBe(90);
  });
});
