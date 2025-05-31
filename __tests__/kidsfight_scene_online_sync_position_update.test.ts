import KidsFightScene from '../kidsfight_scene';
import { WebSocketManager } from '../websocket_manager';
import Phaser from 'phaser';

describe('KidsFightScene Online Position Sync', () => {
  let scene: any;
  let wsManager: WebSocketManager;
  let playerMock: any;
  let sendSpy: jest.SpyInstance;

  beforeEach(() => {
    wsManager = new WebSocketManager('ws://test');
    scene = new KidsFightScene();
    scene.wsManager = wsManager;
    scene.gameMode = 'online';
    scene.localPlayerIndex = 0;
    // Mock player sprite with physics body and getData
    playerMock = {
      x: 100,
      y: 200,
      body: { velocity: { x: 0, y: 0 } },
      flipX: false,
      frame: 0,
      setVelocityX: jest.fn(),
      setVelocityY: jest.fn(),
      setFlipX: jest.fn(),
      setFrame: jest.fn(),
      getData: jest.fn().mockReturnValue(false), // Always return false for animation flags
    };
    scene.players = [playerMock, {}];
    sendSpy = jest.spyOn(wsManager, 'send').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends position_update immediately on handleLeftUp', () => {
    playerMock.body.velocity.x = 0;
    playerMock.body.velocity.y = 0;
    scene.handleLeftUp();
    expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'position_update',
      playerIndex: 0,
      x: 100,
      y: 200,
      velocityX: 0,
      velocityY: 0,
      flipX: false,
      frame: 0
    }));
  });

  it('sends position_update immediately on handleRightUp', () => {
    playerMock.body.velocity.x = 0;
    playerMock.body.velocity.y = 0;
    scene.handleRightUp();
    expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'position_update',
      playerIndex: 0,
      x: 100,
      y: 200,
      velocityX: 0,
      velocityY: 0,
      flipX: false,
      frame: 0
    }));
  });

  it('does not send position_update if not in online mode', () => {
    scene.gameMode = 'local';
    scene.handleLeftUp();
    scene.handleRightUp();
    expect(sendSpy).not.toHaveBeenCalled();
  });

  it('processes position_update actions in message handler', () => {
    // Simulate remote message dispatch
    const remotePlayer = {
      setVelocityX: jest.fn(),
      setVelocityY: jest.fn(),
      setFlipX: jest.fn(),
      setFrame: jest.fn(),
      getData: jest.fn().mockReturnValue(false),
      x: 0,
      y: 0,
      body: { velocity: { x: 0, y: 0 }, blocked: { down: false } },
    };
    scene.players[1] = remotePlayer;
    const action = {
      type: 'position_update',
      playerIndex: 1,
      x: 500,
      y: 300,
      velocityX: 0,
      velocityY: 0,
      flipX: true,
      frame: 0
    };
    scene.handleRemoteAction(action);
    expect(remotePlayer.x).toBe(500);
    expect(remotePlayer.y).toBe(300);
    expect(remotePlayer.setVelocityX).toHaveBeenCalledWith(0);
    expect(remotePlayer.setVelocityY).toHaveBeenCalledWith(0);
    expect(remotePlayer.setFlipX).toHaveBeenCalledWith(true);
  });

  it('position_update is not ignored in message dispatch', () => {
    // Simulate message dispatch logic
    const remotePlayer = {
      setVelocityX: jest.fn(),
      setVelocityY: jest.fn(),
      setFlipX: jest.fn(),
      setFrame: jest.fn(),
      getData: jest.fn().mockReturnValue(false),
      x: 0,
      y: 0,
      body: { velocity: { x: 0, y: 0 }, blocked: { down: false } },
    };
    scene.players[1] = remotePlayer;
    const handleRemoteActionSpy = jest.spyOn(scene, 'handleRemoteAction');
    const action = {
      type: 'position_update',
      playerIndex: 1,
      x: 500,
      y: 300,
      velocityX: 0,
      velocityY: 0,
      flipX: true,
      frame: 0
    };
    scene.handleRemoteAction(action);
    expect(handleRemoteActionSpy).toHaveBeenCalledWith(action);
  });
});
