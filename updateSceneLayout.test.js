import { updateSceneLayout } from './gameUtils.mjs';
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
});
