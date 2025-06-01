import KidsFightScene from '../kidsfight_scene';
import { jest } from '@jest/globals';

// Helper to create a fresh scene with mock players
function createTestScene() {
  const scene: any = new KidsFightScene();
  scene.playerHealth = [200, 200];
  scene.playerSpecial = [0, 0];
  scene.players = [
    { health: 200, setData: jest.fn(), getData: jest.fn(), setFrame: jest.fn() },
    { health: 200, setData: jest.fn(), getData: jest.fn(), setFrame: jest.fn() },
  ];
  scene.updateHealthBar = jest.fn();
  scene.updateSpecialPips = jest.fn();
  scene.checkWinner = jest.fn();
  scene.wsManager = { send: jest.fn() };
  scene.gameMode = 'single';
  return scene;
}

describe('KidsFightScene Health & Damage Logic', () => {
  it('should require 20 normal hits to KO a player', () => {
    const scene: any = createTestScene();
    for (let i = 0; i < 20; i++) {
      scene.tryAttack(0, 1, Date.now(), false); // normal attack
    }
    expect(scene.players[1].health).toBe(0);
    expect(scene.playerHealth[1]).toBe(0);
  });

  it('should require 10 special hits to KO a player', () => {
    const scene: any = createTestScene();
    for (let i = 0; i < 10; i++) {
      scene.tryAttack(0, 1, Date.now(), true); // special attack
    }
    expect(scene.players[1].health).toBe(0);
    expect(scene.playerHealth[1]).toBe(0);
  });

  it('should allow mixed attacks to KO a player', () => {
    const scene: any = createTestScene();
    // 5 special (20*5=100), 10 normal (10*10=100)
    for (let i = 0; i < 5; i++) scene.tryAttack(0, 1, Date.now(), true);
    for (let i = 0; i < 10; i++) scene.tryAttack(0, 1, Date.now(), false);
    expect(scene.players[1].health).toBe(0);
    expect(scene.playerHealth[1]).toBe(0);
  });

  it('should not reduce health below 0', () => {
    const scene: any = createTestScene();
    for (let i = 0; i < 25; i++) scene.tryAttack(0, 1, Date.now(), false);
    expect(scene.players[1].health).toBe(0);
    expect(scene.playerHealth[1]).toBe(0);
  });

  it('should apply correct damage for normal and special attacks', () => {
    const scene: any = createTestScene();
    scene.tryAttack(0, 1, Date.now(), false); // normal
    expect(scene.players[1].health).toBe(190);
    scene.tryAttack(0, 1, Date.now(), true); // special
    expect(scene.players[1].health).toBe(170);
  });
});
