import KidsFightScene from '../kidsfight_scene';
import { createMockPlayer } from './createMockPlayer';

// Mock WebSocketManager
jest.mock('../websocket_manager', () => ({
  WebSocketManager: {
    getInstance: jest.fn(() => ({
      send: jest.fn(),
      isConnected: jest.fn(() => true)
    }))
  }
}));

describe('Walk Animation Synchronization', () => {
  let scene: KidsFightScene;
  let mockPlayer0: any;
  let mockPlayer1: any;
  let sendSpy: jest.SpyInstance;

  beforeEach(() => {
    // Create scene in online mode
    scene = new KidsFightScene();
    scene.gameMode = 'online';
    scene.localPlayerIndex = 0; // Player 0 is local
    (scene as any).isHost = true;
    
    // Create mock players
    mockPlayer0 = createMockPlayer();
    mockPlayer1 = createMockPlayer();
    
    // Set up players array
    scene.players = [mockPlayer0, mockPlayer1];
    
    // Mock WebSocket manager
    const mockWsManager = {
      send: jest.fn(),
      isConnected: jest.fn(() => true)
    };
    scene.wsManager = mockWsManager;
    sendSpy = jest.spyOn(mockWsManager, 'send');
    
    // Mock time
    jest.spyOn(scene, 'getTime').mockReturnValue(1000);
    
    // Mock scene.anims.exists to return true for all animations
    if (scene.anims && scene.anims.exists) {
      jest.spyOn(scene.anims, 'exists').mockReturnValue(true);
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Local Player Animation', () => {
    it('should cycle walk animation frames and send updates', () => {
      // Set player 0 as moving
      mockPlayer0.body.velocity.x = 160;
      
      // Initialize walk animation - should start with frame 1
      scene.updateWalkingAnimation(mockPlayer0);
      
      // First call sets initial frame 1 then immediately cycles to frame 2 due to timing
      expect(mockPlayer0.setFrame).toHaveBeenCalledWith(1);
      expect(mockPlayer0.setFrame).toHaveBeenCalledWith(2);
      expect(mockPlayer0.walkAnimData.currentFrame).toBe(2);
      
      // Should send WebSocket update with frame 2
      expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'position_update',
        playerIndex: 0,
        frame: 2,
        animation: 'walking'
      }));
      
      // Clear previous calls
      mockPlayer0.setFrame.mockClear();
      sendSpy.mockClear();
      
      // Advance time and update again
      jest.spyOn(scene, 'getTime').mockReturnValue(1250); // +250ms
      scene.updateWalkingAnimation(mockPlayer0);
      
      // Should cycle back to frame 1
      expect(mockPlayer0.setFrame).toHaveBeenCalledWith(1);
      expect(mockPlayer0.walkAnimData.currentFrame).toBe(1);
      
      // Should send updated frame
      expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'position_update',
        playerIndex: 0,
        frame: 1,
        animation: 'walking'
      }));
    });
  });

  describe('Remote Player Animation', () => {
    it('should apply received walk animation frames directly', () => {
      // Simulate receiving a position update for player 1 (remote)
      const positionUpdate = {
        type: 'position_update',
        playerIndex: 1,
        x: 100,
        y: 200,
        velocityX: 160,
        velocityY: 0,
        flipX: false,
        frame: 2,
        animation: 'walking'
      };
      
      scene.handleRemoteAction(positionUpdate);
      
      // Should set the exact frame received
      expect(mockPlayer1.setFrame).toHaveBeenCalledWith(2);
      expect(mockPlayer1.walkAnimData.currentFrame).toBe(2);
      
      // Should update position and velocity
      expect(mockPlayer1.setPosition).toHaveBeenCalledWith(100, 200);
      expect(mockPlayer1.setVelocityX).toHaveBeenCalledWith(160);
      expect(mockPlayer1.setFlipX).toHaveBeenCalledWith(false);
    });

    it('should run shared animation logic for remote players', () => {
      // Set player 1 as moving
      mockPlayer1.body.velocity.x = 160;
      
      // Call updatePlayerAnimation for remote player
      scene.updatePlayerAnimation(1);
      
      // Should set frame using shared timing (different from local timing)
      expect(mockPlayer1.setFrame).toHaveBeenCalled();
      
      // Check that sharedWalkAnimData was initialized for remote players
      expect((scene as any).sharedWalkAnimData).toBeDefined();
      expect((scene as any).sharedWalkAnimData.currentFrame).toBe(1);
    });
  });

  describe('Animation State Handling', () => {
    it('should handle idle animation when stopping', () => {
      // Simulate receiving idle state
      const idleUpdate = {
        type: 'position_update',
        playerIndex: 1,
        x: 100,
        y: 200,
        velocityX: 0,
        velocityY: 0,
        flipX: false,
        frame: 0,
        animation: 'idle'
      };
      
      scene.handleRemoteAction(idleUpdate);
      
      // Should set idle frame
      expect(mockPlayer1.setFrame).toHaveBeenCalledWith(0);
      expect(mockPlayer1.setVelocityX).toHaveBeenCalledWith(0);
    });

    it('should prioritize animation field over cause field', () => {
      // Simulate receiving update with both animation and cause fields
      const mixedUpdate = {
        type: 'position_update',
        playerIndex: 1,
        x: 100,
        y: 200,
        velocityX: 160,
        velocityY: 0,
        flipX: false,
        frame: 1,
        animation: 'walking',
        cause: JSON.stringify({ animation: 'idle' }) // Should be ignored
      };
      
      scene.handleRemoteAction(mixedUpdate);
      
      // Should use animation field, not cause field
      expect(mockPlayer1.setFrame).toHaveBeenCalledWith(1);
      expect(mockPlayer1.walkAnimData.currentFrame).toBe(1);
    });
  });

  describe('Frame Holding Mechanism', () => {
    it('should hold received frame from remote player for 300ms', () => {
      // Mock the current time at 1000ms
      jest.spyOn(scene, 'getTime').mockReturnValue(1000);
      
      // Simulate receiving a position update with frame 2
      const positionUpdate = {
        type: 'position_update',
        playerIndex: 1,
        x: 100,
        y: 200,
        velocityX: 160,
        velocityY: 0,
        flipX: false,
        frame: 2,
        animation: 'walking'
      };
      
      scene.handleRemoteAction(positionUpdate);
      
      // Verify frame was set and hold was established
      expect(mockPlayer1.setFrame).toHaveBeenCalledWith(2);
      expect(mockPlayer1.remoteFrameHold).toEqual({
        frame: 2,
        timestamp: 1000,
        holdDuration: 300
      });
      
      // Clear the mock calls
      mockPlayer1.setFrame.mockClear();
      
      // Try to update animation at 1150ms (150ms later, still within 300ms hold)
      jest.spyOn(scene, 'getTime').mockReturnValue(1150);
      scene.updateSharedWalkingAnimation(mockPlayer1);
      
      // Should keep the remote frame (frame 2)
      expect(mockPlayer1.setFrame).toHaveBeenCalledWith(2);
      expect(mockPlayer1.remoteFrameHold).not.toBe(null); // Hold should still be active
    });

    it('should clear frame hold after 300ms and resume local animation', () => {
      // Set up initial frame hold
      jest.spyOn(scene, 'getTime').mockReturnValue(1000);
      
      const positionUpdate = {
        type: 'position_update',
        playerIndex: 1,
        x: 100,
        y: 200,
        velocityX: 160,
        velocityY: 0,
        flipX: false,
        frame: 2,
        animation: 'walking'
      };
      
      scene.handleRemoteAction(positionUpdate);
      mockPlayer1.setFrame.mockClear();
      
      // Try to update animation at 1350ms (350ms later, beyond 300ms hold)
      jest.spyOn(scene, 'getTime').mockReturnValue(1350);
      
      scene.updateSharedWalkingAnimation(mockPlayer1);
      
      // Hold should be cleared
      expect(mockPlayer1.remoteFrameHold).toBe(null);
      
      // Should initialize shared timing and set frame 1 (since shared timing starts with frame 1)
      expect(mockPlayer1.setFrame).toHaveBeenCalledWith(1);
    });

    it('should handle multiple frame holds correctly', () => {
      // First frame hold at 1000ms
      jest.spyOn(scene, 'getTime').mockReturnValue(1000);
      
      scene.handleRemoteAction({
        type: 'position_update',
        playerIndex: 1,
        frame: 1,
        animation: 'walking'
      });
      
      expect(mockPlayer1.remoteFrameHold.frame).toBe(1);
      expect(mockPlayer1.remoteFrameHold.timestamp).toBe(1000);
      
      // Second frame hold at 1200ms (overrides first)
      jest.spyOn(scene, 'getTime').mockReturnValue(1200);
      
      scene.handleRemoteAction({
        type: 'position_update',
        playerIndex: 1,
        frame: 2,
        animation: 'walking'
      });
      
      expect(mockPlayer1.remoteFrameHold.frame).toBe(2);
      expect(mockPlayer1.remoteFrameHold.timestamp).toBe(1200);
      
      // Check at 1400ms - should still hold frame 2 (200ms since last update)
      jest.spyOn(scene, 'getTime').mockReturnValue(1400);
      mockPlayer1.setFrame.mockClear();
      
      scene.updateSharedWalkingAnimation(mockPlayer1);
      
      expect(mockPlayer1.setFrame).toHaveBeenCalledWith(2);
      expect(mockPlayer1.remoteFrameHold).not.toBe(null);
    });

    it('should not interfere with local player animation', () => {
      // Set player 0 as local and moving
      mockPlayer0.body.velocity.x = 160;
      
      // Update local player animation - should work normally
      scene.updateWalkingAnimation(mockPlayer0);
      
      // Local player should not have remoteFrameHold
      expect(mockPlayer0.remoteFrameHold).toBeUndefined();
      
      // Should cycle frames normally
      expect(mockPlayer0.setFrame).toHaveBeenCalled();
    });

    it('should use shared timing after hold expires', () => {
      // Set up frame hold
      jest.spyOn(scene, 'getTime').mockReturnValue(1000);
      
      scene.handleRemoteAction({
        type: 'position_update',
        playerIndex: 1,
        frame: 2,
        animation: 'walking'
      });
      
      mockPlayer1.setFrame.mockClear();
      
      // Update at 1350ms (after hold expires)
      jest.spyOn(scene, 'getTime').mockReturnValue(1350);
      
      scene.updateSharedWalkingAnimation(mockPlayer1);
      
      // Should clear hold and initialize shared timing with frame 1
      expect(mockPlayer1.remoteFrameHold).toBe(null);
      expect(mockPlayer1.setFrame).toHaveBeenCalledWith(1);
    });

    it('should work with idle animation frames', () => {
      jest.spyOn(scene, 'getTime').mockReturnValue(1000);
      
      // Receive idle frame
      scene.handleRemoteAction({
        type: 'position_update',
        playerIndex: 1,
        frame: 0,
        animation: 'idle'
      });
      
      expect(mockPlayer1.setFrame).toHaveBeenCalledWith(0);
      expect(mockPlayer1.remoteFrameHold).toEqual({
        frame: 0,
        timestamp: 1000,
        holdDuration: 300
      });
      
      // Try to update animation during hold
      jest.spyOn(scene, 'getTime').mockReturnValue(1150);
      mockPlayer1.setFrame.mockClear();
      
      scene.updateSharedWalkingAnimation(mockPlayer1);
      
      // Should maintain idle frame
      expect(mockPlayer1.setFrame).toHaveBeenCalledWith(0);
    });
  });
});
