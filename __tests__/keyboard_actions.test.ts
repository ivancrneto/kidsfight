import KidsFightScene from '../kidsfight_scene';

/**
 * Regression tests for keyboard action keys (attack / special / jump / block).
 * Before the fix these keys were created but never bound or polled, so desktop
 * players could move but could not attack, block, jump, or use specials.
 */
describe('KidsFightScene.handleKeyboardActions', () => {
  let scene: any;

  const makeKey = () => ({ isDown: false });

  beforeEach(() => {
    scene = new KidsFightScene();
    scene.gameOver = false;
    scene.fightEnded = false;
    scene.gameMode = 'local';
    scene.players = [{ setData: jest.fn() }, { setData: jest.fn() }];
    scene.playerBlocking = [false, false];
    scene.getPlayerIndex = () => 0;

    // Mocked action handlers
    scene.handleAttack = jest.fn();
    scene.handleSpecial = jest.fn();
    scene.handleJumpDown = jest.fn();
    scene.handleBlock = jest.fn();

    // Mocked keys
    scene.attackKey = makeKey();
    scene.keySpace = makeKey();
    scene.keyQ = makeKey();
    scene.keyW = makeKey();
    scene.blockKey = makeKey();
    scene.keyShift = makeKey();
    scene.cursors = { up: makeKey(), left: makeKey(), right: makeKey() };
  });

  it('fires attack once per key press (edge-triggered)', () => {
    scene.attackKey.isDown = true;
    scene.handleKeyboardActions(); // press
    scene.handleKeyboardActions(); // still held
    expect(scene.handleAttack).toHaveBeenCalledTimes(1);

    scene.attackKey.isDown = false;
    scene.handleKeyboardActions(); // release
    scene.attackKey.isDown = true;
    scene.handleKeyboardActions(); // press again
    expect(scene.handleAttack).toHaveBeenCalledTimes(2);
  });

  it('fires special on Q press', () => {
    scene.keyQ.isDown = true;
    scene.handleKeyboardActions();
    expect(scene.handleSpecial).toHaveBeenCalledTimes(1);
  });

  it('fires jump on ArrowUp or W', () => {
    scene.cursors.up.isDown = true;
    scene.handleKeyboardActions();
    expect(scene.handleJumpDown).toHaveBeenCalledTimes(1);

    scene.cursors.up.isDown = false;
    scene.handleKeyboardActions();
    scene.keyW.isDown = true;
    scene.handleKeyboardActions();
    expect(scene.handleJumpDown).toHaveBeenCalledTimes(2);
  });

  it('engages block on key down and releases it on key up', () => {
    scene.blockKey.isDown = true;
    scene.handleKeyboardActions(); // engage
    expect(scene.handleBlock).toHaveBeenCalledTimes(1);

    scene.blockKey.isDown = false;
    scene.handleKeyboardActions(); // release
    expect(scene.players[0].setData).toHaveBeenCalledWith('isBlocking', false);
    expect(scene.playerBlocking[0]).toBe(false);
  });

  it('does nothing when the game is over', () => {
    scene.gameOver = true;
    scene.attackKey.isDown = true;
    scene.handleKeyboardActions();
    expect(scene.handleAttack).not.toHaveBeenCalled();
  });
});
