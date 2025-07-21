import KidsFightScene from '../kidsfight_scene';

describe('KidsFightScene Game Over Animation', () => {
  let scene: any;
  let winner: any;
  let loser: any;

  beforeEach(() => {
    scene = new KidsFightScene();
    // Stub dependencies
    scene.updateWalkingAnimation = jest.fn();
    scene.updateSharedWalkingAnimation = jest.fn();
    scene.stopWalkingAnimation = jest.fn();
    scene.time = { delayedCall: jest.fn() };

    // Create mock players
    winner = { setFrame: jest.fn(), body: { velocity: { x: 0 } } };
    loser = { setFrame: jest.fn(), body: { velocity: { x: 0 } } };
    
    // Properly initialize the players array using type casting
    (scene as any).players = [loser, winner]; // loser at index 0, winner at index 1

    scene.winnerIndex = 1;
    scene.gameOver = true;
    scene.fightEnded = true;
  });

  it('sets winner frame to 3 when idle after game over', () => {
    // Winner is idle
    scene.updatePlayerAnimation(1);
    expect(winner.setFrame).toHaveBeenCalledWith(3);
  });

  it('sets loser frame to 0 when idle after game over', () => {
    // Loser is idle
    scene.updatePlayerAnimation(0);
    expect(loser.setFrame).toHaveBeenCalledWith(0);
  });

  it('uses walking logic for moving winner after game over', () => {
    winner.body.velocity.x = 150;
    scene.updatePlayerAnimation(1);
    expect(scene.updateWalkingAnimation).toHaveBeenCalledWith(winner);
    // Should not override walking with game-over frame
    expect(winner.setFrame).not.toHaveBeenCalledWith(3);
  });

  it('uses shared walking logic for remote winner in online mode', () => {
    // Setup online remote
    scene.gameMode = 'online';
    scene.localPlayerIndex = 0;
    // Move winner (player 1)
    winner.body.velocity.x = -200;
    scene.updatePlayerAnimation(1);
    expect(scene.updateSharedWalkingAnimation).toHaveBeenCalledWith(winner);
    expect(winner.setFrame).not.toHaveBeenCalledWith(3);
  });

  it('does not call updateWalkingAnimation for loser moving after game over', () => {
    loser.body.velocity.x = 100;
    scene.updatePlayerAnimation(0);
    // Should still call walking logic for loser
    expect(scene.updateWalkingAnimation).toHaveBeenCalledWith(loser);
    expect(loser.setFrame).not.toHaveBeenCalledWith(0);
    // Now make idle and confirm lose frame
    loser.body.velocity.x = 0;
    scene.updatePlayerAnimation(0);
    expect(scene.stopWalkingAnimation).toHaveBeenCalledWith(loser);
    expect(loser.setFrame).toHaveBeenCalledWith(0);
  });
});
