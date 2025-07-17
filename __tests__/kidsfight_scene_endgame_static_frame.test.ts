import KidsFightScene from '../kidsfight_scene';

describe('KidsFightScene endGame static frame enforcement', () => {
  let scene: any;
  let winner: any;
  let loser: any;

  beforeEach(() => {
    scene = new KidsFightScene();
    scene.setSafeFrame = jest.fn();
    winner = {
      y: 300,
      x: 100,
      body: { velocity: { x: 0, y: 0 } },
      setFrame: jest.fn(),
      getData: jest.fn(() => false),
      setData: jest.fn(),
      anims: { stop: jest.fn() },
      setFlipX: jest.fn()
    };
    loser = {
      y: 300,
      x: 200,
      body: { velocity: { x: 0, y: 0 } },
      setFrame: jest.fn(),
      getData: jest.fn(() => false),
      setData: jest.fn(),
      anims: { stop: jest.fn() },
      setFlipX: jest.fn()
    };
    scene.players = [winner, loser];
    scene.winnerIndex = 0;
    scene.gameOver = true;
    scene.fightEnded = true;
  });

  it('forces static winner/loser frames on every update after game over', () => {
    scene.update();
    expect(scene.setSafeFrame).toHaveBeenCalledWith(scene.players[0], 3);
    expect(scene.setSafeFrame).toHaveBeenCalledWith(scene.players[1], 0);
    // Call update again to ensure frames are enforced every frame
    scene.setSafeFrame.mockClear();
    scene.update();
    expect(scene.setSafeFrame).toHaveBeenCalledWith(scene.players[0], 3);
    expect(scene.setSafeFrame).toHaveBeenCalledWith(scene.players[1], 0);
  });

  it('winnerIndex 1 sets correct frames', () => {
    scene.winnerIndex = 1;
    scene.update();
    expect(scene.setSafeFrame).toHaveBeenCalledWith(scene.players[0], 0);
    expect(scene.setSafeFrame).toHaveBeenCalledWith(scene.players[1], 3);
  });

  it('does not call setSafeFrame if winnerIndex is not a number', () => {
    scene.winnerIndex = undefined;
    scene.update();
    expect(scene.setSafeFrame).not.toHaveBeenCalled();
  });
});
