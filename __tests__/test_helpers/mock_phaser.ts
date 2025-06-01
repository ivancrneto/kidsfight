// Mock Phaser methods needed for tests
export function setupPhaserMocks(scene: any) {
  // Mock add.text() which is used in endGame()
  scene.add = {
    text: jest.fn().mockReturnValue({
      setOrigin: jest.fn().mockReturnThis(),
      setScrollFactor: jest.fn().mockReturnThis(),
      setDepth: jest.fn().mockReturnThis(),
      setFontSize: jest.fn().mockReturnThis(),
      setFontFamily: jest.fn().mockReturnThis(),
      setColor: jest.fn().mockReturnThis(),
      setShadow: jest.fn().mockReturnThis(),
      setAlpha: jest.fn().mockReturnThis(),
      setInteractive: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      setText: jest.fn().mockReturnThis(),
      setVisible: jest.fn().mockReturnThis()
    })
  };
  
  // Mock cameras
  scene.cameras = {
    main: {
      width: 800,
      height: 600,
      centerX: 400,
      centerY: 300
    }
  };
  
  // Mock physics
  scene.physics = {
    pause: jest.fn(),
    resume: jest.fn()
  };
  
  // Mock sys.game.canvas
  scene.sys = {
    game: {
      canvas: {
        width: 800,
        height: 600
      }
    }
  };
  
  return scene;
}
