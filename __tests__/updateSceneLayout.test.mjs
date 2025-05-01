import { updateSceneLayout } from '../gameUtils.mjs';
import { fn } from 'jest-mock';

describe('updateSceneLayout', () => {
  it('aligns player and platform Y positions correctly', () => {
    // Minimal mock platform and player
    const mockPlatformBody = { y: 200 };
    const mockPlatform = {
      y: 220,
      body: mockPlatformBody,
      setDisplaySize: fn(),
      setPosition: fn(function(x, y) { this.y = y; }),
      refreshBody: fn(),
      displayHeight: 20
    };
    const mockPlatformGroup = {
      getChildren: () => [mockPlatform]
    };
    const mockPlayerBody = {
      setSize: fn(),
      setOffset: fn(),
      updateFromGameObject: fn(),
      y: 0
    };
    const mockPlayer = {
      setScale: fn(),
      setOrigin: fn(),
      x: 100,
      y: 0,
      displayWidth: 50,
      displayHeight: 100,
      body: mockPlayerBody
    };
    const scene = {
      scale: { width: 400, height: 400 },
      platform: mockPlatformGroup,
      player1: mockPlayer,
      player2: mockPlayer,
      children: { list: [] },
      physics: { world: { staticBodies: true } },
      isReady: true
    };
    updateSceneLayout(scene);
    // Player Y should be at or above platform top (y - displayHeight/2), and body offset applied
    const platformTop = mockPlatform.y - mockPlatform.displayHeight / 2;
    expect(scene.player1.y).toBeGreaterThanOrEqual(platformTop);
    expect(scene.player1.body.setOffset).toHaveBeenCalled();
    expect(mockPlatform.setPosition).toHaveBeenCalled();
    expect(mockPlatform.refreshBody).toHaveBeenCalled();
  });

  it('positions players at 45% of screen height with platform directly below', () => {
    // Mock scene with precise dimensions for testing
    const screenHeight = 400;
    const screenWidth = 800;
    const expectedPlayerY = screenHeight * 0.45; // 45% of screen height
    const platformHeight = screenHeight * 0.045;
    const expectedPlatformY = expectedPlayerY + platformHeight / 2;

    // Minimal mock platform and player
    const mockPlatformBody = { y: 0 };
    const mockPlatform = {
      y: 0,
      body: mockPlatformBody,
      setDisplaySize: fn(),
      setPosition: fn(function(x, y) { this.y = y; }),
      refreshBody: fn(),
      displayHeight: platformHeight
    };
    const mockPlatformGroup = {
      getChildren: () => [mockPlatform]
    };
    const mockPlayerBody = {
      setSize: fn(),
      setOffset: fn(),
      updateFromGameObject: fn(),
      y: 0
    };
    const mockPlayer = {
      setScale: fn(),
      setOrigin: fn(),
      x: 100,
      y: 0,
      displayWidth: 50,
      displayHeight: 100,
      body: mockPlayerBody
    };
    const scene = {
      scale: { width: screenWidth, height: screenHeight },
      platform: mockPlatformGroup,
      player1: mockPlayer,
      player2: { ...mockPlayer },
      children: { list: [] },
      physics: { world: { staticBodies: true } },
      isReady: true
    };

    // Run the function we're testing
    updateSceneLayout(scene);

    // Verify player Y position is at 45% of screen height
    expect(scene.player1.y).toBeCloseTo(expectedPlayerY, 1);
    expect(scene.player2.y).toBeCloseTo(expectedPlayerY, 1);

    // Verify platform Y position is correctly calculated and set
    expect(mockPlatform.y).toBeCloseTo(expectedPlatformY, 1);

    // Verify platform top edge aligns with player feet
    const platformTop = mockPlatform.y - mockPlatform.displayHeight / 2;
    expect(platformTop).toBeCloseTo(expectedPlayerY, 1);
  });
});
