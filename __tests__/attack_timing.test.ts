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
    mockPlayers[0].isAttacking = true;
    
    // Call tryAttack which should set a timeout to clear the flag
    scene.tryAttack(0, 1, Date.now(), false);
    
    // Flag should still be true immediately after
    expect(mockPlayers[0].isAttacking).toBe(true);
    
    // Advance time by 800ms (updated from 200ms)
    jest.advanceTimersByTime(800);
    
    // After duration
    jest.advanceTimersByTime(1);
    expect(mockPlayers[0].isAttacking).toBe(false);
  });

  test('updatePlayerAnimation shows attack then returns to idle after duration', () => {
    mockPlayers[0].isAttacking = true;
    
    // Initial call should set attack frame
    scene.updatePlayerAnimation(0);
    expect(mockPlayers[0].setFrame).toHaveBeenCalledWith(4);
    
    // Clear mock to check next call
    mockPlayers[0].setFrame.mockClear();
    mockPlayers[0].anims.stop.mockClear();
    
    // Advance time by 800ms (updated from 200ms)
    jest.advanceTimersByTime(800);
    scene.updatePlayerAnimation(0);
    expect(mockPlayers[0].setFrame).toHaveBeenCalledWith(0);
    expect(mockPlayers[0].anims.stop).toHaveBeenCalled();
  });
});
