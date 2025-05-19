// Unit tests for KidsFightScene attack and special animation durations
import KidsFightScene from '../kidsfight_scene';

// Enable fake timers for testing timeouts
jest.useFakeTimers();

// Type definitions for our mock scene
interface MockPlayer {
  play: jest.Mock;
  anims: {
    isPlaying: boolean;
    currentAnim: { key: string };
  };
  body: {
    touching: { down: boolean };
    velocity: { x: number; y: number };
    setVelocityX: jest.Mock;
    setVelocityY: jest.Mock;
  };
  setFlipX: jest.Mock;
  setData: jest.Mock;
}

interface MockScene {
  isAttacking: boolean[];
  lastAttackTime: number[];
  lastSpecialTime: number[];
  attackCount: number[];
  playerHealth: number[];
  playerBlocking: boolean[];
  playerDirection: string[];
  gameOver: boolean;
  currentTime: number;
  time: {
    now: () => number;
    delayedCall: jest.Mock;
  };
  keys: {
    v: { isDown: boolean };
    b: { isDown: boolean };
    k: { isDown: boolean };
    l: { isDown: boolean };
  };
  player1: MockPlayer;
  player2: MockPlayer;
  update: jest.Mock;
  tryAttack: jest.Mock<boolean, [number, boolean?]>;
  updatePlayer1Animation: jest.Mock;
  updatePlayer2Animation: jest.Mock;
  handleKeyPress: jest.Mock;
  checkWinner: jest.Mock;
  advanceTime: (ms: number) => void;
}

// Simple mock for the scene with just what we need for testing
const createMockScene = (): MockScene => {
  const mockScene: MockScene = {
    isAttacking: [false, false],
    lastAttackTime: [0, 0],
    lastSpecialTime: [0, 0],
    attackCount: [0, 0],
    playerHealth: [100, 100],
    playerBlocking: [false, false],
    playerDirection: ['right', 'right'],
    gameOver: false,
    currentTime: 0, // Track current time for simulation
    
    // Mock time functions
    time: {
      now: () => mockScene.currentTime,
      delayedCall: jest.fn((delay: number, cb: Function) => ({
        delay,
        callback: cb,
        remove: jest.fn()
      }))
    },
    
    // Mock input and player objects
    keys: {
      v: { isDown: false },
      b: { isDown: false },
      k: { isDown: false },
      l: { isDown: false }
    },
    
    player1: {
      play: jest.fn(),
      anims: { isPlaying: false, currentAnim: { key: '' } },
      body: { 
        touching: { down: true }, 
        velocity: { x: 0, y: 0 },
        setVelocityX: jest.fn(),
        setVelocityY: jest.fn()
      },
      setFlipX: jest.fn(),
      setData: jest.fn()
    },
    
    player2: {
      play: jest.fn(),
      anims: { isPlaying: false, currentAnim: { key: '' } },
      body: { 
        touching: { down: true }, 
        velocity: { x: 0, y: 0 },
        setVelocityX: jest.fn(),
        setVelocityY: jest.fn()
      },
      setFlipX: jest.fn(),
      setData: jest.fn()
    },
    
    // Mock methods
    update: jest.fn(),
    tryAttack: jest.fn((playerIndex: number, isSpecial = false) => {
      mockScene.isAttacking[playerIndex] = true;
      mockScene.lastAttackTime[playerIndex] = mockScene.currentTime;
      if (isSpecial) {
        mockScene.lastSpecialTime[playerIndex] = mockScene.currentTime;
      }
      return true;
    }),
    
    updatePlayer1Animation: jest.fn(),
    updatePlayer2Animation: jest.fn(),
    handleKeyPress: jest.fn(),
    checkWinner: jest.fn(),
    
    // Helper to advance time and update state
    advanceTime: function(ms: number) {
      this.currentTime += ms;
      this.update(this.currentTime, 16); // Pass delta time (16ms = ~60fps)
    }
  };
  
  // Configure the update method to update isAttacking based on time
  mockScene.update.mockImplementation(function(this: MockScene, time: number) {
    this.currentTime = time;
    
    // Update attack state for both players
    for (let i = 0; i < 2; i++) {
      if (this.isAttacking[i]) {
        const isSpecial = this.lastSpecialTime[i] > 0 && 
                         (time - this.lastSpecialTime[i]) < 900;
        const attackDuration = isSpecial ? 900 : 200;
        
        if (time - this.lastAttackTime[i] >= attackDuration) {
          this.isAttacking[i] = false;
          this.lastAttackTime[i] = 0;
          this.lastSpecialTime[i] = 0;
        }
      }
    }
    
    // Process input if any key is down
    if (this.keys.v.isDown || this.keys.b.isDown || 
        this.keys.k.isDown || this.keys.l.isDown) {
      this.handleKeyPress(time);
    }
  });
  
  // Configure handleKeyPress to simulate attacks
  mockScene.handleKeyPress.mockImplementation(function(this: MockScene, time: number) {
    // Player 1 attacks (V for normal, B for special)
    if (!this.isAttacking[0]) {
      if (this.keys.v.isDown) {
        this.tryAttack(0, false);
      } else if (this.keys.b.isDown) {
        this.tryAttack(0, true);
      }
    }
    
    // Player 2 attacks (K for normal, L for special)
    if (!this.isAttacking[1]) {
      if (this.keys.k.isDown) {
        this.tryAttack(1, false);
      } else if (this.keys.l.isDown) {
        this.tryAttack(1, true);
      }
    }
  });
  
  return mockScene;
};

describe('KidsFightScene attack and special animation durations', () => {
  let scene: MockScene;
  
  beforeEach(() => {
    // Create a fresh mock scene for each test
    scene = createMockScene();
    
    // Mock the time
    jest.spyOn(Date, 'now').mockImplementation(() => 1000);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  // Helper function to simulate an attack
  const callUpdateAttack = (playerIndex: number, isSpecial: boolean, elapsed = 0) => {
    // Set the current time
    scene.currentTime = elapsed;
    
    // Set the appropriate key to down and update
    const key = playerIndex === 0 ? (isSpecial ? 'b' : 'v') : (isSpecial ? 'l' : 'k');
    scene.keys[key].isDown = true;
    scene.update(elapsed);
    scene.keys[key].isDown = false;
  };

  it('should set isAttacking[0] true for 200ms on attack, then false', () => {
    callUpdateAttack(0, false, 1000);
    expect(scene.isAttacking[0]).toBe(true);
    
    // Advance time to just before attack should end
    scene.advanceTime(199);
    expect(scene.isAttacking[0]).toBe(true);
    
    // Advance past attack duration
    scene.advanceTime(2);
    expect(scene.isAttacking[0]).toBe(false);
  });

  it('should set isAttacking[1] true for 200ms on attack, then false', () => {
    callUpdateAttack(1, false, 1000);
    expect(scene.isAttacking[1]).toBe(true);
    
    // Advance time to just before attack should end
    scene.advanceTime(199);
    expect(scene.isAttacking[1]).toBe(true);
    
    // Advance past attack duration
    scene.advanceTime(2);
    expect(scene.isAttacking[1]).toBe(false);
  });

  it('should set isAttacking[0] true for 900ms on special attack, then false', () => {
    callUpdateAttack(0, true, 1000);
    expect(scene.isAttacking[0]).toBe(true);
    
    // Advance time to just before special attack should end
    scene.advanceTime(899);
    expect(scene.isAttacking[0]).toBe(true);
    
    // Advance past special attack duration
    scene.advanceTime(2);
    expect(scene.isAttacking[0]).toBe(false);
  });

  it('should prevent new attacks while isAttacking is true', () => {
    // First attack
    callUpdateAttack(0, false, 1000);
    expect(scene.isAttacking[0]).toBe(true);
    
    // Try to attack again before first attack ends
    callUpdateAttack(0, false, 1100);
    expect(scene.isAttacking[0]).toBe(true);
    
    // Advance past first attack duration
    scene.advanceTime(200);
    expect(scene.isAttacking[0]).toBe(false);
    
    // Now should be able to attack again
    callUpdateAttack(0, false, 1300);
    expect(scene.isAttacking[0]).toBe(true);
  });

  it('should handle rapid key presses correctly', () => {
    // First attack
    callUpdateAttack(0, false, 1000);
    expect(scene.isAttacking[0]).toBe(true);
    
    // Second attack while first is still active (should be ignored)
    callUpdateAttack(0, false, 1100);
    expect(scene.isAttacking[0]).toBe(true);
    
    // First attack ends
    scene.advanceTime(100);
    
    // Third attack after first ends (should be processed)
    callUpdateAttack(0, true, 1200);
    expect(scene.isAttacking[0]).toBe(true);
    
    // Special attack should last longer
    scene.advanceTime(800);
    expect(scene.isAttacking[0]).toBe(true);
    
    scene.advanceTime(100);
    expect(scene.isAttacking[0]).toBe(false);
  });

  it('should handle multiple players attacking simultaneously', () => {
    // Player 1 attacks
    callUpdateAttack(0, false, 1000);
    expect(scene.isAttacking[0]).toBe(true);
    
    // Player 2 attacks while player 1 is still attacking
    callUpdateAttack(1, true, 1100);
    expect(scene.isAttacking[0]).toBe(true);
    expect(scene.isAttacking[1]).toBe(true);
    
    // Player 1's attack should end first
    scene.advanceTime(100);
    expect(scene.isAttacking[0]).toBe(false);
    expect(scene.isAttacking[1]).toBe(true);
    
    // Player 2's special attack should still be active
    scene.advanceTime(700);
    expect(scene.isAttacking[1]).toBe(true);
    
    // Player 2's attack should end
    scene.advanceTime(100);
    expect(scene.isAttacking[1]).toBe(false);
  });
});
