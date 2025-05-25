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
    scene.playerSpecial = [0, 0]; // Initialize playerSpecial

    // Mock player1 and player2
    mockAttacker = { x: 100, y: 100, width: 50, height: 100, setData: jest.fn(), getData: jest.fn().mockReturnValue(false), health: 100 }; // Added health
    mockDefender = { x: 120, y: 100, width: 50, height: 100, health: 100 }; // Added health
    scene.player1 = mockAttacker;
    scene.player2 = mockDefender;
    now = Date.now();
    // Mock UI update methods and game logic checks
    scene.updateHealthBar = jest.fn();
    scene.updateSpecialPips = jest.fn(); // Mock updateSpecialPips
    scene.checkWinner = jest.fn(); // Mock checkWinner
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
    expect(scene.playerHealth[1]).toBe(100); // Assuming defender was player2 initially for consistency
    expect(scene.player1.health).toBe(100); // Attacker health unchanged
  });

  // New tests for special points
  it('should award 1 special point to player 1 on successful normal attack', () => {
    scene.tryAttack(0, mockAttacker, mockDefender, now, false); // Player 1 (index 0) attacks
    expect(scene.playerSpecial[0]).toBe(1);
    expect(scene.playerSpecial[1]).toBe(0); // Player 2 special points unchanged
  });

  it('should award 1 special point to player 2 on successful normal attack', () => {
    // Swap attacker and defender for this test
    scene.player1 = mockDefender; // Player 2 is now attacker (index 1)
    scene.player2 = mockAttacker;
    scene.tryAttack(1, mockDefender, mockAttacker, now, false); // Player 2 (index 1) attacks
    expect(scene.playerSpecial[1]).toBe(1);
    expect(scene.playerSpecial[0]).toBe(0); // Player 1 special points unchanged
  });

  it('should not award special points on a special attack', () => {
    scene.tryAttack(0, mockAttacker, mockDefender, now, true); // Special attack
    expect(scene.playerSpecial[0]).toBe(0);
    expect(scene.playerSpecial[1]).toBe(0);
  });

  it('should not award more than 3 special points', () => {
    scene.playerSpecial[0] = 2;
    scene.tryAttack(0, mockAttacker, mockDefender, now, false);
    expect(scene.playerSpecial[0]).toBe(3);
    scene.tryAttack(0, mockAttacker, mockDefender, now, false); // Another attack
    expect(scene.playerSpecial[0]).toBe(3); // Still 3
  });

  // Tests for method calls
  it('should call updateSpecialPips after an attack', () => {
    scene.tryAttack(0, mockAttacker, mockDefender, now, false);
    expect(scene.updateSpecialPips).toHaveBeenCalled();
  });

  it('should call checkWinner after an attack', () => {
    scene.tryAttack(0, mockAttacker, mockDefender, now, false);
    expect(scene.checkWinner).toHaveBeenCalled();
  });

  // Test for health synchronization
  it('should sync defender health object with playerHealth array (defender is player2)', () => {
    scene.playerHealth[1] = 100; // Initial health for playerHealth[1]
    mockDefender.health = 100;   // Initial health for player2 object
    scene.tryAttack(0, mockAttacker, mockDefender, now, false); // Player 1 attacks Player 2
    expect(scene.playerHealth[1]).toBe(90); // playerHealth array updated by gameUtils.tryAttack (simulated)
    expect(mockDefender.health).toBe(90); // Player 2 object health synced
  });

  it('should sync defender health object with playerHealth array (defender is player1)', () => {
    scene.playerHealth[0] = 100;
    mockAttacker.health = 100; // mockAttacker is player1 in this setup
    // Player 2 (mockDefender) attacks Player 1 (mockAttacker)
    scene.tryAttack(1, mockDefender, mockAttacker, now, false);
    expect(scene.playerHealth[0]).toBe(90);
    expect(mockAttacker.health).toBe(90); // Player 1 object health synced
  });
});
