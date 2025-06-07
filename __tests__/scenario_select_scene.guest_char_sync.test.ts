import ScenarioSelectScene, { SCENARIOS } from '../scenario_select_scene';

describe('ScenarioSelectScene Guest Character Sync', () => {
  let scene: ScenarioSelectScene;
  let wsManagerMock: any;
  let startedScene: any;

  beforeEach(() => {
    wsManagerMock = {
      send: jest.fn(),
      setMessageCallback: jest.fn(),
      setRoomCode: jest.fn(),
      setHost: jest.fn()
    };
    startedScene = null;
    scene = new ScenarioSelectScene(wsManagerMock);
    scene.add = {
      text: jest.fn(() => ({
        setOrigin: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        setBackgroundColor: jest.fn().mockReturnThis(),
        setText: jest.fn().mockReturnThis(),
        setTint: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        disableInteractive: jest.fn().mockReturnThis(),
        setColor: jest.fn().mockReturnThis(),
        setStyle: jest.fn().mockReturnThis(),
      })),
      image: jest.fn(() => ({
        setOrigin: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis(),
        setTexture: jest.fn().mockReturnThis(),
        setDisplaySize: jest.fn().mockReturnThis(),
      })),
      rectangle: jest.fn(() => ({
        setOrigin: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        setFillStyle: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
      })),
    } as any;
    scene.cameras = {
      main: {
        width: 800,
        height: 600,
        centerX: 400,
        centerY: 300
      }
    } as any;
    scene.scale = {
      on: jest.fn(),
      off: jest.fn(),
      width: 800,
      height: 600
    } as any;
    scene.scene = {
      start: jest.fn((key, data) => {
        startedScene = { key, data };
      }),
      get: jest.fn()
    } as any;
    scene['selectedScenario'] = 0;
    scene['mode'] = 'online';
    scene['selected'] = { p1: 'bento', p2: 'davir' };
    scene['roomCode'] = 'TEST123';
    scene['isHost'] = true;
    jest.spyOn(console, 'debug').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    // Setup WebSocket handler
    scene.create = jest.fn(() => {
      scene['_wsMessageHandler'] = (event: { data: string }) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'player_selected') {
            if (scene['mode'] === 'online') {
              if (data.player === 'p1') {
                scene['selected'].p1 = data.character;
              } else if (data.player === 'p2' || data.player === 'guest') {
                scene['selected'].p2 = data.character;
              }
            }
          }
        } catch (e) {}
      };
      scene['wsManager'].setMessageCallback(scene['_wsMessageHandler']);
    });
    scene.create();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should update selected.p2 when host receives guest character selection', () => {
    // Initial state
    expect(scene['selected'].p2).toBe('davir');
    // Simulate guest selects jose
    const message = { type: 'player_selected', player: 'p2', character: 'jose' };
    scene['_wsMessageHandler']({ data: JSON.stringify(message) });
    expect(scene['selected'].p2).toBe('jose');
  });

  it('should update selected.p1 when host receives host character selection', () => {
    // Initial state
    expect(scene['selected'].p1).toBe('bento');
    // Simulate host selects carol
    const message = { type: 'player_selected', player: 'p1', character: 'carol' };
    scene['_wsMessageHandler']({ data: JSON.stringify(message) });
    expect(scene['selected'].p1).toBe('carol');
  });
});
