import KidsFightScene from '../kidsfight_scene';
import { createMockPlayer } from './createMockPlayer';

describe('Special Attack Z-Index', () => {
  let scene: KidsFightScene;
  let mockPlayer1: any;
  let mockPlayer2: any;
  let originalSetTimeout: typeof setTimeout;

  beforeEach(() => {
    // Mock setTimeout to control timing in tests
    originalSetTimeout = global.setTimeout;
    const timeoutCallbacks: Array<{ callback: () => void; delay: number }> = [];
    global.setTimeout = jest.fn((callback: () => void, delay: number) => {
      timeoutCallbacks.push({ callback, delay });
      return 1 as any;
    });
    (global.setTimeout as any).timeoutCallbacks = timeoutCallbacks;

    scene = new KidsFightScene();
    
    // Create mock players positioned within special attack range
    mockPlayer1 = createMockPlayer(1, 'bento', 100, 100, 100, 100);
    mockPlayer2 = createMockPlayer(2, 'davir', 150, 100, 100, 100); // 50px apart, within 120px range

    // Ensure setDepth is a mock function
    mockPlayer1.setDepth = jest.fn().mockReturnThis();
    mockPlayer2.setDepth = jest.fn().mockReturnThis();
    
    // Mock depth properties
    mockPlayer1.depth = 1;
    mockPlayer2.depth = 1;
    
    // Set up scene
    scene.players = [mockPlayer1, mockPlayer2];
    scene.playerHealth = [100, 100];
    scene.playerSpecial = [3, 0]; // Player 1 has full special meter
    
    // Mock scene methods
    scene.updateSpecialPips = jest.fn();
    scene.updateHealthBar = jest.fn();
    scene.checkWinner = jest.fn().mockReturnValue(-1);
    
    // Mock WebSocket manager
    scene.wsManager = {
      isConnected: jest.fn().mockReturnValue(false),
      sendGameAction: jest.fn(),
      send: jest.fn(),
      sendMessage: jest.fn()
    };

    scene.gameMode = 'single';
  });

  afterEach(() => {
    global.setTimeout = originalSetTimeout;
    jest.restoreAllMocks();
  });

  describe('Depth Management During Special Attacks', () => {
    it('should set very high depth for both attacker and defender during special attack', () => {
      // Perform special attack
      scene.tryAttack(0, 1, Date.now(), true);
      
      // Verify both players get high depth values
      expect(mockPlayer1.setDepth).toHaveBeenCalledWith(100); // Attacker gets highest depth
      expect(mockPlayer2.setDepth).toHaveBeenCalledWith(99);  // Defender gets high depth
    });

    it('should restore original depth after special attack animation completes', () => {
      // Set custom original depths
      mockPlayer1.depth = 5;
      mockPlayer2.depth = 3;
      
      // Perform special attack
      scene.tryAttack(0, 1, Date.now(), true);
      
      // Verify high depths are set during attack
      expect(mockPlayer1.setDepth).toHaveBeenCalledWith(100);
      expect(mockPlayer2.setDepth).toHaveBeenCalledWith(99);
      
      // Execute timeout callbacks to simulate animation completion
      const timeoutCallbacks = (global.setTimeout as any).timeoutCallbacks;
      timeoutCallbacks.forEach(({ callback }: { callback: () => void }) => callback());
      
      // Verify original depths are restored
      expect(mockPlayer1.setDepth).toHaveBeenCalledWith(5); // Original attacker depth
      expect(mockPlayer2.setDepth).toHaveBeenCalledWith(3); // Original defender depth
    });

    it('should handle default depth values when players have no initial depth', () => {
      // Remove depth properties (undefined)
      delete mockPlayer1.depth;
      delete mockPlayer2.depth;
      
      // Perform special attack
      scene.tryAttack(0, 1, Date.now(), true);
      
      // Verify high depths are set
      expect(mockPlayer1.setDepth).toHaveBeenCalledWith(100);
      expect(mockPlayer2.setDepth).toHaveBeenCalledWith(99);
      
      // Execute timeout callbacks
      const timeoutCallbacks = (global.setTimeout as any).timeoutCallbacks;
      timeoutCallbacks.forEach(({ callback }: { callback: () => void }) => callback());
      
      // Verify default depth (1) is restored
      expect(mockPlayer1.setDepth).toHaveBeenCalledWith(1);
      expect(mockPlayer2.setDepth).toHaveBeenCalledWith(1);
    });

    it('should prioritize attacker depth over defender depth', () => {
      // Perform special attack
      scene.tryAttack(0, 1, Date.now(), true);
      
      // Verify attacker has higher depth than defender
      expect(mockPlayer1.setDepth).toHaveBeenCalledWith(100); // Attacker
      expect(mockPlayer2.setDepth).toHaveBeenCalledWith(99);  // Defender
      
      // Attacker depth should be higher than defender depth
      const attackerDepth = 100;
      const defenderDepth = 99;
      expect(attackerDepth).toBeGreaterThan(defenderDepth);
    });

    it('should work with reverse attack direction (player 2 attacking player 1)', () => {
      // Set up player 2 with special meter
      scene.playerSpecial = [0, 3]; // Player 2 has full special meter
      
      // Player 2 attacks player 1
      scene.tryAttack(1, 0, Date.now(), true);
      
      // Verify depths are set correctly (player 2 is attacker, player 1 is defender)
      expect(mockPlayer2.setDepth).toHaveBeenCalledWith(100); // Player 2 (attacker)
      expect(mockPlayer1.setDepth).toHaveBeenCalledWith(99);  // Player 1 (defender)
    });
  });

  describe('Environment Without setTimeout', () => {
    it('should immediately restore depths when setTimeout is not available', () => {
      // Reset the mock to remove setTimeout function
      global.setTimeout = undefined as any;
      
      // Perform special attack
      scene.tryAttack(0, 1, Date.now(), true);
      
      // Verify high depths are set first
      expect(mockPlayer1.setDepth).toHaveBeenCalledWith(100);
      expect(mockPlayer2.setDepth).toHaveBeenCalledWith(99);
      
      // In the else branch (no setTimeout), depths should be immediately restored
      expect(mockPlayer1.setDepth).toHaveBeenCalledWith(1); // Default depth
      expect(mockPlayer2.setDepth).toHaveBeenCalledWith(1); // Default depth
      
      // Restore setTimeout for other tests
      global.setTimeout = originalSetTimeout;
    });
  });

  describe('Integration with tryAction', () => {
    it('should set high depths when special attack is triggered through tryAction', () => {
      // Use tryAction to trigger special attack
      scene.tryAction(0, 'special', true);
      
      // Verify depths are set through the full action flow
      expect(mockPlayer1.setDepth).toHaveBeenCalledWith(100);
      expect(mockPlayer2.setDepth).toHaveBeenCalledWith(99);
    });

    it('should not affect depth for normal attacks', () => {
      // Perform normal attack
      scene.tryAction(0, 'attack', false);
      
      // Verify high depths are NOT set for normal attacks
      expect(mockPlayer1.setDepth).not.toHaveBeenCalledWith(100);
      expect(mockPlayer2.setDepth).not.toHaveBeenCalledWith(99);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing setDepth method gracefully', () => {
      // Remove setDepth methods
      delete mockPlayer1.setDepth;
      delete mockPlayer2.setDepth;
      
      // Should not throw when setDepth is missing
      expect(() => {
        scene.tryAttack(0, 1, Date.now(), true);
      }).not.toThrow();
    });

    it('should handle null depth values', () => {
      // Set null depths
      mockPlayer1.depth = null;
      mockPlayer2.depth = null;
      
      // Perform special attack
      scene.tryAttack(0, 1, Date.now(), true);
      
      // Should default to 1 when depth is null
      const timeoutCallbacks = (global.setTimeout as any).timeoutCallbacks;
      timeoutCallbacks.forEach(({ callback }: { callback: () => void }) => callback());
      
      expect(mockPlayer1.setDepth).toHaveBeenCalledWith(1);
      expect(mockPlayer2.setDepth).toHaveBeenCalledWith(1);
    });

    it('should handle players positioned outside special attack range', () => {
      // Position players outside special attack range (>120px apart)
      mockPlayer2.x = 250; // 150px apart, outside range
      
      // Perform special attack
      scene.tryAttack(0, 1, Date.now(), true);
      
      // When out of range, isSpecialAttacking flag is set, but no damage/depth changes occur
      expect(mockPlayer1.setData).toHaveBeenCalledWith('isSpecialAttacking', true);
      // Depth changes should not occur when out of range
      expect(mockPlayer1.setDepth).not.toHaveBeenCalledWith(100);
      expect(mockPlayer2.setDepth).not.toHaveBeenCalledWith(99);
    });
  });

  describe('Timeout Callback Verification', () => {
    it('should execute timeout callback with correct delay (300ms)', () => {
      // Perform special attack
      scene.tryAttack(0, 1, Date.now(), true);
      
      // Verify setTimeout was called with correct delay
      expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), 300);
    });

    it('should execute multiple timeout callbacks for complex special attack sequence', () => {
      // Perform special attack
      scene.tryAttack(0, 1, Date.now(), true);
      
      // Should have timeout callbacks for both animation states and depth restoration
      const timeoutCallbacks = (global.setTimeout as any).timeoutCallbacks;
      expect(timeoutCallbacks.length).toBeGreaterThan(0);
      
      // Execute all callbacks
      const depthCallsBefore = mockPlayer1.setDepth.mock.calls.length;
      timeoutCallbacks.forEach(({ callback }: { callback: () => void }) => callback());
      const depthCallsAfter = mockPlayer1.setDepth.mock.calls.length;
      
      // Should have additional depth calls from timeout execution
      expect(depthCallsAfter).toBeGreaterThan(depthCallsBefore);
    });
  });
});