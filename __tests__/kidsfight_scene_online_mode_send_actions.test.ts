import KidsFightScene from '../kidsfight_scene';
import { jest } from '@jest/globals';

describe('KidsFightScene - Online Mode Action Sending', () => {
  let scene: KidsFightScene;
  let wsManagerMock: any;

  beforeEach(() => {
    wsManagerMock = {
      send: jest.fn(),
      isConnected: () => true
    };
    scene = new KidsFightScene({});
    scene.gameMode = 'online';
    scene.localPlayerIndex = 1;
    scene.wsManager = wsManagerMock;
    scene.players = [
      {} as any, // dummy for index 0
      {
        body: {
          touching: { down: true },
          blocked: { down: true },
          setGravityY: jest.fn(),
          setVelocityX: jest.fn(),
          setVelocityY: jest.fn(),
          setCollideWorldBounds: jest.fn(),
          on: jest.fn(),
          velocity: { x: 0, y: 0 }
        }
      } as any,
    ];
    scene.player1 = {
      setData: jest.fn(),
      getData: jest.fn(() => false),
      setVelocityX: jest.fn(),
      setVelocityY: jest.fn(),
      setFlipX: jest.fn(),
      setFrame: jest.fn(),
      body: {
        blocked: { down: true },
        touching: { down: true },
        velocity: { x: 0, y: 0 },
        setVelocityX: jest.fn(),
        setVelocityY: jest.fn(),
        setGravityY: jest.fn(),
        setCollideWorldBounds: jest.fn(),
        on: jest.fn()
      }
    } as any;
    scene.playerSpecial = [10, 10];
    scene.SPECIAL_COST = 3;
    scene.time = { delayedCall: jest.fn() } as any;
  });

  it('sends move left with correct playerIndex', () => {
    scene.handleLeftDown();
    expect(wsManagerMock.send).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'position_update', playerIndex: 1 })
    );
  });

  it('sends move right with correct playerIndex', () => {
    scene.handleRightDown();
    expect(wsManagerMock.send).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'position_update', playerIndex: 1 })
    );
  });

  it('sends jump with correct playerIndex', () => {
    scene.handleJumpDown();
    expect(wsManagerMock.send).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'jump', playerIndex: 1 })
    );
  });

  it('sends attack with correct playerIndex', () => {
    scene.wsManager = wsManagerMock;
    wsManagerMock.send = jest.fn();
    scene.handleAttack();
    expect(wsManagerMock.send).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'attack', playerIndex: 1 })
    );
  });

  it('sends special with correct playerIndex', () => {
    scene.wsManager = wsManagerMock;
    wsManagerMock.send = jest.fn();
    scene.handleSpecial();
    expect(wsManagerMock.send).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'special', playerIndex: 1 })
    );
  });
});
