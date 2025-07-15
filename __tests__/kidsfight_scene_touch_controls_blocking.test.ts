import KidsFightScene from '../kidsfight_scene';
import { createMockPlayer } from './createMockPlayer';

describe('KidsFightScene mobile touch controls - fight end blocking', () => {
  let scene: KidsFightScene;
  let jumpBtn: any;
  let blockBtn: any;
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
    scene.createTouchControls();
    jumpBtn = scene.touchButtons.up;
    blockBtn = scene.touchButtons.block || scene.touchButtons.defend || scene.touchButtons.special;
    player = scene.players[0];
    player.setVelocityY = jest.fn();
    player.setData = jest.fn();
    player.body = { touching: { down: true } };
  });

  it('should allow jump and block before fight ends', () => {
    scene.fightEnded = false;
    scene.gameOver = false;
    jumpBtn.emit('pointerdown');
    blockBtn.emit('pointerdown');
    expect(player.setVelocityY).toHaveBeenCalledWith(-330);
    expect(player.setData).toHaveBeenCalledWith('isBlocking', true);
  });

  it('should NOT allow jump and block after fight ends', () => {
    scene.fightEnded = true;
    scene.gameOver = false;
    jumpBtn.emit('pointerdown');
    blockBtn.emit('pointerdown');
    expect(player.setVelocityY).not.toHaveBeenCalled();
    expect(player.setData).not.toHaveBeenCalledWith('isBlocking', true);
  });

  it('should NOT allow jump and block after gameOver', () => {
    scene.fightEnded = false;
    scene.gameOver = true;
    jumpBtn.emit('pointerdown');
    blockBtn.emit('pointerdown');
    expect(player.setVelocityY).not.toHaveBeenCalled();
    expect(player.setData).not.toHaveBeenCalledWith('isBlocking', true);
  });
});
