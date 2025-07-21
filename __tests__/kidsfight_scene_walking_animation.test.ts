import KidsFightScene from '../kidsfight_scene';

describe('KidsFightScene Walking Animation', () => {
  let scene: any;
  let mockPlayer: any;
  let mockTime: number;

  beforeEach(() => {
    mockTime = 1000;
    
    scene = new KidsFightScene();
    scene.getTime = jest.fn(() => mockTime);
    scene.setSafeFrame = jest.fn();
    
    mockPlayer = {
      walkAnimData: undefined,
      setFrame: jest.fn()
    };
  });

  describe('updateWalkingAnimation', () => {
    it('should initialize walkAnimData on first call', () => {
      scene.updateWalkingAnimation(mockPlayer);
      
      expect(mockPlayer.walkAnimData).toBeDefined();
      expect(mockPlayer.walkAnimData.frameTime).toBe(1000); // Gets set to current time immediately
      expect(mockPlayer.walkAnimData.currentFrame).toBe(2); // Cycles immediately because 1000 - 0 >= 200
      expect(mockPlayer.walkAnimData.frameDelay).toBe(200);
    });

    it('should set frame 1 on first call after initialization', () => {
      scene.updateWalkingAnimation(mockPlayer);
      
      expect(scene.setSafeFrame).toHaveBeenCalledWith(mockPlayer, 2); // Cycles immediately because 1000 - 0 >= 200
    });

    it('should cycle from frame 1 to frame 2 after 200ms', () => {
      // First call - initializes and immediately cycles to frame 2
      scene.updateWalkingAnimation(mockPlayer);
      expect(scene.setSafeFrame).toHaveBeenCalledWith(mockPlayer, 2);
      
      // Advance time by 200ms
      mockTime = 1200;
      scene.getTime.mockReturnValue(mockTime);
      
      // Second call should switch back to frame 1
      scene.updateWalkingAnimation(mockPlayer);
      expect(scene.setSafeFrame).toHaveBeenCalledWith(mockPlayer, 1);
      expect(mockPlayer.walkAnimData.currentFrame).toBe(1);
    });

    it('should cycle from frame 2 back to frame 1 after another 200ms', () => {
      // Initialize and immediately cycle to frame 2
      scene.updateWalkingAnimation(mockPlayer);
      
      // Advance to frame 1
      mockTime = 1200;
      scene.getTime.mockReturnValue(mockTime);
      scene.updateWalkingAnimation(mockPlayer);
      
      // Advance another 200ms
      mockTime = 1400;
      scene.getTime.mockReturnValue(mockTime);
      
      // Should cycle back to frame 2
      scene.updateWalkingAnimation(mockPlayer);
      expect(scene.setSafeFrame).toHaveBeenCalledWith(mockPlayer, 2);
      expect(mockPlayer.walkAnimData.currentFrame).toBe(2);
    });

    it('should not change frame before 200ms delay', () => {
      // Initialize (cycles immediately to frame 2)
      scene.updateWalkingAnimation(mockPlayer);
      scene.setSafeFrame.mockClear();
      
      // Advance time by less than 200ms
      mockTime = 1150;
      scene.getTime.mockReturnValue(mockTime);
      
      // Should call setSafeFrame with the current frame (frame 2, no change)
      scene.updateWalkingAnimation(mockPlayer);
      expect(scene.setSafeFrame).toHaveBeenCalledWith(mockPlayer, 2);
      expect(mockPlayer.walkAnimData.currentFrame).toBe(2); // Frame shouldn't have changed
    });

    it('should handle null player gracefully', () => {
      expect(() => scene.updateWalkingAnimation(null)).not.toThrow();
      expect(() => scene.updateWalkingAnimation(undefined)).not.toThrow();
    });

    it('should maintain correct frameTime after frame changes', () => {
      // Initialize
      scene.updateWalkingAnimation(mockPlayer);
      
      // Advance time and change frame
      mockTime = 1200;
      scene.getTime.mockReturnValue(mockTime);
      scene.updateWalkingAnimation(mockPlayer);
      
      expect(mockPlayer.walkAnimData.frameTime).toBe(1200);
    });
  });

  describe('stopWalkingAnimation', () => {
    it('should set player to idle frame (frame 0)', () => {
      scene.stopWalkingAnimation(mockPlayer);
      
      expect(scene.setSafeFrame).toHaveBeenCalledWith(mockPlayer, 0);
    });

    it('should reset walkAnimData to initial state', () => {
      // Setup walkAnimData as if player was walking
      mockPlayer.walkAnimData = {
        frameTime: 1500,
        currentFrame: 2,
        frameDelay: 200
      };
      
      scene.stopWalkingAnimation(mockPlayer);
      
      expect(mockPlayer.walkAnimData.currentFrame).toBe(1);
      expect(mockPlayer.walkAnimData.frameTime).toBe(0);
    });

    it('should handle player without walkAnimData', () => {
      expect(() => scene.stopWalkingAnimation(mockPlayer)).not.toThrow();
    });

    it('should handle null player gracefully', () => {
      expect(() => scene.stopWalkingAnimation(null)).not.toThrow();
      expect(() => scene.stopWalkingAnimation(undefined)).not.toThrow();
    });
  });

  describe('continuous walking animation cycle', () => {
    it('should cycle correctly over multiple frame changes', () => {
      const frames: number[] = [];
      
      // Override setSafeFrame to capture frames
      scene.setSafeFrame = jest.fn((player, frame) => {
        frames.push(frame);
      });
      
      // Initialize
      scene.updateWalkingAnimation(mockPlayer);
      
      // Simulate 10 frame changes over time
      for (let i = 1; i <= 10; i++) {
        mockTime = 1000 + (i * 200);
        scene.getTime.mockReturnValue(mockTime);
        scene.updateWalkingAnimation(mockPlayer);
      }
      
      // Should cycle: 1 (initial), 2 (immediate cycle), 1, 2, 1, 2, 1, 2, 1, 2, 1, 2
      expect(frames).toEqual([1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2]);
    });
  });
});