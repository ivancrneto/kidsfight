const { tryAttack } = require('../gameUtils.cjs');
const fn = jest.fn;

describe('tryAttack', () => {
  function makeSceneWithPlayerHealth() {
    const player1 = { x: 0, health: 100, setFrame: fn(), play: fn() };
    const player2 = { x: 50, health: 100, setFrame: fn(), play: fn() };
    return {
      lastAttackTime: [0, 0],
      attackCount: [0, 0],
      cameras: { main: { shake: fn() } },
      playerHealth: [100, 100],
      players: [player1, player2],
    };
  }

  it('decreases defender health by 10 for normal attack in range and not on cooldown', () => {
    const scene = makeSceneWithPlayerHealth();
    tryAttack(scene, 0, 1, 1000, false);
    expect(scene.playerHealth[1]).toBe(90);
  });

  it('special attack decreases health by 30 and does not go below 0', () => {
    const scene = makeSceneWithPlayerHealth();
    scene.playerHealth[1] = 20;
    tryAttack(scene, 0, 1, 1000, true);
    expect(scene.playerHealth[1]).toBe(0);
  });

  it('health is reset after scene restart and can be damaged again', () => {
    const scene = makeSceneWithPlayerHealth();
    tryAttack(scene, 0, 1, 1000, false);
    expect(scene.playerHealth[1]).toBe(90);
    // Simulate scene restart
    scene.playerHealth = [100, 100];
    tryAttack(scene, 0, 1, 2000, false);
    expect(scene.playerHealth[1]).toBe(90);
  });

  it('decreases scene.playerHealth for player 2 attacking player 1', () => {
    const scene = makeSceneWithPlayerHealth();
    tryAttack(scene, 1, 0, 1000, false);
    expect(scene.playerHealth[0]).toBe(90);
  });

  it('special attack decreases health by 30 and does not go below 0', () => {
    const scene = makeSceneWithPlayerHealth();
    scene.playerHealth[1] = 20;
    tryAttack(scene, 0, 1, 1000, true);
    expect(scene.playerHealth[1]).toBe(0);
  });

  it('health is reset after scene restart and can be damaged again', () => {
    const scene = makeSceneWithPlayerHealth();
    tryAttack(scene, 0, 1, 1000, false);
    expect(scene.playerHealth[1]).toBe(90);
    // Simulate scene restart
    scene.playerHealth = [100, 100];
    tryAttack(scene, 0, 1, 2000, false);
    expect(scene.playerHealth[1]).toBe(90);
  });

  it('decreases scene.playerHealth for player 1 attacking player 2', () => {
    const scene = makeSceneWithPlayerHealth();
    tryAttack(scene, 0, 1, 1000, false);
    expect(scene.playerHealth[1]).toBe(90);
  });

  it('decreases scene.playerHealth for player 2 attacking player 1', () => {
    const scene = makeSceneWithPlayerHealth();
    tryAttack(scene, 1, 0, 1000, false);
    expect(scene.playerHealth[0]).toBe(90);
  });

  it('special attack decreases health by 30 and does not go below 0', () => {
    const scene = makeSceneWithPlayerHealth();
    scene.playerHealth[1] = 20;
    tryAttack(scene, 0, 1, 1000, true);
    expect(scene.playerHealth[1]).toBe(0);
  });

  it('health is reset after scene restart and can be damaged again', () => {
    const scene = makeSceneWithPlayerHealth();
    tryAttack(scene, 0, 1, 1000, false);
    expect(scene.playerHealth[1]).toBe(90);
    // Simulate scene restart
    scene.playerHealth = [100, 100];
    tryAttack(scene, 0, 1, 2000, false);
    expect(scene.playerHealth[1]).toBe(90);
  });

  it('decreases scene.playerHealth for player 1 attacking player 2', () => {
    const scene = makeSceneWithPlayerHealth();
    tryAttack(scene, 0, 1, 1000, false);
    expect(scene.playerHealth[1]).toBe(90);
  });

  it('decreases scene.playerHealth for player 2 attacking player 1', () => {
    const scene = makeSceneWithPlayerHealth();
    tryAttack(scene, 1, 0, 1000, false);
    expect(scene.playerHealth[0]).toBe(90);
  });

  it('special attack decreases health by 30 and does not go below 0', () => {
    const scene = makeSceneWithPlayerHealth();
    scene.playerHealth[1] = 20;
    tryAttack(scene, 0, 1, 1000, true);
    expect(scene.playerHealth[1]).toBe(0);
  });

  it('health is reset after scene restart and can be damaged again', () => {
    const scene = makeSceneWithPlayerHealth();
    tryAttack(scene, 0, 1, 1000, false);
    expect(scene.playerHealth[1]).toBe(90);
    // Simulate scene restart
    scene.playerHealth = [100, 100];
    tryAttack(scene, 0, 1, 2000, false);
    expect(scene.playerHealth[1]).toBe(90);
  });

  // ---- NEW TESTS FOR INDEX-BASED tryAttack ----
  it('does not throw if indices are invalid or players missing', () => {
    const scene = {};
    expect(() => tryAttack(scene, undefined, 1, 1000, false)).not.toThrow();
    expect(() => tryAttack(scene, 0, undefined, 1000, false)).not.toThrow();
    expect(() => tryAttack(scene, 0, 1, 1000, false)).not.toThrow();
  });

  it('logs an error if indices are invalid', () => {
    const scene = {};
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    tryAttack(scene, undefined, undefined, 1000, false);
    expect(spy).toHaveBeenCalledWith(
      '[TRYATTACK] Invalid indices or players',
      expect.objectContaining({ attackerIdx: undefined, defenderIdx: undefined })
    );
    spy.mockRestore();
  });

  it('correctly uses indices to attack and reduce playerHealth', () => {
    const player1 = { x: 0 };
    const player2 = { x: 50 };
    const scene = {
      players: [player1, player2],
      playerHealth: [100, 100],
      lastAttackTime: [0, 0],
      attackCount: [0, 0],
      cameras: { main: { shake: fn() } },
    };
    tryAttack(scene, 0, 1, 1000, false);
    expect(scene.playerHealth[1]).toBe(90);
    tryAttack(scene, 1, 0, 2000, true);
    expect(scene.playerHealth[0]).toBe(70);
  });
});