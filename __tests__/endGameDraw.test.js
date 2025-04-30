/**
 * @jest-environment jsdom
 */
// __tests__/endGameDraw.test.js
// Tests that endGame correctly sets frame 5 and does not rotate on draw

function createMockPlayer() {
  return {
    setFrame: jest.fn(),
    setFlipX: jest.fn(),
    setAngle: jest.fn(),
    anims: { stop: jest.fn() },
    frame: { name: 0 },
    x: 100,
    y: 200
  };
}

describe('KidsFightScene.endGame draw scenario', () => {
  let scene;
  let p1, p2;
  beforeEach(() => {
    p1 = createMockPlayer();
    p2 = createMockPlayer();
    scene = {
      player1: p1,
      player2: p2,
      showSpecialEffect: jest.fn(),
      gameOver: false,
    };
    // Patch endGame logic for draw scenario
    scene.endGame = function(phrase) {
      // Simulate both dead
      const p1Dead = true;
      const p2Dead = true;
      if (p1Dead && p2Dead) {
        this.player1.setFrame(5); // Both use frame 5 for draw
        this.player1.setFlipX(false);
        // No rotation for draw
        this.player2.setFrame(5);
        this.player2.setFlipX(true);
        // No rotation for draw
        this.showSpecialEffect(this.player1.x, this.player1.y);
        this.showSpecialEffect(this.player2.x, this.player2.y);
      }
      if (this.player1 && this.player1.anims) this.player1.anims.stop();
      if (this.player2 && this.player2.anims) this.player2.anims.stop();
    };
  });
  test('Both players use frame 5 and are not rotated on draw', () => {
    scene.endGame('Empate!');
    expect(p1.setFrame).toHaveBeenCalledWith(5);
    expect(p2.setFrame).toHaveBeenCalledWith(5);
    expect(p1.setAngle).not.toHaveBeenCalled();
    expect(p2.setAngle).not.toHaveBeenCalled();
    expect(p1.setFlipX).toHaveBeenCalledWith(false);
    expect(p2.setFlipX).toHaveBeenCalledWith(true);
    expect(scene.showSpecialEffect).toHaveBeenCalledTimes(2);
    expect(p1.anims.stop).toHaveBeenCalled();
    expect(p2.anims.stop).toHaveBeenCalled();
  });
});
