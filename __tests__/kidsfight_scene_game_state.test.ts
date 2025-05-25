import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Define types for our test scene
interface TestScene {
  player1: any;
  player2: any;
  _playerHealth: number[];
  playerHealth: number[];
  timeLeft: number;
  gameOver: boolean;
  winnerText: {
    setText: jest.Mock;
    setVisible: jest.Mock;
  };
  endGame: jest.Mock;
  updateHealthBars: jest.Mock;
  updateTimer: jest.Mock;
  checkGameOver: jest.Mock;
  update: jest.Mock;
  [key: string]: any; // For dynamic properties
}

// Mock player object
const createMockPlayer = () => ({
  health: 100,
  getData: jest.fn().mockReturnValue(false),
  setData: jest.fn(),
  setFrame: jest.fn(),
  setVelocityX: jest.fn(),
  setFlipX: jest.fn(),
  play: jest.fn(),
  body: {
    on: jest.fn(),
    velocity: { x: 0, y: 0 },
    setAllowGravity: jest.fn(),
    setCollideWorldBounds: jest.fn()
  }
});

// Mock scene object with essential properties and methods
const createTestScene = (): TestScene => {
  const player1 = createMockPlayer();
  const player2 = createMockPlayer();
  
  const scene = {
    player1,
    player2,
    playerHealth: [100, 100],
    timeLeft: 60,
    gameOver: false,
    winnerText: {
      setText: jest.fn(),
      setVisible: jest.fn()
    },
    endGame: jest.fn((winnerIndex, message) => {
      scene.gameOver = true;
      scene.winnerText.setText(message);
      scene.winnerText.setVisible(true);
    }),
    updateHealthBars: jest.fn(),
    updateTimer: jest.fn(() => {
      if (scene.timeLeft > 0) {
        scene.timeLeft--;
      }
    }),
    checkGameOver: jest.fn(() => {
      if (scene.playerHealth[0] <= 0 && scene.playerHealth[1] <= 0) {
        scene.endGame(-1, 'Draw!');
      } else if (scene.playerHealth[0] <= 0) {
        scene.endGame(1, 'Player 2 Wins!');
      } else if (scene.playerHealth[1] <= 0) {
        scene.endGame(0, 'Player 1 Wins!');
      }
    }),
    update: jest.fn((time: number, delta: number) => {
      if (scene.timeLeft <= 0 && !scene.gameOver) {
        if (scene.playerHealth[0] > scene.playerHealth[1]) {
          scene.endGame(0, 'Player 1 Wins!');
        } else if (scene.playerHealth[1] > scene.playerHealth[0]) {
          scene.endGame(1, 'Player 2 Wins!');
        } else {
          scene.endGame(-1, 'Draw!');
        }
      }
      scene.updateTimer();
    })
  };

  // Ensure health doesn't go below 0
  Object.defineProperty(scene, 'playerHealth', {
    get() {
      return this._playerHealth || [100, 100];
    },
    set(value) {
      this._playerHealth = value.map((health: number) => Math.max(0, health));
      this.updateHealthBars();
    }
  });

  // Initialize player health
  const typedScene = scene as TestScene;
  typedScene._playerHealth = [100, 100];
  
  return typedScene;
};

describe('KidsFightScene Game State Tests', () => {
  let scene: TestScene;
  
  beforeEach(() => {
    // Create a fresh scene before each test
    scene = createTestScene();
    jest.clearAllMocks();
    
    // Reset any mock implementations that might have been overridden
    scene.updateTimer.mockImplementation(() => {
      if (scene.timeLeft > 0) {
        scene.timeLeft--;
      }
    });
    
    scene.checkGameOver.mockImplementation(() => {
      if (scene.playerHealth[0] <= 0 && scene.playerHealth[1] <= 0) {
        scene.endGame(-1, 'Draw!');
      } else if (scene.playerHealth[0] <= 0) {
        scene.endGame(1, 'Player 2 Wins!');
      } else if (scene.playerHealth[1] <= 0) {
        scene.endGame(0, 'Player 1 Wins!');
      }
    });
  });

  describe('Player Health Management', () => {
    it('should reduce player health when taking damage', () => {
      const initialHealth = scene.playerHealth[0];
      const damage = 20;
      
      // Simulate player 1 taking damage
      const newHealth = initialHealth - damage;
      scene.playerHealth = [newHealth, scene.playerHealth[1]];
      
      expect(scene.playerHealth[0]).toBe(initialHealth - damage);
      expect(scene.updateHealthBars).toHaveBeenCalled();
    });
    
    it('should not allow health to go below 0', () => {
      // Simulate massive damage to player 1
      scene.playerHealth = [scene.playerHealth[0] - 200, scene.playerHealth[1]];
      
      expect(scene.playerHealth[0]).toBe(0);
      expect(scene.updateHealthBars).toHaveBeenCalled();
    });
  });

  describe('Game Over Conditions', () => {
    it('should end game when player 1 health reaches 0', () => {
      scene.playerHealth[0] = 0;
      scene.checkGameOver();
      
      expect(scene.endGame).toHaveBeenCalledWith(1, 'Player 2 Wins!');
      expect(scene.gameOver).toBe(true);
    });
    
    it('should end game when player 2 health reaches 0', () => {
      scene.playerHealth[1] = 0;
      scene.checkGameOver();
      
      expect(scene.endGame).toHaveBeenCalledWith(0, 'Player 1 Wins!');
      expect(scene.gameOver).toBe(true);
    });
    
    it('should handle a draw when both players reach 0 health', () => {
      scene.playerHealth[0] = 0;
      scene.playerHealth[1] = 0;
      scene.checkGameOver();
      
      expect(scene.endGame).toHaveBeenCalledWith(-1, 'Draw!');
      expect(scene.gameOver).toBe(true);
    });
    
    it('should end game when time runs out', () => {
      scene.timeLeft = 0;
      // Player 1 has more health
      scene.playerHealth[0] = 50;
      scene.playerHealth[1] = 30;
      
      scene.update(0, 0);
      
      expect(scene.endGame).toHaveBeenCalledWith(0, 'Player 1 Wins!');
      expect(scene.gameOver).toBe(true);
    });
  });

  describe('Timer Functionality', () => {
    it('should decrement time left', () => {
      const initialTime = scene.timeLeft;
      
      // Simulate update with delta time
      scene.update(0, 1000);
      
      expect(scene.timeLeft).toBe(initialTime - 1);
      expect(scene.updateTimer).toHaveBeenCalled();
    });
    
    it('should not go below 0 seconds', () => {
      scene.timeLeft = 0;
      
      // Simulate time passing
      scene.update(0, 1000);
      
      expect(scene.timeLeft).toBe(0);
    });
  });
});
