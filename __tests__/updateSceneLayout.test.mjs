const { updateSceneLayout } = require('../gameUtils.cjs');

describe('updateSceneLayout', () => {
  it('aligns player and platform Y positions correctly', () => {
    // Create mock objects that match what updateSceneLayout expects
    const mockPlayer1 = {
      setPosition: jest.fn().mockReturnThis(),
      x: 100,
      y: 0
    };
    
    const mockPlayer2 = {
      setPosition: jest.fn().mockReturnThis(),
      x: 200,
      y: 0
    };
    
    const mockPlatform = {
      setPosition: jest.fn().mockReturnThis(),
      setSize: jest.fn().mockReturnThis(),
      y: 0
    };
    
    // Create a mock scene with the required properties
    const scene = {
      scale: { width: 800, height: 400 },
      player1: mockPlayer1,
      player2: mockPlayer2,
      platform: mockPlatform,
      isReady: true
    };
    
    // Call the function being tested
    updateSceneLayout(scene);
    
    // Verify that setPosition was called on both players
    expect(mockPlayer1.setPosition).toHaveBeenCalled();
    expect(mockPlayer2.setPosition).toHaveBeenCalled();
    
    // Verify that setPosition and setSize were called on the platform
    expect(mockPlatform.setPosition).toHaveBeenCalled();
    expect(mockPlatform.setSize).toHaveBeenCalled();
  });

  it('positions players at 45% of screen height with platform directly below', () => {
    // Mock scene with precise dimensions for testing
    const screenHeight = 400;
    const screenWidth = 800;
    const expectedPlayerY = screenHeight * 0.45; // 45% of screen height
    const platformHeight = screenHeight * 0.045;
    const expectedPlatformY = expectedPlayerY + platformHeight / 2;

    // Create mock objects with position tracking
    let player1Y = 0;
    let player2Y = 0;
    let platformY = 0;
    let platformWidth = 0;
    let platformHeight2 = 0;
    
    const mockPlayer1 = {
      setPosition: jest.fn().mockImplementation((x, y) => {
        player1Y = y;
        return mockPlayer1;
      }),
      x: 100,
      y: 0
    };
    
    const mockPlayer2 = {
      setPosition: jest.fn().mockImplementation((x, y) => {
        player2Y = y;
        return mockPlayer2;
      }),
      x: 200,
      y: 0
    };
    
    const mockPlatform = {
      setPosition: jest.fn().mockImplementation((x, y) => {
        platformY = y;
        return mockPlatform;
      }),
      setSize: jest.fn().mockImplementation((width, height) => {
        platformWidth = width;
        platformHeight2 = height;
        return mockPlatform;
      }),
      y: 0
    };
    
    // Create a mock scene with the required properties
    const scene = {
      scale: { width: screenWidth, height: screenHeight },
      player1: mockPlayer1,
      player2: mockPlayer2,
      platform: mockPlatform,
      isReady: true
    };

    // Run the function we're testing
    updateSceneLayout(scene);

    // Verify player Y position is at 45% of screen height
    expect(player1Y).toBeCloseTo(expectedPlayerY, 1);
    expect(player2Y).toBeCloseTo(expectedPlayerY, 1);

    // Verify platform Y position is correctly calculated and set
    expect(platformY).toBeCloseTo(expectedPlatformY, 1);
    
    // Verify platform height is set correctly
    expect(platformHeight2).toBeCloseTo(platformHeight, 1);
  });
});
