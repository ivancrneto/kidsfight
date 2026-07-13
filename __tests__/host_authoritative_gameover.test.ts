import KidsFightScene from '../kidsfight_scene';

/**
 * The host is authoritative for the match result: endGame() broadcasts a
 * game_over message, and a guest applies a received game_over via
 * handleRemoteAction (without re-broadcasting).
 */
describe('KidsFightScene host-authoritative game over', () => {
  let scene: any;

  beforeEach(() => {
    scene = new KidsFightScene();
    scene.players = [{ setData: jest.fn(), setFrame: jest.fn() }, { setData: jest.fn(), setFrame: jest.fn() }];
    scene.playerHealth = [100, 100];
    scene.gameMode = 'online';
    scene.selected = { p1: 'bento', p2: 'roni' };
    scene.updateHealthBar = jest.fn();
    scene.gameOver = false;
    scene.fightEnded = false;
  });

  it('host broadcasts game_over when the match ends', () => {
    scene.isHost = true;
    const send = jest.fn();
    scene.wsManager = { send };

    // endGame sets gameOver and broadcasts near the top, then touches UI we
    // don't fully mock here; the broadcast has already happened by then.
    try { scene.endGame(0, 'Bento Venceu!'); } catch { /* unmocked UI after broadcast */ }

    expect(scene.gameOver).toBe(true);
    expect(scene.winnerIndex).toBe(0);
    expect(send).toHaveBeenCalledWith({ type: 'game_over', winnerIndex: 0, message: 'Bento Venceu!' });
  });

  it('guest applies a received game_over via endGame and does not re-broadcast', () => {
    scene.isHost = false;
    const send = jest.fn();
    scene.wsManager = { send };
    scene.endGame = jest.fn(); // isolate the routing from endGame's UI work

    scene.handleRemoteAction({ type: 'game_over', winnerIndex: 1, message: 'Roni Venceu!' });

    expect(scene.endGame).toHaveBeenCalledWith(1, 'Roni Venceu!');
    // A guest must not echo the game_over back to the server.
    expect(send).not.toHaveBeenCalled();
  });
});
