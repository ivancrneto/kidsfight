const { updateSceneLayout } = require('../gameUtils.cjs');

describe('updateSceneLayout', () => {
  beforeEach(() => {
    global.mockPlayer1 = { setPosition: jest.fn() };
    global.mockPlayer2 = { setPosition: jest.fn() };
    global.mockPlatform = { setPosition: jest.fn(), setSize: jest.fn() };
  });

  it('aligns player and platform Y positions correctly', () => {
    // Arrange: mock all objects and properties
    const expectedP1X = 240;
    const expectedP2X = 560;
    const screenWidth = 800;
    const screenHeight = 400;
    // Calculate expectedPlayerY based on gameUtils logic (h * 0.45)
    const expectedPlayerY = screenHeight * 0.45;
    // Calculate platformHeight and expectedPlatformY based on gameUtils logic
    const platformHeight = screenHeight * 0.045;
    const expectedPlatformY = expectedPlayerY + platformHeight / 2;
    const mockPlayer1 = { setPosition: jest.fn(), setScale: jest.fn(), setOrigin: jest.fn(), body: {} };
    const mockPlayer2 = { setPosition: jest.fn(), setScale: jest.fn(), setOrigin: jest.fn(), body: {} };
    const mockPlatform = { setPosition: jest.fn(), setSize: jest.fn() };
    const scene = {
      player1: mockPlayer1,
      player2: mockPlayer2,
      platform: mockPlatform,
      scale: { width: screenWidth, height: screenHeight },
      isReady: true,
    };
    // Act
    updateSceneLayout(scene);
    // Assert setPosition/setSize calls
    expect(mockPlayer1.setPosition).toHaveBeenCalledWith(expectedP1X, expectedPlayerY);
    expect(mockPlayer2.setPosition).toHaveBeenCalledWith(expectedP2X, expectedPlayerY);
    expect(mockPlatform.setPosition).toHaveBeenCalledWith(screenWidth / 2, expectedPlatformY);
    expect(mockPlatform.setSize).toHaveBeenCalledWith(screenWidth, platformHeight);
  });

  it('positions players at 45% of screen height with platform directly below', () => {
    // Arrange: mock all objects and properties
    const screenWidth = 800;
    const screenHeight = 400;
    // Calculate expectedPlayerY based on gameUtils logic (h * 0.45)
    const expectedPlayerY = screenHeight * 0.45;
    // Calculate platformHeight and expectedPlatformY based on gameUtils logic
    const platformHeight = screenHeight * 0.045;
    const expectedPlatformY = expectedPlayerY + platformHeight / 2;
    const expectedP1X = 240;
    const expectedP2X = 560;
    const mockPlayer1 = { setPosition: jest.fn(), setScale: jest.fn(), setOrigin: jest.fn(), body: {} };
    const mockPlayer2 = { setPosition: jest.fn(), setScale: jest.fn(), setOrigin: jest.fn(), body: {} };
    const mockPlatform = { setPosition: jest.fn(), setSize: jest.fn() };
    const scene = {
      player1: mockPlayer1,
      player2: mockPlayer2,
      platform: mockPlatform,
      scale: { width: screenWidth, height: screenHeight },
      isReady: true,
    };
    // Act
    updateSceneLayout(scene);
    // Assert setPosition/setSize calls
    expect(mockPlayer1.setPosition).toHaveBeenCalledWith(expectedP1X, expectedPlayerY);
    expect(mockPlayer2.setPosition).toHaveBeenCalledWith(expectedP2X, expectedPlayerY);
    expect(mockPlatform.setPosition).toHaveBeenCalledWith(screenWidth / 2, expectedPlatformY);
    expect(mockPlatform.setSize).toHaveBeenCalledWith(screenWidth, platformHeight);
  });
});
