import KidsFightScene from '../kidsfight_scene';

describe('KidsFightScene winner frame after game over', () => {
  let scene: any;
  let winner: any;
  let loser: any;

  beforeEach(() => {
    scene = new KidsFightScene();
    scene.setSafeFrame = jest.fn();
    scene.updateWalkingAnimation = jest.fn();
    scene.stopWalkingAnimation = jest.fn();
    scene.time = { delayedCall: jest.fn() };
    winner = {
      y: 300,
      body: { velocity: { x: 0, y: 0 } },
      isAttacking: false,
      isSpecialAttacking: false,
      isBlocking: false,
      setFrame: jest.fn(),
      getData: jest.fn(() => false),
      setData: jest.fn(),
      anims: { stop: jest.fn() }
    };
    loser = {
      y: 300,
      body: { velocity: { x: 0, y: 0 } },
      isAttacking: false,
      isSpecialAttacking: false,
      isBlocking: false,
      setFrame: jest.fn(),
      getData: jest.fn(() => false),
      setData: jest.fn(),
      anims: { stop: jest.fn() }
    };
    scene.players = [winner, loser];
    scene.winnerIndex = 0;
    scene.gameOver = true;
    scene.fightEnded = true;
  });

  it('sets winner frame to 3 and keeps it after game over', () => {
    scene.updatePlayerAnimation(0);
    expect(winner.setFrame).toHaveBeenCalledWith(3);
    // Calling again should keep frame 3
    scene.updatePlayerAnimation(0);
    expect(winner.setFrame).toHaveBeenCalledWith(3);
  });

  it('does not override winner frame with walk/idle after game over', () => {
    winner.body.velocity.x = 100;
    scene.updatePlayerAnimation(0);
    // Should call updateWalkingAnimation, but NOT set frame 3 in this case
    expect(scene.updateWalkingAnimation).toHaveBeenCalledWith(winner);
    expect(winner.setFrame).not.toHaveBeenCalledWith(0);
    // Now set velocity.x = 0 and call again: should stop walking and set frame 3
    winner.body.velocity.x = 0;
    scene.updatePlayerAnimation(0);
    expect(scene.stopWalkingAnimation).toHaveBeenCalledWith(winner);
    expect(winner.setFrame).toHaveBeenCalledWith(3);
  });

  it('does not set frame 3 for loser after game over', () => {
    scene.updatePlayerAnimation(1);
    expect(loser.setFrame).not.toHaveBeenCalledWith(3);
  });
});
