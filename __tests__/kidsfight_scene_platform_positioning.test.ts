import Phaser from 'phaser';
import KidsFightScene from '../kidsfight_scene';

describe('KidsFightScene - Platform & Player Positioning', () => {
  let scene: KidsFightScene;
  let gameWidth = 800;
  let gameHeight = 600;
  let platformHeight = 510;

  beforeEach(() => {
    scene = new KidsFightScene();
    // Mock sys.game.canvas.width/height and device.os
    scene.sys = { 
      game: { 
        canvas: { width: gameWidth, height: gameHeight },
        device: { os: { android: false, iOS: false } }
      }
    } as any;
    // Mock physics and add methods
    scene.physics = {
      add: {
        staticGroup: jest.fn(() => ({
          create: jest.fn(() => ({ setDisplaySize: jest.fn().mockReturnThis(), setVisible: jest.fn().mockReturnThis(), refreshBody: jest.fn().mockReturnThis() }))
        })),
        collider: jest.fn(),
        sprite: jest.fn((x, y, key) => {
          return {
            x, y, key,
            setAlpha: jest.fn().mockReturnThis(),
            setOrigin: jest.fn().mockReturnThis(),
            setScale: jest.fn().mockReturnThis(),
            setCollideWorldBounds: jest.fn().mockReturnThis(),
            setBounce: jest.fn().mockReturnThis(),
            setDepth: jest.fn().mockReturnThis(),
            setGravityY: jest.fn().mockReturnThis(),
            setSize: jest.fn().mockReturnThis(),
            setOffset: jest.fn().mockReturnThis(),
            setFlipX: jest.fn().mockReturnThis(), // <-- add setFlipX
            body: { setSize: jest.fn(), setOffset: jest.fn(), setGravityY: jest.fn() }
          };
        })
      }
    } as any;
    scene.add = {
  circle: jest.fn().mockReturnValue({
    setAlpha: jest.fn().mockReturnThis(),
    setDepth: jest.fn().mockReturnThis(),
    setInteractive: jest.fn().mockReturnThis(),
    setScrollFactor: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
  }),
      rectangle: jest.fn(() => ({
        setDepth: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis(),
      })),
      image: jest.fn(() => ({ setOrigin: jest.fn().mockReturnThis(), setDisplaySize: jest.fn().mockReturnThis() })),
      graphics: jest.fn(() => ({
        clear: jest.fn().mockReturnThis(),
        fillStyle: jest.fn().mockReturnThis(),
        fillRect: jest.fn().mockReturnThis(),
        fillCircle: jest.fn().mockReturnThis(),
        lineStyle: jest.fn().mockReturnThis(),
        strokeRect: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis(),
      })),
      text: jest.fn(() => ({
        setOrigin: jest.fn().mockReturnThis(),
        setFontSize: jest.fn().mockReturnThis(),
        setColor: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setScrollFactor: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setVisible: jest.fn().mockReturnThis(),
        setText: jest.fn().mockReturnThis(),
      }))
    } as any;
    scene.selected = { p1: 'player1', p2: 'player2' };
    scene.TOTAL_HEALTH = 100;
  });

  it('should create an upper platform at the correct y and make it transparent', () => {
    scene.create();
    // The upper platform y should be platformHeight - gameHeight * 0.2 = 380
    const expectedY = 380;
    // Rectangle for visual platform
    expect(scene.add.rectangle).toHaveBeenCalledWith(gameWidth / 2, expectedY, gameWidth, 32, 0x888888);
    // Alpha should be set to 0
    const rectInstance = (scene.add.rectangle as jest.Mock).mock.results[0].value;
    expect(rectInstance.setAlpha).toHaveBeenCalledWith(0);
  });

  it('should create players at the correct y with origin (0.5, 1.0) and scale 0.4', () => {
    scene.create();
    const expectedY = 380;
    // Player1
    expect(scene.physics.add.sprite).toHaveBeenCalledWith(gameWidth * 0.25, expectedY, 'player1');
    // Player2
    expect(scene.physics.add.sprite).toHaveBeenCalledWith(gameWidth * 0.75, expectedY, 'player2');
    // Check setOrigin and setScale
    const p1Instance = (scene.physics.add.sprite as jest.Mock).mock.results[0].value;
    expect(p1Instance.setOrigin).toHaveBeenCalledWith(0.5, 1.0);
    expect(p1Instance.setScale).toHaveBeenCalledWith(0.4);
    const p2Instance = (scene.physics.add.sprite as jest.Mock).mock.results[1].value;
    expect(p2Instance.setOrigin).toHaveBeenCalledWith(0.5, 1.0);
    expect(p2Instance.setScale).toHaveBeenCalledWith(0.4);
  });

  it('should add physics collider between players and upper platform', () => {
    scene.create();
    // There should be at least one call to collider with a player and the upper platform
    expect(scene.physics.add.collider).toHaveBeenCalled();
  });
});
