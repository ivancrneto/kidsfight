import KidsFightScene from '../kidsfight_scene';

describe('KidsFightScene.handleRemoteAction', () => {
  let scene: any;
  let player0: any;
  let player1: any;

  beforeEach(() => {
    scene = new KidsFightScene();
    scene.players = [];
    player0 = {
      setVelocityX: jest.fn(),
      setVelocityY: jest.fn(),
      setFlipX: jest.fn(),
      setPosition: jest.fn(),
      body: { reset: jest.fn() },
      setData: jest.fn(),
      x: 0,
      y: 0,
      health: 100
    };
    player1 = {
      setVelocityX: jest.fn(),
      setVelocityY: jest.fn(),
      setFlipX: jest.fn(),
      setPosition: jest.fn(),
      body: { reset: jest.fn() },
      setData: jest.fn(),
      x: 0,
      y: 0,
      health: 100
    };
    scene.players[0] = player0;
    scene.players[1] = player1;
    scene.playerBlocking = [false, false];
    scene.playerHealth = [100, 100];
    scene.playerDirection = [];
    scene.updateHealthBar = jest.fn();
    scene.updatePlayerAnimation = jest.fn();
    jest.spyOn(scene as any, 'tryAttack').mockImplementation(() => {});
    scene.showReplayRequestPopup = jest.fn();
    scene.hideReplayPopup = jest.fn();
    scene.endGame = jest.fn();
    scene.checkWinner = jest.fn(() => -1);
    scene.gameOver = false;
  });

  it('handles move action', () => {
    scene.handleRemoteAction({ type: 'move', playerIndex: 0, direction: -1 });
    expect(player0.setVelocityX).toHaveBeenCalledWith(-160);
    expect(player0.setFlipX).toHaveBeenCalledWith(true);
    expect(scene.playerDirection[0]).toBe('left');
  });

  it('handles jump action', () => {
    scene.handleRemoteAction({ type: 'jump', playerIndex: 1 });
    expect(player1.setVelocityY).toHaveBeenCalled();
  });

  it('handles block action', () => {
    scene.handleRemoteAction({ type: 'block', playerIndex: 1, active: true });
    expect(player1.setData).toHaveBeenCalledWith('isBlocking', true);
    expect(scene.playerBlocking[1]).toBe(true);
  });

  it('handles attack action', () => {
    const now = Date.now();
    (scene as any).tryAttack.mockClear();
    scene.handleRemoteAction({ type: 'attack', playerIndex: 0, now });
    expect((scene as any).tryAttack).toHaveBeenCalledTimes(2);
  });

  it('handles special action', () => {
    const now = Date.now();
    (scene as any).tryAttack.mockClear();
    scene.handleRemoteAction({ type: 'special', playerIndex: 1, now });
    expect((scene as any).tryAttack).toHaveBeenCalledTimes(2);
  });

  it('handles position_update action', () => {
    scene.handleRemoteAction({
      type: 'position_update', playerIndex: 0,
      x: 10, y: 20, velocityX: 5, velocityY: 6, flipX: true
    });
    expect(player0.setPosition).toHaveBeenCalledWith(10, 20);
    expect(player0.body.reset).toHaveBeenCalledWith(10, 20);
    expect(player0.setVelocityX).toHaveBeenCalledWith(5);
    expect(player0.setVelocityY).toHaveBeenCalledWith(6);
    expect(player0.setFlipX).toHaveBeenCalledWith(true);
    expect(scene.updatePlayerAnimation).toHaveBeenCalledWith(0);
  });

  it('handles health_update action', () => {
    scene.playerHealth = [100, 100];
    scene.handleRemoteAction({ type: 'health_update', playerIndex: 1, health: 30 });
    expect(scene.playerHealth[1]).toBe(30);
    expect(player1.health).toBe(30);
    expect(scene.updateHealthBar).toHaveBeenCalledWith(1);
  });

  it('parses raw JSON string', () => {
    const json = JSON.stringify({ type: 'move', playerIndex: 1, direction: 1 });
    scene.handleRemoteAction(json);
    expect(player1.setVelocityX).toHaveBeenCalledWith(160);
    expect(player1.setFlipX).toHaveBeenCalledWith(false);
  });

  it('parses action.data JSON string', () => {
    const data = JSON.stringify({ type: 'jump', playerIndex: 0 });
    scene.handleRemoteAction({ data });
    expect(player0.setVelocityY).toHaveBeenCalled();
  });

  it('skips invalid JSON string', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    scene.handleRemoteAction('invalid');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

});
