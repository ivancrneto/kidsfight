import KidsFightScene from '../kidsfight_scene';
import Phaser from 'phaser';

describe('KidsFightScene - Attack and Health', () => {
  let scene: KidsFightScene;
  let mockAttacker: any;
  let mockDefender: any;
  let now: number;

  beforeEach(() => {
    // Minimal mock for Phaser.Scene
    scene = new KidsFightScene({});
    scene.playerHealth = [100, 100];
    // Mock player1 and player2
    mockAttacker = { x: 100, y: 100, width: 50, height: 100, setData: jest.fn(), getData: jest.fn().mockReturnValue(false) };
    mockDefender = { x: 120, y: 100, width: 50, height: 100 };
    scene.player1 = mockAttacker;
    scene.player2 = mockDefender;
    now = Date.now();
    // Mock updateHealthBar
    scene.updateHealthBar = jest.fn();
  });

  it('should decrease defender health by 10 on normal attack', () => {
    scene.tryAttack(0, mockAttacker, mockDefender, now, false);
    expect(scene.playerHealth[1]).toBe(90);
    expect(scene.updateHealthBar).toHaveBeenCalledWith(1);
  });

  it('should not decrease below zero', () => {
    scene.playerHealth[1] = 5;
    scene.tryAttack(0, mockAttacker, mockDefender, now, false);
    expect(scene.playerHealth[1]).toBe(0);
  });

  it('should decrease defender health by 30 on special attack', () => {
    scene.playerHealth[1] = 100;
    scene.tryAttack(0, mockAttacker, mockDefender, now, true);
    expect(scene.playerHealth[1]).toBe(70);
  });

  it('should do nothing if attacker or defender is missing', () => {
    scene.tryAttack(0, null, mockDefender, now, false);
    expect(scene.playerHealth[1]).toBe(100);
    scene.tryAttack(0, mockAttacker, null, now, false);
    expect(scene.playerHealth[1]).toBe(100);
  });

  it('should do nothing if defender is not player1 or player2', () => {
    const unrelated = { x: 0, y: 0 };
    scene.tryAttack(0, mockAttacker, unrelated, now, false);
    expect(scene.playerHealth[1]).toBe(100);
  });
});
