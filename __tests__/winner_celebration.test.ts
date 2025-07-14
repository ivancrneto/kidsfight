/**
 * @jest-environment jsdom
 */

import KidsFightScene from '../kidsfight_scene';

describe('Winner Celebration Tests', () => {
  let scene: KidsFightScene;
  let mockPlayer1: any;
  let mockPlayer2: any;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create scene instance
    scene = new KidsFightScene();
    
    // Create mock players
    mockPlayer1 = {
      setFrame: jest.fn(),
      setAngle: jest.fn(),
      setDepth: jest.fn(),
      setScale: jest.fn(),
      setVelocityX: jest.fn(),
      setVelocityY: jest.fn(),
      body: {
        setVelocityX: jest.fn(),
        setVelocityY: jest.fn()
      }
    };

    mockPlayer2 = {
      setFrame: jest.fn(),
      setAngle: jest.fn(),
      setDepth: jest.fn(),
      setScale: jest.fn(),
      setVelocityX: jest.fn(),
      setVelocityY: jest.fn(),
      body: {
        setVelocityX: jest.fn(),
        setVelocityY: jest.fn()
      }
    };

    // Setup players array
    (scene as any).players = [mockPlayer1, mockPlayer2];
    (scene as any).gameOver = false;

    // Mock other required properties and methods
    (scene as any).add = {
      text: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis()
      })
    };

    (scene as any).cameras = {
      main: { width: 800, height: 600 }
    };

    (scene as any).time = {
      addEvent: jest.fn()
    };
  });

  describe('Player 1 Wins', () => {
    it('should set player 1 to frame 3 when player 1 wins', () => {
      scene.endGame(0, 'Player 1 Wins!');

      // Verify player 1 gets celebration frame
      expect(mockPlayer1.setFrame).toHaveBeenCalledWith(3);
      
      // Verify player 2 does not get celebration frame
      expect(mockPlayer2.setFrame).not.toHaveBeenCalled();
    });

    it('should not apply any scaling or depth changes to winner', () => {
      scene.endGame(0, 'Player 1 Wins!');

      // Verify no scaling or depth changes are applied
      expect(mockPlayer1.setScale).not.toHaveBeenCalled();
      expect(mockPlayer1.setDepth).not.toHaveBeenCalled();
    });

    it('should apply rotation effect to loser', () => {
      scene.endGame(0, 'Player 1 Wins!');

      // Verify rotation effect is applied to the loser
      expect(mockPlayer2.setAngle).toHaveBeenCalledWith(90);
      // Verify no depth changes or frame changes are applied to loser
      expect(mockPlayer2.setDepth).not.toHaveBeenCalled();
      expect(mockPlayer2.setFrame).not.toHaveBeenCalled();
    });

    it('should not create any celebration animation loops', () => {
      scene.endGame(0, 'Player 1 Wins!');

      // Verify no animation events are created
      expect((scene as any).time.addEvent).not.toHaveBeenCalled();
    });
  });

  describe('Player 2 Wins', () => {
    it('should set player 2 to frame 3 when player 2 wins', () => {
      scene.endGame(1, 'Player 2 Wins!');

      // Verify player 2 gets celebration frame
      expect(mockPlayer2.setFrame).toHaveBeenCalledWith(3);
      
      // Verify player 1 does not get celebration frame
      expect(mockPlayer1.setFrame).not.toHaveBeenCalled();
    });

    it('should not apply any scaling or depth changes to winner', () => {
      scene.endGame(1, 'Player 2 Wins!');

      // Verify no scaling or depth changes are applied
      expect(mockPlayer2.setScale).not.toHaveBeenCalled();
      expect(mockPlayer2.setDepth).not.toHaveBeenCalled();
    });

    it('should apply rotation effect to loser', () => {
      scene.endGame(1, 'Player 2 Wins!');

      // Verify rotation effect is applied to the loser
      expect(mockPlayer1.setAngle).toHaveBeenCalledWith(90);
      // Verify no depth changes or frame changes are applied to loser
      expect(mockPlayer1.setDepth).not.toHaveBeenCalled();
      expect(mockPlayer1.setFrame).not.toHaveBeenCalled();
    });

    it('should not create any celebration animation loops', () => {
      scene.endGame(1, 'Player 2 Wins!');

      // Verify no animation events are created
      expect((scene as any).time.addEvent).not.toHaveBeenCalled();
    });
  });

  describe('Draw Game', () => {
    it('should not set celebration frame for either player in a draw', () => {
      scene.endGame(-1, 'Draw!');

      // Verify neither player gets celebration frame
      expect(mockPlayer1.setFrame).not.toHaveBeenCalled();
      expect(mockPlayer2.setFrame).not.toHaveBeenCalled();
    });

    it('should not apply any visual effects in a draw', () => {
      scene.endGame(-1, 'Draw!');

      // Verify no visual effects are applied to either player
      expect(mockPlayer1.setScale).not.toHaveBeenCalled();
      expect(mockPlayer1.setDepth).not.toHaveBeenCalled();
      expect(mockPlayer1.setAngle).not.toHaveBeenCalled();
      expect(mockPlayer2.setScale).not.toHaveBeenCalled();
      expect(mockPlayer2.setDepth).not.toHaveBeenCalled();
      expect(mockPlayer2.setAngle).not.toHaveBeenCalled();
    });
  });

  describe('Player Movement Stop', () => {
    it('should stop all player movement when game ends', () => {
      scene.endGame(0, 'Player 1 Wins!');

      // Verify both players have their velocity set to 0
      expect(mockPlayer1.setVelocityX).toHaveBeenCalledWith(0);
      expect(mockPlayer1.setVelocityY).toHaveBeenCalledWith(0);
      expect(mockPlayer2.setVelocityX).toHaveBeenCalledWith(0);
      expect(mockPlayer2.setVelocityY).toHaveBeenCalledWith(0);

      // Verify body velocities are also set to 0
      expect(mockPlayer1.body.setVelocityX).toHaveBeenCalledWith(0);
      expect(mockPlayer1.body.setVelocityY).toHaveBeenCalledWith(0);
      expect(mockPlayer2.body.setVelocityX).toHaveBeenCalledWith(0);
      expect(mockPlayer2.body.setVelocityY).toHaveBeenCalledWith(0);
    });
  });

  describe('Game Over State Management', () => {
    it('should set gameOver to true', () => {
      expect((scene as any).gameOver).toBe(false);
      
      scene.endGame(0, 'Player 1 Wins!');
      
      expect((scene as any).gameOver).toBe(true);
    });

    it('should not execute endGame logic if game is already over', () => {
      // Set game as already over
      (scene as any).gameOver = true;
      
      scene.endGame(0, 'Player 1 Wins!');
      
      // Verify no frame setting occurs
      expect(mockPlayer1.setFrame).not.toHaveBeenCalled();
      expect(mockPlayer2.setFrame).not.toHaveBeenCalled();
    });

    it('should not execute endGame logic if _gameOver is set', () => {
      // Set alternative game over flag
      (scene as any)._gameOver = true;
      
      scene.endGame(0, 'Player 1 Wins!');
      
      // Verify no frame setting occurs
      expect(mockPlayer1.setFrame).not.toHaveBeenCalled();
      expect(mockPlayer2.setFrame).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing players gracefully', () => {
      (scene as any).players = undefined;
      
      // Should not throw error
      expect(() => {
        scene.endGame(0, 'Player 1 Wins!');
      }).not.toThrow();
    });

    it('should handle empty players array gracefully', () => {
      (scene as any).players = [];
      
      // Should not throw error
      expect(() => {
        scene.endGame(0, 'Player 1 Wins!');
      }).not.toThrow();
    });

    it('should handle single player in array gracefully', () => {
      (scene as any).players = [mockPlayer1];
      
      // Should not throw error
      expect(() => {
        scene.endGame(0, 'Player 1 Wins!');
      }).not.toThrow();
      
      // With only one player, the celebration frame logic may not apply
      // Since the logic checks for players.length >= 2
      // This test just verifies no error occurs
    });

    it('should handle null players gracefully', () => {
      (scene as any).players = [null, null];
      
      // Should not throw error
      expect(() => {
        scene.endGame(0, 'Player 1 Wins!');
      }).not.toThrow();
    });

    it('should handle players without setFrame method gracefully', () => {
      const playerWithoutSetFrame = {
        setVelocityX: jest.fn(),
        setVelocityY: jest.fn(),
        body: {
          setVelocityX: jest.fn(),
          setVelocityY: jest.fn()
        }
      };
      
      (scene as any).players = [playerWithoutSetFrame, mockPlayer2];
      
      // Should not throw error
      expect(() => {
        scene.endGame(0, 'Player 1 Wins!');
      }).not.toThrow();
    });
  });

  describe('Winner Message Display', () => {
    it('should display winner message text', () => {
      const testMessage = 'Bento Venceu!';
      scene.endGame(0, testMessage);

      // Verify message text was created
      expect((scene as any).add.text).toHaveBeenCalledWith(
        400, 300, testMessage,
        expect.objectContaining({
          fontSize: '48px',
          color: '#fff',
          fontStyle: 'bold',
          stroke: '#000',
          strokeThickness: 6
        })
      );
    });
  });
});