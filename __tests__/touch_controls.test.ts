// @ts-nocheck
import KidsFightScene from '../kidsfight_scene';

describe('Touch Controls', () => {
  let scene;
  
  beforeEach(() => {
    // Mock Phaser objects and methods
    scene = new KidsFightScene();
    
    // Mock the add object and its methods
    scene.add = {
      circle: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
      }),
      text: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
      }),
    };
    
    // Mock the sys.game.canvas object
    scene.sys = {
      game: {
        canvas: {
          width: 800,
          height: 600,
        },
      },
    };
  });
  
  test('should create touch controls with correct positioning', () => {
    // Call the method to test
    scene.createTouchControls();
    
    // Verify that circle buttons were created
    expect(scene.add.circle).toHaveBeenCalledTimes(6); // 6 buttons: left, right, jump, attack, special, block
    
    // Verify that text labels were created
    expect(scene.add.text).toHaveBeenCalledTimes(6); // 6 text labels for the buttons
    
    // Verify that touchButtons object was created
    expect(scene.touchButtons).toBeDefined();
    expect(Object.keys(scene.touchButtons).length).toBe(6);
  });
  
  test('should create responsive sized buttons based on screen size', () => {
    // Test with a smaller screen
    scene.sys.game.canvas.width = 400;
    scene.sys.game.canvas.height = 300;
    
    scene.createTouchControls();
    
    // Calculate expected radius for this screen size
    const expectedRadius = Math.floor(Math.min(400, 300) * 0.06);
    
    // Verify the first button was created with the correct radius
    expect(scene.add.circle).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      expectedRadius,
      expect.any(Number)
    );
  });
  
  test('should position controls in the bottom corners', () => {
    const width = 800;
    const height = 600;
    scene.sys.game.canvas.width = width;
    scene.sys.game.canvas.height = height;
    
    scene.createTouchControls();
    
    // Circles stay a full radius inside the canvas.
    const radius = Math.floor(Math.min(width, height) * 0.06);
    const margin = radius + 8;
    const baseY = height - margin;
    const leftX = margin;
    const rightX = margin + Math.round(radius * 2.6);

    expect(scene.add.circle).toHaveBeenCalledWith(
      leftX,
      baseY,
      expect.any(Number),
      expect.any(Number)
    );

    expect(scene.add.circle).toHaveBeenCalledWith(
      rightX,
      baseY,
      expect.any(Number),
      expect.any(Number)
    );

    const attackX = width - margin;
    expect(scene.add.circle).toHaveBeenCalledWith(
      attackX,
      baseY,
      expect.any(Number),
      expect.any(Number)
    );
    expect(leftX - radius).toBeGreaterThanOrEqual(0);
    expect(attackX + radius).toBeLessThanOrEqual(width);
  });
});
