/**
 * @jest-environment jsdom
 */

import KidsFightScene from '../kidsfight_scene';

// Mock WebSocket manager
const mockWsManager = {
  sendReplayRequest: jest.fn().mockReturnValue(true),
  sendReplayResponse: jest.fn().mockReturnValue(true),
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
  setStyle: jest.fn().mockReturnThis(),
  destroy: jest.fn()
});

const mockAdd = {
  text: jest.fn().mockImplementation(() => createMockText()),
  rectangle: jest.fn().mockReturnValue({
    setOrigin: jest.fn().mockReturnThis(),
    destroy: jest.fn()
  })
};

const mockCameras = {
  main: {
    width: 800,
    height: 600
  }
};

describe('Replay Response Handling Tests', () => {
  let scene: KidsFightScene;
  let mockRematchButton: any;

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
    (scene as any).gameMode = 'online';
    (scene as any).isHost = true;
    (scene as any).selectedScenario = 'scenario1';
    (scene as any).selected = { p1: 'bento', p2: 'davir' };
    (scene as any).gameOver = false;
    (scene as any).replayPopupShown = false;
    (scene as any).replayPopupElements = [];

    // Create mock rematch button
    mockRematchButton = createMockText();
    (scene as any).rematchButton = mockRematchButton;
  });

  describe('Replay Response - Accepted', () => {
    it('should restart scene when replay response is accepted', () => {
      const action = {
        type: 'replay_response',
        accepted: true
      };

      scene.handleRemoteAction(action);

      expect(mockScene.restart).toHaveBeenCalled();
    });

    it('should hide replay popup when replay response is accepted', () => {
      // Setup popup elements
      const mockPopupElements = [
        { destroy: jest.fn() },
        { destroy: jest.fn() },
        { destroy: jest.fn() }
      ];
      (scene as any).replayPopupElements = mockPopupElements;
      (scene as any).replayPopupShown = true;

      const action = {
        type: 'replay_response',
        accepted: true
      };

      scene.handleRemoteAction(action);

      // Verify popup elements were destroyed
      mockPopupElements.forEach(element => {
        expect(element.destroy).toHaveBeenCalled();
      });
      expect((scene as any).replayPopupShown).toBe(false);
      expect((scene as any).replayPopupElements).toHaveLength(0);
    });
  });

  describe('Replay Response - Declined', () => {
    it('should reset rematch button state when replay response is declined', () => {
      const action = {
        type: 'replay_response',
        accepted: false
      };

      scene.handleRemoteAction(action);

      // Verify button state was reset
      expect(mockRematchButton.setText).toHaveBeenCalledWith('Request Rematch');
      expect(mockRematchButton.setInteractive).toHaveBeenCalledWith(true);
      expect(mockRematchButton.setStyle).toHaveBeenCalledWith({ backgroundColor: '#222222' });
    });

    it('should hide replay popup when replay response is declined', () => {
      // Setup popup elements
      const mockPopupElements = [
        { destroy: jest.fn() },
        { destroy: jest.fn() },
        { destroy: jest.fn() }
      ];
      (scene as any).replayPopupElements = mockPopupElements;
      (scene as any).replayPopupShown = true;

      const action = {
        type: 'replay_response',
        accepted: false
      };

      scene.handleRemoteAction(action);

      // Verify popup elements were destroyed
      mockPopupElements.forEach(element => {
        expect(element.destroy).toHaveBeenCalled();
      });
      expect((scene as any).replayPopupShown).toBe(false);
      expect((scene as any).replayPopupElements).toHaveLength(0);
    });

    it('should not restart scene when replay response is declined', () => {
      const action = {
        type: 'replay_response',
        accepted: false
      };

      scene.handleRemoteAction(action);

      expect(mockScene.restart).not.toHaveBeenCalled();
    });

    it('should handle missing rematch button gracefully', () => {
      // Remove rematch button
      (scene as any).rematchButton = undefined;

      const action = {
        type: 'replay_response',
        accepted: false
      };

      // Should not throw error
      expect(() => {
        scene.handleRemoteAction(action);
      }).not.toThrow();
    });
  });

  describe('Replay Response - Edge Cases', () => {
    it('should handle replay_response with no accepted property', () => {
      const action = {
        type: 'replay_response'
        // No 'accepted' property
      };

      // Should default to falsy behavior (decline)
      scene.handleRemoteAction(action);

      expect(mockRematchButton.setText).toHaveBeenCalledWith('Request Rematch');
      expect(mockScene.restart).not.toHaveBeenCalled();
    });

    it('should log debug information for replay_response', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const action = {
        type: 'replay_response',
        accepted: true
      };

      scene.handleRemoteAction(action);

      expect(consoleSpy).toHaveBeenCalledWith('[SCENE][DEBUG] Received replay_response:', action);

      consoleSpy.mockRestore();
    });
  });
});