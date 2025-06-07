import Phaser from 'phaser';
import ScenarioSelectScene from '../scenario_select_scene';

describe('ScenarioSelectScene Host Transition Tests', () => {
  let scene: ScenarioSelectScene;
  let wsManagerMock: any;
  let sentMessages: any[];
  let startedScene: any;
  
  beforeEach(() => {
    // Mock setTimeout
    jest.useFakeTimers();
    
    sentMessages = [];
    startedScene = null;
    
    wsManagerMock = {
      send: jest.fn((msg) => { sentMessages.push(msg); }),
      setMessageCallback: jest.fn(),
      setRoomCode: jest.fn(),
      setHost: jest.fn()
    };
    
    scene = new ScenarioSelectScene(wsManagerMock);
    
    // Mock Phaser methods
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
    
    // Setup initial scene state
    scene['selectedScenario'] = 0;
    scene['mode'] = 'online';
    scene['selected'] = { p1: 'bento', p2: 'davir' };
    scene['roomCode'] = 'TEST123';
    scene['isHost'] = true;
    
    // Mock console methods for testing
    jest.spyOn(console, 'debug').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });
  
  describe('Host Game Start Flow', () => {
    it('should send game_start message and transition to game scene after timeout when host starts game', () => {
      // Setup as host
      scene['isHost'] = true;
      scene['hostReady'] = true;
      scene['guestReady'] = true;
      
      // Mock setTimeout
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn().mockImplementation((cb, ms) => {
        if (ms === 100) {
          // Immediately execute the callback
          cb();
        }
        return 123; // Return a dummy timeout ID
      });
      
      // Call startGame
      scene['startGame']();
      
      // Verify game_start message was sent
      expect(wsManagerMock.send).toHaveBeenCalledWith(expect.objectContaining({
        type: 'game_start',
        scenario: 'scenario1',
        p1Char: 'bento',
        p2Char: 'davir',
        roomCode: 'TEST123',
        isHost: true
      }));
      
      // Verify setTimeout was called with 100ms
      expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), 100);
      
      // Verify scene transition occurred
      expect(scene.scene.start).toHaveBeenCalledWith('KidsFightScene', expect.objectContaining({
        gameMode: 'online',
        mode: 'online',
        p1: 'bento',
        p2: 'davir',
        selected: { p1: 'bento', p2: 'davir' },
        scenario: 'scenario1',
        selectedScenario: 'scenario1',
        roomCode: 'TEST123',
        isHost: true,
        wsManager: wsManagerMock
      }));
      
      // Restore original setTimeout
      global.setTimeout = originalSetTimeout;
    });
    
    it('should respect cooldown period between game start attempts', () => {
      // Setup as host
      scene['isHost'] = true;
      scene['hostReady'] = true;
      scene['guestReady'] = true;
      
      // Mock Date.now to control time
      const originalDateNow = Date.now;
      const mockTime = 1000000;
      Date.now = jest.fn(() => mockTime);
      
      // First call to startGame
      scene['startGame']();
      
      // Verify game_start message was sent
      expect(wsManagerMock.send).toHaveBeenCalledTimes(1);
      
      // Reset mock to simulate second call
      wsManagerMock.send.mockClear();
      scene.scene.start.mockClear();
      
      // Second call to startGame immediately after (should be throttled)
      scene['startGame']();
      
      // Verify no additional message was sent due to cooldown
      expect(wsManagerMock.send).not.toHaveBeenCalled();
      
      // Advance time past cooldown
      Date.now = jest.fn(() => mockTime + 1500);
      
      // Third call to startGame after cooldown
      scene['startGame']();
      
      // Verify message was sent after cooldown
      expect(wsManagerMock.send).toHaveBeenCalledTimes(1);
      
      // Restore original Date.now
      Date.now = originalDateNow;
    });
  });
  
  describe('_transitionToGame Helper Method', () => {
    it('should correctly transition to KidsFightScene with provided data', () => {
      // Test data
      const testData = {
        scenario: 'scenario2',
        roomCode: 'ROOM456',
        isHost: true,
        playerIndex: 0
      };
      
      // Call transition helper
      scene['_transitionToGame'](testData, 'bento', 'davir');
      
      // Verify scene started with correct parameters
      expect(scene.scene.start).toHaveBeenCalledWith('KidsFightScene', expect.objectContaining({
        gameMode: 'online',
        mode: 'online',
        p1: 'bento',
        p2: 'davir',
        selected: { p1: 'bento', p2: 'davir' },
        scenario: 'scenario2',
        selectedScenario: 'scenario2',
        roomCode: 'ROOM456',
        isHost: true,
        playerIndex: 0,
        wsManager: wsManagerMock
      }));
    });
    
    it('should handle missing data with default values', () => {
      // Test with minimal data
      const testData = {
        // No scenario or other fields
      };
      
      // Call transition helper
      scene['_transitionToGame'](testData, 'bento', 'davir');
      
      // Verify scene started with default values
      expect(scene.scene.start).toHaveBeenCalledWith('KidsFightScene', expect.objectContaining({
        scenario: 'scenario1', // Default
        selectedScenario: 'scenario1', // Default
        roomCode: 'TEST123', // From scene
        isHost: true, // From scene
        playerIndex: 0, // Default for host
      }));
    });
    
    it('should handle errors during transition', () => {
      // Mock scene.start to throw error
      scene.scene.start.mockImplementation(() => {
        throw new Error('Test error');
      });
      
      // Call transition helper
      scene['_transitionToGame']({}, 'bento', 'davir');
      
      // Verify error was logged
      expect(console.error).toHaveBeenCalledWith(
        '[ScenarioSelectScene][_transitionToGame] Error transitioning to game:',
        expect.any(Error)
      );
      
      // Verify gameStarted was reset
      expect(scene['gameStarted']).toBe(false);
    });
  });
  
  describe('validateCharacterKey Method', () => {
    it('should return valid character keys unchanged', () => {
      expect(scene['validateCharacterKey']('bento')).toBe('bento');
      expect(scene['validateCharacterKey']('davir')).toBe('davir');
      expect(scene['validateCharacterKey']('jose')).toBe('jose');
    });
    
    it('should clean up keys with _select suffix', () => {
      expect(scene['validateCharacterKey']('bento_select')).toBe('bento');
      expect(scene['validateCharacterKey']('davir_select')).toBe('davir');
    });
    
    it('should return player1 for invalid keys', () => {
      expect(scene['validateCharacterKey']('invalid_character')).toBe('player1');
      expect(scene['validateCharacterKey']('')).toBe('player1');
    });
  });
  
  describe('WebSocket Message Handler', () => {
    let messageCallback: (event: { data: string }) => void;
    
    beforeEach(() => {
      // Setup WebSocket message handler
      scene.create = jest.fn(() => {
        // Simulate the part of create() that sets up the WebSocket handler
        if (scene['mode'] === 'online' && scene['wsManager']) {
          scene['_wsMessageHandler'] = (event: MessageEvent) => {
            try {
              const data = JSON.parse(event.data);
              
              if (data.type === 'scenario_selected' && !scene['isHost']) {
                const scenarioIndex = 0; // Simplified for test
                scene['selectedScenario'] = scenarioIndex;
              } else if (data.type === 'player_ready') {
                if (data.player === 'host') scene['hostReady'] = true;
                else if (data.player === 'guest') scene['guestReady'] = true;
                
                if (scene['hostReady'] && scene['guestReady'] && !scene['gameStarted'] && scene['isHost']) {
                  scene['startGame']();
                }
              } else if (data.type === 'game_start') {
                if (scene['gameStarted']) return;
                scene['gameStarted'] = true;
                scene['_transitionToGame'](data, data.p1Char, data.p2Char);
              }
            } catch (e) {
              console.error('[Test] Error processing message:', e);
            }
          };
          scene['wsManager'].setMessageCallback(scene['_wsMessageHandler']);
        }
      });
      
      // Call create to set up the handler
      scene.create();
      
      // Extract the message callback
      messageCallback = wsManagerMock.setMessageCallback.mock.calls[0][0];
    });
    
    it('should handle game_start message and transition to game scene', () => {
      // Simulate receiving game_start message
      messageCallback({
        data: JSON.stringify({
          type: 'game_start',
          scenario: 'scenario2',
          p1Char: 'jose',
          p2Char: 'davis',
          roomCode: 'TEST123',
          isHost: false,
          playerIndex: 1
        })
      });
      
      // Verify scene transition
      expect(scene.scene.start).toHaveBeenCalledWith('KidsFightScene', expect.objectContaining({
        scenario: 'scenario2',
        p1: 'jose',
        p2: 'davis',
        selected: { p1: 'jose', p2: 'davis' }
      }));
    });
    
    it('should ignore duplicate game_start messages', () => {
      // Mark game as already started
      scene['gameStarted'] = true;
      
      // Simulate receiving game_start message
      messageCallback({
        data: JSON.stringify({
          type: 'game_start',
          scenario: 'scenario2'
        })
      });
      
      // Verify scene was not started again
      expect(scene.scene.start).not.toHaveBeenCalled();
    });
    
    it('should handle player_ready messages and update ready states', () => {
      // Mock startGame to verify it's called when both players ready
      scene['startGame'] = jest.fn();
      
      // Simulate host ready message
      messageCallback({
        data: JSON.stringify({
          type: 'player_ready',
          player: 'host'
        })
      });
      
      // Verify host ready state updated
      expect(scene['hostReady']).toBe(true);
      
      // Simulate guest ready message
      messageCallback({
        data: JSON.stringify({
          type: 'player_ready',
          player: 'guest'
        })
      });
      
      // Verify guest ready state updated and startGame called
      expect(scene['guestReady']).toBe(true);
      expect(scene['startGame']).toHaveBeenCalled();
    });
  });
  
  describe('Shutdown Method', () => {
    it('should clean up WebSocket handlers and reset state', () => {
      // Setup WebSocket and state
      scene['gameStarted'] = true;
      scene['hostReady'] = true;
      scene['guestReady'] = true;
      scene['_lastGameStartTime'] = 12345;
      scene['_processedMessageIds'] = new Set(['msg1', 'msg2']);
      
      // Call shutdown
      scene.shutdown();
      
      // Verify WebSocket callback was cleared
      expect(wsManagerMock.setMessageCallback).toHaveBeenCalledWith(null);
      
      // Verify state was reset
      expect(scene['gameStarted']).toBe(false);
      expect(scene['hostReady']).toBe(false);
      expect(scene['guestReady']).toBe(false);
      expect(scene['_lastGameStartTime']).toBe(0);
      expect(scene['_processedMessageIds'].size).toBe(0);
      
      // Verify event listeners were removed
      expect(scene.scale.off).toHaveBeenCalledWith('resize', scene['updateLayout'], scene);
    });
    
    it('should send scene_change message when in online mode', () => {
      // Setup as online mode
      scene['mode'] = 'online';
      scene['roomCode'] = 'TEST123';
      scene['isHost'] = true;
      
      // Call shutdown
      scene.shutdown();
      
      // Verify scene_change message was sent
      expect(wsManagerMock.send).toHaveBeenCalledWith({
        type: 'scene_change',
        scene: 'leaving_scenario_select',
        roomCode: 'TEST123',
        isHost: true
      });
    });
    
    it('should not send scene_change message when in local mode', () => {
      // Setup as local mode
      scene['mode'] = 'local';
      
      // Call shutdown
      scene.shutdown();
      
      // Verify no message was sent
      expect(wsManagerMock.send).not.toHaveBeenCalled();
    });
  });
});
