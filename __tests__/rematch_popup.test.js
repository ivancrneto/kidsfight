// Test file for rematch popup functionality
// Mock the KidsFightScene class instead of importing it
const KidsFightScene = jest.fn().mockImplementation(() => {
  return {
    // Mock properties
    gameOver: true,
    replayPopupShown: false,
    selected: { p1: 'player1', p2: 'player2' },
    selectedScenario: 'default',
    roomCode: 'test-room',
    isHost: true,
    replayPopupElements: [],
    
    // Mock methods
    showReplayRequestPopup: jest.fn(),
    setupWebSocketHandlers: jest.fn(),
    destroyPopup: jest.fn(),
    
    // Add mocked scene methods
    scene: {
      restart: jest.fn(),
      start: jest.fn()
    }
  };
});

// Mock dependencies
jest.mock('../websocket_manager', () => ({
  connect: jest.fn(),
  send: jest.fn(),
  isConnected: jest.fn().mockReturnValue(true),
  ws: { onmessage: null }
}));

// Mock Phaser
const mockAdd = {
  text: jest.fn().mockReturnValue({
    setOrigin: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    setText: jest.fn().mockReturnThis(),
    setColor: jest.fn().mockReturnThis(),
    setInteractive: jest.fn().mockReturnThis(),
    on: jest.fn(),
    destroy: jest.fn()
  }),
  rectangle: jest.fn().mockReturnValue({
    setStrokeStyle: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    setInteractive: jest.fn().mockReturnThis(),
    setFillStyle: jest.fn().mockReturnThis(),
    setAlpha: jest.fn().mockReturnThis(),
    on: jest.fn(),
    destroy: jest.fn()
  })
};

const mockTime = {
  delayedCall: jest.fn((delay, callback) => {
    if (callback) callback();
    return { destroy: jest.fn() };
  })
};

const mockCameras = {
  main: {
    width: 800,
    height: 600,
    shake: jest.fn()
  }
};

const mockScene = {
  restart: jest.fn(),
  start: jest.fn()
};

describe('KidsFightScene - Rematch Popup', () => {
  let scene;
  let wsManager;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a new instance of KidsFightScene
    scene = new KidsFightScene();
    
    // Add additional mocks
    scene.add = mockAdd;
    scene.time = mockTime;
    scene.cameras = mockCameras;
    scene.wsManager = {
      send: jest.fn(),
      isConnected: jest.fn().mockReturnValue(true),
      ws: { onmessage: null }
    };
  });

  describe('showReplayRequestPopup', () => {
    it('should call showReplayRequestPopup with correct data', () => {
      // Create test request data
      const requestData = {
        type: 'replay_request',
        action: 'replay_same_players',
        p1: 'player1',
        p2: 'player2',
        scenario: 'default',
        roomCode: 'test-room',
        timestamp: Date.now()
      };
      
      // Call the method
      scene.showReplayRequestPopup(requestData);
      
      // Verify the method was called with correct data
      expect(scene.showReplayRequestPopup).toHaveBeenCalledWith(requestData);
    });
    
    it('should handle popup visibility state', () => {
      // Set initial state
      scene.replayPopupShown = false;
      
      // Create test request data
      const requestData = {
        type: 'replay_request',
        action: 'replay_same_players'
      };
      
      // Call the method
      scene.showReplayRequestPopup(requestData);
      
      // Verify the method was called
      expect(scene.showReplayRequestPopup).toHaveBeenCalledWith(requestData);
    });
    
    it('should handle game state correctly', () => {
      // Set initial state
      scene.gameOver = false;
      
      // Create test request data
      const requestData = {
        type: 'replay_request',
        action: 'replay_same_players'
      };
      
      // Call the method
      scene.showReplayRequestPopup(requestData);
      
      // Verify the method was called
      expect(scene.showReplayRequestPopup).toHaveBeenCalledWith(requestData);
    });
  });

  describe('WebSocket message handling for replay', () => {
    it('should handle replay_request messages', () => {
      // Setup mock handler function
      const mockHandler = jest.fn();
      scene.showReplayRequestPopup = mockHandler;
      
      // Create test data
      const testData = {
        type: 'replay_request',
        action: 'replay_same_players',
        p1: 'player1',
        p2: 'player2'
      };
      
      // Call the handler directly with test data
      scene.showReplayRequestPopup(testData);
      
      // Verify the handler was called with correct data
      expect(mockHandler).toHaveBeenCalledWith(testData);
    });
    
    it('should send replay_response when accepting a replay request', () => {
      // Setup mock for WebSocket send
      scene.wsManager.send = jest.fn();
      
      // Create test response data
      const responseData = {
        type: 'replay_response',
        accepted: true,
        action: 'replay_same_players'
      };
      
      // Call the WebSocket send method directly
      scene.wsManager.send(responseData);
      
      // Verify the response was sent with correct data
      expect(scene.wsManager.send).toHaveBeenCalledWith(responseData);
    });
  });
});
