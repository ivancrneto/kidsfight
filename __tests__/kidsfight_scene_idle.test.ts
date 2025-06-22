/**
 * Unit test to ensure KidsFightScene keeps both players idle (no movement)
 * and shows the idle frame (0) when update() is called.
 */
import KidsFightScene from '../kidsfight_scene';

describe('KidsFightScene idle state', () => {
  // Helper to create a minimal mock player sprite
  function createMockPlayer(x: number): any {
    const body = { velocity: { x: 0, y: 0 } } as any;
    const player: any = {
      x,
      frame: 0,
      body,
      flipX: false,
      // Phaser-like helpers used by scene code
      setFlipX: jest.fn(function (val: boolean) {
        this.flipX = val;
      }),
      setVelocityX: jest.fn(function (vx: number) {
        this.body.velocity.x = vx;
      }),
      setVelocityY: jest.fn(function (vy: number) {
        this.body.velocity.y = vy;
      }),
      setScale: jest.fn(),
      getData: jest.fn(),
      setFrame: jest.fn(function (f: number) {
        this.frame = f;
      }),
      anims: {
        isPlaying: false,
        stop: jest.fn(),
      },
    };
    return player;
  }

  it('forces players to remain idle with zero velocity and frame 0', () => {
    const scene: any = new KidsFightScene();

    // Inject mock players
    const player1 = createMockPlayer(100);
    const player2 = createMockPlayer(200);
    scene.players = [player1, player2];

    // Call update – should reset velocities & frame
    scene.update(0, 16);

    // Velocities should be zero
    expect(player1.body.velocity).toEqual({ x: 0, y: 0 });
    expect(player2.body.velocity).toEqual({ x: 0, y: 0 });

    // Frame should be 0 (idle)
    expect(player1.frame).toBe(0);
    expect(player2.frame).toBe(0);
  });
});
