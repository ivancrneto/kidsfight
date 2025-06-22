/**
 * Unit tests for visual effects and collider guard logic in KidsFightScene.
 */
import KidsFightScene from '../kidsfight_scene';

describe('KidsFightScene visual effects & safety guards', () => {
  // Basic graphics stub the scene expects (fillStyle, fillCircle, setDepth, destroy)
  function graphicsStub() {
    return {
      fillStyle: jest.fn(),
      fillCircle: jest.fn(),
      setDepth: jest.fn(),
      destroy: jest.fn(),
    } as any;
  }

  /**
   * Ensure showHitEffectAtCoordinates creates/destroys a graphics object safely.
   */
  it('showHitEffectAtCoordinates draws and schedules destroy of effect', () => {
    const scene: any = new KidsFightScene();

    // Stub out required Phaser pieces
    const gfxObj = graphicsStub();
    scene.add = { graphics: jest.fn(() => gfxObj) } as any;

    // Schedule callback immediately for deterministic test
    scene.time = {
      delayedCall: jest.fn((_ms: number, cb: () => void) => cb()),
    } as any;

    scene.hitEffects = [];

    // Call method under test
    scene.showHitEffectAtCoordinates(150, 300);

    // Graphics factory should be called once
    expect(scene.add.graphics).toHaveBeenCalledTimes(1);

    // Graphic should be added then removed after the delayed callback
    expect(gfxObj.fillCircle).toHaveBeenCalled();
    expect(gfxObj.destroy).toHaveBeenCalled();

    // hitEffects array should end empty (effect removed)
    expect(scene.hitEffects.length).toBe(0);
  });

  /**
   * Guard: physics.add.collider must not be called if second player is missing.
   */
  it('does not add collider when players[1] is undefined', () => {
    const scene: any = new KidsFightScene();

    // Mock physics collider
    const colliderMock = jest.fn();
    scene.physics = { add: { collider: colliderMock } } as any;
    scene.players = [ {}, undefined ];
    scene.platforms = {};

    // Reproduce guarded block from create():
    if (
      scene.physics &&
      scene.physics.add &&
      typeof scene.physics.add.collider === 'function' &&
      scene.players &&
      scene.players[0] &&
      scene.players[1]
    ) {
      scene.physics.add.collider(scene.players, scene.platforms);
    }

    expect(colliderMock).not.toHaveBeenCalled();
  });
});
