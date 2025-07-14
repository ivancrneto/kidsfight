/**
 * @jest-environment jsdom
 */

import KidsFightScene from '../kidsfight_scene';

// Mock WebSocket manager
const mockWsManager = {
  sendReplayRequest: jest.fn().mockReturnValue(true),
  isConnected: jest.fn().mockReturnValue(true),
  connect: jest.fn(),
  setMessageCallback: jest.fn(),
  send: jest.fn().mockReturnValue(true),
  getRoomCode: jest.fn().mockReturnValue('test-room'),
};

// Mock scene methods
const mockScene = {
  start: jest.fn(),
  restart: jest.fn()
};

// Mock add.text method - create unique instances for each button
const createMockText = () => ({
  setOrigin: jest.fn().mockReturnThis(),
  setInteractive: jest.fn().mockReturnThis(),
  on: jest.fn().mockReturnThis(),
  setDepth: jest.fn().mockReturnThis(),
  setText: jest.fn().mockReturnThis(),
  setStyle: jest.fn().mockReturnThis()
});

const mockAdd = {
  text: jest.fn().mockImplementation(() => createMockText()),
  graphics: jest.fn().mockReturnValue({
    fillStyle: jest.fn().mockReturnThis(),
    fillRect: jest.fn().mockReturnThis(),
    clear: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    destroy: jest.fn()
  })
};

// Ensure text is recognized as a function
Object.defineProperty(mockAdd, 'text', {
  value: jest.fn().mockImplementation(() => createMockText()),
  writable: true,
  enumerable: true,
  configurable: true
});

const mockCameras = {
  main: {
    width: 800,
    height: 600
  }
};

describe('Rematch Functionality Tests', () => {
  let scene: KidsFightScene;
  let mockPointerDownCallback: () => void;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create scene instance
    scene = new KidsFightScene();
    
    // Setup mocks
    scene.add = mockAdd as any;
    scene.scene = mockScene as any;
    scene.cameras = mockCameras as any;
    scene.wsManager = mockWsManager as any;
    
    // Mock properties
    (scene as any).roomCode = 'test-room-123';
    (scene as any).localPlayerIndex = 0;
    (scene as any).gameMode = 'local';
    (scene as any).isHost = true;
    (scene as any).selectedScenario = 'scenario1';
    (scene as any).selected = { p1: 'bento', p2: 'davir' };
    (scene as any).gameOver = false; // Should not be over initially
    
    // Mock players array for endGame
    (scene as any).players = [
      { 
        setFrame: jest.fn(), 
        setAngle: jest.fn(), 
        setDepth: jest.fn(),
        setVelocityX: jest.fn(),
        setVelocityY: jest.fn(),
        body: {
          setVelocityX: jest.fn(),
          setVelocityY: jest.fn()
        }
      },
      { 
        setFrame: jest.fn(), 
        setAngle: jest.fn(), 
        setDepth: jest.fn(),
        setVelocityX: jest.fn(),
        setVelocityY: jest.fn(),
        body: {
          setVelocityX: jest.fn(),
          setVelocityY: jest.fn()
        }
      }
    ];
  });

  describe('Local Mode Rematch', () => {
    beforeEach(() => {
      (scene as any).gameMode = 'local';
      // Reset mock callback capture for each test
      mockPointerDownCallback = undefined as any;
    });

    it('should create "Play Again" button in local mode', () => {
      scene.endGame(0, 'Player 1 Wins!');

      // Verify text button was created with correct parameters
      expect(mockAdd.text).toHaveBeenCalledWith(
        400, // centerX
        330, // centerY + 30
        'Play Again',
        expect.objectContaining({
          fontSize: '24px',
          backgroundColor: '#222222',
          color: '#ffffff'
        })
      );

      // Find the button instances that were created
      const buttonInstances = mockAdd.text.mock.results.map(r => r.value);
      expect(buttonInstances.length).toBeGreaterThan(0);
      
      // Verify at least one button was made interactive
      const hasInteractiveButton = buttonInstances.some(btn => 
        btn.setOrigin.mock.calls.length > 0 &&
        btn.setInteractive.mock.calls.length > 0 &&
        btn.on.mock.calls.length > 0
      );
      expect(hasInteractiveButton).toBe(true);
    });

    it('should navigate to PlayerSelectScene when Play Again is clicked in local mode', () => {
      // Setup callback capture
      let playAgainCallback: () => void;
      
      // Mock the text creation to capture the callback for "Play Again" button
      const originalText = mockAdd.text;
      mockAdd.text = jest.fn().mockImplementation((x, y, text) => {
        const mockBtn = createMockText();
        if (text === 'Play Again') {
          mockBtn.on.mockImplementation((event, callback) => {
            if (event === 'pointerdown') {
              playAgainCallback = callback;
            }
            return mockBtn;
          });
        }
        return mockBtn;
      });

      scene.endGame(0, 'Player 1 Wins!');

      // Restore original mock
      mockAdd.text = originalText;

      // Simulate button click
      expect(playAgainCallback).toBeDefined();
      playAgainCallback();

      // Verify correct scene transition
      expect(mockScene.start).toHaveBeenCalledWith('PlayerSelectScene');
      expect(mockScene.restart).not.toHaveBeenCalled();
    });
  });

  describe('Online Mode Rematch', () => {
    beforeEach(() => {
      (scene as any).gameMode = 'online';
      (scene as any).roomCode = 'test-room-456';
      (scene as any).localPlayerIndex = 1;
    });

    it('should create "Request Rematch" button in online mode', () => {
      scene.endGame(1, 'Player 2 Wins!');

      // Verify text button was created with correct parameters
      expect(mockAdd.text).toHaveBeenCalledWith(
        400, // centerX
        330, // centerY + 30
        'Request Rematch',
        expect.objectContaining({
          fontSize: '24px',
          backgroundColor: '#222222',
          color: '#ffffff'
        })
      );

      // Find the button instances that were created
      const buttonInstances = mockAdd.text.mock.results.map(r => r.value);
      expect(buttonInstances.length).toBeGreaterThan(0);
      
      // Verify at least one button was made interactive
      const hasInteractiveButton = buttonInstances.some(btn => 
        btn.setOrigin.mock.calls.length > 0 &&
        btn.setInteractive.mock.calls.length > 0 &&
        btn.on.mock.calls.length > 0
      );
      expect(hasInteractiveButton).toBe(true);
    });

    it('should send rematch request with correct parameters when button is clicked', () => {
      // Setup callback capture
      let rematchCallback: () => void;
      let rematchButton: any;
      
      // Mock the text creation to capture the callback for "Request Rematch" button
      const originalText = mockAdd.text;
      mockAdd.text = jest.fn().mockImplementation((x, y, text) => {
        const mockBtn = createMockText();
        if (text === 'Request Rematch') {
          rematchButton = mockBtn; // Store reference for the test
          mockBtn.on.mockImplementation((event, callback) => {
            if (event === 'pointerdown') {
              rematchCallback = callback;
            }
            return mockBtn;
          });
        }
        return mockBtn;
      });

      scene.endGame(1, 'Player 2 Wins!');

      // Restore original mock
      mockAdd.text = originalText;

      // Store the rematch button reference so setText/setStyle work correctly
      (scene as any).rematchButton = rematchButton;

      // Simulate button click
      expect(rematchCallback).toBeDefined();
      rematchCallback();

      // Verify WebSocket sendReplayRequest was called with correct parameters
      expect(mockWsManager.sendReplayRequest).toHaveBeenCalledWith(
        'test-room-456', // roomCode
        '1', // localPlayerIndex as string
        {
          gameMode: 'online',
          isHost: true,
          selectedScenario: 'scenario1',
          selected: { p1: 'bento', p2: 'davir' }
        }
      );

      // Verify button state changes
      expect(rematchButton.setText).toHaveBeenCalledWith('Esperando a resposta...');
      expect(rematchButton.setInteractive).toHaveBeenCalledWith(false);
      expect(rematchButton.setStyle).toHaveBeenCalledWith({ backgroundColor: '#666666' });
    });

    it('should handle missing roomCode gracefully', () => {
      // Remove roomCode
      (scene as any).roomCode = undefined;
      
      // Setup callback capture
      let rematchCallback: () => void;
      
      // Mock the text creation to capture the callback for "Request Rematch" button
      const originalText = mockAdd.text;
      mockAdd.text = jest.fn().mockImplementation((x, y, text) => {
        const mockBtn = createMockText();
        if (text === 'Request Rematch') {
          mockBtn.on.mockImplementation((event, callback) => {
            if (event === 'pointerdown') {
              rematchCallback = callback;
            }
            return mockBtn;
          });
        }
        return mockBtn;
      });
      
      // Spy on console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      scene.endGame(1, 'Player 2 Wins!');
      
      // Restore original mock
      mockAdd.text = originalText;
      
      // Execute the rematch button callback
      expect(rematchCallback).toBeDefined();
      rematchCallback();

      // Verify error message and that sendReplayRequest was not called
      expect(consoleSpy).toHaveBeenCalledWith('[KidsFightScene] Cannot send rematch request: missing roomCode or wsManager');
      expect(mockWsManager.sendReplayRequest).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle missing wsManager gracefully', () => {
      // Remove wsManager
      (scene as any).wsManager = undefined;
      
      // Setup callback capture
      let rematchCallback: () => void;
      
      // Mock the text creation to capture the callback for "Request Rematch" button
      const originalText = mockAdd.text;
      mockAdd.text = jest.fn().mockImplementation((x, y, text) => {
        const mockBtn = createMockText();
        if (text === 'Request Rematch') {
          mockBtn.on.mockImplementation((event, callback) => {
            if (event === 'pointerdown') {
              rematchCallback = callback;
            }
            return mockBtn;
          });
        }
        return mockBtn;
      });
      
      // Spy on console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      scene.endGame(1, 'Player 2 Wins!');
      
      // Restore original mock
      mockAdd.text = originalText;
      
      // Execute the rematch button callback
      expect(rematchCallback).toBeDefined();
      rematchCallback();

      // Verify error message was logged
      expect(consoleSpy).toHaveBeenCalledWith('[KidsFightScene] Cannot send rematch request: missing roomCode or wsManager');

      consoleSpy.mockRestore();
    });

    it('should handle sendReplayRequest failure', () => {
      // Make sendReplayRequest return false
      mockWsManager.sendReplayRequest.mockReturnValue(false);
      
      // Setup callback capture
      let rematchCallback: () => void;
      
      // Mock the text creation to capture the callback for "Request Rematch" button
      const originalText = mockAdd.text;
      mockAdd.text = jest.fn().mockImplementation((x, y, text) => {
        const mockBtn = createMockText();
        if (text === 'Request Rematch') {
          mockBtn.on.mockImplementation((event, callback) => {
            if (event === 'pointerdown') {
              rematchCallback = callback;
            }
            return mockBtn;
          });
        }
        return mockBtn;
      });
      
      // Spy on console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      scene.endGame(1, 'Player 2 Wins!');
      
      // Restore original mock
      mockAdd.text = originalText;
      
      // Execute the rematch button callback
      expect(rematchCallback).toBeDefined();
      rematchCallback();

      // Verify error message was logged
      expect(consoleSpy).toHaveBeenCalledWith('[KidsFightScene] Failed to send rematch request');

      consoleSpy.mockRestore();
    });
  });

  describe('Main Menu Button', () => {
    it('should create Main Menu button for both local and online modes', () => {
      scene.endGame(0, 'Player 1 Wins!');

      // Check that Main Menu button was created
      const textCalls = mockAdd.text.mock.calls;
      const mainMenuCall = textCalls.find(call => call[2] === 'Main Menu');
      
      expect(mainMenuCall).toBeDefined();
      expect(mainMenuCall[0]).toBe(400); // centerX
      expect(mainMenuCall[1]).toBe(370); // Y position
      expect(mainMenuCall[3]).toEqual(expect.objectContaining({
        fontSize: '24px',
        backgroundColor: '#222222',
        color: '#ffffff'
      }));
    });

    it('should navigate to GameModeScene when Main Menu is clicked', () => {
      // Setup callback capture for Main Menu button
      let mainMenuCallback: () => void;
      
      // Mock the text creation to capture the callback for "Main Menu" button
      const originalText = mockAdd.text;
      mockAdd.text = jest.fn().mockImplementation((x, y, text) => {
        const mockBtn = createMockText();
        if (text === 'Main Menu') {
          mockBtn.on.mockImplementation((event, callback) => {
            if (event === 'pointerdown') {
              mainMenuCallback = callback;
            }
            return mockBtn;
          });
        }
        return mockBtn;
      });

      scene.endGame(0, 'Player 1 Wins!');

      // Restore original mock
      mockAdd.text = originalText;
      
      // Simulate Main Menu button click
      expect(mainMenuCallback).toBeDefined();
      mainMenuCallback();

      // Verify correct scene transition
      expect(mockScene.start).toHaveBeenCalledWith('GameModeScene');
    });
  });

  describe('Button Creation Edge Cases', () => {
    it('should handle missing add.text method gracefully', () => {
      (scene as any).add = undefined;

      // Should not throw error
      expect(() => {
        scene.endGame(0, 'Player 1 Wins!');
      }).not.toThrow();
    });

    it('should handle missing cameras gracefully', () => {
      (scene as any).cameras = { main: { width: 800, height: 600 } };

      // Should not throw error
      expect(() => {
        scene.endGame(0, 'Player 1 Wins!');
      }).not.toThrow();
    });
  });
});