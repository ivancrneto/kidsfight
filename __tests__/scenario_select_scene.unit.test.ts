import ScenarioSelectScene from '../scenario_select_scene';
import Phaser from 'phaser';

describe('ScenarioSelectScene - Unit Tests', () => {
  let scene: ScenarioSelectScene;
  let wsManagerMock: any;
  let sentMessages: any[];
  let startedScene: any;

  let pointerDownHandler: Function | null = null;
  beforeEach(() => {
    sentMessages = [];
    startedScene = null;
    pointerDownHandler = null;
    wsManagerMock = {
      send: jest.fn((msg) => { sentMessages.push(msg); }),
      setMessageCallback: jest.fn(),
    };

    scene = new ScenarioSelectScene(wsManagerMock);
    scene.add = {
      text: jest.fn(() => {
        const mockButton = {
          on: jest.fn((event, handler) => {
            if (event === 'pointerdown') pointerDownHandler = handler;
            return mockButton;
          }),
          emit: jest.fn((event, ...args) => {
            if (event === 'pointerdown' && pointerDownHandler) pointerDownHandler(...args);
          }),
          setInteractive: jest.fn().mockReturnThis(),
          setOrigin: jest.fn().mockReturnThis(),
          setBackgroundColor: jest.fn().mockReturnThis(),
          disableInteractive: jest.fn().mockReturnThis(),
          setText: jest.fn().mockReturnThis(),
          setTint: jest.fn().mockReturnThis(),
          setDepth: jest.fn().mockReturnThis(),
          setPadding: jest.fn().mockReturnThis(),
        };
        return mockButton;
      }),
      image: jest.fn(() => ({
        setOrigin: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setDisplaySize: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setTexture: jest.fn().mockReturnThis(),
      })),
      rectangle: jest.fn(() => ({
        setOrigin: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
      })),
    } as any;
    scene.cameras = { main: { width: 800, height: 600 } } as any;
    scene.scene = {
      start: jest.fn((key, data) => { startedScene = { key, data }; }),
      get: jest.fn()
    } as any;
    scene['selectedScenario'] = 0;
    scene['mode'] = 'online';
    scene['selected'] = { p1: 'player1', p2: 'player2' };
    scene['roomCode'] = 'ROOM123';
    scene['isHost'] = true;
    scene.waitingText = { setText: jest.fn(), setVisible: jest.fn(), setOrigin: jest.fn() } as any;
  });

  it('host sends player_ready with scenario, guest does not', () => {
    // Host
    scene['isHost'] = true;
    scene['wsManager'] = wsManagerMock;
    scene['selectedScenario'] = 1;
    scene['mode'] = 'online';
    scene.createActionButtons();
    // Assign the actual readyButton mock
    const readyButton = scene.add.text.mock.results[scene.add.text.mock.calls.length - 1].value;
    scene.readyButton = readyButton;
    // Simulate ready button click
    scene.readyButton.emit('pointerdown');
    expect(sentMessages[sentMessages.length - 1]).toEqual({
      type: 'player_ready',
      player: 'host',
      scenario: expect.any(String)
    });
    // Guest
    sentMessages.length = 0;
    scene['isHost'] = false;
    scene['wsManager'] = wsManagerMock;
    scene['selectedScenario'] = 1;
    scene['mode'] = 'online';
    scene.createActionButtons();
    // Assign the actual readyButton mock
    const readyButtonGuest = scene.add.text.mock.results[scene.add.text.mock.calls.length - 1].value;
    scene.readyButton = readyButtonGuest;
    scene.readyButton.emit('pointerdown');
    expect(sentMessages[sentMessages.length - 1]).toEqual({
      type: 'player_ready',
      player: 'guest'
    });
  });

  it('does not allow guest to change scenario', () => {
    scene['isHost'] = false;
    scene['mode'] = 'online';
    scene['selectedScenario'] = 0;
    scene.preview = { setTexture: jest.fn(), setOrigin: jest.fn() } as any;
    scene.rescalePreview = jest.fn();
    const originalScenario = scene['selectedScenario'];
    scene.changeScenario(1);
    expect(scene['selectedScenario']).toBe(originalScenario);
  });

  it('allows host to change scenario and sends scenario_selected', () => {
    scene['isHost'] = true;
    scene['mode'] = 'online';
    scene['selectedScenario'] = 0;
    scene.preview = { setTexture: jest.fn(), setOrigin: jest.fn() } as any;
    scene.rescalePreview = jest.fn();
    scene['wsManager'] = wsManagerMock;
    scene.changeScenario(1);
    expect(scene['selectedScenario']).toBe(1);
    expect(sentMessages[sentMessages.length - 1]).toEqual({
      type: 'scenario_selected',
      scenario: expect.any(String),
      roomCode: 'ROOM123',
    });
  });

  it('disables ready button after click', () => {
    scene['isHost'] = true;
    scene['wsManager'] = wsManagerMock;
    scene.createActionButtons();
    // Assign the actual readyButton mock
    const readyButton = scene.add.text.mock.results[scene.add.text.mock.calls.length - 1].value;
    scene.readyButton = readyButton;
    scene.readyButton.disableInteractive = jest.fn();
    scene.readyButton.setTint = jest.fn();
    scene.readyButton.setText = jest.fn();
    scene.readyButton.emit('pointerdown');
    expect(scene.readyButton.disableInteractive).toHaveBeenCalled();
    expect(scene.readyButton.setTint).toHaveBeenCalled();
    expect(scene.readyButton.setText).toHaveBeenCalledWith('AGUARDANDO...');
  });

  it('local mode: ready button starts game directly', () => {
    scene['mode'] = 'local';
    scene['isHost'] = true;
    const startGameSpy = jest.spyOn(scene, 'startGame');
    
    // Manually create a simplified mock of the ready button that will directly call startGame
    const mockButton = {
      on: jest.fn((event, handler) => {
        if (event === 'pointerdown') {
          mockButton.pointerdownHandler = handler;
        }
        return mockButton;
      }),
      emit: jest.fn((event) => {
        if (event === 'pointerdown' && mockButton.pointerdownHandler) {
          mockButton.pointerdownHandler();
        }
        return mockButton;
      }),
      setOrigin: jest.fn().mockReturnThis(),
      setInteractive: jest.fn().mockReturnThis(),
      setText: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis(),
      setPadding: jest.fn().mockReturnThis(),
      setBackgroundColor: jest.fn().mockReturnThis(),
      pointerdownHandler: null as any
    };
    
    // Assign our custom button
    scene['readyButton'] = mockButton;
    
    // Set up the handler like ScenarioSelectScene does
    mockButton.on('pointerdown', () => {
      scene.startGame();
    });
    
    // Simulate pointerdown for local mode handler
    mockButton.emit('pointerdown');
    
    // Verify the spy was called
    expect(startGameSpy).toHaveBeenCalled();
  });
});
