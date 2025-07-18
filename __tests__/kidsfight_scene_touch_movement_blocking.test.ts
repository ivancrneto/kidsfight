import KidsFightScene from '../kidsfight_scene';
import { createMockPlayer } from './createMockPlayer';

describe('KidsFightScene mobile touch controls - movement blocking when fight ends', () => {
  let scene: KidsFightScene;
  let leftBtn: any;
  let rightBtn: any;
  let player: any;

  beforeEach(() => {
    scene = new KidsFightScene();
    // Event system for touch buttons
    function makeButtonMock() {
      const handlers: Record<string, Function[]> = {};
      return {
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn(function(event, fn) {
          if (!handlers[event]) handlers[event] = [];
          handlers[event].push(fn);
          return this;
        }),
        emit: jest.fn(function(event, ...args) {
          (handlers[event] || []).forEach(fn => fn(...args));
        }),
        setScrollFactor: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setStrokeStyle: jest.fn().mockReturnThis(),
        setFillStyle: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setDisplaySize: jest.fn().mockReturnThis(),
        x: 0,
        y: 0
      };
    }
    scene.add = {
      circle: jest.fn().mockImplementation(makeButtonMock),
      text: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setStyle: jest.fn().mockReturnThis(),
        setFontSize: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn(),
        setPosition: jest.fn().mockReturnThis(),
        setDisplaySize: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis(),
        setText: jest.fn().mockReturnThis(),
        setFill: jest.fn().mockReturnThis(),
        x: 0,
        y: 0
      })
    } as any;
    scene.sys = { game: { canvas: { width: 800, height: 600 } } } as any;
    scene.players = [createMockPlayer()];
    scene.getPlayerIndex = () => 0;
    scene.fightEnded = false;
    scene.gameOver = false;
    scene.playerDirection = ['right', 'left'];
    scene.createTouchControls();
    leftBtn = scene.touchButtons.left;
    rightBtn = scene.touchButtons.right;
    player = scene.players[0];
    player.setVelocityX = jest.fn();
    player.setFlipX = jest.fn();
  });

  describe('before fight ends', () => {
    beforeEach(() => {
      scene.fightEnded = false;
      scene.gameOver = false;
    });

    it('should allow left movement before fight ends', () => {
      leftBtn.emit('pointerdown');
      expect(player.setVelocityX).toHaveBeenCalledWith(-160);
      expect(player.setFlipX).toHaveBeenCalledWith(true);
    });

    it('should allow right movement before fight ends', () => {
      rightBtn.emit('pointerdown');
      expect(player.setVelocityX).toHaveBeenCalledWith(160);
      expect(player.setFlipX).toHaveBeenCalledWith(false);
    });
  });

  describe('after fightEnded = true', () => {
    beforeEach(() => {
      scene.fightEnded = true;
      scene.gameOver = false;
    });

    it('should NOT allow left movement after fight ends', () => {
      leftBtn.emit('pointerdown');
      expect(player.setVelocityX).not.toHaveBeenCalled();
      expect(player.setFlipX).not.toHaveBeenCalled();
    });

    it('should NOT allow right movement after fight ends', () => {
      rightBtn.emit('pointerdown');
      expect(player.setVelocityX).not.toHaveBeenCalled();
      expect(player.setFlipX).not.toHaveBeenCalled();
    });
  });

  describe('after gameOver = true', () => {
    beforeEach(() => {
      scene.fightEnded = false;
      scene.gameOver = true;
    });

    it('should NOT allow left movement after game over', () => {
      leftBtn.emit('pointerdown');
      expect(player.setVelocityX).not.toHaveBeenCalled();
      expect(player.setFlipX).not.toHaveBeenCalled();
    });

    it('should NOT allow right movement after game over', () => {
      rightBtn.emit('pointerdown');
      expect(player.setVelocityX).not.toHaveBeenCalled();
      expect(player.setFlipX).not.toHaveBeenCalled();
    });
  });

  describe('regression test - movement when fight ends', () => {
    it('should prevent movement regression when both gameOver and fightEnded are true', () => {
      scene.fightEnded = true;
      scene.gameOver = true;
      
      leftBtn.emit('pointerdown');
      rightBtn.emit('pointerdown');
      
      expect(player.setVelocityX).not.toHaveBeenCalled();
      expect(player.setFlipX).not.toHaveBeenCalled();
    });

    it('should work correctly when transitioning from active to ended state', () => {
      // Initially should work
      scene.fightEnded = false;
      scene.gameOver = false;
      
      leftBtn.emit('pointerdown');
      expect(player.setVelocityX).toHaveBeenCalledWith(-160);
      
      // Reset mocks
      player.setVelocityX.mockClear();
      player.setFlipX.mockClear();
      
      // End the fight
      scene.fightEnded = true;
      
      // Should no longer work
      leftBtn.emit('pointerdown');
      rightBtn.emit('pointerdown');
      
      expect(player.setVelocityX).not.toHaveBeenCalled();
      expect(player.setFlipX).not.toHaveBeenCalled();
    });
  });
});