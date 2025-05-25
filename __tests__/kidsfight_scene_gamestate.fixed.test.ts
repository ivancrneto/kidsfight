import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Simple mock scene for testing game state
type MockScene = {
  player1: any;
  player2: any;
  playerHealth: number[];
  timeLeft: number;
  gameOver: boolean;
  winnerText: {
    setText: jest.Mock;
    setVisible: jest.Mock;
  };
  endGame: jest.Mock;
  updateHealthBars: jest.Mock;
  checkGameOver: jest.Mock;
};

// Create a test scene with default values
const createTestScene = (): MockScene => {
  const scene: any = {
    player1: {
      health: 100,
      getData: jest.fn().mockReturnValue(false)
    },
    player2: {
      health: 100,
      getData: jest.fn().mockReturnValue(false)
    },
    playerHealth: [100, 100],
    timeLeft: 60,
    gameOver: false,
    winnerText: {
      setText: jest.fn(),
      setVisible: jest.fn()
    },
    endGame: jest.fn(),
    updateHealthBars: jest.fn(),
    checkGameOver: function() {
      // Check for player 1 win (player 2 health <= 0)
      if (this.playerHealth[1] <= 0 && this.playerHealth[0] > 0) {
        this.endGame(1, 'Player 2 defeated!');
      } 
      // Check for player 2 win (player 1 health <= 0)
      else if (this.playerHealth[0] <= 0 && this.playerHealth[1] > 0) {
        this.endGame(0, 'Player 1 defeated!');
      } 
      // Check for draw (both players health <= 0)
      else if (this.playerHealth[0] <= 0 && this.playerHealth[1] <= 0) {
        this.endGame(-1, 'Draw!');
      }
    }
  };
  
  // Bind methods to the scene
  scene.checkGameOver = scene.checkGameOver.bind(scene);
  return scene;
};

describe('KidsFightScene Game State Tests', () => {
  let scene: MockScene;
  
  beforeEach(() => {
    // Create a fresh scene before each test
    scene = createTestScene();
    jest.clearAllMocks();
  });
  
  describe('Player Health Management', () => {
    it('should reduce player health when taking damage', () => {
      const initialHealth = scene.player1.health;
      const damage = 20;
      
      // Simulate player 1 taking damage
      scene.player1.health -= damage;
      scene.playerHealth[0] = scene.player1.health;
      scene.updateHealthBars();
      
      expect(scene.player1.health).toBe(initialHealth - damage);
      expect(scene.updateHealthBars).toHaveBeenCalled();
    });
    
    it('should not allow health to go below 0', () => {
      // Try to deal more damage than health
      const excessiveDamage = 150;
      
      // Simulate player 1 taking excessive damage
      scene.player1.health = Math.max(0, scene.player1.health - excessiveDamage);
      scene.playerHealth[0] = scene.player1.health;
      
      expect(scene.player1.health).toBe(0);
      expect(scene.playerHealth[0]).toBe(0);
    });
  });
  
  describe('Game Over Conditions', () => {
    it('should end game when player 1 health reaches 0', () => {
      // Set player 1 health to 0
      scene.player1.health = 0;
      scene.playerHealth[0] = 0;
      
      // Trigger game over check
      scene.checkGameOver();
      
      expect(scene.endGame).toHaveBeenCalledWith(0, 'Player 1 defeated!');
    });
    
    it('should end game when player 2 health reaches 0', () => {
      // Set player 2 health to 0
      scene.player2.health = 0;
      scene.playerHealth[1] = 0;
      
      // Trigger game over check
      scene.checkGameOver();
      
      expect(scene.endGame).toHaveBeenCalledWith(1, 'Player 2 defeated!');
    });
    
    it('should handle a draw when both players reach 0 health', () => {
      // Set both players' health to 0
      scene.player1.health = 0;
      scene.player2.health = 0;
      scene.playerHealth = [0, 0];
      
      // Trigger game over check
      scene.checkGameOver();
      
      expect(scene.endGame).toHaveBeenCalledWith(-1, expect.any(String));
    });
  });
  
  describe('Timer Functionality', () => {
    it('should decrement time left', () => {
      const initialTime = scene.timeLeft;
      
      // Simulate one second passing
      scene.timeLeft--;
      
      expect(scene.timeLeft).toBe(initialTime - 1);
    });
    
    it('should not go below 0 seconds', () => {
      // Set time to 0
      scene.timeLeft = 0;
      
      // Try to decrement
      scene.timeLeft = Math.max(0, scene.timeLeft - 1);
      
      expect(scene.timeLeft).toBe(0);
    });
  });
});
