import KidsFightScene from '../kidsfight_scene';

// Mocks for Phaser objects
class MockGraphics {
  fillStyle = jest.fn().mockReturnThis();
  fillCircle = jest.fn().mockReturnThis();
  setDepth = jest.fn().mockReturnThis();
  clear = jest.fn().mockReturnThis();
  destroy = jest.fn();
}

describe('KidsFightScene Special Pips', () => {
  let scene: any;
  let mockAdd: any;

  beforeEach(() => {
    mockAdd = {
      graphics: jest.fn(() => new MockGraphics()),
    };
    const mockGame = {
      canvas: { width: 800, height: 480 },
      device: { os: {} }
    };
    scene = new KidsFightScene({});
    scene.add = mockAdd;
    scene.sys = { game: mockGame };
    scene.specialPips1 = [];
    scene.specialPips2 = [];
    scene.playerSpecial = [0, 0];
  });

  describe('createSpecialPips', () => {
    it('should create 3 special pips for each player and clear old ones', () => {
      // Setup old pips
      const oldPip1 = new MockGraphics();
      const oldPip2 = new MockGraphics();
      scene.specialPips1 = [oldPip1];
      scene.specialPips2 = [oldPip2];
      // Call
      scene.createSpecialPips(1, 1);
      // Old pips should be destroyed
      expect(oldPip1.destroy).toHaveBeenCalled();
      expect(oldPip2.destroy).toHaveBeenCalled();
      // 3 new pips for each player
      expect(scene.specialPips1.length).toBe(3);
      expect(scene.specialPips2.length).toBe(3);
      // Each pip should be a MockGraphics instance
      scene.specialPips1.forEach(pip => expect(pip).toBeInstanceOf(MockGraphics));
      scene.specialPips2.forEach(pip => expect(pip).toBeInstanceOf(MockGraphics));
      // fillStyle and fillCircle called for each pip
      scene.specialPips1.forEach(pip => {
        expect(pip.fillStyle).toHaveBeenCalledWith(0x888888, 0.3);
        expect(pip.fillCircle).toHaveBeenCalled();
        expect(pip.setDepth).toHaveBeenCalledWith(10);
      });
      scene.specialPips2.forEach(pip => {
        expect(pip.fillStyle).toHaveBeenCalledWith(0x888888, 0.3);
        expect(pip.fillCircle).toHaveBeenCalled();
        expect(pip.setDepth).toHaveBeenCalledWith(10);
      });
    });
  });

  describe('updateSpecialPips', () => {
    it('should fill pips yellow for earned and white for unearned', () => {
      // Mock 3 pips for each player
      scene.specialPips1 = [new MockGraphics(), new MockGraphics(), new MockGraphics()];
      scene.specialPips2 = [new MockGraphics(), new MockGraphics(), new MockGraphics()];
      scene.playerSpecial = [2, 1];
      // Call
      scene.updateSpecialPips();
      // Player 1: first 2 yellow, last white
      expect(scene.specialPips1[0].fillStyle).toHaveBeenCalledWith(0xffe066, 1);
      expect(scene.specialPips1[1].fillStyle).toHaveBeenCalledWith(0xffe066, 1);
      expect(scene.specialPips1[2].fillStyle).toHaveBeenCalledWith(0x888888, 0.3);
      // Player 2: first yellow, rest white
      expect(scene.specialPips2[0].fillStyle).toHaveBeenCalledWith(0xffe066, 1);
      expect(scene.specialPips2[1].fillStyle).toHaveBeenCalledWith(0x888888, 0.3);
      expect(scene.specialPips2[2].fillStyle).toHaveBeenCalledWith(0x888888, 0.3);
    });
    it('should not throw if fewer than 3 pips exist', () => {
      scene.specialPips1 = [new MockGraphics()];
      scene.specialPips2 = [new MockGraphics()];
      scene.playerSpecial = [1, 0];
      expect(() => scene.updateSpecialPips()).not.toThrow();
    });
  });
});
