/** @jest-environment jsdom */
/// <reference types="jest" />

import Phaser from 'phaser';
import KidsFightScene from '../kidsfight_scene';

/** @type {jest.Mock} */
const mockEndGame = jest.fn();
/** @type {jest.Mock} */
const mockGetCharacterName = jest.fn(key => key === 'player1' ? 'Player 1' : 'Player 2');

jest.mock('phaser', () => {
  return {
    Scene: class {
      constructor() {
        this.sys = {
          settings: {
            data: {}
          }
        };
      }
    }
  };
});

describe('KidsFightScene - Winner Checker', () => {
  let scene;

  beforeEach(() => {
    scene = new KidsFightScene();
    scene.gameOver = false;
    scene.playerHealth = [100, 100];
    scene.timeLeft = 99;
    scene.p1SpriteKey = 'player1';
    scene.p2SpriteKey = 'player2';
    scene.endGame = jest.fn();
    scene.getCharacterName = jest.fn(key => key === 'player1' ? 'Player 1' : 'Player 2');
  });

  describe('checkWinner', () => {
    it('should return false if game is already over', () => {
      scene.gameOver = true;
      expect(scene.checkWinner()).toBe(false);
      expect(scene.endGame).not.toHaveBeenCalled();
    });

    it('should declare player 2 as winner when player 1 health is 0', () => {
      scene.playerHealth[0] = 0;
      scene.playerHealth[1] = 50;
      
      expect(scene.checkWinner()).toBe(true);
      expect(scene.endGame).toHaveBeenCalledWith('Player 2 Venceu!');
    });

    it('should declare player 1 as winner when player 2 health is 0', () => {
      scene.playerHealth[0] = 50;
      scene.playerHealth[1] = 0;
      
      expect(scene.checkWinner()).toBe(true);
      expect(scene.endGame).toHaveBeenCalledWith('Player 1 Venceu!');
    });

    describe('when time runs out', () => {
      beforeEach(() => {
        scene.timeLeft = 0;
      });

      it('should declare player 1 as winner when they have more health', () => {
        scene.playerHealth = [80, 50];
        
        expect(scene.checkWinner()).toBe(true);
        expect(scene.endGame).toHaveBeenCalledWith('Player 1 Venceu!');
      });

      it('should declare player 2 as winner when they have more health', () => {
        scene.playerHealth = [50, 80];
        
        expect(scene.checkWinner()).toBe(true);
        expect(scene.endGame).toHaveBeenCalledWith('Player 2 Venceu!');
      });

      it('should declare a tie when both players have equal health', () => {
        scene.playerHealth = [50, 50];
        
        expect(scene.checkWinner()).toBe(true);
        expect(scene.endGame).toHaveBeenCalledWith('Empate!');
      });
    });

    it('should return false when game is ongoing', () => {
      scene.playerHealth = [50, 50];
      scene.timeLeft = 30;
      
      expect(scene.checkWinner()).toBe(false);
      expect(scene.endGame).not.toHaveBeenCalled();
    });

    it('should handle edge cases with very low health values', () => {
      scene.playerHealth = [0.1, 0];
      
      expect(scene.checkWinner()).toBe(true);
      expect(scene.endGame).toHaveBeenCalledWith('Player 1 Venceu!');
    });
  });
});
