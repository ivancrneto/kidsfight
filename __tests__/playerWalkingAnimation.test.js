import { updateWalkingAnimation } from '../kidsfight_scene.js';
// Import KidsFightScene for animation testing
import KidsFightScene from '../kidsfight_scene.js';

// Mock Phaser.Scene globally before testing
global.Phaser = { Scene: class {} };

describe('Player walking animation', () => {
  let scene, mockPlayer;
  
  beforeEach(() => {
    // Create a mock player sprite with setFrame method
    mockPlayer = {
      setFrame: jest.fn(),
      walkAnimData: undefined
    };
    
    // Create scene instance
    scene = new KidsFightScene();
    scene.player1 = mockPlayer;
  });
  
  it('should set player to frame 0 when not moving', () => {
    scene.updatePlayer1Animation(false, 100);
    expect(mockPlayer.setFrame).toHaveBeenCalledWith(0);
  });
  
  it('should initialize walkAnimData if undefined', () => {
    scene.updatePlayer1Animation(true, 100);
    expect(mockPlayer.walkAnimData).toBeDefined();
    expect(mockPlayer.walkAnimData.frameTime).toBeDefined();
    expect(mockPlayer.walkAnimData.currentFrame).toBeDefined();
    expect(mockPlayer.walkAnimData.frameDelay).toBeDefined();
  });
  
  it('should not change frame if not enough time has elapsed', () => {
    // Initialize player
    scene.updatePlayer1Animation(true, 50);
    
    // Reset mock to check next call
    mockPlayer.setFrame.mockClear();
    
    // Set frameTime below threshold
    mockPlayer.walkAnimData.frameTime = 50;
    mockPlayer.walkAnimData.frameDelay = 150;
    
    scene.updatePlayer1Animation(true, 50);
    expect(mockPlayer.walkAnimData.frameTime).toBe(100); // 50 + 50
    expect(mockPlayer.setFrame).not.toHaveBeenCalled();
  });
  
  it('should toggle between frames 1 and 2 when enough time has elapsed', () => {
    // Initialize player with frame 1
    scene.updatePlayer1Animation(true, 50);
    mockPlayer.walkAnimData.currentFrame = 1;
    
    // Reset mock to check next call
    mockPlayer.setFrame.mockClear();
    
    // Set frameTime above threshold
    mockPlayer.walkAnimData.frameTime = 100;
    mockPlayer.walkAnimData.frameDelay = 150;
    
    scene.updatePlayer1Animation(true, 100);
    
    // Should have switched to frame 2
    expect(mockPlayer.walkAnimData.frameTime).toBe(0); // Reset
    expect(mockPlayer.walkAnimData.currentFrame).toBe(2);
    expect(mockPlayer.setFrame).toHaveBeenCalledWith(2);
    
    // Next update should go back to frame 1
    scene.updatePlayer1Animation(true, 200); // More than frameDelay
    expect(mockPlayer.walkAnimData.currentFrame).toBe(1);
    expect(mockPlayer.setFrame).toHaveBeenCalledWith(1);
  });
});
// Mock Phaser.Scene globally before testing
global.Phaser = { Scene: class {} };

describe('Player walking animation', () => {
  let mockPlayer;
  
  beforeEach(() => {
    // Create a mock player sprite with setFrame method
    mockPlayer = {
      setFrame: jest.fn(),
      walkAnimData: undefined
    };
  });
  
  it('should set player to frame 0 when not moving', () => {
    updateWalkingAnimation(mockPlayer, false, 100);
    expect(mockPlayer.setFrame).toHaveBeenCalledWith(0);
  });
  
  it('should initialize walkAnimData if undefined', () => {
    updateWalkingAnimation(mockPlayer, true, 100);
    expect(mockPlayer.walkAnimData).toBeDefined();
    expect(mockPlayer.walkAnimData.frameTime).toBeDefined();
    expect(mockPlayer.walkAnimData.currentFrame).toBeDefined();
    expect(mockPlayer.walkAnimData.frameDelay).toBeDefined();
  });
  
  it('should not change frame if not enough time has elapsed', () => {
    // Initialize player
    updateWalkingAnimation(mockPlayer, true, 50);
    
    // Reset mock to check next call
    mockPlayer.setFrame.mockClear();
    
    // Set frameTime below threshold
    mockPlayer.walkAnimData.frameTime = 50;
    mockPlayer.walkAnimData.frameDelay = 150;
    
    updateWalkingAnimation(mockPlayer, true, 50);
    expect(mockPlayer.walkAnimData.frameTime).toBe(100); // 50 + 50
    expect(mockPlayer.setFrame).not.toHaveBeenCalled();
  });
  
  it('should toggle between frames 1 and 2 when enough time has elapsed', () => {
    // Initialize player with frame 1
    updateWalkingAnimation(mockPlayer, true, 50);
    mockPlayer.walkAnimData.currentFrame = 1;
    
    // Reset mock to check next call
    mockPlayer.setFrame.mockClear();
    
    // Set frameTime above threshold
    mockPlayer.walkAnimData.frameTime = 100;
    mockPlayer.walkAnimData.frameDelay = 150;
    
    updateWalkingAnimation(mockPlayer, true, 100);
    
    // Should have switched to frame 2
    expect(mockPlayer.walkAnimData.frameTime).toBe(0); // Reset
    expect(mockPlayer.walkAnimData.currentFrame).toBe(2);
    expect(mockPlayer.setFrame).toHaveBeenCalledWith(2);
    
    // Next update should go back to frame 1
    updateWalkingAnimation(mockPlayer, true, 200); // More than frameDelay
    expect(mockPlayer.walkAnimData.currentFrame).toBe(1);
    expect(mockPlayer.setFrame).toHaveBeenCalledWith(1);
  });
  
  it('should do nothing if player is null or undefined', () => {
    // Should not throw error
    expect(() => updateWalkingAnimation(null, true, 100)).not.toThrow();
    expect(() => updateWalkingAnimation(undefined, true, 100)).not.toThrow();
  });
});
