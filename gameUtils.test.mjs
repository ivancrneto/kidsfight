import { tryAttack } from './gameUtils.mjs';
import { fn } from 'jest-mock';

describe('tryAttack', () => {
  function makeSceneWithPlayerHealth() {
    return {
      lastAttackTime: [0, 0],
      attackCount: [0, 0],
      cameras: { main: { shake: fn() } },
      playerHealth: [100, 100],
      player1: { x: 0 },
      player2: { x: 50 },
    };
  }
  function makeSceneWithPlayerHealth() {
    return {
      lastAttackTime: [0, 0],
      attackCount: [0, 0],
      cameras: { main: { shake: fn() } },
      playerHealth: [100, 100],
      player1: {},
      player2: {},
    };
  }
  function makePlayer(x = 0) {
    return {
      x,
      health: 100,
      setFrame: fn(),
      play: fn(),
    };
  }

  function makeScene() {
    return {
      lastAttackTime: [0, 0],
      attackCount: [0, 0],
      cameras: { main: { shake: fn() } },
    };
  }

  it('decreases defender health by 10 for normal attack in range and not on cooldown', () => {
    const scene = makeScene();
    const attacker = makePlayer(0);
    const defender = makePlayer(50);
    tryAttack(scene, 0, attacker, defender, 1000, false);
    expect(defender.health).toBe(90);
    it('decreases scene.playerHealth for player 1 attacking player 2', () => {
    const scene = makeSceneWithPlayerHealth();
    tryAttack(scene, 0, scene.player1, scene.player2, 1000, false);
    expect(scene.playerHealth[1]).toBe(90);
  });

  it('decreases scene.playerHealth for player 2 attacking player 1', () => {
    const scene = makeSceneWithPlayerHealth();
    tryAttack(scene, 1, scene.player2, scene.player1, 1000, false);
    expect(scene.playerHealth[0]).toBe(90);
  });

  it('special attack decreases health by 30 and does not go below 0', () => {
    const scene = makeSceneWithPlayerHealth();
    scene.playerHealth[1] = 20;
    tryAttack(scene, 0, scene.player1, scene.player2, 1000, true);
    expect(scene.playerHealth[1]).toBe(0);
  });

  it('health is reset after scene restart and can be damaged again', () => {
    const scene = makeSceneWithPlayerHealth();
    tryAttack(scene, 0, scene.player1, scene.player2, 1000, false);
    expect(scene.playerHealth[1]).toBe(90);
    // Simulate scene restart
    scene.playerHealth = [100, 100];
    tryAttack(scene, 0, scene.player1, scene.player2, 2000, false);
    expect(scene.playerHealth[1]).toBe(90);
  });

});

  it('decreases defender health by 30 for special attack in range and not on cooldown', () => {
    const scene = makeScene();
    const attacker = makePlayer(0);
    const defender = makePlayer(50);
    tryAttack(scene, 0, attacker, defender, 1000, true);
    expect(defender.health).toBe(70);
    it('decreases scene.playerHealth for player 1 attacking player 2', () => {
    const scene = makeSceneWithPlayerHealth();
    tryAttack(scene, 0, scene.player1, scene.player2, 1000, false);
    expect(scene.playerHealth[1]).toBe(90);
  });

  it('decreases scene.playerHealth for player 2 attacking player 1', () => {
    const scene = makeSceneWithPlayerHealth();
    tryAttack(scene, 1, scene.player2, scene.player1, 1000, false);
    expect(scene.playerHealth[0]).toBe(90);
  });

  it('special attack decreases health by 30 and does not go below 0', () => {
    const scene = makeSceneWithPlayerHealth();
    scene.playerHealth[1] = 20;
    tryAttack(scene, 0, scene.player1, scene.player2, 1000, true);
    expect(scene.playerHealth[1]).toBe(0);
  });

  it('health is reset after scene restart and can be damaged again', () => {
    const scene = makeSceneWithPlayerHealth();
    tryAttack(scene, 0, scene.player1, scene.player2, 1000, false);
    expect(scene.playerHealth[1]).toBe(90);
    // Simulate scene restart
    scene.playerHealth = [100, 100];
    tryAttack(scene, 0, scene.player1, scene.player2, 2000, false);
    expect(scene.playerHealth[1]).toBe(90);
  });

});

  it('does not decrease health if out of range', () => {
    const scene = makeScene();
    const attacker = makePlayer(0);
    const defender = makePlayer(200);
    tryAttack(scene, 0, attacker, defender, 1000, false);
    expect(defender.health).toBe(100);
    it('decreases scene.playerHealth for player 1 attacking player 2', () => {
    const scene = makeSceneWithPlayerHealth();
    tryAttack(scene, 0, scene.player1, scene.player2, 1000, false);
    expect(scene.playerHealth[1]).toBe(90);
  });

  it('decreases scene.playerHealth for player 2 attacking player 1', () => {
    const scene = makeSceneWithPlayerHealth();
    tryAttack(scene, 1, scene.player2, scene.player1, 1000, false);
    expect(scene.playerHealth[0]).toBe(90);
  });

  it('special attack decreases health by 30 and does not go below 0', () => {
    const scene = makeSceneWithPlayerHealth();
    scene.playerHealth[1] = 20;
    tryAttack(scene, 0, scene.player1, scene.player2, 1000, true);
    expect(scene.playerHealth[1]).toBe(0);
  });

  it('health is reset after scene restart and can be damaged again', () => {
    const scene = makeSceneWithPlayerHealth();
    tryAttack(scene, 0, scene.player1, scene.player2, 1000, false);
    expect(scene.playerHealth[1]).toBe(90);
    // Simulate scene restart
    scene.playerHealth = [100, 100];
    tryAttack(scene, 0, scene.player1, scene.player2, 2000, false);
    expect(scene.playerHealth[1]).toBe(90);
  });

});

  it('does not decrease health if on cooldown', () => {
    const scene = makeScene();
    scene.lastAttackTime[0] = 900;
    const attacker = makePlayer(0);
    const defender = makePlayer(50);
    tryAttack(scene, 0, attacker, defender, 1200, false); // cooldown is 500ms
    expect(defender.health).toBe(100);
    it('decreases scene.playerHealth for player 1 attacking player 2', () => {
    const scene = makeSceneWithPlayerHealth();
    tryAttack(scene, 0, scene.player1, scene.player2, 1000, false);
    expect(scene.playerHealth[1]).toBe(90);
  });

  it('decreases scene.playerHealth for player 2 attacking player 1', () => {
    const scene = makeSceneWithPlayerHealth();
    tryAttack(scene, 1, scene.player2, scene.player1, 1000, false);
    expect(scene.playerHealth[0]).toBe(90);
  });

  it('special attack decreases health by 30 and does not go below 0', () => {
    const scene = makeSceneWithPlayerHealth();
    scene.playerHealth[1] = 20;
    tryAttack(scene, 0, scene.player1, scene.player2, 1000, true);
    expect(scene.playerHealth[1]).toBe(0);
  });

  it('health is reset after scene restart and can be damaged again', () => {
    const scene = makeSceneWithPlayerHealth();
    tryAttack(scene, 0, scene.player1, scene.player2, 1000, false);
    expect(scene.playerHealth[1]).toBe(90);
    // Simulate scene restart
    scene.playerHealth = [100, 100];
    tryAttack(scene, 0, scene.player1, scene.player2, 2000, false);
    expect(scene.playerHealth[1]).toBe(90);
  });

});

  it('initializes defender.health if undefined', () => {
    const scene = makeScene();
    const attacker = makePlayer(0);
    const defender = makePlayer(50);
    defender.health = undefined;
    tryAttack(scene, 0, attacker, defender, 1000, false);
    expect(defender.health).toBe(90);
    it('decreases scene.playerHealth for player 1 attacking player 2', () => {
    const scene = makeSceneWithPlayerHealth();
    tryAttack(scene, 0, scene.player1, scene.player2, 1000, false);
    expect(scene.playerHealth[1]).toBe(90);
  });

  it('decreases scene.playerHealth for player 2 attacking player 1', () => {
    const scene = makeSceneWithPlayerHealth();
    tryAttack(scene, 1, scene.player2, scene.player1, 1000, false);
    expect(scene.playerHealth[0]).toBe(90);
  });

  it('special attack decreases health by 30 and does not go below 0', () => {
    const scene = makeSceneWithPlayerHealth();
    scene.playerHealth[1] = 20;
    tryAttack(scene, 0, scene.player1, scene.player2, 1000, true);
    expect(scene.playerHealth[1]).toBe(0);
  });

  it('health is reset after scene restart and can be damaged again', () => {
    const scene = makeSceneWithPlayerHealth();
    tryAttack(scene, 0, scene.player1, scene.player2, 1000, false);
    expect(scene.playerHealth[1]).toBe(90);
    // Simulate scene restart
    scene.playerHealth = [100, 100];
    tryAttack(scene, 0, scene.player1, scene.player2, 2000, false);
    expect(scene.playerHealth[1]).toBe(90);
  });

});
  it('decreases scene.playerHealth for player 1 attacking player 2', () => {
    const scene = makeSceneWithPlayerHealth();
    tryAttack(scene, 0, scene.player1, scene.player2, 1000, false);
    expect(scene.playerHealth[1]).toBe(90);
  });

  it('decreases scene.playerHealth for player 2 attacking player 1', () => {
    const scene = makeSceneWithPlayerHealth();
    tryAttack(scene, 1, scene.player2, scene.player1, 1000, false);
    expect(scene.playerHealth[0]).toBe(90);
  });

  it('special attack decreases health by 30 and does not go below 0', () => {
    const scene = makeSceneWithPlayerHealth();
    scene.playerHealth[1] = 20;
    tryAttack(scene, 0, scene.player1, scene.player2, 1000, true);
    expect(scene.playerHealth[1]).toBe(0);
  });

  it('health is reset after scene restart and can be damaged again', () => {
    const scene = makeSceneWithPlayerHealth();
    tryAttack(scene, 0, scene.player1, scene.player2, 1000, false);
    expect(scene.playerHealth[1]).toBe(90);
    // Simulate scene restart
    scene.playerHealth = [100, 100];
    tryAttack(scene, 0, scene.player1, scene.player2, 2000, false);
    expect(scene.playerHealth[1]).toBe(90);
  });

});
