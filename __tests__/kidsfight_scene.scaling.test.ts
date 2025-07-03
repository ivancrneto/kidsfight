import KidsFightScene from '../kidsfight_scene';

describe('KidsFightScene scenario scaling', () => {
  let scene: any;
  beforeEach(() => {
    scene = new KidsFightScene();
    scene.sys = { game: { canvas: { width: 300, height: 500 } } } as any;
  });

  it('scales background to canvas dimensions', () => {
    const mockBg: any = {
      setDepth: jest.fn().mockReturnThis(),
      setOrigin: jest.fn().mockReturnThis(),
      setDisplaySize: jest.fn().mockReturnThis(),
    };
    scene.safeAddImage = jest.fn().mockReturnValue(mockBg);
    scene.create({});
    expect(scene.safeAddImage).toHaveBeenCalledWith(400, 240, 'scenario1');
    expect(mockBg.setOrigin).toHaveBeenCalledWith(0.5, 0.5);
    expect(mockBg.setDisplaySize).toHaveBeenCalledWith(300, 500);
  });

  it('uses provided scenario key and scales accordingly', () => {
    const mockBg2: any = {
      setDepth: jest.fn().mockReturnThis(),
      setOrigin: jest.fn().mockReturnThis(),
      setDisplaySize: jest.fn().mockReturnThis(),
    };
    scene.safeAddImage = jest.fn().mockReturnValue(mockBg2);
    scene.create({ scenario: 'scenario2' });
    expect(scene.safeAddImage).toHaveBeenCalledWith(400, 240, 'scenario2');
    expect(mockBg2.setOrigin).toHaveBeenCalledWith(0.5, 0.5);
    expect(mockBg2.setDisplaySize).toHaveBeenCalledWith(300, 500);
  });
});
