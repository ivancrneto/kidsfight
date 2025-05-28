import Phaser from 'phaser';
import ScenarioSelectScene from '../scenario_select_scene';

describe('ScenarioSelectScene (online mode)', () => {
  let scene: ScenarioSelectScene;
  let wsManagerMock: any;
  let sentMessages: any[];
  let startedScene: any;
  let readyButtonMock: any;

  beforeEach(() => {
    sentMessages = [];
    startedScene = null;
    wsManagerMock = {
      send: jest.fn((msg) => { sentMessages.push(msg); }),
      setMessageCallback: jest.fn(),
    };
    readyButtonMock = {
      on: jest.fn(),
      emit: jest.fn(function (event, ...args) {
        if (event === 'pointerdown') {
          const handler = (readyButtonMock.on as jest.Mock).mock.calls.find(([evt]) => evt === 'pointerdown')?.[1];
          if (handler) handler(...args);
        }
      }),
      setInteractive: jest.fn().mockReturnThis(),
      setOrigin: jest.fn().mockReturnThis(),
      setBackgroundColor: jest.fn().mockReturnThis(),
      disableInteractive: jest.fn().mockReturnThis(),
    };
    scene = new ScenarioSelectScene(wsManagerMock);
    // Mock Phaser methods
    scene.add = {
      text: jest.fn((x, y, text, style) => {
        if (text === 'Pronto!') return readyButtonMock;
        // Return a generic mock for other buttons
        return {
          on: jest.fn(),
          emit: jest.fn(),
          setInteractive: jest.fn().mockReturnThis(),
          setOrigin: jest.fn().mockReturnThis(),
          setBackgroundColor: jest.fn().mockReturnThis(),
          disableInteractive: jest.fn().mockReturnThis(),
        };
      }),
      image: jest.fn(() => ({
        setOrigin: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis(),
        setTexture: jest.fn().mockReturnThis(),
      })),
      rectangle: jest.fn(() => ({})),
    } as any;
    scene.cameras = { main: { width: 800, height: 600 } } as any;
    scene.scale = { on: jest.fn() } as any;
    scene.scene = { start: jest.fn((key, data) => { startedScene = { key, data }; }) } as any;
    // Setup scenario data
    scene['selectedScenario'] = 0;
    scene['mode'] = 'online';
    scene['selected'] = { p1: 'player1', p2: 'player2' };
    scene['roomCode'] = 'ROOM123';
    scene['isHost'] = true;
    // Mock waitingText for setText
    scene.waitingText = { setText: jest.fn() } as any;
    scene.readyButton = readyButtonMock as any;
  });

  it('host sends player_ready and transitions to KidsFightScene only after both players are ready (game_start sent)', () => {
    scene.init({
      mode: 'online',
      selected: { p1: 'player1', p2: 'player2' },
      roomCode: 'ROOM123',
      isHost: true,
      wsManager: wsManagerMock
    });
    scene.create();
    const messageCallback1 = wsManagerMock.setMessageCallback.mock.calls[0][0];
    // Simulate click on readyButton
    const readyBtn = scene.readyButton;
    const pointerDown = (readyBtn.on as jest.Mock).mock.calls.find(([event]) => event === 'pointerdown')[1];
    pointerDown();
    // Should send player_ready (not scenario_selected)
    expect(wsManagerMock.send).toHaveBeenNthCalledWith(1, expect.objectContaining({
      type: 'player_ready',
      player: 'host',
      roomCode: 'ROOM123'
    }));
    // Should NOT start KidsFightScene yet
    expect(startedScene).toBeNull();
    // Simulate host receiving their own player_ready
    messageCallback1({
      data: JSON.stringify({
        type: 'player_ready',
        player: 'host',
        roomCode: 'ROOM123'
      })
    });
    // Simulate guest sending player_ready
    messageCallback1({
      data: JSON.stringify({
        type: 'player_ready',
        player: 'guest',
        roomCode: 'ROOM123'
      })
    });
    // Debug output after host ready
    // eslint-disable-next-line no-console
    console.error('[DEBUG after host]', {
      hostReady: scene['hostReady'],
      guestReady: scene['guestReady'],
      gameStarted: scene['gameStarted']
    });
    // Debug output for wsManagerMock.send calls
    // eslint-disable-next-line no-console
    console.log('wsManagerMock.send.mock.calls:', wsManagerMock.send.mock.calls);
    // Should send scenario_selected as the second message
    expect(wsManagerMock.send).toHaveBeenNthCalledWith(2, expect.objectContaining({
      type: 'scenario_selected',
      scenario: 'scenario1',
      roomCode: 'ROOM123'
    }));
    // Simulate guest sending player_ready
    messageCallback1({
      data: JSON.stringify({
        type: 'player_ready',
        player: 'guest',
        roomCode: 'ROOM123'
      })
    });
    // Should send game_start as the third message
    expect(wsManagerMock.send).toHaveBeenNthCalledWith(3, expect.objectContaining({
      type: 'game_start',
      scenario: 'scenario1',
      roomCode: 'ROOM123'
    }));
    expect(startedScene?.key).toBe('KidsFightScene');
    expect(startedScene?.data.scenario).toBe('scenario1');
  });

  it('guest transitions to KidsFightScene on game_start message', () => {
    // Setup scene as guest
    scene['isHost'] = false;
    scene['mode'] = 'online';
    scene['roomCode'] = 'ROOM123';
    scene['selected'] = { p1: 'player1', p2: 'player2' };
    startedScene = null;
    scene.scene.start = jest.fn((key, data) => { startedScene = { key, data }; });
    scene['wsManager'] = wsManagerMock;
    let messageCallback;
    wsManagerMock.setMessageCallback = jest.fn((callback) => { messageCallback = callback; });
    scene.create();
    // Simulate receiving game_start message
    messageCallback({
      data: JSON.stringify({
        type: 'game_start',
        scenario: 'scenario1',
        roomCode: 'ROOM123',
        p1Char: 'player1',
        p2Char: 'player2'
      })
    });
    expect(startedScene?.key).toBe('KidsFightScene');
    expect(startedScene?.data.scenario).toBe('scenario1');
  });

  it('host sends scenario_selected and game_start messages when ready button is clicked', () => {
    scene.create();
    // Capture the registered message callback
    let messageCallback2: any;
    wsManagerMock.setMessageCallback.mock.calls.forEach(([cb]: [any]) => { messageCallback2 = cb; });
    // Simulate host clicking the ready button
    scene.readyButton.emit('pointerdown');
    // Should send player_ready as the first call
    expect(wsManagerMock.send).toHaveBeenNthCalledWith(1, expect.objectContaining({
      type: 'player_ready',
      player: 'host',
      roomCode: 'ROOM123'
    }));
    // Should send scenario_selected as the second call
    expect(wsManagerMock.send).toHaveBeenNthCalledWith(2, expect.objectContaining({
      type: 'scenario_selected',
      scenario: 'scenario1',
      roomCode: 'ROOM123'
    }));
    // Simulate guest sending player_ready
    messageCallback2({
      data: JSON.stringify({
        type: 'player_ready',
        player: 'guest',
        roomCode: 'ROOM123'
      })
    });
    // Should send game_start as the third call
    expect(wsManagerMock.send).toHaveBeenNthCalledWith(3, expect.objectContaining({
      type: 'game_start',
      p1Char: 'player1',
      p2Char: 'player2',
      scenario: 'scenario1',
      roomCode: 'ROOM123'
    }));
    // Should start KidsFightScene
    expect(startedScene.key).toBe('KidsFightScene');
    expect(startedScene.data.scenario).toBe('scenario1');
  });

  it('should receive and use WebSocketManager from scene data', () => {
    const customWsManager = { send: jest.fn(), setMessageCallback: jest.fn() };
    
    // Initialize scene with data containing wsManager
    scene.init({
      mode: 'online',
      selected: { p1: 'testChar1', p2: 'testChar2' },
      roomCode: 'TEST456',
      isHost: true,
      wsManager: customWsManager
    });
    
    // Verify the wsManager was set correctly
    expect(scene['wsManager']).toBe(customWsManager);
    
    // Test that it's used when sending messages
    scene.createActionButtons();
    const readyBtn = scene.readyButton;
    const pointerDown = (readyBtn.on as jest.Mock).mock.calls.find(([event]) => event === 'pointerdown')[1];
    pointerDown();
    
    // Should use the wsManager from init data
    expect(customWsManager.send).toHaveBeenCalled();
  });
});
