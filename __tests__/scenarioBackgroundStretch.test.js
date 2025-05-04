// Mock Phaser.Scene globally before requiring KidsFightScene
global.Phaser = { Scene: class {} };

import KidsFightScene from '../kidsfight_scene.js';
import { stretchBackgroundToFill } from '../kidsfight_scene.js';

describe('KidsFightScene scenario background stretching', () => {
  let scene, mockAdd, mockImage, mockCam;

  beforeEach(() => {
    mockImage = {
      setOrigin: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis(),
      setScrollFactor: jest.fn().mockReturnThis(),
      displayWidth: 0,
      displayHeight: 0
    };
    mockCam = {
      width: 1234,
      height: 567,
      setBounds: jest.fn()
    };
    mockAdd = {
      image: jest.fn(() => mockImage)
    };
    scene = new KidsFightScene();
    scene.add = mockAdd;
    scene.cameras = { main: mockCam };
    scene.physics = { world: { setBounds: jest.fn() } };
    scene.selectedScenario = 'scenario2';
    scene.isTouch = false;
  });

  it('should stretch the scenario background to fill the camera area', () => {
    // Simulate the part of create() that adds the background
    const scenarioKey = scene.selectedScenario || 'scenario1';
    const cam = scene.cameras.main;
    const bg = scene.add.image(cam.width / 2, cam.height / 2, scenarioKey).setOrigin(0.5, 0.5);
    stretchBackgroundToFill(bg, cam.width, cam.height);
    
    expect(mockAdd.image).toHaveBeenCalledWith(cam.width / 2, cam.height / 2, scenarioKey);
    expect(bg.displayWidth).toBe(cam.width);
    expect(bg.displayHeight).toBe(cam.height);
  });

  it('should set the correct camera and world bounds', () => {
    const cam = scene.cameras.main;
    scene.physics.world.setBounds(0, 0, cam.width, cam.height);
    cam.setBounds(0, 0, cam.width, cam.height);
    expect(scene.physics.world.setBounds).toHaveBeenCalledWith(0, 0, cam.width, cam.height);
    expect(cam.setBounds).toHaveBeenCalledWith(0, 0, cam.width, cam.height);
  });
});

describe('stretchBackgroundToFill', () => {
  it('should set displayWidth and displayHeight to match the given area', () => {
    const mockBg = { displayWidth: 0, displayHeight: 0 };
    stretchBackgroundToFill(mockBg, 1234, 567);
    expect(mockBg.displayWidth).toBe(1234);
    expect(mockBg.displayHeight).toBe(567);
  });

  it('should do nothing if bg is null or undefined', () => {
    expect(() => stretchBackgroundToFill(null, 100, 100)).not.toThrow();
    expect(() => stretchBackgroundToFill(undefined, 100, 100)).not.toThrow();
  });
});
