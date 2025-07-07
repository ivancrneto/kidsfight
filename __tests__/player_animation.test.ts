// Import KidsFightScene directly as default export
import KidsFightScene from '../kidsfight_scene';

// Create a test subclass that exposes private members for testing
class TestableKidsFightScene extends KidsFightScene {
  // Expose the players array for testing
  public getPlayers(): any[] {
    // Use type assertion to access private property
    return (this as any).players;
  }
  
  // Set the players array for testing
  public setPlayers(mockPlayers: any[]): void {
    // Use type assertion to access private property
    (this as any).players = mockPlayers;
  }
}

describe('Player Animation Tests', () => {
  let scene: TestableKidsFightScene;
  let mockPlayers: any[];

  beforeEach(() => {
    jest.useFakeTimers();
    
    // Create a new scene instance for each test
    scene = new TestableKidsFightScene();
    
    // Create mock players
    mockPlayers = [
      {
        texture: { key: 'player1' },
        body: { velocity: { x: 0, y: 0 } },
        setScale: jest.fn(),
        setFrame: jest.fn(),
        play: jest.fn(),
        anims: {
          play: jest.fn(),
          stop: jest.fn(),
          exists: jest.fn().mockReturnValue(true)
        },
        getData: jest.fn(),
        isAttacking: false,
        isSpecialAttacking: false,
        isBlocking: false
      },
      {
        texture: { key: 'player2' },
        body: { velocity: { x: 0, y: 0 } },
        setScale: jest.fn(),
        setFrame: jest.fn(),
        play: jest.fn(),
        anims: {
          play: jest.fn(),
          stop: jest.fn(),
          exists: jest.fn().mockReturnValue(true)
        },
        getData: jest.fn(),
        isAttacking: false,
        isSpecialAttacking: false,
        isBlocking: false
      }
    ];
    
    // Set the mock players in the scene
    scene.setPlayers(mockPlayers);
    // Initialize Y position for testing to ensure no vertical shift
    mockPlayers.forEach(p => p.y = 200);
    
    // Mock the anims object
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

  test('player should remain in idle state (frame 0) when not moving', () => {
    // Set up player state - not moving
    mockPlayers[0].body.velocity.x = 0;
    
    // Call the update animation method
    scene.updatePlayerAnimation(0);
    
    // Verify player is set to idle frame (stopWalkingAnimation is called for idle)
    expect(mockPlayers[0].setFrame).toHaveBeenCalledWith(0);
  });

  test('player should start walking animation when moving', () => {
    // Set up player state - moving right
    mockPlayers[0].body.velocity.x = 160;
    
    // Make sure no other states are active
    mockPlayers[0].isAttacking = false;
    mockPlayers[0].isSpecialAttacking = false;
    mockPlayers[0].isBlocking = false;
    mockPlayers[0].getData.mockImplementation(() => false);
    
    // Mock getTime for walking animation timing - use a small time to prevent immediate cycling
    scene.getTime = jest.fn().mockReturnValue(100);
    
    // Call the update animation method
    scene.updatePlayerAnimation(0);
    
    // Verify walking frame is set (should be frame 1 for initial walking)
    expect(mockPlayers[0].setFrame).toHaveBeenCalledWith(1);
    expect(mockPlayers[0].walkAnimData).toBeDefined();
    expect(mockPlayers[0].walkAnimData.currentFrame).toBe(1);
  });

  test('player should flash attack frame then return to idle', () => {
    // Set up player state - attacking
    mockPlayers[0].isAttacking = true;

    // Call the update animation method
    scene.updatePlayerAnimation(0);

    // Verify initial attack frame is set
    expect(mockPlayers[0].setFrame).toHaveBeenCalledWith(4);
    
    // Advance timers to trigger the delayed callback (200ms delay)
    jest.advanceTimersByTime(200);
    
    // Verify revert to idle frame
    expect(mockPlayers[0].setFrame).toHaveBeenCalledWith(0);
    expect(mockPlayers[0].isAttacking).toBe(false);
    expect(mockPlayers[0].anims.stop).toHaveBeenCalled();
  });

  test('player should use block frame when blocking', () => {
    // Set up player state - blocking
    mockPlayers[0].isBlocking = true;
    
    // Call the update animation method
    scene.updatePlayerAnimation(0);
    
    // Verify block frame is set and scale is BASE_SCALE (0.4)
    expect(mockPlayers[0].setFrame).toHaveBeenCalledWith(5);
    expect(mockPlayers[0].setScale).toHaveBeenCalledWith(0.4);
    expect(mockPlayers[0].anims.play).not.toHaveBeenCalled();
  });

  test('player should use special attack frame when using special', () => {
    // Set up player state - special attacking
    mockPlayers[0].isSpecialAttacking = true;
    
    // Call the update animation method
    scene.updatePlayerAnimation(0);
    
    // Verify special attack frame is set
    expect(mockPlayers[0].setFrame).toHaveBeenCalledWith(6);
    expect(mockPlayers[0].anims.play).not.toHaveBeenCalled();
  });

  test('player should use getData values if available', () => {
    // Set up player state - getData returns true for blocking
    mockPlayers[0].getData.mockImplementation((key: string) => {
      if (key === 'isBlocking') return true;
      return false;
    });
    
    // Call the update animation method
    scene.updatePlayerAnimation(0);
    
    // Verify block frame is set based on getData value
    expect(mockPlayers[0].setFrame).toHaveBeenCalledWith(5);
    expect(mockPlayers[0].setScale).toHaveBeenCalledWith(0.4);
  });


  test('update method should call updatePlayerAnimation for both players', () => {
    // Spy on updatePlayerAnimation method
    const spy = jest.spyOn(scene, 'updatePlayerAnimation');
    
    // Mock required methods for update to work
    mockPlayers[0].setFlipX = jest.fn();
    mockPlayers[1].setFlipX = jest.fn();
    scene.checkWinner = jest.fn() as any;
    
    // Call update method
    scene.update();
    
    // Verify updatePlayerAnimation was called for both players
    expect(spy).toHaveBeenCalledWith(0);
    expect(spy).toHaveBeenCalledWith(1);
    expect(spy).toHaveBeenCalledTimes(2);

  });

  test('player y remains unchanged across all animation states', () => {
    // Set a baseline Y position
    mockPlayers[0].y = 150;

    // Idle state
    mockPlayers[0].body.velocity.x = 0;
    scene.updatePlayerAnimation(0);
    expect(mockPlayers[0].y).toBe(150);

    // Run state
    mockPlayers[0].body.velocity.x = 160;
    mockPlayers[0].isAttacking = false;
    mockPlayers[0].isSpecialAttacking = false;
    mockPlayers[0].isBlocking = false;
    scene.updatePlayerAnimation(0);
    expect(mockPlayers[0].y).toBe(150);

    // Attack state
    mockPlayers[0].body.velocity.x = 0;
    mockPlayers[0].isAttacking = true;
    scene.updatePlayerAnimation(0);
    expect(mockPlayers[0].y).toBe(150);

    // Special attack state
    mockPlayers[0].isAttacking = false;
    mockPlayers[0].isSpecialAttacking = true;
    scene.updatePlayerAnimation(0);
    expect(mockPlayers[0].y).toBe(150);

    // Block state
    mockPlayers[0].isSpecialAttacking = false;
    mockPlayers[0].isBlocking = true;
    scene.updatePlayerAnimation(0);
    expect(mockPlayers[0].y).toBe(150);
  });
});


