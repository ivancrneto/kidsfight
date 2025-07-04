import { isLandscape, stretchBackgroundToFill, addVariableWidthSpritesheet } from '../kidsfight_scene';

describe('isLandscape', () => {
  let originalWindow: any;

  beforeAll(() => {
    originalWindow = (global as any).window;
  });

  afterAll(() => {
    (global as any).window = originalWindow;
  });

  it('returns true when window is undefined', () => {
    delete (global as any).window;
    expect(isLandscape()).toBe(true);
  });

  it('returns true when width > height', () => {
    (global as any).window = { innerWidth: 1000, innerHeight: 500 };
    expect(isLandscape()).toBe(true);
  });

  it('returns false when width <= height', () => {
    (global as any).window = { innerWidth: 400, innerHeight: 800 };
    expect(isLandscape()).toBe(false);
  });
});

describe('stretchBackgroundToFill', () => {
  it('sets displayWidth and displayHeight on the background object', () => {
    const bg: any = { displayWidth: 0, displayHeight: 0 };
    stretchBackgroundToFill(bg, 200, 100);
    expect(bg.displayWidth).toBe(200);
    expect(bg.displayHeight).toBe(100);
  });

  it('does nothing when background is null or undefined', () => {
    expect(() => stretchBackgroundToFill(null as any, 200, 100)).not.toThrow();
  });
});

describe('addVariableWidthSpritesheet', () => {
  const rawKey = 'rawKey';
  const key = 'testKey';
  const frameWidths = [10, 20];
  const frameHeight = 30;

  it('removes existing texture, adds image, and creates frames when texture exists', () => {
    const rawTexture = { getSourceImage: jest.fn(() => 'imageData') };
    const newTexture = { add: jest.fn() };
    const texturesMock: any = {
      exists: jest.fn().mockReturnValue(true),
      remove: jest.fn(),
      get: jest.fn((textureKey: string) =>
        textureKey === rawKey ? rawTexture : newTexture
      ),
      addImage: jest.fn(),
    };
    const sceneMock: any = { textures: texturesMock };

    addVariableWidthSpritesheet(sceneMock, key, rawKey, frameWidths, frameHeight);

    expect(texturesMock.exists).toHaveBeenCalledWith(key);
    expect(texturesMock.remove).toHaveBeenCalledWith(key);
    expect(texturesMock.get).toHaveBeenCalledWith(rawKey);
    expect(rawTexture.getSourceImage).toHaveBeenCalled();
    expect(texturesMock.addImage).toHaveBeenCalledWith(key, 'imageData');
    // Verify frame creation calls
    expect(texturesMock.get).toHaveBeenCalledWith(key);
    expect(newTexture.add).toHaveBeenCalledTimes(frameWidths.length);
    expect(newTexture.add).toHaveBeenNthCalledWith(1, 0, 0, 0, 0, 10, 30);
    expect(newTexture.add).toHaveBeenNthCalledWith(2, 1, 0, 10, 0, 20, 30);
  });

  it('does not remove texture when it does not exist', () => {
    const texturesMock: any = {
      exists: jest.fn().mockReturnValue(false),
      remove: jest.fn(),
      get: jest.fn((textureKey: string) =>
        textureKey === rawKey
          ? { getSourceImage: () => undefined }
          : { add: jest.fn() }
      ),
      addImage: jest.fn(),
    };
    const sceneMock: any = { textures: texturesMock };

    addVariableWidthSpritesheet(sceneMock, key, rawKey, [], frameHeight);

    expect(texturesMock.exists).toHaveBeenCalledWith(key);
    expect(texturesMock.remove).not.toHaveBeenCalled();
  });
});
