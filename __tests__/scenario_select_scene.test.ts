import Phaser from 'phaser';
import ScenarioSelectScene from '../scenario_select_scene';

describe('ScenarioSelectScene (online mode)', () => {
  let scene: ScenarioSelectScene;
  let wsManagerMock: any;
  let sentMessages: any[];
  let startedScene: any;

  beforeEach(() => {
    sentMessages = [];
    startedScene = null;
    wsManagerMock = {
      send: jest.fn((msg) => { sentMessages.push(msg); }),
      setMessageCallback: jest.fn(),
    };
    scene = new ScenarioSelectScene(wsManagerMock);
    // Mock Phaser methods
    scene.add = {
      text: jest.fn(() => ({ setOrigin: jest.fn().mockReturnThis(), setInteractive: jest.fn().mockReturnThis(), on: jest.fn().mockReturnThis(), setBackgroundColor: jest.fn().mockReturnThis() })),
      image: jest.fn(() => ({ setOrigin: jest.fn().mockReturnThis(), setAlpha: jest.fn().mockReturnThis(), setScale: jest.fn().mockReturnThis() })),
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
  });

  it('host sends scenario_selected and transitions to KidsFightScene', () => {
    scene.createActionButtons();
    // Simulate click on readyButton
    const readyBtn = scene.readyButton;
    // Find pointerdown handler
    const pointerDown = (readyBtn.on as jest.Mock).mock.calls.find(([event]) => event === 'pointerdown')[1];
    pointerDown();
    // Should send scenario_selected (as an object, not a string)
    expect(wsManagerMock.send).toHaveBeenCalledWith(expect.objectContaining({
      type: 'scenario_selected',
      scenario: 'scenario1',
      roomCode: 'ROOM123'
    }));
    // Should start KidsFightScene
    expect(startedScene.key).toBe('KidsFightScene');
    expect(startedScene.data.scenario).toBe('scenario1');
  });

  it('guest transitions to KidsFightScene on scenario_selected message', () => {
    // Setup scene as guest
    scene['isHost'] = false;
    scene['mode'] = 'online';
    scene['roomCode'] = 'ROOM123';
    scene['selected'] = { p1: 'player1', p2: 'player2' };
    
    // Initialize startedScene variable
    startedScene = null;
    
    // Mock scene.start
    scene.scene.start = jest.fn((key, data) => {
      startedScene = { key, data };
    });
    
    // Mock wsManager
    scene['wsManager'] = wsManagerMock;
    
    // Capture the callback
    let messageCallback: Function;
    wsManagerMock.setMessageCallback = jest.fn((callback) => {
      messageCallback = callback;
    });
    
    // Call create to set up the message handlers
    scene.create();
    
    // Simulate receiving scenario_selected message as a string (as it would be from WebSocket)
    messageCallback({
      data: JSON.stringify({
        type: 'scenario_selected',
        scenario: 'scenario1',
        roomCode: 'ROOM123'
      })
    });
    
    // Should start KidsFightScene
    expect(startedScene?.key).toBe('KidsFightScene');
    expect(startedScene?.data.scenario).toBe('scenario1');
  });

  it('host sends scenario_selected and game_start messages when ready button is clicked', () => {
    scene.createActionButtons();
    // Simulate click on readyButton
    const readyBtn = scene.readyButton;
    // Find pointerdown handler
    const pointerDown = (readyBtn.on as jest.Mock).mock.calls.find(([event]) => event === 'pointerdown')[1];
    pointerDown();
    
    // Should send scenario_selected without JSON.stringify
    expect(wsManagerMock.send).toHaveBeenCalledWith(expect.objectContaining({
      type: 'scenario_selected',
      scenario: 'scenario1',
      roomCode: 'ROOM123'
    }));
    
    // Should send game_start without JSON.stringify
    expect(wsManagerMock.send).toHaveBeenCalledWith(expect.objectContaining({
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
