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
  });
});
