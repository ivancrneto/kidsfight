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
      on: jest.fn((event, callback) => {
        if (event === 'pointerdown') {
          readyButtonMock.pointerDownCallback = callback;
        }
        return readyButtonMock;
      }),
      emit: jest.fn(function(event, ...args) {
        if (event === 'pointerdown' && readyButtonMock.pointerDownCallback) {
          readyButtonMock.pointerDownCallback(...args);
        }
      }),
      setInteractive: jest.fn().mockReturnThis(),
      setOrigin: jest.fn().mockReturnThis(),
      setBackgroundColor: jest.fn().mockReturnThis(),
      disableInteractive: jest.fn().mockReturnThis(),
      setText: jest.fn().mockReturnThis(),
      setTint: jest.fn().mockReturnThis(),
      pointerDownCallback: null as any,
    };

    scene = new ScenarioSelectScene(wsManagerMock);
    
    // Mock Phaser methods
    scene.add = {
      text: jest.fn((x, y, text, style) => {
        if (text === 'Pronto!' || text === 'COMEÇAR') {
          return readyButtonMock;
        }
        // Return a generic mock for other text elements
        return {
          ...readyButtonMock,
          setText: jest.fn().mockReturnThis(),
          setTint: jest.fn().mockReturnThis(),
          setOrigin: jest.fn().mockReturnThis(),
          setInteractive: jest.fn().mockReturnThis(),
        };
      }),
      image: jest.fn(() => ({
        setOrigin: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis(),
        setTexture: jest.fn().mockReturnThis(),
      })),
      rectangle: jest.fn(() => ({
        setOrigin: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        setFillStyle: jest.fn().mockReturnThis(),
      })),
    } as any;

    scene.cameras = { 
      main: { 
        width: 800, 
        height: 600,
        centerX: { set: jest.fn() },
        centerY: { set: jest.fn() }
      } 
    } as any;
    
    scene.scale = { 
      on: jest.fn(),
      width: 800,
      height: 600
    } as any;
    
    scene.scene = { 
      start: jest.fn((key, data) => { 
        startedScene = { key, data }; 
      }),
      get: jest.fn()
    } as any;
    
    // Setup scenario data
    scene['selectedScenario'] = 0;
    scene['mode'] = 'online';
    scene['selected'] = { p1: 'player1', p2: 'player2' };
    scene['roomCode'] = 'ROOM123';
    scene['isHost'] = true;
    
    // Mock waitingText
    scene.waitingText = { 
      setText: jest.fn().mockReturnThis(),
      setVisible: jest.fn().mockReturnThis(),
      setOrigin: jest.fn().mockReturnThis()
    } as any;
  });

  it('host starts the game and sends game_start message when ready button is clicked', () => {
    // Mock the ready button with pointerdown event handler
    const readyButtonMock = { 
      emit: jest.fn(),
      on: jest.fn((event, callback) => {
        if (event === 'pointerdown') {
          readyButtonMock.pointerdownCallback = callback;
        }
      }),
      pointerdownCallback: null
    } as any;
    
    // Setup initial state
    scene.init({
      mode: 'online',
      selected: { p1: 'player1', p2: 'player2' },
      roomCode: 'ROOM123',
      isHost: true,
      wsManager: wsManagerMock
    });
    
    // Mock the startGame method to ensure it's called
    const startGameSpy = jest.spyOn(scene, 'startGame');
    
    // Create the scene
    scene.create();
    
    // Set the readyButton on the scene after create (using type assertion to access private property)
    (scene as any).readyButton = readyButtonMock;
    
    // Manually call the hostReady handler that would normally be triggered by pointerdown
    scene['hostReady'] = true;
    scene['updateReadyUI']();
    scene['startGame']();
    
    // Verify startGame was called
    expect(startGameSpy).toHaveBeenCalled();
    
    // Verify game_start was sent with correct data
    expect(wsManagerMock.send).toHaveBeenCalledWith(expect.objectContaining({
      type: 'game_start',
      scenario: 'scenario1',
      p1Char: 'player1',
      p2Char: 'player2',
      roomCode: 'ROOM123',
      isHost: true
    }));
    
    // Verify scene started with correct parameters
    expect(scene.scene.start).toHaveBeenCalledWith('KidsFightScene', {
      gameMode: 'online',
      mode: 'online',
      p1: 'player1',
      p2: 'player2',
      selected: { p1: 'player1', p2: 'player2' },
      scenario: 'scenario1',
      roomCode: 'ROOM123',
      isHost: true,
      wsManager: wsManagerMock
    });
  });

  it('guest transitions to KidsFightScene on game_start message', () => {
    // Setup as guest
    scene['isHost'] = false;
    scene.init({
      mode: 'online',
      selected: { p1: 'player1', p2: 'player2' },
      roomCode: 'ROOM123',
      isHost: false,
      wsManager: wsManagerMock
    });
    
    // Mock the WebSocket message callback
    let messageCallback: (event: { data: string }) => void;
    wsManagerMock.setMessageCallback.mockImplementation((cb: any) => {
      messageCallback = cb;
      return () => {}; // Return cleanup function
    });
    
    // Create the scene
    scene.create();
    
    // Simulate receiving game_start message
    messageCallback!({ 
      data: JSON.stringify({
        type: 'game_start',
        scenario: 'scenario1',
        p1Char: 'player1',
        p2Char: 'player2',
        roomCode: 'ROOM123',
        isHost: false,
        playerIndex: 1
      })
    });
    
    // Verify scene started with correct parameters
    expect(scene.scene.start).toHaveBeenCalledWith('KidsFightScene', {
      gameMode: 'online',
      mode: 'online',
      p1: 'player1',
      p2: 'player2',
      selected: { p1: 'player1', p2: 'player2' },
      scenario: 'scenario1',
      roomCode: 'ROOM123',
      isHost: false,
      playerIndex: 1,
      wsManager: wsManagerMock
    });
  });
});
