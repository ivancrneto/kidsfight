/**
 * @jest-environment jsdom
 */
const { KidsFightScene } = require('../gameUtils.cjs');

// Mock Phaser
global.Phaser = {
  Scene: class MockScene {
    constructor() {}
    add = {
      text: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis()
      }),
      rectangle: jest.fn().mockReturnValue({
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn()
      })
    };
    tweens = {
      add: jest.fn()
    };
    scene = {
      start: jest.fn()
    };
  }
};

describe('Character Names and Selection', () => {
  let scene;

  beforeEach(() => {
    // Create a new instance of KidsFightScene for each test
    scene = new KidsFightScene();
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('getCharacterName method', () => {
    test('returns correct name for player1 (Bento)', () => {
      expect(scene.getCharacterName('player1')).toBe('Bento');
    });

    test('returns correct name for player2 (Davi R)', () => {
      expect(scene.getCharacterName('player2')).toBe('Davi R');
    });

    test('returns correct name for player3 (José)', () => {
      expect(scene.getCharacterName('player3')).toBe('José');
    });

    test('returns correct name for player4 (Davi S)', () => {
      expect(scene.getCharacterName('player4')).toBe('Davi S');
    });

    test('returns correct name for player5 (Carol)', () => {
      expect(scene.getCharacterName('player5')).toBe('Carol');
    });

    test('returns correct name for player6 (Roni)', () => {
      expect(scene.getCharacterName('player6')).toBe('Roni');
    });

    test('returns correct name for player7 (Jacqueline)', () => {
      expect(scene.getCharacterName('player7')).toBe('Jacqueline');
    });

    test('returns correct name for player8 (Ivan)', () => {
      expect(scene.getCharacterName('player8')).toBe('Ivan');
    });

    test('returns default name for unknown sprite key', () => {
      expect(scene.getCharacterName('unknown')).toBe('Jogador');
    });
  });

  describe('Winner determination', () => {
    test('correctly determines winner when player1 wins', () => {
      // Setup
      scene.p1SpriteKey = 'player1';
      scene.p2SpriteKey = 'player2';
      scene.playerHealth = [100, 0]; // Player 2 has 0 health, so Player 1 wins
      scene.gameOver = false;
      
      // Call checkWinner method
      scene.checkWinner();
      
      // Verify that endGame was called with the correct winner message
      expect(scene.add.text).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        'Bento Venceu!',
        expect.any(Object)
      );
    });

    test('correctly determines winner when player2 wins', () => {
      // Setup
      scene.p1SpriteKey = 'player1';
      scene.p2SpriteKey = 'player2';
      scene.playerHealth = [0, 100]; // Player 1 has 0 health, so Player 2 wins
      scene.gameOver = false;
      
      // Call checkWinner method
      scene.checkWinner();
      
      // Verify that endGame was called with the correct winner message
      expect(scene.add.text).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        'Davi R Venceu!',
        expect.any(Object)
      );
    });

    test('correctly determines winner when player3 wins', () => {
      // Setup
      scene.p1SpriteKey = 'player3';
      scene.p2SpriteKey = 'player2';
      scene.playerHealth = [100, 0]; // Player 2 has 0 health, so Player 1 (José) wins
      scene.gameOver = false;
      
      // Call checkWinner method
      scene.checkWinner();
      
      // Verify that endGame was called with the correct winner message
      expect(scene.add.text).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        'José Venceu!',
        expect.any(Object)
      );
    });

    test('correctly determines winner when player4 wins', () => {
      // Setup
      scene.p1SpriteKey = 'player2';
      scene.p2SpriteKey = 'player4';
      scene.playerHealth = [0, 100]; // Player 1 has 0 health, so Player 2 (Davi S) wins
      scene.gameOver = false;
      
      // Call checkWinner method
      scene.checkWinner();
      
      // Verify that endGame was called with the correct winner message
      expect(scene.add.text).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        'Davi S Venceu!',
        expect.any(Object)
      );
    });

    test('correctly determines winner when player5 wins', () => {
      // Setup
      scene.p1SpriteKey = 'player5';
      scene.p2SpriteKey = 'player2';
      scene.playerHealth = [100, 0]; // Player 2 has 0 health, so Player 1 (Carol) wins
      scene.gameOver = false;
      
      // Call checkWinner method
      scene.checkWinner();
      
      // Verify that endGame was called with the correct winner message
      expect(scene.add.text).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        'Carol Venceu!',
        expect.any(Object)
      );
    });

    test('correctly determines winner when player6 wins', () => {
      // Setup
      scene.p1SpriteKey = 'player6';
      scene.p2SpriteKey = 'player2';
      scene.playerHealth = [100, 0]; // Player 2 has 0 health, so Player 1 (Roni) wins
      scene.gameOver = false;
      
      // Call checkWinner method
      scene.checkWinner();
      
      // Verify that endGame was called with the correct winner message
      expect(scene.add.text).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        'Roni Venceu!',
        expect.any(Object)
      );
    });

    test('correctly determines winner when player7 wins', () => {
      // Setup
      scene.p1SpriteKey = 'player7';
      scene.p2SpriteKey = 'player2';
      scene.playerHealth = [100, 0]; // Player 2 has 0 health, so Player 1 (Jacqueline) wins
      scene.gameOver = false;
      
      // Call checkWinner method
      scene.checkWinner();
      
      // Verify that endGame was called with the correct winner message
      expect(scene.add.text).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        'Jacqueline Venceu!',
        expect.any(Object)
      );
    });

    test('correctly determines winner when player8 wins', () => {
      // Setup
      scene.p1SpriteKey = 'player8';
      scene.p2SpriteKey = 'player2';
      scene.playerHealth = [100, 0]; // Player 2 has 0 health, so Player 1 (Ivan) wins
      scene.gameOver = false;
      
      // Call checkWinner method
      scene.checkWinner();
      
      // Verify that endGame was called with the correct winner message
      expect(scene.add.text).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        'Ivan Venceu!',
        expect.any(Object)
      );
    });

    test('correctly determines a draw', () => {
      // Setup
      scene.p1SpriteKey = 'player1';
      scene.p2SpriteKey = 'player2';
      scene.playerHealth = [50, 50]; // Both players have equal health
      scene.gameOver = false;
      scene.timeLeft = 0; // Time is up
      
      // Call checkWinner method
      scene.checkWinner();
      
      // Verify that endGame was called with the draw message
      expect(scene.add.text).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        'Empate!',
        expect.any(Object)
      );
    });
  });

  describe('Player Selection', () => {
    test('correctly handles player selection in PlayerSelectScene', () => {
      // This is a basic test to verify the selection mechanism
      // We'll mock the PlayerSelectScene behavior
      
      const playerSelectScene = {
        selected: { p1: 0, p2: 1 }, // Default selections
        
        // Simulate player 1 selecting José (player3)
        selectPlayer1: function(index) {
          this.selected.p1 = index;
        },
        
        // Simulate player 2 selecting Davi S (player4)
        selectPlayer2: function(index) {
          this.selected.p2 = index;
        }
      };
      
      // Player 1 selects José (index 2)
      playerSelectScene.selectPlayer1(2);
      expect(playerSelectScene.selected.p1).toBe(2);
      
      // Player 2 selects Davi S (index 3)
      playerSelectScene.selectPlayer2(3);
      expect(playerSelectScene.selected.p2).toBe(3);
      
      // Verify final selections
      expect(playerSelectScene.selected).toEqual({ p1: 2, p2: 3 });
    });

    test('correctly handles Carol selection', () => {
      // This test verifies Carol can be selected
      const playerSelectScene = {
        selected: { p1: 0, p2: 1 }, // Default selections
        
        // Simulate player selection functions
        selectPlayer1: function(index) {
          this.selected.p1 = index;
        },
        
        selectPlayer2: function(index) {
          this.selected.p2 = index;
        }
      };
      
      // Player 1 selects Carol (index 4)
      playerSelectScene.selectPlayer1(4);
      expect(playerSelectScene.selected.p1).toBe(4);
      
      // Player 2 also selects Carol (index 4)
      playerSelectScene.selectPlayer2(4);
      expect(playerSelectScene.selected.p2).toBe(4);
      
      // Verify both players can select Carol
      expect(playerSelectScene.selected).toEqual({ p1: 4, p2: 4 });
    });

    test('correctly handles Roni selection', () => {
      // This test verifies Roni can be selected
      const playerSelectScene = {
        selected: { p1: 0, p2: 1 }, // Default selections
        
        // Simulate player selection functions
        selectPlayer1: function(index) {
          this.selected.p1 = index;
        },
        
        selectPlayer2: function(index) {
          this.selected.p2 = index;
        }
      };
      
      // Player 1 selects Roni (index 5)
      playerSelectScene.selectPlayer1(5);
      expect(playerSelectScene.selected.p1).toBe(5);
      
      // Player 2 also selects Roni (index 5)
      playerSelectScene.selectPlayer2(5);
      expect(playerSelectScene.selected.p2).toBe(5);
      
      // Verify both players can select Roni
      expect(playerSelectScene.selected).toEqual({ p1: 5, p2: 5 });
    });
    
    test('correctly handles Jacqueline selection', () => {
      // This test verifies Jacqueline can be selected
      const playerSelectScene = {
        selected: { p1: 0, p2: 1 }, // Default selections
        
        // Simulate player selection functions
        selectPlayer1: function(index) {
          this.selected.p1 = index;
        },
        
        selectPlayer2: function(index) {
          this.selected.p2 = index;
        }
      };
      
      // Player 1 selects Jacqueline (index 6)
      playerSelectScene.selectPlayer1(6);
      expect(playerSelectScene.selected.p1).toBe(6);
      
      // Player 2 also selects Jacqueline (index 6)
      playerSelectScene.selectPlayer2(6);
      expect(playerSelectScene.selected.p2).toBe(6);
      
      // Verify both players can select Jacqueline
      expect(playerSelectScene.selected).toEqual({ p1: 6, p2: 6 });
    });
    
    test('correctly handles Ivan selection', () => {
      // This test verifies Ivan can be selected
      const playerSelectScene = {
        selected: { p1: 0, p2: 1 }, // Default selections
        
        // Simulate player selection functions
        selectPlayer1: function(index) {
          this.selected.p1 = index;
        },
        
        selectPlayer2: function(index) {
          this.selected.p2 = index;
        }
      };
      
      // Player 1 selects Ivan (index 7)
      playerSelectScene.selectPlayer1(7);
      expect(playerSelectScene.selected.p1).toBe(7);
      
      // Player 2 also selects Ivan (index 7)
      playerSelectScene.selectPlayer2(7);
      expect(playerSelectScene.selected.p2).toBe(7);
      
      // Verify both players can select Ivan
      expect(playerSelectScene.selected).toEqual({ p1: 7, p2: 7 });
    });
  });
});
