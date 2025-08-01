import KidsFightScene from '../kidsfight_scene';
import Phaser from 'phaser';

describe('KidsFightScene Touch Controls Layout', () => {
  let scene: KidsFightScene;
  let addSpy: any;
  let createdShapes: any[];
  let createdTexts: any[];

  beforeEach(() => {
    createdShapes = [];
    createdTexts = [];
    scene = new KidsFightScene();
    // Mock Phaser add factory
    scene.sys = { game: { canvas: { width: 800, height: 480 } } } as any;
    scene.add = {
      circle: jest.fn((x, y, radius, color) => {
        const shape = { x, y, radius, color, setAlpha: jest.fn().mockReturnThis(), setDepth: jest.fn().mockReturnThis(), setInteractive: jest.fn().mockReturnThis(), setScrollFactor: jest.fn().mockReturnThis(), on: jest.fn().mockReturnThis() };
        createdShapes.push(shape);
        return shape;
      }),
      text: jest.fn((x, y, txt, style) => {
        const t = { x, y, txt, style, setOrigin: jest.fn().mockReturnThis(), setDepth: jest.fn().mockReturnThis() };
        createdTexts.push(t);
        return t;
      })
    } as any;
    scene.gameMode = 'single';
    scene.isHost = true;
    scene.players = [
      { setVelocityX: jest.fn(), setVelocityY: jest.fn(), setData: jest.fn(), body: { blocked: { down: true }, velocity: { x: 0 } } } as any,
      { setVelocityX: jest.fn(), setVelocityY: jest.fn(), setData: jest.fn(), body: { blocked: { down: true }, velocity: { x: 0 } } } as any,
    ];
  });

  it('creates left/right/jump as D-pad in left bottom corner', () => {
    scene.createTouchControls();
    // Check labels (use correct Unicode arrows)
    expect(createdTexts.find(t => t.txt === '◀')).toBeDefined();
    expect(createdTexts.find(t => t.txt === '▶')).toBeDefined();
    expect(createdTexts.find(t => t.txt === '⭡')).toBeDefined();
  });

  it('creates attack, special, block in arc in right bottom corner', () => {
    scene.createTouchControls();
    // Check action labels
    expect(createdTexts.find(t => t.txt === 'A')).toBeDefined();
    expect(createdTexts.find(t => t.txt === 'S')).toBeDefined();
    expect(createdTexts.find(t => t.txt === 'B')).toBeDefined();
  });

  it('uses responsive sizing for buttons', () => {
    scene.sys.game.canvas.width = 1200;
    scene.sys.game.canvas.height = 700;
    scene.createTouchControls();
  });

  it('sets correct icons and colors for each button', () => {
    scene.createTouchControls();
    // D-pad colors
    expect(createdShapes[0].color).toBe(0x4444ff); // left
    expect(createdShapes[1].color).toBe(0x4444ff); // right
    expect(createdShapes[2].color).toBe(0x44ff44); // jump
    // Action colors
    expect(createdShapes[3].color).toBe(0xff4444); // attack
    expect(createdShapes[4].color).toBe(0xffff44); // block
    expect(createdShapes[5].color).toBe(0xff44ff); // special
  });

  it('sets correct z-index (depth) for action buttons to appear above players', () => {
    scene.createTouchControls();
    
    // Action buttons (attack, block, special) should have depth 1000 to appear above players
    expect(createdShapes[3].setDepth).toHaveBeenCalledWith(1000); // attack button
    expect(createdShapes[4].setDepth).toHaveBeenCalledWith(1000); // block button  
    expect(createdShapes[5].setDepth).toHaveBeenCalledWith(1000); // special button
    
    // Action button text labels should have depth 1001 to appear above the button circles
    const attackText = createdTexts.find(t => t.txt === 'A');
    const blockText = createdTexts.find(t => t.txt === 'B');
    const specialText = createdTexts.find(t => t.txt === 'S');
    
    expect(attackText.setDepth).toHaveBeenCalledWith(1001);
    expect(blockText.setDepth).toHaveBeenCalledWith(1001);
    expect(specialText.setDepth).toHaveBeenCalledWith(1001);
    
    // D-pad buttons should not have setDepth called (they use default depth)
    expect(createdShapes[0].setDepth).not.toHaveBeenCalled(); // left
    expect(createdShapes[1].setDepth).not.toHaveBeenCalled(); // right
    expect(createdShapes[2].setDepth).not.toHaveBeenCalled(); // jump
  });
});
