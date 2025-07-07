import KidsFightScene from '../kidsfight_scene';
import { createMockPlayer } from './createMockPlayer';

class TestableKidsFightScene extends KidsFightScene {
  public getPlayers(): any[] {
    return (this as any).players;
  }
  public setPlayers(mockPlayers: any[]): void {
    (this as any).players = mockPlayers;
  }
}

describe('Attack animation timing', () => {
  let scene: TestableKidsFightScene;
  let mockPlayers: any[];

  beforeEach(() => {
    jest.useFakeTimers();
    scene = new TestableKidsFightScene();
    mockPlayers = [createMockPlayer(), createMockPlayer()];
    // Set texture keys for animation keys
    mockPlayers[0].texture.key = 'player1';
    mockPlayers[1].texture.key = 'player2';
    scene.setPlayers(mockPlayers);
    // Mock anims for updatePlayerAnimation
    scene.anims = {
      exists: jest.fn().mockReturnValue(true),
      create: jest.fn(),
      get: jest.fn()
    } as any;
    // Mock time for delayedCall
    scene.time = {
      delayedCall: jest.fn((delay, callback) => {
        setTimeout(callback, delay);
        return { remove: jest.fn() };
      })
    } as any;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('isAttacking flag persists and clears after duration', () => {
    // Trigger a normal attack
    scene.tryAttack(0, 1, Date.now(), false);
    expect(mockPlayers[0].isAttacking).toBe(true);
    // Before duration ends
    jest.advanceTimersByTime(299);
    expect(mockPlayers[0].isAttacking).toBe(true);
    // After duration
    jest.advanceTimersByTime(1);
    expect(mockPlayers[0].isAttacking).toBe(false);
  });

  test('updatePlayerAnimation shows attack then returns to idle after duration', () => {
    scene.tryAttack(0, 1, Date.now(), false);
    // First update: should flash attack frame
    scene.updatePlayerAnimation(0);
    expect(mockPlayers[0].setFrame).toHaveBeenCalledWith(4);
    mockPlayers[0].setFrame.mockClear();
    // Advance past attack duration
    jest.advanceTimersByTime(300);
    scene.updatePlayerAnimation(0);
    expect(mockPlayers[0].setFrame).toHaveBeenCalledWith(0);
    expect(mockPlayers[0].anims.stop).toHaveBeenCalled();
  });
});
