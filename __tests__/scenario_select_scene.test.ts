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
    // Should send scenario_selected
    expect(wsManagerMock.send).toHaveBeenCalledWith(expect.stringContaining('scenario_selected'));
    // Should start KidsFightScene
    expect(startedScene.key).toBe('KidsFightScene');
    expect(startedScene.data.scenario).toBe('scenario1');
  });

  it('guest transitions to KidsFightScene on scenario_selected message', () => {
    scene['isHost'] = false;
    let callback: any = null;
    wsManagerMock.setMessageCallback = jest.fn(cb => { callback = cb; });
    scene['wsManager'] = wsManagerMock;
    scene['mode'] = 'online';
    scene['selected'] = { p1: 'player1', p2: 'player2' };
    scene['roomCode'] = 'ROOM123';
    scene['isHost'] = false;
    scene.create();
    // Simulate receiving scenario_selected message
    callback({ data: JSON.stringify({ type: 'scenario_selected', scenario: 'scenario1', roomCode: 'ROOM123' }) });
    // Should start KidsFightScene
    expect(startedScene.key).toBe('KidsFightScene');
    expect(startedScene.data.scenario).toBe('scenario1');
  });
});
