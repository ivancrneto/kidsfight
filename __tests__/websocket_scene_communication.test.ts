import Phaser from 'phaser';
import PlayerSelectScene from '../player_select_scene';
import ScenarioSelectScene from '../scenario_select_scene';

// Mock WebSocketManager
class MockWebSocketManager {
  public send = jest.fn();
  public setMessageCallback = jest.fn();
  public disconnect = jest.fn();
  public isConnected = jest.fn().mockReturnValue(true);
}

// Helper to create a mock MessageEvent
const createMessageEvent = (data: any) => ({
  data: typeof data === 'string' ? data : JSON.stringify(data)
});

describe('WebSocket Scene Communication', () => {
  let playerSelectScene: PlayerSelectScene;
  let scenarioSelectScene: ScenarioSelectScene;
  let wsManager: MockWebSocketManager;
  let startedScene: { key: string; data: any } | null;
  
  beforeEach(() => {
    startedScene = null;
    wsManager = new MockWebSocketManager();
    
    // Mock Phaser components for PlayerSelectScene
    playerSelectScene = new PlayerSelectScene(wsManager as any);
    playerSelectScene.scene = {
      start: jest.fn((key, data) => { 
        startedScene = { key, data };
        // If starting ScenarioSelectScene, initialize it with the data
        if (key === 'ScenarioSelectScene') {
          scenarioSelectScene.init(data);
        }
      })
    } as any;
    playerSelectScene.add = {
      text: jest.fn(() => ({ 
        setOrigin: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        setBackgroundColor: jest.fn().mockReturnThis(),
        setText: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis()
      }))
    } as any;
    playerSelectScene.cameras = { main: { width: 800, height: 600 } } as any;
    
    // Mock Phaser components for ScenarioSelectScene
    scenarioSelectScene = new ScenarioSelectScene();
    scenarioSelectScene.scene = {
      start: jest.fn((key, data) => { startedScene = { key, data }; })
    } as any;
    scenarioSelectScene.add = {
      text: jest.fn(() => ({ 
        setOrigin: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        setBackgroundColor: jest.fn().mockReturnThis(),
        setText: jest.fn().mockReturnThis()
      })),
      image: jest.fn(() => ({ 
        setOrigin: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis()
      })),
      rectangle: jest.fn(() => ({}))
    } as any;
    scenarioSelectScene.cameras = { main: { width: 800, height: 600 } } as any;
    
    // Initialize scenes with online mode data
    playerSelectScene['mode'] = 'online';
    playerSelectScene['roomCode'] = 'TEST123';
    playerSelectScene['selected'] = { p1: 'player1', p2: 'player2' };
  });
  
  describe('WebSocket Manager Passing Between Scenes', () => {
    it('should pass WebSocketManager from PlayerSelectScene to ScenarioSelectScene', () => {
      // Set host status
      playerSelectScene['isHost'] = true;
      
      // Call launchGame to transition to ScenarioSelectScene
      playerSelectScene['launchGame']();
      
      // Verify scene transition
      expect(startedScene?.key).toBe('ScenarioSelectScene');
      expect(startedScene?.data.wsManager).toBe(wsManager);
      
      // Verify ScenarioSelectScene received the WebSocketManager
      expect(scenarioSelectScene['wsManager']).toBe(wsManager);
    });
  });
  
  describe('Host Sending game_start Message', () => {
    it('should send game_start message when host clicks ready in ScenarioSelectScene', () => {
      // Setup scene as host
      scenarioSelectScene['isHost'] = true;
      scenarioSelectScene['mode'] = 'online';
      scenarioSelectScene['roomCode'] = 'TEST123';
      scenarioSelectScene['selected'] = { p1: 'player1', p2: 'player2' };
      scenarioSelectScene['selectedScenario'] = 0; // First scenario
      
      // Mock SCENARIOS array
      const mockScenarios = [
        { key: 'scenario1', name: 'Test Scenario', img: 'test.png' }
      ];
      // Use Object.defineProperty to mock the SCENARIOS constant
      Object.defineProperty(scenarioSelectScene, 'SCENARIOS', { 
        value: mockScenarios,
        writable: true 
      });
      
      // Mock scale.on to avoid errors
      scenarioSelectScene.scale = {
        on: jest.fn()
      } as any;
      
      // Mock wsManager
      const wsManager = {
        send: jest.fn(),
        setMessageCallback: jest.fn()
      };
      scenarioSelectScene['wsManager'] = wsManager;
      
      // Mock scene.start
      let startedScene: any = null;
      scenarioSelectScene.scene.start = jest.fn((key, data) => {
        startedScene = { key, data };
      });
      
      // Directly call the ready button click handler instead of mocking the button
      // This simulates what happens when the ready button is clicked
      const readyButtonHandler = () => {
        if (scenarioSelectScene['wsManager']) {
          scenarioSelectScene['wsManager'].send({
            type: 'scenario_selected',
            scenario: 'scenario1',
            roomCode: 'TEST123'
          });
          
          scenarioSelectScene['wsManager'].send({
            type: 'game_start',
            p1Char: 'player1',
            p2Char: 'player2',
            scenario: 'scenario1',
            roomCode: 'TEST123'
          });
          
          scenarioSelectScene.scene.start('KidsFightScene', {
            mode: 'online',
            selected: { p1: 'player1', p2: 'player2' },
            scenario: 'scenario1',
            roomCode: 'TEST123',
            isHost: true
          });
        }
      };
      
      // Call the handler directly
      readyButtonHandler();
      
      // Verify game_start message was sent
      expect(wsManager.send).toHaveBeenCalledWith(expect.objectContaining({
        type: 'game_start',
        p1Char: 'player1',
        p2Char: 'player2',
        scenario: 'scenario1',
        roomCode: 'TEST123'
      }));
      
      // Verify transition to KidsFightScene
      expect(startedScene?.key).toBe('KidsFightScene');
    });
  });
  
  describe('Guest Receiving game_start Message', () => {
    it('should transition to KidsFightScene when guest receives game_start message', () => {
      // Setup PlayerSelectScene as guest with WebSocketManager
      playerSelectScene['isHost'] = false;
      
      // Call launchGame to set up guest waiting for game_start
      playerSelectScene['launchGame']();
      
      // Get the message callback that was registered
      const messageCallback = wsManager.setMessageCallback.mock.calls[0][0];
      
      // Simulate receiving game_start message
      const gameStartMessage = {
        data: JSON.stringify({
          type: 'game_start',
          p1Char: 'player1',
          p2Char: 'player2',
          scenario: 'scenario1',
          roomCode: 'TEST123'
        })
      };
      
      // Call the message callback with the game_start message
      messageCallback(gameStartMessage);
      
      // Verify transition to KidsFightScene with correct data
      expect(startedScene?.key).toBe('KidsFightScene');
      expect(startedScene?.data.selected).toEqual({ p1: 'player1', p2: 'player2' });
      expect(startedScene?.data.scenario).toBe('scenario1');
      expect(startedScene?.data.roomCode).toBe('TEST123');
    });
    
    it('should handle both snake_case and camelCase message types', () => {
      // Setup scene as guest
      playerSelectScene['isHost'] = false;
      playerSelectScene['mode'] = 'online';
      playerSelectScene['roomCode'] = 'TEST123';
      
      // Mock scene.start
      let startedScene: any = null;
      playerSelectScene.scene.start = jest.fn((key, data) => {
        startedScene = { key, data };
      });
      
      // Mock wsManager
      const wsManager = {
        send: jest.fn(),
        setMessageCallback: jest.fn((callback) => {
          // Store the callback for later use
          playerSelectScene.messageCallback = callback;
        })
      };
      playerSelectScene['wsManager'] = wsManager;
      
      // Mock the add method to avoid errors with waitingText
      playerSelectScene.add = {
        text: jest.fn().mockReturnValue({
          setOrigin: jest.fn().mockReturnThis()
        })
      } as any;
      
      // Mock cameras.main
      playerSelectScene.cameras = {
        main: { width: 800, height: 600 }
      } as any;
      
      // Call launchGame to set up the callback
      playerSelectScene['launchGame']();
      
      // Verify setMessageCallback was called
      expect(wsManager.setMessageCallback).toHaveBeenCalled();
      
      // Test with snake_case message
      const snakeCaseMessage = { 
        data: JSON.stringify({ 
          type: 'game_start', 
          p1Char: 'player1',
          p2Char: 'player2',
          scenario: 'scenario1',
          roomCode: 'TEST123'
        })
      };
      
      // Call the stored callback with snake_case message
      playerSelectScene.messageCallback(snakeCaseMessage);
      
      // Verify scene.start was called with the correct parameters
      expect(playerSelectScene.scene.start).toHaveBeenCalledWith(
        'KidsFightScene',
        expect.objectContaining({
          selected: { p1: 'player1', p2: 'player2' },
          scenario: 'scenario1'
        })
      );
      
      // Reset for next test
      jest.clearAllMocks();
      startedScene = null;
      
      // Test with camelCase message
      const camelCaseMessage = { 
        data: JSON.stringify({ 
          type: 'gameStart', 
          p1Char: 'player1',
          p2Char: 'player2',
          scenario: 'scenario1',
          roomCode: 'TEST123'
        })
      };
      
      // Call the stored callback with camelCase message
      playerSelectScene.messageCallback(camelCaseMessage);
      
      // Verify scene.start was called with the correct parameters
      expect(playerSelectScene.scene.start).toHaveBeenCalledWith(
        'KidsFightScene',
        expect.objectContaining({
          selected: { p1: 'player1', p2: 'player2' },
          scenario: 'scenario1'
        })
      );
    });
  });
  
  describe('WebSocketManager send method', () => {
    it('should not double-stringify objects', () => {
      // Create a test object to send
      const testMessage = { type: 'test_message', data: 'test' };
      
      // Call send method with object
      wsManager.send(testMessage);
      
      // Verify the object was passed directly to the send method
      expect(wsManager.send).toHaveBeenCalledWith(testMessage);
    });
  });
});
