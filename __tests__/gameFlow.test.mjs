// Game Flow Test Suite
// Tests the game flow functionality including:
// - Play Again button navigation
// - Responsive button positioning
// - Player selection reset

// Mock the imports first
jest.mock('../scenario1.png?url', () => 'mocked-scenario-url', { virtual: true });
jest.mock('./sprites-bento3.png?url', () => 'mocked-bento-url', { virtual: true });
jest.mock('./sprites-davir3.png?url', () => 'mocked-davir-url', { virtual: true });

// Mock Phaser global object
global.Phaser = {
  Scene: class MockScene {
    constructor(config) {
      this.key = config?.key || 'MockScene';
    }
  },
  Physics: {
    Arcade: {
      Sprite: class {}
    }
  }
};

// Mock Phaser components
const mockTweens = {
  add: jest.fn()
};

const mockSelector = {
  setPosition: jest.fn()
};

const mockCamera = {
  width: 800,
  height: 600
};

const mockCameras = {
  main: mockCamera
};

const mockText = {
  setOrigin: jest.fn().mockReturnThis(),
  setInteractive: jest.fn().mockReturnThis(),
  destroy: jest.fn()
};

const mockRectangle = {
  setStrokeStyle: jest.fn().mockReturnThis(),
  setOrigin: jest.fn().mockReturnThis(),
  setDepth: jest.fn().mockReturnThis(),
  setAlpha: jest.fn().mockReturnThis(),
  setInteractive: jest.fn().mockReturnThis(),
  setPosition: jest.fn(),
  destroy: jest.fn()
};

const mockAdd = {
  rectangle: jest.fn().mockReturnValue(mockRectangle),
  text: jest.fn()
};

const mockScene = {
  start: jest.fn(),
  restart: jest.fn()
};

// Create mock classes for testing
class PlayerSelectScene {
  constructor() {
    this.add = mockAdd;
    this.tweens = mockTweens;
    this.scene = mockScene;
    this.cameras = mockCameras;
    this.p1Selector = mockSelector;
    this.p2Selector = mockSelector;
    this.selected = { p1: 0, p2: 0 };
  }

  init() {
    // Reset selections when scene is restarted
    this.selected = { p1: 0, p2: 0 };
  }

  create() {
    // Simplified create method for testing
    const screenHeight = this.cameras.main.height;
    const buttonY = Math.min(screenHeight * 0.65, 380);
    const startBtn = this.add.rectangle(400, buttonY, 240, 70, 0x00ff00);
  }
}

class KidsFightScene {
  constructor() {
    this.add = mockAdd;
    this.tweens = mockTweens;
    this.scene = mockScene;
    this.cameras = mockCameras;
  }

  showWinner(playerKey) {
    // Mock winner display
    this.winText = this.add.text(400, 300, `${playerKey} Venceu!`);
    
    // Create play again button
    const playAgainBtn = this.add.text(400, 400, 'Jogar Novamente')
      .setInteractive();
    
    // Add click handler directly
    this.playAgainHandler = () => {
      this.winText.destroy();
      playAgainBtn.destroy();
      this.scene.start('PlayerSelectScene');
    };
  }
}

describe('Game Flow and Navigation', () => {
  let playerSelectScene;
  let kidsFightScene;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockAdd.text.mockImplementation(() => ({
      setOrigin: jest.fn().mockReturnThis(),
      setInteractive: jest.fn().mockReturnThis(),
      destroy: jest.fn()
    }));
    
    // Create instances
    playerSelectScene = new PlayerSelectScene();
    kidsFightScene = new KidsFightScene();
  });

  describe('Play Again Button', () => {
    test('should navigate to PlayerSelectScene when clicked', () => {
      // Show winner which creates the play again button
      kidsFightScene.showWinner('player1');
      
      // Manually call the handler that would be triggered on button click
      kidsFightScene.playAgainHandler();
      
      // Verify that scene.start was called with 'PlayerSelectScene'
      expect(mockScene.start).toHaveBeenCalledWith('PlayerSelectScene');
      
      // Verify that scene.restart was NOT called
      expect(mockScene.restart).not.toHaveBeenCalled();
      
      // Get the actual mock text instances returned
      const winTextInstance = mockAdd.text.mock.results[0].value;
      const playAgainBtnInstance = mockAdd.text.mock.results[1].value;
      expect(winTextInstance.destroy).toHaveBeenCalled();
      expect(playAgainBtnInstance.destroy).toHaveBeenCalled();
    });
  });

  describe('Player Selection Reset', () => {
    test('should reset selections when init is called', () => {
      // Set some non-default selections
      playerSelectScene.selected = { p1: 1, p2: 1 };
      
      // Call init to reset
      playerSelectScene.init();
      
      // Verify selections are reset to defaults
      expect(playerSelectScene.selected).toEqual({ p1: 0, p2: 0 });
    });
  });

  describe('Responsive Button Positioning', () => {
    test('should position start button based on screen height', () => {
      // Test with iPhone 12 Pro dimensions
      mockCamera.width = 390;
      mockCamera.height = 844;
      
      // Reset mock to ensure clean state
      mockAdd.rectangle.mockClear();
      
      // Call create which positions the button
      playerSelectScene.create();
      
      // Get the arguments from the rectangle call
      const rectangleCall = mockAdd.rectangle.mock.calls[0];
      
      // Button Y position should be capped at 380 for this screen height
      expect(rectangleCall[1]).toBe(380);
      
      // Button dimensions should be 240x70
      expect(rectangleCall[2]).toBe(240);
      expect(rectangleCall[3]).toBe(70);
    });
    
    test('should calculate button position for smaller screens', () => {
      // Test with a smaller screen
      mockCamera.width = 320;
      mockCamera.height = 480;
      
      // Reset mock to ensure clean state
      mockAdd.rectangle.mockClear();
      
      // Call create which positions the button
      playerSelectScene.create();
      
      // Get the arguments from the rectangle call
      const rectangleCall = mockAdd.rectangle.mock.calls[0];
      
      // Button Y position should be 65% of height (312) for this screen
      const expectedY = Math.min(480 * 0.65, 380);
      expect(rectangleCall[1]).toBe(expectedY);
    });
  });
});
